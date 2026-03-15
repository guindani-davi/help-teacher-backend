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
17. [Security Considerations](#17-security-considerations)

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

> **Security (M2):** The `subscription_plans` table should only be writable by admins or via migrations. Apply a Row Level Security (RLS) policy or restrict write access to the application's service role to prevent plan/price manipulation.

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

### 3.6 Table: `webhook_events` (Replay Protection)

| Column         | Type        | Constraints                   | Description                          |
| -------------- | ----------- | ----------------------------- | ------------------------------------ |
| `id`           | UUID        | PK, DEFAULT gen_random_uuid() | Internal identifier                  |
| `event_id`     | TEXT        | NOT NULL, UNIQUE              | ASAAS webhook event ID               |
| `event_type`   | TEXT        | NOT NULL                      | Event type (e.g., PAYMENT_CONFIRMED) |
| `processed_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW()        | When the event was processed         |

Used for webhook idempotency and replay protection (C2). Old records can be pruned after 30 days.

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
  model/
    webhook-event.model.ts
  repository/
    i.webhook-events.repository.ts
    implementation/
      webhook-events.repository.ts
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

> **ASAAS Checkout Approach:** Our backend **never handles credit card data, CPF/CNPJ, or any sensitive payment information**. When a user subscribes, the backend creates an ASAAS Checkout Session (`POST /v3/checkouts`) and returns the checkout URL. The user is redirected to ASAAS's hosted checkout page where they enter all payment details directly. ASAAS handles PCI-DSS compliance, card validation, and customer creation. Our backend is notified of the result via webhooks.
>
> This eliminates PCI-DSS scope, credit card tokenization, CPF/CNPJ validation, and `remoteIp` handling from our backend entirely.

**`SubscribeBodyDTO`** — For initiating a subscription checkout:

```typescript
export class SubscribeBodyDTO {
  @IsUUID()
  planId: string;
}
```

This is intentionally minimal. The backend uses the `planId` to look up the plan catalog (price, name, cycle) and creates the ASAAS Checkout Session server-side. No payment data passes through our API.

**`ChangePlanBodyDTO`** — For upgrading/downgrading (direct API, no checkout needed since payment method is already on file):

```typescript
export class ChangePlanBodyDTO {
  @IsUUID()
  planId: string;
}
```

---

## 6. ASAAS Integration Layer

### 6.1 `IAsaasService` Abstract Class

```typescript
@Injectable()
export abstract class IAsaasService {
  // Checkout
  public abstract createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<AsaasCheckoutSession>;

  // Subscription (for upgrades/downgrades/cancels after initial checkout)
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

> **Note:** `createCustomer()` is no longer needed — ASAAS creates the customer automatically during checkout. The `asaas_customer_id` is extracted from the webhook payload after checkout completion.

### 6.2 `AsaasService` Implementation

- Uses `ConfigService` to read `ASAAS_API_KEY`.
- Uses `fetch` (Node 22 native) or a lightweight HTTP client to call the ASAAS REST API.
- Base URL is read from `ASAAS_API_URL` env var (sandbox vs. production).
- Callback URLs (success, cancel) are read from `ASAAS_CHECKOUT_SUCCESS_URL` and `ASAAS_CHECKOUT_CANCEL_URL` env vars.
- Maps ASAAS response DTOs to internal types.
- Throws `AsaasApiException` (a new DomainException) on API errors.
- **No customer creation needed** — ASAAS creates the customer during checkout automatically.

### 6.3 Key ASAAS API Calls

| Operation               | ASAAS Endpoint                  | When                                             |
| ----------------------- | ------------------------------- | ------------------------------------------------ |
| Create checkout session | `POST /v3/checkouts`            | Subscribe to paid plan (user completes on ASAAS) |
| Update subscription     | `PUT /v3/subscriptions/{id}`    | Change plan (value, cycle) after initial setup   |
| Cancel subscription     | `DELETE /v3/subscriptions/{id}` | Cancel subscription                              |
| Get subscription        | `GET /v3/subscriptions/{id}`    | Sync/verify status                               |

### 6.4 ASAAS ↔ Internal Mapping

**Checkout Session Fields:**

| ASAAS Checkout Field  | Source                                                           |
| --------------------- | ---------------------------------------------------------------- |
| `chargeTypes`         | Always `['RECURRENT']`                                           |
| `billingTypes`        | `['CREDIT_CARD']` (can include `'PIX'` in the future)            |
| `items[0].name`       | Plan's `name` from catalog                                       |
| `items[0].value`      | `subscription_plans.price_cents / 100` (server-side)             |
| `items[0].quantity`   | Always `1`                                                       |
| `subscription.cycle`  | Maps from `BillingCycleEnum` → ASAAS `MONTHLY`/`YEARLY`          |
| `externalReference`   | Our `users.id` (used to link webhook back to user)               |
| `callback.successUrl` | Frontend success page URL (e.g., `/subscription/success`)        |
| `callback.cancelUrl`  | Frontend cancel page URL (e.g., `/subscription/cancel`)          |
| `customerData`        | Pre-filled with user's `name` and `email` (optional convenience) |

**Subscription/Webhook Fields:**

| ASAAS Field                        | Internal Field                                              |
| ---------------------------------- | ----------------------------------------------------------- |
| `customer` (ASAAS customer ID)     | `users.asaas_customer_id`                                   |
| `id` (ASAAS subscription ID)       | `user_subscriptions.asaas_subscription_id`                  |
| `status` (ACTIVE/INACTIVE/EXPIRED) | `user_subscriptions.status` mapped to our enum              |
| `externalReference`                | Our `users.id`                                              |
| `cycle`                            | Maps from our `BillingCycleEnum` → ASAAS `MONTHLY`/`YEARLY` |
| `value`                            | Derived from `subscription_plans.price_cents / 100`         |

---

## 7. Subscription Business Logic

### 7.1 User Registration → Implicit Free Tier

- **No record is created** in `user_subscriptions` at registration time.
- A user without a `user_subscriptions` row is treated as `FREE` tier.
- The `SubscriptionsService.getUserTier(userId)` method returns `FREE` if no record exists.

### 7.2 Subscribe (Free → Paid)

The subscribe flow uses **ASAAS Checkout Sessions**. Our backend creates a checkout session and returns the URL. The user completes payment on ASAAS's hosted page. We are notified via webhook.

**Step A — Backend creates checkout session:**

1. **Derive `userId` from JWT** (`request.user.sub`) — never from request params/body (H1 — IDOR prevention).
2. Validate the target plan exists and is active.
3. **Validate the plan is not free** — reject attempts to "subscribe" to the free plan via this endpoint; free tier is implicit (H4).
4. Validate the user does not already have an active paid subscription.
   - Use the DB `UNIQUE` constraint on `user_subscriptions.user_id` as the ultimate guard.
   - Use PostgreSQL advisory locks (`pg_advisory_xact_lock(hashtext(userId))`) to prevent race conditions where concurrent requests could create duplicate checkout sessions (H5).
5. **Derive price server-side** — always read `plan.priceCents` from the DB plan record. Never accept price from client input (C4).
6. **Create ASAAS Checkout Session** via `POST /v3/checkouts`:
   - `chargeTypes` = `['RECURRENT']`.
   - `billingTypes` = `['CREDIT_CARD']` (can add `'PIX'` in the future).
   - `items` = `[{ name: plan.name, value: plan.priceCents / 100, quantity: 1, imageBase64: planImage }]`.
   - `subscription` = `{ cycle: 'MONTHLY', nextDueDate: today }`.
   - `externalReference` = user's UUID (used to link the webhook back to our user).
   - `callback.successUrl` = frontend success page (e.g., `https://app.helptutor.com/subscription/success`).
   - `callback.cancelUrl` = frontend cancel page (e.g., `https://app.helptutor.com/subscription/cancel`).
   - `customerData` = `{ name: user.name, email: user.email }` (optional pre-fill for convenience).
   - `minutesToExpire` = `30` (checkout expires after 30 minutes).
7. **Return the checkout URL** to the frontend.

**Step B — User completes payment on ASAAS's hosted checkout page:**

- User enters credit card info, CPF/CNPJ, address — all directly on ASAAS's page.
- ASAAS handles PCI-DSS compliance, card validation, fraud checks, and customer creation.
- On success, ASAAS redirects the user to our `successUrl`.
- On cancel/failure, ASAAS redirects to our `cancelUrl`.

**Step C — Webhook confirms subscription creation:**

1. ASAAS sends `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` webhook with subscription and customer info.
2. Backend extracts `externalReference` (our user UUID), `subscription` ID, and `customer` ID from the payload.
3. **Save `asaas_customer_id`** on the `users` table (for future reference).
4. **Insert** row in `user_subscriptions` with the plan, ASAAS subscription ID, and status `active`.
5. **Revoke all refresh tokens** for the user → forces re-login → new JWT includes updated tier.

> **Important:** The subscription is NOT considered active until the webhook confirms it. The frontend `successUrl` page should poll `GET /subscriptions/me` or show a "processing" state until the webhook has been processed.

> **Security advantage:** Our backend never handles credit card data, CPF/CNPJ, `remoteIp`, or any PCI-sensitive information. ASAAS handles all of this on their hosted checkout page. This eliminates C1, C3, and H2 concerns entirely.

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

### 8.3 Staleness Window & Defense-in-Depth

- Access tokens have a **15-minute TTL**.
- When a subscription changes (via the API or via ASAAS webhook), we **revoke all refresh tokens** for the user.
- Worst case: the user has a valid access token for up to 15 minutes with an outdated tier.
- After that, the access token expires, the refresh token is revoked, and the user must re-login.
- **This is an acceptable trade-off** for read-only/display operations.

**Defense-in-Depth for Write Operations (C5 — Critical):**

For endpoints guarded by `@RequiredTier()` that perform **write operations** (e.g., creating resources, inviting members), the `SubscriptionTierGuard` adds a **lightweight DB verification** in addition to the JWT check:

```typescript
// In SubscriptionTierGuard, for write operations (POST, PUT, PATCH, DELETE):
if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
  const currentTier = await this.subscriptionsService.getUserTier(user.sub);
  if (TIER_HIERARCHY[currentTier] < TIER_HIERARCHY[requiredTier]) {
    throw new ForbiddenException('Insufficient subscription tier');
  }
}
```

This closes the 15-minute escalation window for any state-changing action, while still allowing fast JWT-only checks for GET requests.

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

**Authentication:**

- The webhook endpoint validates the `asaas-access-token` header against a stored secret (`ASAAS_WEBHOOK_TOKEN` env var).
- **`ASAAS_WEBHOOK_TOKEN` must be a separate secret from `ASAAS_API_KEY`** (M1) — never reuse the API key as the webhook token. This limits blast radius if either key is compromised.
- If the token doesn't match, return `401`.

**Endpoint Configuration (C7):**

- The webhook endpoint must use `@SkipThrottle()` to bypass global rate limiting (ASAAS controls the request rate, not us).
- Always return a raw `200 OK` response immediately to ASAAS to prevent retries.
- Sanitize all webhook payloads before logging — never log full payment details or card tokens.

**Replay Protection (C2):**

- Validate the `dateCreated` timestamp on webhook events — reject events older than a configurable threshold (e.g., 10 minutes).
- Store processed event IDs in the `webhook_events` table to detect and reject replayed events (see Section 10.5).

### 10.4 Processing Flow

1. Parse webhook payload.
2. Verify auth token.
3. Extract `event` and `payment.subscription` or `subscription.id`.
4. Look up `user_subscriptions` by `asaas_subscription_id`.
5. Update status accordingly.
6. If status changed, revoke user's refresh tokens.

### 10.5 Idempotency & Replay Protection

- Webhook handlers must be idempotent. If a `PAYMENT_CONFIRMED` arrives for an already-active subscription, it's a no-op.
- **Event deduplication (C2):** Every processed webhook event's `id` is stored in the `webhook_events` table (with `event_id UNIQUE` constraint). Before processing, check if the event ID already exists — if so, return `200` without re-processing.
- Processing flow with deduplication:
  1. Receive webhook event.
  2. Verify auth token.
  3. Check `webhook_events` table for `event.id` — if found, return `200`.
  4. Validate `dateCreated` timestamp — reject if too old.
  5. Process the event (update subscription status, revoke tokens if needed).
  6. Insert `event.id` into `webhook_events` table.
  7. Return `200`.
- Old records in `webhook_events` can be pruned periodically (e.g., events older than 30 days).

---

## 11. Impacts on Existing Code

### 11.1 Files to Modify

| File                                                                | Change                                                                                                |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/auth/payloads/jwt.payload.ts`                                  | Add `subscriptionTier: SubscriptionTierEnum` field                                                    |
| `src/auth/service/i.auth.service.ts`                                | Add dependency on `ISubscriptionsService` (or just `ISubscriptionsRepository`)                        |
| `src/auth/service/implementation/auth.service.ts`                   | In `login()` and `refresh()`, look up user's tier and include in JWT payload                          |
| `src/auth/auth.module.ts`                                           | Import `SubscriptionsModule`                                                                          |
| `src/organizations/service/implementation/organizations.service.ts` | In `transferOwnership()`, validate target user's subscription tier                                    |
| `src/organizations/organizations.module.ts`                         | Import `SubscriptionsModule`                                                                          |
| `src/app.module.ts`                                                 | Import `AsaasModule` and `SubscriptionsModule`                                                        |
| `.env.example`                                                      | Add `ASAAS_API_URL`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_CHECKOUT_SUCCESS_URL`, `ASAAS_CHECKOUT_CANCEL_URL` |
| `.env.development`                                                  | Add sandbox values for the above                                                                      |
| `src/common/enums/domain-exception-code.enum.ts`                    | Add new domain exception codes                                                                        |
| `src/common/filters/all-exceptions.filter.ts`                       | Add new code → HTTP status mappings                                                                   |
| `src/users/repository/i.users.repository.ts`                        | Add `updateAsaasCustomerId()` method                                                                  |
| `src/users/repository/implementation/users.repository.ts`           | Implement `updateAsaasCustomerId()`                                                                   |
| `src/users/model/user.model.ts`                                     | Add `asaasCustomerId: string \| null` field                                                           |

### 11.2 New Files

All files under `src/asaas/` and `src/subscriptions/` as described in Section 4.

### 11.3 New Migration

One new migration file covering:

- New enums (`subscription_tier`, `billing_cycle`, `subscription_status`)
- New tables (`subscription_plans`, `user_subscriptions`, `webhook_events`)
- New column on `users` (`asaas_customer_id`)
- Seed data for the 3 initial plans
- Indexes for performance (`user_id`, `asaas_subscription_id`, `event_id`)

---

## 12. Database Migrations

### 12.0 Migration Workflow

To generate migration files and update types, use the following workflow:

**Step 1 — Generate a new migration file:**

```bash
npx supabase migration new <nameofmigration>
```

This creates a new timestamped `.sql` file under `supabase/migrations/` (e.g., `supabase/migrations/20260401120000_<nameofmigration>.sql`). Write the SQL statements in this file.

**Step 2 — After writing/running the migration, regenerate TypeScript types:**

```bash
npm run db:types
```

This updates `src/database/types.ts` with the new tables, columns, and enums, ensuring the application code has type-safe access to the new schema.

> **Important:** Always run `npm run db:types` after every migration to keep the TypeScript types in sync with the database schema.

### 12.1 Migration SQL

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

-- Webhook event deduplication (replay protection)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
```

---

## 13. API Endpoints

### 13.1 Subscriptions Controller

| Method | Path                         | Auth   | Description                                                     |
| ------ | ---------------------------- | ------ | --------------------------------------------------------------- |
| `GET`  | `/subscriptions/plans`       | Public | List all active subscription plans                              |
| `GET`  | `/subscriptions/me`          | JWT    | Get current user's subscription (tier, plan, status)            |
| `POST` | `/subscriptions/subscribe`   | JWT    | Create ASAAS checkout session, returns checkout URL to redirect |
| `PUT`  | `/subscriptions/change-plan` | JWT    | Upgrade or downgrade plan (direct ASAAS API, no checkout)       |
| `POST` | `/subscriptions/cancel`      | JWT    | Cancel current subscription                                     |

**Rate Limiting (C6 — Critical):**

Subscription mutation endpoints (`subscribe`, `change-plan`, `cancel`) must have strict rate limits to prevent abuse:

```typescript
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per 60 seconds
@Post('subscribe')
```

The `GET /plans` and `GET /me` endpoints use the default global rate limit (20 req/60s).

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

**`CheckoutSessionResponse`** (returned by POST /subscribe):

```typescript
{
  checkoutUrl: string; // ASAAS hosted checkout URL — frontend redirects user here
  expiresInMinutes: number;
}
```

> The frontend receives this URL and redirects the user to ASAAS's checkout page. After payment, the user is redirected back to the configured `successUrl` or `cancelUrl`.

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
   - `subscribe()` — creates ASAAS checkout session, returns checkout URL
   - `handleCheckoutCompleted()` — called by webhook after successful checkout
   - `changePlan()`, `cancel()`
   - `handleSubscriptionStatusChange()` (called by webhook)
   - `validateDowngrade()` (extensible hook)
3. Create `ISubscriptionsController` + `SubscriptionsController`.
   - Wire up the 5 endpoints.
4. Create DTOs with class-validator decorators.
5. Create `SubscriptionsModule` with proper DI bindings.

### Phase 3: ASAAS Module — API Client + Webhook

**Estimated effort: 2 days**

1. Create `IAsaasService` + `AsaasService`.
   - Implement `createCheckoutSession()` — `POST /v3/checkouts`.
   - Implement `updateSubscription()`, `cancelSubscription()`, `getSubscription()`.
   - Handle error responses (sanitize before returning to client).
2. Create `AsaasWebhookController`.
   - Parse events, validate auth token, deduplicate via `webhook_events` table.
   - Handle `PAYMENT_CONFIRMED` — link checkout result to user, create local subscription.
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

**Estimated effort: 2-3 days**

1. Integration tests against Supabase local.
2. Test ASAAS sandbox checkout flow end-to-end (create session → redirect → webhook).
3. Test webhook idempotency and replay protection.
4. Test token refresh after subscription change.
5. Edge cases: double-subscribe, cancel already-canceled, downgrade with blocking features.
6. **Security tests:**
   - Verify `planId` rejects non-UUID values.
   - Verify price in checkout session is always derived server-side from plan catalog.
   - Verify webhook replay with duplicate event IDs is rejected.
   - Verify webhook with expired timestamps is rejected.
   - Verify ASAAS API errors return generic messages to client.
   - Verify rate limiting on subscription mutation endpoints.
   - Verify `SubscriptionTierGuard` performs DB check on POST/PUT/PATCH/DELETE.
   - Verify checkout `externalReference` correctly links back to authenticated user.
   - Verify expired/canceled checkout sessions cannot create subscriptions.

---

## 15. Environment Variables

Add to `.env.example`:

```dotenv
ASAAS_API_URL=
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
ASAAS_CHECKOUT_SUCCESS_URL=
ASAAS_CHECKOUT_CANCEL_URL=
```

Add to `.env.development`:

```dotenv
ASAAS_API_URL=https://api-sandbox.asaas.com
ASAAS_API_KEY=$aact_hmlg_... (already present)
ASAAS_WEBHOOK_TOKEN=some_dev_webhook_token
ASAAS_CHECKOUT_SUCCESS_URL=http://localhost:3000/subscription/success
ASAAS_CHECKOUT_CANCEL_URL=http://localhost:3000/subscription/cancel
```

> Note: `ASAAS_API_KEY` is already in `.env.development`. We just need to add `ASAAS_API_URL` and `ASAAS_WEBHOOK_TOKEN`.
>
> **Security (M1):** `ASAAS_WEBHOOK_TOKEN` must be a **separate secret** from `ASAAS_API_KEY`. Generate a dedicated webhook verification token in the ASAAS dashboard. Never reuse the API key as the webhook token.

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

### 16.4 ASAAS Error Sanitization (H3)

When the ASAAS API returns an error, **never expose the raw ASAAS error message to the client**. The `AsaasApiException` handler must:

- Return a **generic message** to the client: `"Payment processing failed. Please try again or contact support."`
- Log the **full ASAAS error response** server-side (using the existing `LoggingInterceptor`) for debugging.
- This prevents leaking internal infrastructure details, ASAAS-specific error codes, or sensitive data to end users.

### 16.5 Audit Trail (M3)

All subscription state changes (subscribe, upgrade, downgrade, cancel, webhook-triggered changes) should be logged with:

- `userId`, `action`, `fromPlan`, `toPlan`, `timestamp`, `trigger` (user/webhook/system).
- This provides an audit trail for dispute resolution and debugging.
- Can be implemented as a simple `subscription_audit_log` table or structured application logs.

---

## 17. Security Considerations

This section consolidates all security requirements for the subscription feature, organized by severity. Each finding references the section where the mitigation is implemented.

### 17.1 Critical

| ID     | Finding                                           | Mitigation                                                                                | Section                                                                    |
| ------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ~~C1~~ | ~~PCI-DSS: Raw credit card data through backend~~ | **Eliminated.** Using ASAAS Checkout Sessions — backend never handles card data.          | [5.3](#53-dtos), [7.2](#72-subscribe-free--paid)                           |
| C2     | **Webhook replay attacks**                        | Store processed event IDs in `webhook_events` table. Validate `dateCreated` timestamps.   | [10.3](#103-webhook-security), [10.5](#105-idempotency--replay-protection) |
| ~~C3~~ | ~~Client-supplied `remoteIp` spoofing~~           | **Eliminated.** Using ASAAS Checkout Sessions — no `remoteIp` needed.                     | [5.3](#53-dtos)                                                            |
| C4     | **Price manipulation from client input**          | Always derive price from server-side plan catalog (`plan.priceCents`). Never from client. | [7.2](#72-subscribe-free--paid)                                            |
| C5     | **15-min tier escalation via JWT staleness**      | Defense-in-depth: DB check on write operations in `SubscriptionTierGuard`.                | [8.3](#83-staleness-window--defense-in-depth)                              |
| C6     | **No rate limiting on subscription endpoints**    | `@Throttle({ default: { limit: 3, ttl: 60000 } })` on mutation endpoints.                 | [13.1](#131-subscriptions-controller)                                      |
| C7     | **Webhook endpoint misconfiguration**             | `@SkipThrottle()`, raw 200 response, sanitize logs.                                       | [10.3](#103-webhook-security)                                              |

### 17.2 High

| ID     | Finding                                   | Mitigation                                                                          | Section                                  |
| ------ | ----------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| H1     | **IDOR on subscription operations**       | Always derive `userId` from JWT (`request.user.sub`), never from params/body.       | [7.2](#72-subscribe-free--paid)          |
| ~~H2~~ | ~~No CPF/CNPJ validation~~                | **Eliminated.** ASAAS Checkout handles CPF/CNPJ collection and validation directly. | [5.3](#53-dtos)                          |
| H3     | **ASAAS error details exposed to client** | Generic client messages, detailed server-side logging.                              | [16.4](#164-asaas-error-sanitization-h3) |
| H4     | **Subscribe to free plan via API**        | Reject in `subscribe()` if `plan.isFree()`.                                         | [7.2](#72-subscribe-free--paid)          |
| H5     | **Double-subscribe race condition**       | DB `UNIQUE` constraint + PostgreSQL advisory locks + webhook idempotency.           | [7.2](#72-subscribe-free--paid)          |

### 17.3 Medium

| ID  | Finding                                  | Mitigation                                                            | Section                                                        |
| --- | ---------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| M1  | **Webhook token reuses API key**         | `ASAAS_WEBHOOK_TOKEN` must be a separate secret from `ASAAS_API_KEY`. | [10.3](#103-webhook-security), [15](#15-environment-variables) |
| M2  | **Plan table write protection**          | RLS policy or service-role-only write access on `subscription_plans`. | [3.3](#33-table-subscription_plans)                            |
| M3  | **Audit trail for subscription changes** | Log all state changes with userId, action, plans, timestamp, trigger. | [16.5](#165-audit-trail-m3)                                    |
| M4  | **Missing `@IsUUID()` on `planId`**      | Added to `SubscribeBodyDTO` and `ChangePlanBodyDTO`.                  | [5.3](#53-dtos)                                                |

### 17.4 Security Checklist (Pre-Launch)

- [ ] ASAAS Checkout Sessions used for initial subscription — backend never handles card data or CPF/CNPJ
- [ ] `ASAAS_WEBHOOK_TOKEN` is a separate secret from `ASAAS_API_KEY`
- [ ] Webhook endpoint uses `@SkipThrottle()` and returns raw 200
- [ ] `webhook_events` table exists and deduplication is implemented
- [ ] All subscription mutation endpoints have `@Throttle` decorators
- [ ] `SubscriptionTierGuard` performs DB check on write operations
- [ ] Checkout `externalReference` is validated against authenticated user on webhook
- [ ] Price in checkout session is always derived from plan catalog, never from client
- [ ] `userId` is always derived from JWT, never from request body
- [ ] ASAAS API errors are sanitized before client response
- [ ] `subscription_plans` table has write protection
- [ ] Subscription audit logging is in place
- [ ] Checkout callback URLs are validated and use HTTPS in production

---

## Summary of Key Design Principles

| Principle                       | Application                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Separation of concerns**      | `AsaasModule` (infrastructure) vs `SubscriptionsModule` (business domain)                                              |
| **Interface-based DI**          | Abstract classes (`IAsaasService`, `ISubscriptionsService`) with concrete implementations, following existing patterns |
| **Token-based authorization**   | Subscription tier embedded in JWT — no DB query needed for tier checks                                                 |
| **Extensibility**               | Plan catalog in DB (not hard-coded), tier hierarchy constant, `validateDowngrade()` hook                               |
| **Existing pattern compliance** | Controller → Service → Repository layers, DomainException hierarchy, guard stacking, module structure                  |
| **Idempotency**                 | Webhook handlers are safe to call multiple times, with event ID deduplication                                          |
| **Graceful staleness**          | 15-min max window for outdated tier in JWT, mitigated by revoking refresh tokens on changes + DB check on writes       |
| **PCI-DSS compliance**          | ASAAS Checkout Sessions handle all payment data — backend is completely out of PCI-DSS scope                           |
| **Defense-in-depth**            | JWT-based fast checks for reads, DB-verified checks for writes, rate limiting on mutations, replay-protected webhooks  |
| **OWASP compliance**            | IDOR prevention (JWT-derived user ID), input validation (@IsUUID), error sanitization, audit trails                    |
