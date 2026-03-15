# Subscriptions Feature — Step-by-Step Implementation Plan

> **Reference document:** [subscriptions-roadmap.md](./subscriptions-roadmap.md) — contains the full architecture, data model, security considerations, and design decisions.
>
> This document breaks the roadmap into **atomic, sequential steps** that an AI coding agent can execute one at a time. Each step produces working, compilable code before moving to the next.

---

## System Prompt

Use the system prompt below when asking the AI to implement each step. Paste it once at the start of the conversation, then feed one step at a time.

```
You are a senior NestJS backend developer implementing features for the help-tutor backend project. You MUST follow every convention listed below exactly. Do NOT invent new patterns. Read the existing codebase before writing any code.

## Project Stack
- NestJS 11, TypeScript 5.7 (strict mode), Node 22
- Supabase (PostgreSQL 17) with auto-generated types at `src/database/types.ts`
- Authentication: JWT (15-min access tokens + refresh tokens)
- Validation: class-validator + class-transformer
- Global: Helmet, CORS, ThrottlerGuard (20 req/60s default), ValidationPipe (whitelist + forbidNonWhitelisted)

## Architecture Rules

### Module Pattern
- Every module uses `{ provide: IXxxAbstract, useClass: XxxConcrete }` — never shorthand class registration.
- Only abstract tokens (`IXxxService`, `IXxxRepository`) are exported — never the concrete class.
- Circular dependencies resolved with `forwardRef(() => ModuleName)`.

### Controller Pattern
- **Abstract class** at `controller/i.xxx.controller.ts`:
  - NOT decorated with `@Controller()`.
  - Stores service deps as `protected readonly` fields, assigned in a plain constructor (no `@Inject`).
  - All methods are `public abstract`.
- **Concrete class** at `controller/implementation/xxx.controller.ts`:
  - Decorated with `@Controller('route')`.
  - `extends IXxxController`.
  - Constructor uses `@Inject(IXxxService)` then calls `super(service)`.
  - All NestJS decorators (`@Post()`, `@UseGuards()`, `@Body()`, `@Throttle()`, `@HttpCode()`) go ONLY on the concrete class.
  - `@HttpCode(HttpStatus.OK)` is used on POST routes that return data (NestJS defaults POST to 201).
  - `@Throttle()` can override the global limit per-route.
  - Guard stacking order: `AuthGuard` → `MembershipGuard` → `RolesGuard` → `SubscriptionTierGuard`.

### Service Pattern
- **Abstract class** at `service/i.xxx.service.ts`:
  - Decorated with `@Injectable()` (this is the NestJS DI token).
  - Deps are `protected readonly`, assigned in constructor (no `@Inject` on abstract).
  - Public methods are `public abstract`.
  - Internal helpers that must be overridden are `protected abstract`.
- **Concrete class** at `service/implementation/xxx.service.ts`:
  - Decorated with `@Injectable()`.
  - `extends IXxxService`.
  - Constructor uses `@Inject(IXxxAbstract)` for every dep, then calls `super(...)`.
  - Static constants: `private static readonly NAME = value`.

### Repository Pattern
- **Abstract class** at `repository/i.xxx.repository.ts`:
  - NOT decorated with `@Injectable()`.
  - Always depends on `IDatabaseService` and `IHelpersService`.
  - Always has `protected abstract mapToEntity(data: Database['public']['Tables']['xxx']['Row']): Model`.
- **Concrete class** at `repository/implementation/xxx.repository.ts`:
  - Decorated with `@Injectable()`.
  - `extends IXxxRepository`.
  - Constructor uses `@Inject(IDatabaseService)` and `@Inject(IHelpersService)`, then calls `super(...)`.
  - Supabase queries use: `.from('table').select().eq().single()`, with `.insert()`, `.update()`, `.delete()`.
  - Error handling: check `result.error`, check `result.error.code` against `PostgresErrorCode` enum, throw `EntityAlreadyExistsException`, `EntityNotFoundException`, or `DatabaseException`.
  - Date mapping: always use `this.helperService.parseEntitiesDates(data.created_at, data.updated_at)`.

### Model Pattern
- Plain classes (no decorators) at `model/xxx.model.ts`.
- All properties are `public readonly`.
- Constructor takes positional arguments matching property order.
- Nullable fields use `Type | null` (never `undefined`).
- Can have utility methods (e.g., `isFree(): boolean`).

### DTO Pattern
- Files at `dtos/xxx.dto.ts`.
- Properties are `public` (no `readonly`).
- Decorators top to bottom: type validators (`@IsString()`, `@IsUUID()`), then `@IsNotEmpty()`, then constraints (`@MinLength()`).
- Optional fields: `@IsOptional()` + `?` syntax.

### Exception Pattern
- All custom exceptions extend `DomainException`.
- Each has a fixed `DomainExceptionCode`.
- Common exceptions in `src/common/exceptions/`, module-specific in `module/exceptions/`.
- `AllExceptionsFilter` maps `DomainExceptionCode` → `HttpStatus` via a static `Map`.

### Enum Pattern
- Domain enums suffixed with `Enum` (e.g., `SubscriptionTierEnum`).
- Values: `UPPER_CASE = 'lower_case'` matching the PostgreSQL enum value.
- Technical enums NOT suffixed (e.g., `PostgresErrorCode`, `DomainExceptionCode`).

### Response Pattern
- Controllers return raw data — `ResponseInterceptor` wraps it in `ApiResponse.success(data)` automatically.
- Response classes use `public readonly` properties.
- Named `XxxResponse` (suffixed with `Response`).

### Database
- To create migration files: `npx supabase migration new <name>`
- After every migration: `npm run db:types` to regenerate `src/database/types.ts`
- Supabase query builder is fully typed via `IDatabaseService extends SupabaseClient<Database>`

### Security Rules
- `userId` ALWAYS derived from JWT (`request.user.sub`) — never from request body/params.
- Prices ALWAYS derived server-side from plan catalog — never from client input.
- ASAAS API errors return generic message to client, full details logged server-side only.
- Webhook endpoint: `@SkipThrottle()`, validate `asaas-access-token` header, always return 200, deduplicate via `webhook_events` table.
- `SubscriptionTierGuard` performs lightweight DB check on write operations (POST/PUT/PATCH/DELETE) for defense-in-depth.

### Naming Conventions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Abstract interfaces: prefixed with `I` (e.g., `ISubscriptionsService`)
- Interface files: prefixed with `i.` (e.g., `i.subscriptions.service.ts`)
- Enums: `PascalCase` + `Enum` suffix for domain enums
- DB columns: `snake_case`, TS properties: `camelCase`

### What NOT to do
- Do NOT use barrel files (index.ts).
- Do NOT use `@Injectable()` on abstract repository classes.
- Do NOT put NestJS decorators on abstract controllers.
- Do NOT put `@Inject()` on abstract class constructors.
- Do NOT use `undefined` for nullable fields — use `null`.
- Do NOT import concrete implementations directly — always import the abstract token.
- Do NOT return raw error details from external APIs to the client.
```

