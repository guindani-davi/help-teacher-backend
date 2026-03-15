# Subscriptions Feature — Roadmap & Implementation Plan

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Analysis & Design Decisions](#2-architecture-analysis--design-decisions)
3. [Data Model](#3-data-model)
4. [Module Structure](#4-module-structure)
5. [Enums, Models & DTOs](#5-enums-models--dtos)
6. [ASAAS Integration Layer](#6-asaas-integration-layer)
7. [Subscription Business Logic](#7-subscription-business-logic)
8. [JWT Token Strategy](#8-jwt-token-strategy)
9. [Guards & Decorators](#9-guards--decorators)
10. [Webhook Processing](#10-webhook-processing)
11. [Impacts on Existing Code](#11-impacts-on-existing-code)
12. [Database Migrations](#12-database-migrations)
13. [API Endpoints](#13-api-endpoints)
14. [Implementation Phases](#14-implementation-phases)
15. [Environment Variables](#15-environment-variables)
16. [Error Handling](#16-error-handling)

---

## 1. Executive Summary

This plan adds a subscription system to help-tutor where:

- **Subscriptions are user-scoped** (tied to users, not organizations).
- There are 3 initial tiers: **Free** (R$0), **Basic** (R$198/mo), **Pro** (R$298/mo).
- Payment is handled via **ASAAS API** (customers, subscriptions, webhooks).
- Subscription tier is **embedded in the JWT** to avoid DB lookups on every request.
- The system must support **upgrade, downgrade, and cancellation** flows.
- **Ownership transfer** must validate the target user's subscription tier.
- The design is **extensible** for future tiers, billing cycles (annual), and new billing types.

---

## 2. Architecture Analysis & Design Decisions

### 2.1 Separation of Concerns — Two New Modules

| Module                | Responsibility                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AsaasModule`         | **Infrastructure layer.** Thin wrapper around the ASAAS REST API. Knows nothing about subscription plans or business rules. Could be swapped for Stripe, PagSeguro, etc. without touching business logic. Also owns the webhook controller since webhook payload format is ASAAS-specific. |
| `SubscriptionsModule` | **Domain/business layer.** Owns plans catalog, user subscription state, tier validation, upgrade/downgrade rules. Depends on `AsaasModule` for payment operations.                                                                                                                         |

This follows the same pattern the codebase already uses (e.g., `EmailModule` wraps Resend/SMTP while `AuthModule` consumes it for business logic).

### 2.2 Plan Catalog — Database Table vs. Hard-coded Enum

**Decision: Hybrid approach.**

- A `subscription_tier` PostgreSQL enum (`free`, `basic`, `pro`) is used for the **logical tier level** that business logic depends on (guards, ownership transfer checks, JWT claims). This is mirrored as a TypeScript `SubscriptionTierEnum`.
- A `subscription_plans` database table stores the **plan catalog** (name, price, billing cycle, ASAAS description, active/inactive). This allows creating new plan variations (e.g., "Basic Annual" at a discounted rate) without code changes — they map to an existing tier.
- This means many plans can map to the same tier. E.g., "Basic Monthly" (R$198/mo) and a future "Basic Annual" (R$1.990/yr) both resolve to tier `basic`.

### 2.3 User Subscription State — Single Row Per User

- A `user_subscriptions` table holds **one row per user** representing their current subscription state.
- When a user upgrades/downgrades, the row is **updated in place** (not duplicated).
- Users without a record in this table are implicitly on the `free` tier.
- This avoids the complexity of a full subscription history table (which can be derived from ASAAS if ever needed).

### 2.4 ASAAS Customer Lifecycle

- An `asaas_customer_id` field is stored on the `users` table (nullable).
- When a user subscribes for the first time, we create an ASAAS customer and save the ID.
- Subsequent subscription changes reuse the same ASAAS customer ID.
- Free users do not need an ASAAS customer record.

---

## 3. Data Model

### 3.1 ER Diagram (Logical)

```
┌──────────────┐       ┌────────────────────┐       ┌─────────────────────┐
│    users     │       │ subscription_plans  │       │  user_subscriptions │
├──────────────┤       ├────────────────────┤       ├─────────────────────┤
│ id (PK)      │──┐    │ id (PK)            │──┐    │ id (PK)             │
│ email        │  │    │ name               │  │    │ user_id (FK→users)  │◄── UNIQUE
│ name         │  │    │ tier (enum)        │  │    │ plan_id (FK→plans)  │
│ ...          │  │    │ price_cents (int)  │  └───►│ asaas_subscription_id│
│ asaas_cid*   │  │    │ billing_cycle (enum)│      │ status (enum)       │
└──────────────┘  │    │ asaas_description  │       │ current_period_end  │
                  │    │ is_active (bool)   │       │ canceled_at         │
                  │    │ created_at         │       │ created_at          │
                  │    │ updated_at         │       │ updated_at          │
                  │    └────────────────────┘       └─────────────────────┘
                  │                                          │
                  └──────────────────────────────────────────┘
```

\*`asaas_cid` = `asaas_customer_id` added to the `users` table.

### 3.2 New PostgreSQL Enums

```sql
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled');
```

### 3.3 Table: `subscription_plans`

| Column              | Type              | Constraints                   | Description                                          |
| ------------------- | ----------------- | ----------------------------- | ---------------------------------------------------- |
| `id`                | UUID              | PK, DEFAULT gen_random_uuid() | Plan identifier                                      |
| `name`              | TEXT              | NOT NULL                      | Display name (e.g., "Help Tutor Basic Monthly Plan") |
| `tier`              | subscription_tier | NOT NULL                      | Logical tier: free, basic, pro                       |
| `price_cents`       | INTEGER           | NOT NULL                      | Price in centavos (0, 19800, 29800)                  |
| `billing_cycle`     | billing_cycle     | NULL                          | NULL for free, 'monthly'/'yearly' for paid           |
| `asaas_description` | TEXT              | NOT NULL                      | Description sent to ASAAS when creating subscription |
| `is_active`         | BOOLEAN           | NOT NULL DEFAULT TRUE         | Soft-disable plans without deleting                  |
| `created_at`        | TIMESTAMPTZ       | NOT NULL DEFAULT NOW()        |                                                      |
| `updated_at`        | TIMESTAMPTZ       |                               |                                                      |

Seeded with the initial 3 plans. The `free` plan has `price_cents = 0` and `billing_cycle = NULL`.

### 3.4 Table: `user_subscriptions`

| Column                  | Type                | Constraints                     | Description                      |
| ----------------------- | ------------------- | ------------------------------- | -------------------------------- |
| `id`                    | UUID                | PK, DEFAULT gen_random_uuid()   |                                  |
| `user_id`               | UUID                | NOT NULL, FK→users, **UNIQUE**  | One active subscription per user |
| `plan_id`               | UUID                | NOT NULL, FK→subscription_plans | Current plan                     |
| `asaas_subscription_id` | TEXT                | NULL, UNIQUE                    | NULL for free-tier users         |
| `status`                | subscription_status | NOT NULL DEFAULT 'active'       |                                  |
| `current_period_end`    | TIMESTAMPTZ         | NULL                            | When current billing period ends |
| `canceled_at`           | TIMESTAMPTZ         | NULL                            | When the user canceled           |
| `created_at`            | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()          |                                  |
| `updated_at`            | TIMESTAMPTZ         |                                 |                                  |

### 3.5 Column Added to `users`

| Column              | Type | Constraints  | Description                                            |
| ------------------- | ---- | ------------ | ------------------------------------------------------ |
| `asaas_customer_id` | TEXT | NULL, UNIQUE | ASAAS customer ID (created on first paid subscription) |

---

## 4. Module Structure

### 4.1 `src/asaas/` — Payment Gateway Wrapper

```
src/asaas/
  asaas.module.ts
  controller/
    i.asaas-webhook.controller.ts
    implementation/
      asaas-webhook.controller.ts
  dtos/
    asaas-webhook-event.dto.ts
  enums/
    asaas-billing-type.enum.ts
    asaas-subscription-cycle.enum.ts
    asaas-subscription-status.enum.ts
    asaas-webhook-event.enum.ts
  service/
    i.asaas.service.ts
    implementation/
      asaas.service.ts
```

### 4.2 `src/subscriptions/` — Subscription Domain

```
src/subscriptions/
  subscriptions.module.ts
  controller/
    i.subscriptions.controller.ts
    implementation/
      subscriptions.controller.ts
  decorators/
    required-tier.decorator.ts
  dtos/
    subscribe.dto.ts
    change-plan.dto.ts
  enums/
    subscription-tier.enum.ts
    subscription-status.enum.ts
    billing-cycle.enum.ts
  exceptions/
    insufficient-subscription.exception.ts
    active-subscription-required.exception.ts
    cannot-downgrade.exception.ts
  guards/
    subscription-tier/
      subscription-tier.guard.ts
  model/
    subscription-plan.model.ts
    user-subscription.model.ts
  repository/
    i.subscriptions.repository.ts
    implementation/
      subscriptions.repository.ts
  service/
    i.subscriptions.service.ts
    implementation/
      subscriptions.service.ts
```

---

## 5. Enums, Models & DTOs

### 5.1 Enums

**`SubscriptionTierEnum`** (used in business logic, JWT, guards):

```typescript
export enum SubscriptionTierEnum {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
}
```

Has a natural ordering: FREE < BASIC < PRO. A helper constant or method will define this hierarchy:

```typescript
export const TIER_HIERARCHY: Record<SubscriptionTierEnum, number> = {
  [SubscriptionTierEnum.FREE]: 0,
  [SubscriptionTierEnum.BASIC]: 1,
  [SubscriptionTierEnum.PRO]: 2,
};
```

**`SubscriptionStatusEnum`**:

```typescript
export enum SubscriptionStatusEnum {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
}
```

**`BillingCycleEnum`**:

```typescript
export enum BillingCycleEnum {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}
```

### 5.2 Models

**`SubscriptionPlan`**:

```typescript
export class SubscriptionPlan {
  public readonly id: string;
  public readonly name: string;
  public readonly tier: SubscriptionTierEnum;
  public readonly priceCents: number;
  public readonly billingCycle: BillingCycleEnum | null;
  public readonly asaasDescription: string;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public isFree(): boolean {
    return this.tier === SubscriptionTierEnum.FREE;
  }
}
```

**`UserSubscription`**:

```typescript
export class UserSubscription {
  public readonly id: string;
  public readonly userId: string;
  public readonly planId: string;
  public readonly asaasSubscriptionId: string | null;
  public readonly status: SubscriptionStatusEnum;
  public readonly currentPeriodEnd: Date | null;
  public readonly canceledAt: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public isActive(): boolean {
    return this.status === SubscriptionStatusEnum.ACTIVE;
  }
}
```

### 5.3 DTOs

**`SubscribeBodyDTO`** — For creating a paid subscription:

```typescript
export class SubscribeBodyDTO {
  planId: string; // UUID of the target plan
  creditCard: CreditCardDTO;
  creditCardHolderInfo: CreditCardHolderInfoDTO;
  remoteIp: string;
}
```

**`CreditCardDTO`**:

```typescript
export class CreditCardDTO {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}
```

**`CreditCardHolderInfoDTO`**:

```typescript
export class CreditCardHolderInfoDTO {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}
```

**`ChangePlanBodyDTO`** — For upgrading/downgrading:

```typescript
export class ChangePlanBodyDTO {
  planId: string; // UUID of the target plan
}
```

---

## 6. ASAAS Integration Layer

### 6.1 `IAsaasService` Abstract Class

```typescript
@Injectable()
export abstract class IAsaasService {
  // Customer
  public abstract createCustomer(
    name: string,
    cpfCnpj: string,
    email: string,
  ): Promise<AsaasCustomer>;

  // Subscription
  public abstract createSubscriptionWithCreditCard(
    params: CreateAsaasSubscriptionParams,
  ): Promise<AsaasSubscription>;
  public abstract getSubscription(
    asaasSubscriptionId: string,
  ): Promise<AsaasSubscription>;
  public abstract updateSubscription(
    asaasSubscriptionId: string,
    params: UpdateAsaasSubscriptionParams,
  ): Promise<AsaasSubscription>;
  public abstract cancelSubscription(
    asaasSubscriptionId: string,
  ): Promise<void>;
}
```

### 6.2 `AsaasService` Implementation

- Uses `ConfigService` to read `ASAAS_API_KEY`.
- Uses `fetch` (Node 22 native) or a lightweight HTTP client to call the ASAAS REST API.
- Base URL is read from `ASAAS_API_URL` env var (sandbox vs. production).
- Maps ASAAS response DTOs to internal types.
- Throws `AsaasApiException` (a new DomainException) on API errors.

### 6.3 Key ASAAS API Calls

| Operation                          | ASAAS Endpoint                  | When                       |
| ---------------------------------- | ------------------------------- | -------------------------- |
| Create customer                    | `POST /v3/customers`            | First paid subscription    |
| Create subscription w/ credit card | `POST /v3/subscriptions/`       | Subscribe to paid plan     |
| Update subscription                | `PUT /v3/subscriptions/{id}`    | Change plan (value, cycle) |
| Cancel subscription                | `DELETE /v3/subscriptions/{id}` | Cancel subscription        |
| Get subscription                   | `GET /v3/subscriptions/{id}`    | Sync/verify status         |

### 6.4 ASAAS ↔ Internal Mapping

| ASAAS Field                        | Internal Field                                              |
| ---------------------------------- | ----------------------------------------------------------- |
| `customer` (ASAAS customer ID)     | `users.asaas_customer_id`                                   |
| `id` (ASAAS subscription ID)       | `user_subscriptions.asaas_subscription_id`                  |
| `status` (ACTIVE/INACTIVE/EXPIRED) | `user_subscriptions.status` mapped to our enum              |
| `externalReference`                | Our `user_subscriptions.id` or `users.id`                   |
| `billingType`                      | Always `CREDIT_CARD` (for now)                              |
| `cycle`                            | Maps from our `BillingCycleEnum` → ASAAS `MONTHLY`/`YEARLY` |
| `value`                            | Derived from `subscription_plans.price_cents / 100`         |

---

## 7. Subscription Business Logic

### 7.1 User Registration → Implicit Free Tier

- **No record is created** in `user_subscriptions` at registration time.
- A user without a `user_subscriptions` row is treated as `FREE` tier.
- The `SubscriptionsService.getUserTier(userId)` method returns `FREE` if no record exists.

### 7.2 Subscribe (Free → Paid)

1. Validate the target plan exists and is active.
2. Validate the user does not already have an active paid subscription.
3. **Create ASAAS customer** if `users.asaas_customer_id` is NULL.
   - Uses user's name + surname as `name`, a CPF/CNPJ from the DTO as `cpfCnpj`, and email.
   - Saves the returned `asaas_customer_id` on the users table.
4. **Create ASAAS subscription** via `POST /v3/subscriptions/` (with credit card).
   - `customer` = the ASAAS customer ID.
   - `billingType` = `CREDIT_CARD`.
   - `value` = plan price in reais (e.g., 198.00).
   - `nextDueDate` = today (first charge immediate).
   - `cycle` = `MONTHLY` (or `YEARLY` for future annual plans).
   - `description` = plan's `asaas_description`.
   - `externalReference` = user's UUID.
5. **Insert/upsert** row in `user_subscriptions` with status `active`.
6. **Revoke all refresh tokens** for the user → forces re-login → new JWT includes updated tier.
7. Return the new subscription state.

### 7.3 Upgrade (Lower Tier → Higher Tier)

1. Validate the user has an active subscription.
2. Validate target plan's tier is **higher** than current tier.
3. **Update ASAAS subscription** via `PUT /v3/subscriptions/{id}`:
   - New `value` from the target plan.
   - `updatePendingPayments: true`.
4. **Update** `user_subscriptions` row: new `plan_id`.
5. **Revoke all refresh tokens** → forces re-login.

### 7.4 Downgrade (Higher Tier → Lower Tier)

1. Validate the user has an active subscription.
2. Validate target plan's tier is **lower** than current tier.
3. **Validate business rules** for the lower tier:
   - E.g., if downgrading from Pro to Basic, check that the user's organizations don't rely on Pro-only features.
   - This validation is a hook/method that future feature modules can extend.
   - For now, the method returns `true` (no features implemented yet that would block it).
4. If target plan is **Free**:
   - **Cancel** the ASAAS subscription → `DELETE /v3/subscriptions/{id}`.
   - **Update** `user_subscriptions.status` = `canceled`.
5. If target plan is **Basic** (from Pro):
   - **Update** ASAAS subscription with the new value.
   - **Update** `user_subscriptions.plan_id`.
6. **Revoke all refresh tokens** → forces re-login.

### 7.5 Cancel

1. Validate the user has an active paid subscription.
2. **Cancel** the ASAAS subscription → `DELETE /v3/subscriptions/{id}`.
3. **Update** `user_subscriptions`: `status = 'canceled'`, `canceled_at = now()`.
4. **Revoke all refresh tokens** → forces re-login (will get FREE tier).

### 7.6 Ownership Transfer Validation

**Current flow** in `OrganizationsService.transferOwnership()`:

- Validates target is not already owner.
- Demotes caller from OWNER to ADMIN.
- Promotes target to OWNER.

**New validation** (added before the transfer):

- Look up target user's subscription tier.
- If target tier is `FREE`, **block** the transfer with `InsufficientSubscriptionException`.
  - Rationale: owners need at least a Basic plan to manage organizations.
  - This rule can be refined later (e.g., if Free allows owning one org).

> **Note:** The exact tier required for ownership is a business decision. The implementation will use a configurable constant (`MINIMUM_OWNER_TIER = SubscriptionTierEnum.FREE` initially, since free users can already create organizations per the requirements). This can be adjusted as features are built.

Looking at the requirements more carefully: "Free Plan allows a user to create an organization (acting as the owner)." So free users CAN be owners, but with limitations. The transfer-ownership check should verify: "the user receiving the owner role has a subscription sufficient for this purpose." This means the target must have at least the **same tier** as the current owner OR a sufficient tier for the org's current usage. For now, we'll validate that the target user has a tier **≥ FREE** (which is always true), making the guard a no-op until feature limits are implemented.

---

## 8. JWT Token Strategy

### 8.1 Extended Payload

**Current:**

```typescript
export interface JwtPayload {
  sub: string;
  email: string;
}
```

**New:**

```typescript
export interface JwtPayload {
  sub: string;
  email: string;
  subscriptionTier: SubscriptionTierEnum;
}
```

### 8.2 How Tier Gets Into the Token

1. On **login**: `AuthService.validateUser()` → after validating credentials, look up user's tier via `SubscriptionsService.getUserTier(userId)` → include in JWT payload.
2. On **refresh**: Same — when generating the new access token, re-fetch the tier from DB.

### 8.3 Staleness Window

- Access tokens have a **15-minute TTL**.
- When a subscription changes (via the API or via ASAAS webhook), we **revoke all refresh tokens** for the user.
- Worst case: the user has a valid access token for up to 15 minutes with an outdated tier.
- After that, the access token expires, the refresh token is revoked, and the user must re-login.
- **This is an acceptable trade-off** for avoiding DB queries on every request.

### 8.4 Alternative Considered: Token Version

We could add a `tokenVersion` field to the user record and include it in the JWT. On every request, compare the JWT's version with a cached (Redis) version. If mismatched, reject the token. This was rejected because:

- The codebase doesn't use Redis.
- The 15-minute staleness window is acceptable.
- This can be added later if needed.

---

## 9. Guards & Decorators

### 9.1 `@RequiredTier()` Decorator

```typescript
export const REQUIRED_TIER_KEY = 'required_tier';
export const RequiredTier = (tier: SubscriptionTierEnum) =>
  SetMetadata(REQUIRED_TIER_KEY, tier);
```

Usage:

```typescript
@RequiredTier(SubscriptionTierEnum.PRO)
@UseGuards(AuthGuard, SubscriptionTierGuard)
```

### 9.2 `SubscriptionTierGuard`

- Reads the `required_tier` metadata from the handler/class.
- Reads `subscriptionTier` from `request.user` (the JWT payload, set by `AuthGuard`).
- Compares using `TIER_HIERARCHY`: if the user's tier level is **≥** the required tier level, allow.
- Otherwise, throw `ForbiddenException`.

```typescript
@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.get<SubscriptionTierEnum>(REQUIRED_TIER_KEY, ...);
    if (!requiredTier) return true; // no tier required

    const user: JwtPayload = request.user;
    if (TIER_HIERARCHY[user.subscriptionTier] >= TIER_HIERARCHY[requiredTier]) return true;

    throw new ForbiddenException('Insufficient subscription tier');
  }
}
```

### 9.3 Guard Stacking Example

```typescript
@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationsController {
  @Post(':slug/teachers')
  @UseGuards(MembershipGuard, RolesGuard, SubscriptionTierGuard)
  @AllowedRoles(RolesEnum.OWNER)
  @RequiredTier(SubscriptionTierEnum.PRO)   // Only Pro owners can invite teachers
  async inviteTeacher(...) { }
}
```

---

## 10. Webhook Processing

### 10.1 Endpoint

`POST /asaas/webhooks` — open endpoint (no JWT auth), secured via ASAAS webhook `authToken`.

### 10.2 Relevant ASAAS Webhook Events

| Event                      | Action                                  |
| -------------------------- | --------------------------------------- |
| `PAYMENT_CONFIRMED`        | Ensure subscription status is `active`  |
| `PAYMENT_RECEIVED`         | Same as above                           |
| `PAYMENT_OVERDUE`          | Set status to `past_due`                |
| `SUBSCRIPTION_INACTIVATED` | Set status to `canceled`, revoke tokens |
| `SUBSCRIPTION_DELETED`     | Set status to `canceled`, revoke tokens |

### 10.3 Webhook Security

- The webhook endpoint validates the `asaas-access-token` header against a stored secret (`ASAAS_WEBHOOK_TOKEN` env var).
- If the token doesn't match, return `401`.

### 10.4 Processing Flow

1. Parse webhook payload.
2. Verify auth token.
3. Extract `event` and `payment.subscription` or `subscription.id`.
4. Look up `user_subscriptions` by `asaas_subscription_id`.
5. Update status accordingly.
6. If status changed, revoke user's refresh tokens.

### 10.5 Idempotency

- Webhook handlers must be idempotent. If a `PAYMENT_CONFIRMED` arrives for an already-active subscription, it's a no-op.

---

## 11. Impacts on Existing Code

### 11.1 Files to Modify

| File                                                                | Change                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/auth/payloads/jwt.payload.ts`                                  | Add `subscriptionTier: SubscriptionTierEnum` field                             |
| `src/auth/service/i.auth.service.ts`                                | Add dependency on `ISubscriptionsService` (or just `ISubscriptionsRepository`) |
| `src/auth/service/implementation/auth.service.ts`                   | In `login()` and `refresh()`, look up user's tier and include in JWT payload   |
| `src/auth/auth.module.ts`                                           | Import `SubscriptionsModule`                                                   |
| `src/organizations/service/implementation/organizations.service.ts` | In `transferOwnership()`, validate target user's subscription tier             |
| `src/organizations/organizations.module.ts`                         | Import `SubscriptionsModule`                                                   |
| `src/app.module.ts`                                                 | Import `AsaasModule` and `SubscriptionsModule`                                 |
| `.env.example`                                                      | Add `ASAAS_API_URL`, `ASAAS_WEBHOOK_TOKEN`                                     |
| `.env.development`                                                  | Add sandbox values for the above                                               |
| `src/common/enums/domain-exception-code.enum.ts`                    | Add new domain exception codes                                                 |
| `src/common/filters/all-exceptions.filter.ts`                       | Add new code → HTTP status mappings                                            |
| `src/users/repository/i.users.repository.ts`                        | Add `updateAsaasCustomerId()` method                                           |
| `src/users/repository/implementation/users.repository.ts`           | Implement `updateAsaasCustomerId()`                                            |
| `src/users/model/user.model.ts`                                     | Add `asaasCustomerId: string \| null` field                                    |

### 11.2 New Files

All files under `src/asaas/` and `src/subscriptions/` as described in Section 4.

### 11.3 New Migration

One new migration file covering:

- New enums (`subscription_tier`, `billing_cycle`, `subscription_status`)
- New tables (`subscription_plans`, `user_subscriptions`)
- New column on `users` (`asaas_customer_id`)
- Seed data for the 3 initial plans

---

## 12. Database Migrations

### 12.1 Single Migration File

```sql
-- Create enums
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled');

-- Add ASAAS customer ID to users
ALTER TABLE users ADD COLUMN asaas_customer_id TEXT UNIQUE;

-- Subscription plans catalog
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier subscription_tier NOT NULL,
  price_cents INTEGER NOT NULL,
  billing_cycle billing_cycle,
  asaas_description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  asaas_subscription_id TEXT UNIQUE,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_asaas_sub_id ON user_subscriptions(asaas_subscription_id);

-- Seed initial plans
INSERT INTO subscription_plans (name, tier, price_cents, billing_cycle, asaas_description) VALUES
  ('Help Tutor Free Plan', 'free', 0, NULL, 'Help Tutor Free Plan'),
  ('Help Tutor Basic Monthly Plan', 'basic', 19800, 'monthly', 'Help Tutor Basic Monthly Plan - R$198/mês'),
  ('Help Tutor Pro Monthly Plan', 'pro', 29800, 'monthly', 'Help Tutor Pro Monthly Plan - R$298/mês');
```

### 12.2 Update `db:types`

After running the migration, regenerate Supabase types:

```bash
npm run db:types
```

This will update `src/database/types.ts` with the new tables and enums.

---

## 13. API Endpoints

### 13.1 Subscriptions Controller

| Method | Path                         | Auth   | Description                                          |
| ------ | ---------------------------- | ------ | ---------------------------------------------------- |
| `GET`  | `/subscriptions/plans`       | Public | List all active subscription plans                   |
| `GET`  | `/subscriptions/me`          | JWT    | Get current user's subscription (tier, plan, status) |
| `POST` | `/subscriptions/subscribe`   | JWT    | Subscribe to a paid plan (with credit card)          |
| `PUT`  | `/subscriptions/change-plan` | JWT    | Upgrade or downgrade plan                            |
| `POST` | `/subscriptions/cancel`      | JWT    | Cancel current subscription                          |

### 13.2 ASAAS Webhook Controller

| Method | Path              | Auth          | Description                  |
| ------ | ----------------- | ------------- | ---------------------------- |
| `POST` | `/asaas/webhooks` | Webhook Token | Receive ASAAS webhook events |

### 13.3 Response Types

**`SubscriptionPlanResponse`** (returned by GET /plans):

```typescript
{
  id: string;
  name: string;
  tier: 'free' | 'basic' | 'pro';
  priceCents: number;
  billingCycle: 'monthly' | 'yearly' | null;
}
```

**`UserSubscriptionResponse`** (returned by GET /me):

```typescript
{
  plan: SubscriptionPlanResponse;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: string | null;
  canceledAt: string | null;
}
```

---

## 14. Implementation Phases

### Phase 1: Foundation (Data Model + Enums + Models)

**Estimated effort: 1 day**

1. Create the database migration (enums, tables, seed data).
2. Run `npm run db:types` to regenerate Supabase types.
3. Create TypeScript enums: `SubscriptionTierEnum`, `SubscriptionStatusEnum`, `BillingCycleEnum`.
4. Create models: `SubscriptionPlan`, `UserSubscription`.
5. Add `asaasCustomerId` to `User` model.
6. Update `UsersRepository` to handle new `asaas_customer_id` column.
7. Add new domain exception codes.

### Phase 2: Subscriptions Module — Repository + Service + Controller

**Estimated effort: 2 days**

1. Create `ISubscriptionsRepository` + `SubscriptionsRepository`.
   - `getPlans()`, `getPlanById()`, `getPlanByTier()`
   - `getUserSubscription(userId)`, `getUserTier(userId)`
   - `createUserSubscription()`, `updateUserSubscription()`, `updateSubscriptionStatus()`
2. Create `ISubscriptionsService` + `SubscriptionsService`.
   - `getPlans()`, `getMySubscription()`, `getUserTier()`
   - `subscribe()`, `changePlan()`, `cancel()`
   - `handleSubscriptionStatusChange()` (called by webhook)
   - `validateDowngrade()` (extensible hook)
3. Create `ISubscriptionsController` + `SubscriptionsController`.
   - Wire up the 5 endpoints.
4. Create DTOs with class-validator decorators.
5. Create `SubscriptionsModule` with proper DI bindings.

### Phase 3: ASAAS Module — API Client + Webhook

**Estimated effort: 2 days**

1. Create `IAsaasService` + `AsaasService`.
   - Implement HTTP calls to ASAAS API.
   - Handle error responses.
2. Create `AsaasWebhookController`.
   - Parse events, validate auth token.
   - Call `SubscriptionsService.handleSubscriptionStatusChange()`.
3. Create `AsaasModule` with DI bindings.
4. Add env vars to `.env.example` and `.env.development`.

### Phase 4: JWT Integration + Guards

**Estimated effort: 1 day**

1. Extend `JwtPayload` with `subscriptionTier`.
2. Modify `AuthService.login()` and `AuthService.refresh()` to include tier in JWT.
3. Add `SubscriptionsModule` as dependency of `AuthModule`.
4. Create `@RequiredTier()` decorator.
5. Create `SubscriptionTierGuard`.
6. Export guard from `SubscriptionsModule`.

### Phase 5: Ownership Transfer Validation

**Estimated effort: 0.5 day**

1. Inject `ISubscriptionsService` into `OrganizationsService`.
2. In `transferOwnership()`, look up target user's tier.
3. Apply business rule (configurable minimum tier for ownership).

### Phase 6: Testing & Hardening

**Estimated effort: 2 days**

1. Integration tests against Supabase local.
2. Test ASAAS sandbox flow end-to-end.
3. Test webhook idempotency.
4. Test token refresh after subscription change.
5. Edge cases: double-subscribe, cancel already-canceled, downgrade with blocking features.

---

## 15. Environment Variables

Add to `.env.example`:

```dotenv
ASAAS_API_URL=
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
```

Add to `.env.development`:

```dotenv
ASAAS_API_URL=https://api-sandbox.asaas.com
ASAAS_API_KEY=$aact_hmlg_... (already present)
ASAAS_WEBHOOK_TOKEN=some_dev_webhook_token
```

> Note: `ASAAS_API_KEY` is already in `.env.development`. We just need to add `ASAAS_API_URL` and `ASAAS_WEBHOOK_TOKEN`.

---

## 16. Error Handling

### 16.1 New Domain Exception Codes

```typescript
// Added to DomainExceptionCode enum:
INSUFFICIENT_SUBSCRIPTION = 'INSUFFICIENT_SUBSCRIPTION',
ACTIVE_SUBSCRIPTION_REQUIRED = 'ACTIVE_SUBSCRIPTION_REQUIRED',
CANNOT_DOWNGRADE = 'CANNOT_DOWNGRADE',
ASAAS_API_ERROR = 'ASAAS_API_ERROR',
```

### 16.2 HTTP Status Mappings

| Code                           | HTTP Status              |
| ------------------------------ | ------------------------ |
| `INSUFFICIENT_SUBSCRIPTION`    | 403 Forbidden            |
| `ACTIVE_SUBSCRIPTION_REQUIRED` | 422 Unprocessable Entity |
| `CANNOT_DOWNGRADE`             | 422 Unprocessable Entity |
| `ASAAS_API_ERROR`              | 502 Bad Gateway          |

### 16.3 New Exception Classes

```
src/subscriptions/exceptions/insufficient-subscription.exception.ts
src/subscriptions/exceptions/active-subscription-required.exception.ts
src/subscriptions/exceptions/cannot-downgrade.exception.ts
src/asaas/exceptions/asaas-api.exception.ts
```

---

## Summary of Key Design Principles

| Principle                       | Application                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Separation of concerns**      | `AsaasModule` (infrastructure) vs `SubscriptionsModule` (business domain)                                              |
| **Interface-based DI**          | Abstract classes (`IAsaasService`, `ISubscriptionsService`) with concrete implementations, following existing patterns |
| **Token-based authorization**   | Subscription tier embedded in JWT — no DB query needed for tier checks                                                 |
| **Extensibility**               | Plan catalog in DB (not hard-coded), tier hierarchy constant, `validateDowngrade()` hook                               |
| **Existing pattern compliance** | Controller → Service → Repository layers, DomainException hierarchy, guard stacking, module structure                  |
| **Idempotency**                 | Webhook handlers are safe to call multiple times                                                                       |
| **Graceful staleness**          | 15-min max window for outdated tier in JWT, mitigated by revoking refresh tokens on changes                            |