---

## Implementation Steps

### Step 1 — Database Migration

**Goal:** Create the SQL migration with all new enums, tables, indexes, and seed data.

**Instructions:**

1. Run `npx supabase migration new add_subscriptions` to generate the migration file.
2. Write the following SQL in the generated file:
   - Create PostgreSQL enums: `subscription_tier` (`free`, `basic`, `pro`), `billing_cycle` (`monthly`, `yearly`), `subscription_status` (`active`, `past_due`, `canceled`).
   - Add column `asaas_customer_id TEXT UNIQUE` to the `users` table.
   - Create `subscription_plans` table (see roadmap Section 3.3).
   - Create `user_subscriptions` table with `UNIQUE` constraint on `user_id` (see roadmap Section 3.4).
   - Create `webhook_events` table for idempotency (see roadmap Section 3.6).
   - Create indexes: `idx_subscription_plans_tier`, `idx_user_subscriptions_user_id`, `idx_user_subscriptions_asaas_sub_id`, `idx_webhook_events_event_id`.
   - Seed 3 initial plans: Free (0 centavos, no billing cycle), Basic (19800 centavos, monthly), Pro (29800 centavos, monthly).
3. Run the migration locally.
4. Run `npm run db:types` to regenerate `src/database/types.ts`.

**Reference:** Roadmap Section 12.

**Files created/modified:**

- `supabase/migrations/<timestamp>_add_subscriptions.sql` (new)
- `src/database/types.ts` (auto-regenerated)

---

### Step 2 — Subscription Enums

**Goal:** Create the three TypeScript enums and the tier hierarchy constant.

**Instructions:**

1. Create `src/subscriptions/enums/subscription-tier.enum.ts` with `SubscriptionTierEnum` (`FREE = 'free'`, `BASIC = 'basic'`, `PRO = 'pro'`) and export `TIER_HIERARCHY: Record<SubscriptionTierEnum, number>` mapping FREE→0, BASIC→1, PRO→2.
2. Create `src/subscriptions/enums/subscription-status.enum.ts` with `SubscriptionStatusEnum` (`ACTIVE = 'active'`, `PAST_DUE = 'past_due'`, `CANCELED = 'canceled'`).
3. Create `src/subscriptions/enums/billing-cycle.enum.ts` with `BillingCycleEnum` (`MONTHLY = 'monthly'`, `YEARLY = 'yearly'`).

**Reference:** Roadmap Section 5.1.

**Files created:**

- `src/subscriptions/enums/subscription-tier.enum.ts`
- `src/subscriptions/enums/subscription-status.enum.ts`
- `src/subscriptions/enums/billing-cycle.enum.ts`

---

### Step 3 — Domain Exception Codes + Exception Classes

**Goal:** Add new exception codes and create the subscription/ASAAS exception classes.

**Instructions:**

1. Add to `src/common/enums/domain-exception-code.enum.ts`:
   - `INSUFFICIENT_SUBSCRIPTION = 'INSUFFICIENT_SUBSCRIPTION'`
   - `ACTIVE_SUBSCRIPTION_REQUIRED = 'ACTIVE_SUBSCRIPTION_REQUIRED'`
   - `CANNOT_DOWNGRADE = 'CANNOT_DOWNGRADE'`
   - `ASAAS_API_ERROR = 'ASAAS_API_ERROR'`
2. Add to the `DOMAIN_CODE_TO_STATUS` map in `src/common/filters/all-exceptions.filter.ts`:
   - `INSUFFICIENT_SUBSCRIPTION` → `HttpStatus.FORBIDDEN`
   - `ACTIVE_SUBSCRIPTION_REQUIRED` → `422` (UNPROCESSABLE_ENTITY)
   - `CANNOT_DOWNGRADE` → `422` (UNPROCESSABLE_ENTITY)
   - `ASAAS_API_ERROR` → `HttpStatus.BAD_GATEWAY`
3. Create `src/subscriptions/exceptions/insufficient-subscription.exception.ts` — extends `DomainException` with code `INSUFFICIENT_SUBSCRIPTION` and a parameterized message.
4. Create `src/subscriptions/exceptions/active-subscription-required.exception.ts` — extends `DomainException` with code `ACTIVE_SUBSCRIPTION_REQUIRED`.
5. Create `src/subscriptions/exceptions/cannot-downgrade.exception.ts` — extends `DomainException` with code `CANNOT_DOWNGRADE`.
6. Create `src/asaas/exceptions/asaas-api.exception.ts` — extends `DomainException` with code `ASAAS_API_ERROR`. **Important:** the message exposed to clients must be generic (`"Payment processing failed. Please try again or contact support."`). The original ASAAS error details should be passed to the constructor for logging purposes only, but the `message` field that reaches the client must be the generic one.

**Reference:** Roadmap Sections 16.1–16.4.

**Files created:**

- `src/subscriptions/exceptions/insufficient-subscription.exception.ts`
- `src/subscriptions/exceptions/active-subscription-required.exception.ts`
- `src/subscriptions/exceptions/cannot-downgrade.exception.ts`
- `src/asaas/exceptions/asaas-api.exception.ts`

**Files modified:**

- `src/common/enums/domain-exception-code.enum.ts`
- `src/common/filters/all-exceptions.filter.ts`

---

### Step 4 — Subscription Models

**Goal:** Create `SubscriptionPlan` and `UserSubscription` domain models.

**Instructions:**

1. Create `src/subscriptions/model/subscription-plan.model.ts`:
   - Properties: `id`, `name`, `tier` (SubscriptionTierEnum), `priceCents` (number), `billingCycle` (BillingCycleEnum | null), `asaasDescription`, `isActive`, `createdAt`, `updatedAt` (Date | null).
   - Method: `isFree(): boolean` — returns `true` if tier is FREE.
   - Follow the existing model pattern: `public readonly` properties, positional constructor.
2. Create `src/subscriptions/model/user-subscription.model.ts`:
   - Properties: `id`, `userId`, `planId`, `asaasSubscriptionId` (string | null), `status` (SubscriptionStatusEnum), `currentPeriodEnd` (Date | null), `canceledAt` (Date | null), `createdAt`, `updatedAt` (Date | null).
   - Method: `isActive(): boolean` — returns `true` if status is ACTIVE.

**Reference:** Roadmap Section 5.2.

**Files created:**

- `src/subscriptions/model/subscription-plan.model.ts`
- `src/subscriptions/model/user-subscription.model.ts`

---

### Step 5 — Webhook Event Model

**Goal:** Create the `WebhookEvent` model for the ASAAS module.

**Instructions:**

1. Create `src/asaas/model/webhook-event.model.ts`:
   - Properties: `id`, `eventId`, `eventType`, `processedAt` (Date).
   - Follow existing model pattern.

**Reference:** Roadmap Section 3.6.

**Files created:**

- `src/asaas/model/webhook-event.model.ts`

---

### Step 6 — Update User Model

**Goal:** Add the `asaasCustomerId` field to the existing User model.

**Instructions:**

1. Read `src/users/model/user.model.ts` to understand current constructor signature.
2. Add `public readonly asaasCustomerId: string | null` as the last property (before `createdAt` / `updatedAt`, or wherever nullable external IDs logically fit — after the domain fields, before the audit fields).
3. Update the constructor to accept the new parameter.
4. Read `src/users/repository/implementation/users.repository.ts` and update `mapToEntity()` to pass `data.asaas_customer_id` to the constructor.
5. Check all callers of `new User(...)` across the codebase and add the new argument. This includes `mapToEntity` calls in the users repository.

**Reference:** Roadmap Sections 3.5, 11.1.

**Files modified:**

- `src/users/model/user.model.ts`
- `src/users/repository/implementation/users.repository.ts`

---

### Step 7 — Users Repository: `updateAsaasCustomerId()`

**Goal:** Add a method to save the ASAAS customer ID on the users table.

**Instructions:**

1. Add `public abstract updateAsaasCustomerId(userId: string, asaasCustomerId: string): Promise<void>` to `src/users/repository/i.users.repository.ts`.
2. Implement it in `src/users/repository/implementation/users.repository.ts`:
   - Update the `users` table: `SET asaas_customer_id = asaasCustomerId, updated_at = NOW() WHERE id = userId`.
   - Handle errors (throw `DatabaseException` on failure).

**Reference:** Roadmap Section 11.1.

**Files modified:**

- `src/users/repository/i.users.repository.ts`
- `src/users/repository/implementation/users.repository.ts`

---

### Step 8 — ASAAS Enums

**Goal:** Create the ASAAS-specific enums used in the API integration layer.

**Instructions:**

1. Create `src/asaas/enums/asaas-billing-type.enum.ts` with `AsaasBillingTypeEnum` (values: `CREDIT_CARD = 'CREDIT_CARD'`, `PIX = 'PIX'`).
2. Create `src/asaas/enums/asaas-subscription-cycle.enum.ts` with `AsaasSubscriptionCycleEnum` (values: `MONTHLY = 'MONTHLY'`, `YEARLY = 'YEARLY'`, `WEEKLY = 'WEEKLY'`).
3. Create `src/asaas/enums/asaas-subscription-status.enum.ts` with `AsaasSubscriptionStatusEnum` (values: `ACTIVE = 'ACTIVE'`, `INACTIVE = 'INACTIVE'`, `EXPIRED = 'EXPIRED'`).
4. Create `src/asaas/enums/asaas-webhook-event.enum.ts` with `AsaasWebhookEventEnum` (values: `PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED'`, `PAYMENT_RECEIVED = 'PAYMENT_RECEIVED'`, `PAYMENT_OVERDUE = 'PAYMENT_OVERDUE'`, `SUBSCRIPTION_INACTIVATED = 'SUBSCRIPTION_INACTIVATED'`, `SUBSCRIPTION_DELETED = 'SUBSCRIPTION_DELETED'`).

**Reference:** Roadmap Sections 6.4, 10.2.

**Files created:**

- `src/asaas/enums/asaas-billing-type.enum.ts`
- `src/asaas/enums/asaas-subscription-cycle.enum.ts`
- `src/asaas/enums/asaas-subscription-status.enum.ts`
- `src/asaas/enums/asaas-webhook-event.enum.ts`

---

### Step 9 — ASAAS Service (Interface + Implementation)

**Goal:** Create the ASAAS API client that wraps checkout session creation, subscription management, and error handling.

**Instructions:**

1. Create `src/asaas/service/i.asaas.service.ts`:
   - `@Injectable()` abstract class.
   - Depends on `ConfigService` (from `@nestjs/config`).
   - Methods:
     - `public abstract createCheckoutSession(params: CreateCheckoutSessionParams): Promise<AsaasCheckoutSession>`
     - `public abstract getSubscription(asaasSubscriptionId: string): Promise<AsaasSubscription>`
     - `public abstract updateSubscription(asaasSubscriptionId: string, params: UpdateAsaasSubscriptionParams): Promise<AsaasSubscription>`
     - `public abstract cancelSubscription(asaasSubscriptionId: string): Promise<void>`
   - Define the param/response types as interfaces in the same file or a dedicated types file (`src/asaas/types/asaas.types.ts`). Key types:
     - `CreateCheckoutSessionParams`: `{ planName, valueCents, billingCycle, externalReference, customerName?, customerEmail? }`
     - `AsaasCheckoutSession`: `{ url: string, expiresInMinutes: number }` (mapped from ASAAS response)
     - `AsaasSubscription`: `{ id, customer, status, value, cycle, externalReference }` (mapped from ASAAS response)
     - `UpdateAsaasSubscriptionParams`: `{ value?, cycle?, updatePendingPayments? }`

2. Create `src/asaas/service/implementation/asaas.service.ts`:
   - `@Injectable()`, extends `IAsaasService`.
   - Constructor: `@Inject(ConfigService) configService: ConfigService`, call `super(configService)`.
   - Read `ASAAS_API_URL`, `ASAAS_API_KEY`, `ASAAS_CHECKOUT_SUCCESS_URL`, `ASAAS_CHECKOUT_CANCEL_URL` from ConfigService.
   - Use native `fetch` for HTTP calls.
   - `createCheckoutSession()`: `POST /v3/checkouts` with body `{ chargeTypes: ['RECURRENT'], billingTypes: ['CREDIT_CARD'], items: [...], subscription: { cycle, nextDueDate: today }, callback: { successUrl, cancelUrl }, externalReference, customerData?, minutesToExpire: 30 }`. Return the checkout URL.
   - `getSubscription()`: `GET /v3/subscriptions/{id}`.
   - `updateSubscription()`: `PUT /v3/subscriptions/{id}`.
   - `cancelSubscription()`: `DELETE /v3/subscriptions/{id}`.
   - All methods: on non-2xx response, throw `AsaasApiException` with the generic client message. Log the full ASAAS error response using `Logger`.
   - Private helper: `private async request<T>(method, path, body?): Promise<T>` that sets `access_token` header and handles errors.

**Reference:** Roadmap Sections 6.1–6.4, 16.4.

**Files created:**

- `src/asaas/service/i.asaas.service.ts`
- `src/asaas/service/implementation/asaas.service.ts`
- `src/asaas/types/asaas.types.ts` (optional, can inline types)

---

### Step 10 — Webhook Events Repository

**Goal:** Create the repository for webhook event deduplication.

**Instructions:**

1. Create `src/asaas/repository/i.webhook-events.repository.ts`:
   - Abstract class (no `@Injectable()`), depends on `IDatabaseService` and `IHelpersService`.
   - Methods:
     - `public abstract existsByEventId(eventId: string): Promise<boolean>`
     - `public abstract create(eventId: string, eventType: string): Promise<WebhookEvent>`
   - `protected abstract mapToEntity(...)`.

2. Create `src/asaas/repository/implementation/webhook-events.repository.ts`:
   - `@Injectable()`, extends `IWebhookEventsRepository`.
   - `existsByEventId()`: query `webhook_events` table by `event_id`, return `!!result.data`.
   - `create()`: insert into `webhook_events`, return mapped entity.
   - `mapToEntity()`: map DB row to `WebhookEvent` model.

**Reference:** Roadmap Sections 3.6, 10.5.

**Files created:**

- `src/asaas/repository/i.webhook-events.repository.ts`
- `src/asaas/repository/implementation/webhook-events.repository.ts`

---

### Step 11 — ASAAS Webhook DTO

**Goal:** Create the DTO for parsing incoming ASAAS webhook payloads.

**Instructions:**

1. Create `src/asaas/dtos/asaas-webhook-event.dto.ts`:
   - This DTO represents the ASAAS webhook body. Key fields:
     - `event: string` (the event type, e.g., `PAYMENT_CONFIRMED`)
     - `payment?: { subscription?: string, customer?: string, externalReference?: string, dateCreated?: string }`
     - `subscription?: { id?: string, customer?: string, externalReference?: string, status?: string }`
   - Use `@IsString()`, `@IsNotEmpty()` on `event`. The nested objects are optional and validated programmatically in the controller/service (ASAAS payloads have a fluid structure).

**Reference:** Roadmap Sections 10.1–10.4.

**Files created:**

- `src/asaas/dtos/asaas-webhook-event.dto.ts`

---

### Step 12 — ASAAS Webhook Controller

**Goal:** Create the webhook endpoint that receives ASAAS events.

**Instructions:**

1. Create `src/asaas/controller/i.asaas-webhook.controller.ts`:
   - Abstract class with `protected readonly` deps: `IWebhookEventsRepository`, `ISubscriptionsService` (will be injected later — for now, accept it as a dep; the module wiring in Step 19 will handle the circular reference).
   - Actually, to avoid circular dependency, the webhook controller should depend on `ISubscriptionsRepository` and `IUsersRepository` directly (or a dedicated `IWebhookHandlerService` within the subscriptions module). **Simpler approach:** have the webhook controller depend only on `IAsaasWebhookHandlerService` — a thin abstract class in the subscriptions module that the webhook controller calls. But to keep it aligned with the existing pattern: make the webhook controller depend on `ISubscriptionsService` and use `forwardRef`.
   - Method: `public abstract handleWebhook(headers: Record<string, string>, body: any): Promise<void>`

2. Create `src/asaas/controller/implementation/asaas-webhook.controller.ts`:
   - `@Controller('asaas')`, extends `IAsaasWebhookController`.
   - `@SkipThrottle()` at class level (bypass global rate limiting for webhooks).
   - Constructor: inject `IWebhookEventsRepository` and `ISubscriptionsService` (via `forwardRef` in the module).
   - Endpoint: `@Post('webhooks')`, `@HttpCode(HttpStatus.OK)`.
   - Flow:
     1. Read `asaas-access-token` from headers.
     2. Compare against `ASAAS_WEBHOOK_TOKEN` env var. If mismatch, throw `UnauthorizedException`.
     3. Extract `event` from body.
     4. Check `webhook_events` table for the event `id` — if found, return (already processed).
     5. Validate `dateCreated` timestamp — if older than 10 minutes, log a warning and return.
     6. Based on event type, delegate to `ISubscriptionsService.handleWebhookEvent(...)`.
     7. Insert event into `webhook_events` table.
     8. Return (implicit 200).

**Reference:** Roadmap Sections 10.1–10.5, 13.2.

**Files created:**

- `src/asaas/controller/i.asaas-webhook.controller.ts`
- `src/asaas/controller/implementation/asaas-webhook.controller.ts`

---

### Step 13 — Subscriptions Repository (Interface + Implementation)

**Goal:** Create the repository for subscription plans and user subscriptions.

**Instructions:**

1. Create `src/subscriptions/repository/i.subscriptions.repository.ts`:
   - Abstract class (no `@Injectable()`), depends on `IDatabaseService` and `IHelpersService`.
   - Methods:
     - `public abstract getActivePlans(): Promise<SubscriptionPlan[]>`
     - `public abstract getPlanById(planId: string): Promise<SubscriptionPlan>`
     - `public abstract getUserSubscription(userId: string): Promise<UserSubscription | null>`
     - `public abstract getUserTier(userId: string): Promise<SubscriptionTierEnum>`
     - `public abstract createUserSubscription(userId: string, planId: string, asaasSubscriptionId: string): Promise<UserSubscription>`
     - `public abstract updateUserSubscriptionPlan(userId: string, planId: string): Promise<UserSubscription>`
     - `public abstract updateSubscriptionStatus(asaasSubscriptionId: string, status: SubscriptionStatusEnum, canceledAt?: Date): Promise<UserSubscription | null>`
     - `public abstract getUserSubscriptionByAsaasId(asaasSubscriptionId: string): Promise<UserSubscription | null>`
   - Two `mapToEntity` methods: `mapToPlan(...)` and `mapToSubscription(...)`.

2. Create `src/subscriptions/repository/implementation/subscriptions.repository.ts`:
   - `@Injectable()`, extends `ISubscriptionsRepository`.
   - `getActivePlans()`: `SELECT * FROM subscription_plans WHERE is_active = true`.
   - `getPlanById()`: `SELECT * FROM subscription_plans WHERE id = planId`. Throw `EntityNotFoundException('SubscriptionPlan')` if not found.
   - `getUserSubscription()`: `SELECT * FROM user_subscriptions WHERE user_id = userId`. Return `null` if not found (not an error — free users won't have a record).
   - `getUserTier()`: query `user_subscriptions` joined with `subscription_plans` to get the tier. If no subscription exists, return `SubscriptionTierEnum.FREE`.
   - `createUserSubscription()`: insert into `user_subscriptions`. Handle `UNIQUE_VIOLATION` on `user_id` (throw `EntityAlreadyExistsException`).
   - `updateUserSubscriptionPlan()`: update `plan_id` and `updated_at` where `user_id = userId`.
   - `updateSubscriptionStatus()`: update `status` (and `canceled_at` if provided) where `asaas_subscription_id = asaasSubscriptionId`. Return null if no matching row.
   - `getUserSubscriptionByAsaasId()`: select by `asaas_subscription_id`.

**Reference:** Roadmap Sections 3.3, 3.4, 5.2.

**Files created:**

- `src/subscriptions/repository/i.subscriptions.repository.ts`
- `src/subscriptions/repository/implementation/subscriptions.repository.ts`

---

### Step 14 — Subscription DTOs

**Goal:** Create the request DTOs and response classes.

**Instructions:**

1. Create `src/subscriptions/dtos/subscribe.dto.ts`:
   - `SubscribeBodyDTO` with `@IsUUID() planId: string`.

2. Create `src/subscriptions/dtos/change-plan.dto.ts`:
   - `ChangePlanBodyDTO` with `@IsUUID() planId: string`.

3. Create `src/subscriptions/responses/subscription-plan.response.ts`:
   - `SubscriptionPlanResponse` with `public readonly` properties: `id`, `name`, `tier`, `priceCents`, `billingCycle`.
   - Constructor takes a `SubscriptionPlan` model and maps it.

4. Create `src/subscriptions/responses/user-subscription.response.ts`:
   - `UserSubscriptionResponse` with `public readonly` properties: `plan` (SubscriptionPlanResponse), `status`, `currentPeriodEnd` (string | null), `canceledAt` (string | null).
   - Constructor takes `UserSubscription` + `SubscriptionPlan` models and maps them.

5. Create `src/subscriptions/responses/checkout-session.response.ts`:
   - `CheckoutSessionResponse` with `public readonly` properties: `checkoutUrl` (string), `expiresInMinutes` (number).

**Reference:** Roadmap Sections 5.3, 13.3.

**Files created:**

- `src/subscriptions/dtos/subscribe.dto.ts`
- `src/subscriptions/dtos/change-plan.dto.ts`
- `src/subscriptions/responses/subscription-plan.response.ts`
- `src/subscriptions/responses/user-subscription.response.ts`
- `src/subscriptions/responses/checkout-session.response.ts`

---

### Step 15 — Subscriptions Service (Interface + Implementation)

**Goal:** Create the subscription business logic service.

**Instructions:**

1. Create `src/subscriptions/service/i.subscriptions.service.ts`:
   - `@Injectable()` abstract class.
   - Depends on: `ISubscriptionsRepository`, `IAsaasService`, `IUsersRepository`, `IAuthService` (for revoking refresh tokens).
   - Methods:
     - `public abstract getPlans(): Promise<SubscriptionPlan[]>`
     - `public abstract getMySubscription(userId: string): Promise<{ subscription: UserSubscription | null, plan: SubscriptionPlan | null }>`
     - `public abstract getUserTier(userId: string): Promise<SubscriptionTierEnum>`
     - `public abstract subscribe(userId: string, planId: string, userName: string, userEmail: string): Promise<CheckoutSessionResponse>`
     - `public abstract changePlan(userId: string, planId: string): Promise<UserSubscription>`
     - `public abstract cancel(userId: string): Promise<void>`
     - `public abstract handleWebhookEvent(event: string, payload: any): Promise<void>`
   - Protected methods:
     - `protected abstract validateDowngrade(userId: string, fromTier: SubscriptionTierEnum, toTier: SubscriptionTierEnum): Promise<void>`

2. Create `src/subscriptions/service/implementation/subscriptions.service.ts`:
   - `@Injectable()`, extends `ISubscriptionsService`.
   - Constructor injects all deps with `@Inject(...)`, calls `super(...)`.
   - `getPlans()`: delegate to repository.
   - `getMySubscription()`: get user subscription from repo, if null return `{ subscription: null, plan: null }` (free tier). If exists, also fetch the plan.
   - `getUserTier()`: delegate to repository.
   - `subscribe()`:
     1. Fetch plan by ID (validate exists + active).
     2. Validate plan is NOT free → throw if `plan.isFree()`.
     3. Check user doesn't already have an active paid subscription → throw if they do.
     4. Derive price server-side from `plan.priceCents`.
     5. Call `IAsaasService.createCheckoutSession()` with plan details and user's UUID as `externalReference`.
     6. Return `CheckoutSessionResponse`.
     7. (The actual subscription creation happens in `handleWebhookEvent` after ASAAS confirms payment.)
   - `changePlan()`:
     1. Get current subscription (throw `ActiveSubscriptionRequiredException` if none).
     2. Get current plan and target plan.
     3. Compare tiers using `TIER_HIERARCHY`.
     4. If upgrade: call `IAsaasService.updateSubscription()` with new value, update local DB.
     5. If downgrade: validate via `validateDowngrade()`, then either cancel ASAAS sub (if going to Free) or update value (if going to Basic from Pro).
     6. Revoke refresh tokens via `IAuthService`.
     7. Return updated subscription.
   - `cancel()`:
     1. Get current subscription (throw if none or already canceled).
     2. Call `IAsaasService.cancelSubscription()`.
     3. Update local status to `canceled`.
     4. Revoke refresh tokens.
   - `handleWebhookEvent()`:
     1. Switch on event type.
     2. For `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`: extract `subscription` ID and `customer` ID from payload. If this is a new subscription (no local record yet for this ASAAS subscription ID), find the user via `externalReference`, save `asaas_customer_id` on user, create `user_subscriptions` row. If already exists, ensure status is `active`. Revoke refresh tokens.
     3. For `PAYMENT_OVERDUE`: update status to `past_due`.
     4. For `SUBSCRIPTION_INACTIVATED`/`SUBSCRIPTION_DELETED`: update status to `canceled`, revoke refresh tokens.
   - `validateDowngrade()`: for now, return (no-op). This is the extensibility hook.

**Reference:** Roadmap Sections 7.1–7.5, 10.2.

**Files created:**

- `src/subscriptions/service/i.subscriptions.service.ts`
- `src/subscriptions/service/implementation/subscriptions.service.ts`

---

### Step 16 — Subscriptions Controller

**Goal:** Create the subscription API endpoints.

**Instructions:**

1. Create `src/subscriptions/controller/i.subscriptions.controller.ts`:
   - Abstract class with `protected readonly subscriptionsService: ISubscriptionsService`.
   - Methods:
     - `public abstract getPlans(): Promise<SubscriptionPlanResponse[]>`
     - `public abstract getMySubscription(user: JwtPayload): Promise<UserSubscriptionResponse | { tier: 'free' }>`
     - `public abstract subscribe(user: JwtPayload, body: SubscribeBodyDTO): Promise<CheckoutSessionResponse>`
     - `public abstract changePlan(user: JwtPayload, body: ChangePlanBodyDTO): Promise<UserSubscriptionResponse>`
     - `public abstract cancel(user: JwtPayload): Promise<void>`

2. Create `src/subscriptions/controller/implementation/subscriptions.controller.ts`:
   - `@Controller('subscriptions')`, extends `ISubscriptionsController`.
   - `GET /plans` — public (no auth guard). Returns `SubscriptionPlanResponse[]`.
   - `GET /me` — `@UseGuards(AuthGuard)`. Uses `@CurrentUser()` decorator. Returns subscription state or `{ tier: 'free' }`.
   - `POST /subscribe` — `@UseGuards(AuthGuard)`, `@Throttle({ default: { limit: 3, ttl: 60000 } })`, `@HttpCode(HttpStatus.OK)`. Calls `subscriptionsService.subscribe(user.sub, body.planId, ...)`. Returns `CheckoutSessionResponse`.
   - `PUT /change-plan` — `@UseGuards(AuthGuard)`, `@Throttle({ default: { limit: 3, ttl: 60000 } })`. Calls `subscriptionsService.changePlan(user.sub, body.planId)`. Returns `UserSubscriptionResponse`.
   - `POST /cancel` — `@UseGuards(AuthGuard)`, `@Throttle({ default: { limit: 3, ttl: 60000 } })`, `@HttpCode(HttpStatus.OK)`. Calls `subscriptionsService.cancel(user.sub)`.

**Reference:** Roadmap Sections 13.1, 13.3.

**Files created:**

- `src/subscriptions/controller/i.subscriptions.controller.ts`
- `src/subscriptions/controller/implementation/subscriptions.controller.ts`

---

### Step 17 — `@RequiredTier()` Decorator + `SubscriptionTierGuard`

**Goal:** Create the tier-checking decorator and guard.

**Instructions:**

1. Create `src/subscriptions/decorators/required-tier.decorator.ts`:
   - Export `REQUIRED_TIER_KEY = 'required_tier'`.
   - Export `RequiredTier = (tier: SubscriptionTierEnum) => SetMetadata(REQUIRED_TIER_KEY, tier)`.

2. Create `src/subscriptions/guards/subscription-tier/subscription-tier.guard.ts`:
   - `@Injectable()`, implements `CanActivate`.
   - Constructor injects `Reflector` and `ISubscriptionsService` (for defense-in-depth DB check).
   - `canActivate(context: ExecutionContext)`:
     1. Read `REQUIRED_TIER_KEY` from handler metadata via `Reflector`.
     2. If no required tier, return `true`.
     3. Read `request.user` (JwtPayload) — get `subscriptionTier`.
     4. Compare with `TIER_HIERARCHY`: if user's tier ≥ required tier, **for GET requests**, return `true`.
     5. **For write operations** (POST, PUT, PATCH, DELETE): perform a lightweight DB check via `ISubscriptionsService.getUserTier(user.sub)` and compare again. This closes the 15-minute JWT staleness window for state-changing actions.
     6. If insufficient, throw `ForbiddenException('Insufficient subscription tier')`.

**Reference:** Roadmap Sections 9.1–9.3, 8.3.

**Files created:**

- `src/subscriptions/decorators/required-tier.decorator.ts`
- `src/subscriptions/guards/subscription-tier/subscription-tier.guard.ts`

---

### Step 18 — JWT Payload + AuthService Integration

**Goal:** Add `subscriptionTier` to the JWT payload, and modify login/refresh to include it.

**Instructions:**

1. Modify `src/auth/payloads/jwt.payload.ts`:
   - Add `subscriptionTier: SubscriptionTierEnum` to the `JwtPayload` interface.

2. Read `src/auth/service/i.auth.service.ts` and `src/auth/service/implementation/auth.service.ts` to understand current `login()` and `refresh()` methods.

3. Modify `src/auth/service/i.auth.service.ts`:
   - Add `ISubscriptionsService` (or `ISubscriptionsRepository`) as a dependency in the constructor.

4. Modify `src/auth/service/implementation/auth.service.ts`:
   - Inject `ISubscriptionsService` (or `ISubscriptionsRepository`) using `@Inject(...)`.
   - In `login()`: after validating credentials and getting the user, call `subscriptionsService.getUserTier(user.id)` (or `subscriptionsRepository.getUserTier(user.id)`) and include `subscriptionTier` in the JWT payload when signing.
   - In `refresh()`: same — when generating the new access token, fetch the current tier from DB and include it in the payload.

5. Modify `src/auth/auth.module.ts`:
   - Import `SubscriptionsModule` (may need `forwardRef` if circular).

**Reference:** Roadmap Sections 8.1–8.2, 11.1.

**Files modified:**

- `src/auth/payloads/jwt.payload.ts`
- `src/auth/service/i.auth.service.ts`
- `src/auth/service/implementation/auth.service.ts`
- `src/auth/auth.module.ts`

---

### Step 19 — Module Wiring

**Goal:** Create `AsaasModule` and `SubscriptionsModule`, register everything in `AppModule`.

**Instructions:**

1. Create `src/asaas/asaas.module.ts`:
   - Providers:
     - `{ provide: IAsaasService, useClass: AsaasService }`
     - `{ provide: IWebhookEventsRepository, useClass: WebhookEventsRepository }`
   - Controllers: `[AsaasWebhookController]`
   - Imports: `[DatabaseModule, HelpersModule, forwardRef(() => SubscriptionsModule)]` (for the webhook controller that calls `ISubscriptionsService`)
   - Exports: `[IAsaasService, IWebhookEventsRepository]`

2. Create `src/subscriptions/subscriptions.module.ts`:
   - Providers:
     - `{ provide: ISubscriptionsRepository, useClass: SubscriptionsRepository }`
     - `{ provide: ISubscriptionsService, useClass: SubscriptionsService }`
   - Controllers: `[SubscriptionsController]`
   - Imports: `[DatabaseModule, HelpersModule, forwardRef(() => AsaasModule), forwardRef(() => AuthModule), UsersModule]`
   - Exports: `[ISubscriptionsService, ISubscriptionsRepository]`

3. Modify `src/app.module.ts`:
   - Add `AsaasModule` and `SubscriptionsModule` to the `imports` array.

4. Modify `src/organizations/organizations.module.ts`:
   - Add `SubscriptionsModule` to imports (needed for Step 20).

**Reference:** Roadmap Sections 4.1, 4.2, 11.1.

**Files created:**

- `src/asaas/asaas.module.ts`
- `src/subscriptions/subscriptions.module.ts`

**Files modified:**

- `src/app.module.ts`
- `src/organizations/organizations.module.ts`

---

### Step 20 — Ownership Transfer Validation

**Goal:** Add subscription tier validation to the ownership transfer flow.

**Instructions:**

1. Read `src/organizations/service/i.organizations.service.ts` and `src/organizations/service/implementation/organizations.service.ts` to understand the current `transferOwnership()` method.
2. Add `ISubscriptionsService` as a dependency to `IOrganizationsService`.
3. In `OrganizationsService.transferOwnership()`, before performing the transfer:
   - Look up the target user's subscription tier via `subscriptionsService.getUserTier(targetUserId)`.
   - For now, the minimum tier is `FREE` (configurable via a `private static readonly MINIMUM_OWNER_TIER = SubscriptionTierEnum.FREE`), so this is effectively a no-op. But the plumbing is in place for when limits are implemented.
   - If target tier < MINIMUM_OWNER_TIER, throw `InsufficientSubscriptionException`.

**Reference:** Roadmap Section 7.6, 11.1.

**Files modified:**

- `src/organizations/service/i.organizations.service.ts`
- `src/organizations/service/implementation/organizations.service.ts`

---

### Step 21 — Environment Variables

**Goal:** Add all required ASAAS environment variables.

**Instructions:**

1. Add to `.env.example`:

   ```
   ASAAS_API_URL=
   ASAAS_API_KEY=
   ASAAS_WEBHOOK_TOKEN=
   ASAAS_CHECKOUT_SUCCESS_URL=
   ASAAS_CHECKOUT_CANCEL_URL=
   ```

2. Add to `.env.development` (or equivalent):

   ```
   ASAAS_API_URL=https://api-sandbox.asaas.com
   ASAAS_WEBHOOK_TOKEN=<generate_a_separate_token>
   ASAAS_CHECKOUT_SUCCESS_URL=http://localhost:3000/subscription/success
   ASAAS_CHECKOUT_CANCEL_URL=http://localhost:3000/subscription/cancel
   ```

   Note: `ASAAS_API_KEY` should already exist. `ASAAS_WEBHOOK_TOKEN` must be a SEPARATE secret from `ASAAS_API_KEY`.

**Reference:** Roadmap Sections 15, 17.3 (M1).

**Files modified:**

- `.env.example`
- `.env.development`

---

### Step 22 — Compile & Smoke Test

**Goal:** Verify the entire application compiles and starts without errors.

**Instructions:**

1. Run `npm run build` — fix any compilation errors.
2. Run `npm run start:dev` — verify the app starts without runtime errors.
3. Verify new routes appear: `GET /subscriptions/plans`, `GET /subscriptions/me`, `POST /subscriptions/subscribe`, `PUT /subscriptions/change-plan`, `POST /subscriptions/cancel`, `POST /asaas/webhooks`.

---

## Dependency Graph

```
Step 1  (Migration)
  ↓
Step 2  (Enums)
  ↓
Step 3  (Exception Codes) ← independent of Steps 1-2
  ↓
Step 4  (Subscription Models) ← needs Step 2
Step 5  (Webhook Event Model) ← independent
Step 6  (Update User Model) ← needs Step 1
Step 7  (Users Repo update) ← needs Step 6
  ↓
Step 8  (ASAAS Enums) ← independent
Step 9  (ASAAS Service) ← needs Step 3, Step 8
Step 10 (Webhook Events Repo) ← needs Step 5
Step 11 (Webhook DTO) ← needs Step 8
  ↓
Step 12 (Webhook Controller) ← needs Step 9, 10, 11
Step 13 (Subscriptions Repo) ← needs Step 4
Step 14 (Subscription DTOs/Responses) ← needs Step 4
  ↓
Step 15 (Subscriptions Service) ← needs Step 9, 13, 14, 7
Step 16 (Subscriptions Controller) ← needs Step 14, 15
Step 17 (Tier Guard) ← needs Step 2, 15
  ↓
Step 18 (JWT Integration) ← needs Step 15
Step 19 (Module Wiring) ← needs ALL above
Step 20 (Ownership Transfer) ← needs Step 15, 19
Step 21 (Env Vars) ← independent
Step 22 (Compile & Smoke Test) ← needs ALL
```

---

## How to Use This Plan

1. **Start a new conversation** with the AI.
2. **Paste the System Prompt** above as the system/initial message.
3. **Feed one step at a time**: Copy-paste the step (e.g., "Step 3") as a user message. Tell the AI to read the relevant existing files before writing code.
4. **Verify after each step**: Run `npm run build` to catch compilation errors before moving to the next step.
5. **Reference the roadmap**: If the AI needs more context about a design decision, tell it to read `docs/subscriptions-roadmap.md`.
6. **Don't skip steps**: The dependency graph shows which steps must be completed before others. Follow the order.
