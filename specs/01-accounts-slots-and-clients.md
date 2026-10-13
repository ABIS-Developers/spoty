# SPEC 01 — Family accounts, slots, clients and payments

> **Status:** Approved
> **Depends on:** none
> **Date:** 2026-10-12
> **Objective:** A PIN-protected admin app to register Spotify family accounts with their 5 sellable slots, assign clients (single or 2-slot promo) to those slots, and record their monthly payments with a computed paid / pending / overdue status.

---

## Why this spec exists

The business resells slots of Spotify family plans. Today there is no single place that knows which account each client is in, how much they pay, or whether they paid this month. This spec builds that foundation. Alerts and the earnings dashboard (SPEC 02) need this data model in place before they can be built.

---

## Scope

**In:**

- PIN login screen. The PIN is checked server-side by an AppSync Lambda authorizer and is stored as an Amplify secret (`ACCESS_PIN`), never in the repo.
- Session that lasts until the browser tab is closed (`sessionStorage`), plus a "Salir" (log out) button.
- Removal of the template `Todo` model, the template `App.tsx` content and the Cognito auth resource.
- Account CRUD: alias, Spotify email, Spotify password, Spotify billing day (1–31) and monthly cost (default `240`), plus notes.
- Each account shows 6 slots automatically: slot 0 is the fixed admin slot (not sellable) and slots 1–5 are sellable.
- The account password is masked by default, with "show" and "copy" buttons. The email also has a "copy" button.
- "Delete" of an account is a soft close (`status: CLOSED`). It is allowed only when the account has no active clients. Closed accounts are hidden by default and keep their history.
- Client registration with name, phone/WhatsApp, the client's Spotify email, notes, start date, payment day, plan type and amount.
- Plan type `SINGLE` takes 1 slot and defaults to `80`. Plan type `PROMO` takes 2 slots in the same account, has one payer and one payment day, and defaults to `150`. A promo also stores the second person's name and Spotify email.
- The amount is pre-filled from the plan type and stays editable.
- The admin manually picks the account and the free slot(s) for each client. The app does not auto-suggest or auto-open accounts.
- The client's payment day defaults to the day of the start date and stays editable.
- A "Primer pago recibido" (first payment received) checkbox, checked by default, creates the payment for the current period on registration.
- Client edit, plus moving a client to other free slot(s) in the same or another active account. A promo moves only to an account with 2 free slots.
- Client cancellation ("Dar de baja"): it sets `status: CANCELLED`, frees the slot(s) and keeps the client and their payments as history.
- Payment registration per client: period (`YYYY-MM`), paid date and amount. Each client has a payment history list.
- A payment status computed for the current period: `PAID`, `PENDING` or `OVERDUE` (rules in the data model).
- Visual UX: a slot grid per account, color + icon status badges, a calendar date picker for dates, and a 1–31 day grid picker for day-of-month fields.
- UI text in Spanish. All code, identifiers, file names and comments in English.
- A dark-olive + white/beige theme with WCAG AA contrast.

**Out of scope (for future specs):**

- Due-date alerts: who is overdue or due soon, and in which account (SPEC 02).
- Earnings dashboard: total collected − cost of active accounts, per account and per month (SPEC 02).
- Spotify billing alerts and a history of payments made to Spotify (SPEC 02).
- A calendar view of all due dates (SPEC 02).
- A waitlist of confirmed clients and the "open a new account at ≥4 clients" helper.
- A client-facing portal.
- WhatsApp, email or push notifications.
- Any automation against Spotify, such as inviting or removing members.
- Showing or accepting the service agreement (terms) inside the app.
- Multiple admin users or roles.
- Grace days for overdue payments.

---

## Data model

Amplify Gen2 schema in `amplify/data/resource.ts`. Every model uses `allow.custom()`, which means the Lambda PIN authorizer.

```ts
const schema = a.schema({
  AccountStatus: a.enum(["ACTIVE", "CLOSED"]),
  PlanType: a.enum(["SINGLE", "PROMO"]),
  ClientStatus: a.enum(["ACTIVE", "CANCELLED"]),

  Account: a.model({
    alias: a.string().required(),          // e.g. "Cuenta 1"
    spotifyEmail: a.email().required(),
    spotifyPassword: a.string().required(), // plain text, DynamoDB encryption at rest
    billingDay: a.integer().required(),     // 1–31, Spotify charge day
    monthlyCost: a.integer().required(),    // default 240
    status: a.ref("AccountStatus").required(),
    notes: a.string(),
    clients: a.hasMany("Client", "accountId"),
  }).authorization((allow) => [allow.custom()]),

  Client: a.model({
    accountId: a.id().required(),
    account: a.belongsTo("Account", "accountId"),
    name: a.string().required(),
    phone: a.string(),
    spotifyEmail: a.email(),
    notes: a.string(),
    startDate: a.date().required(),         // YYYY-MM-DD
    paymentDay: a.integer().required(),     // 1–31, default = day of startDate
    planType: a.ref("PlanType").required(),
    amount: a.integer().required(),         // monthly, default from PRICES
    slots: a.integer().array().required(),  // [n] for SINGLE, [n, m] for PROMO; values 1–5
    secondName: a.string(),                 // PROMO only
    secondSpotifyEmail: a.email(),          // PROMO only
    status: a.ref("ClientStatus").required(),
    cancelledAt: a.date(),
    payments: a.hasMany("Payment", "clientId"),
  }).authorization((allow) => [allow.custom()]),

  Payment: a.model({
    clientId: a.id().required(),
    client: a.belongsTo("Client", "clientId"),
    period: a.string().required(),          // "YYYY-MM"
    paidAt: a.date().required(),
    amount: a.integer().required(),
  }).authorization((allow) => [allow.custom()]),
});
```

Constants in `src/features/clients/lib/pricing.ts`:

```ts
export const PRICES = { SINGLE: 80, PROMO: 150 } as const;
export const SLOTS_PER_ACCOUNT = 5;      // sellable slots, admin slot excluded
export const DEFAULT_ACCOUNT_COST = 240;
```

Payment status rules, implemented in `src/features/payments/lib/paymentStatus.ts` as pure functions that take `today` as a parameter:

- `dueDate(period, paymentDay)` returns day `min(paymentDay, lastDayOfMonth(period))` of `period`.
- `currentPeriod(today)` returns `today` formatted as `YYYY-MM`.
- `PAID` means a `Payment` exists with `period === currentPeriod(today)`.
- `PENDING` means not paid and `today <= dueDate`.
- `OVERDUE` means not paid and `today > dueDate`.
- `CANCELLED` clients have no status. They are not shown in slots.

Slot rules:

- A slot is free when no `ACTIVE` client of that account has it in `slots`.
- These rules are validated client-side before every create or move. With a single admin, concurrent writes are not a concern.

Conventions:

- Money is stored as integer pesos. It is displayed as `$80`.
- Dates are stored as ISO `YYYY-MM-DD` strings. They are displayed in Spanish, for example `12 oct 2026`.
- Date math uses `date-fns` with the `es` locale.

---

## Architecture

The code uses a feature-based architecture. Each feature owns its components, Zustand store, API calls, pure logic and Spanish UI texts.

```
amplify/
  backend.ts                      # data + pinAuthorizer, no auth
  data/resource.ts                # schema above, lambda auth mode
  functions/pin-authorizer/
    resource.ts                   # defineFunction + secret("ACCESS_PIN")
    handler.ts                    # isAuthorized = token === ACCESS_PIN
src/
  main.tsx
  index.css                       # Tailwind v4 import + @theme tokens
  app/
    App.tsx                       # auth gate + router
    routes.tsx                    # HashRouter routes
    layout/AppShell.tsx           # header, logout, responsive nav switch
    layout/Sidebar.tsx            # ≥ 1024px
    layout/BottomTabBar.tsx       # < 1024px
  shared/
    api/dataClient.ts             # generateClient<Schema>({ authMode: "lambda", authToken })
    components/                   # Button, Input, Dialog (sheet/modal), ConfirmDialog,
                                  # StatusBadge, DatePicker, DayOfMonthPicker,
                                  # CopyButton, EmptyState, Spinner, Avatar,
                                  # ProgressBar, Chip, Timeline, SelectableCard
    lib/dates.ts                  # format helpers (es locale)
  features/
    auth/
      components/LoginPage.tsx
      store/sessionStore.ts       # pin, login(), logout(), sessionStorage sync
      texts.ts
    accounts/
      api/accountsApi.ts
      store/accountsStore.ts
      components/AccountsPage.tsx, AccountCard.tsx, AccountDetailPage.tsx,
                 AccountForm.tsx, SlotGrid.tsx, PasswordField.tsx
      lib/slots.ts                # freeSlots(account, clients)
      texts.ts
    clients/
      api/clientsApi.ts
      store/clientsStore.ts
      components/ClientForm.tsx, ClientDetailPage.tsx, MoveClientDialog.tsx,
                 CancelClientDialog.tsx
      lib/pricing.ts
      texts.ts
    payments/
      api/paymentsApi.ts
      store/paymentsStore.ts
      components/PaymentForm.tsx, PaymentHistory.tsx
      lib/paymentStatus.ts
      texts.ts
```

Rules:

- A feature imports from `shared/` and from another feature's public `index.ts` only. It never deep-imports another feature's internals.
- Stores call their feature's `api/` layer. Components never call `dataClient` directly.
- Pure logic lives in `lib/` with no React or Amplify imports, so it stays unit-testable.
- Routes are `#/login`, `#/accounts`, `#/accounts/:id`, `#/accounts/:id/clients/new` and `#/clients/:id`.

---

## Theme and UX

Tailwind v4 `@theme` tokens in `src/index.css`:

| Token             | Hex       | Use                                       |
| ----------------- | --------- | ----------------------------------------- |
| `olive-950`       | `#1F2614` | Main text on light backgrounds            |
| `olive-900`       | `#2B3520` | Header/nav background, login background   |
| `olive-700`       | `#4B5A2E` | Primary buttons, active nav, focus ring   |
| `olive-600`       | `#5C6B38` | Primary hover                             |
| `olive-100`       | `#E4E8D5` | Selected slot / subtle highlight          |
| `beige-50`        | `#FAF7F0` | App background                            |
| `beige-100`       | `#F3EDE0` | Secondary surfaces, free slot fill        |
| `beige-300`       | `#D9CCB0` | Borders, dashed free-slot outline         |
| `white`           | `#FFFFFF` | Cards, inputs, text on olive              |
| `status-paid`     | `#1E7A46` | PAID badge                                |
| `status-pending`  | `#9A6700` | PENDING badge                             |
| `status-overdue`  | `#B42318` | OVERDUE badge                             |

UX rules:

- Use the `ui-ux-pro-max` skill during implementation for layout, spacing, typography and interaction details.
- Use `lucide-react` icons. Examples: `Lock` for the admin slot, `UserPlus` for a free slot, `Users` for promo, `CheckCircle2` / `Clock` / `AlertTriangle` for statuses, `Eye` / `EyeOff` / `Copy` for credentials, `CalendarDays` for dates, `ArrowRightLeft` for move and `UserX` for cancel.
- Status is never shown by color alone. Every badge pairs an icon with a Spanish label ("Pagado", "Pendiente", "Vencido").
- The slot grid shows 6 tiles. The admin tile is locked. Free tiles have a dashed outline and "+ Asignar". Occupied tiles show the name and a status badge. The 2 tiles of a promo are visually joined, with a single "Promo · $150 · 1 pago" label.
- The account card shows `occupied/5` slots, the next Spotify billing date and the monthly cost.
- The client form switches between "Suelto" and "Promo (2 espacios)". Promo reveals the second-person fields and requires 2 free slots to be chosen.
- `DatePicker` is a popover calendar built on `react-day-picker` with the `es` locale. `DayOfMonthPicker` is a 7-column grid of 1–31.
- No HTML tables (`<table>`) anywhere in the UI. All data is shown visually as cards, tiles, chips, avatars, progress bars and timelines.
- The accounts list is a card grid. Each card has an occupancy progress bar (`occupied/5`) and a mini row of 6 slot dots colored by status.
- Account detail is a hero card with the credentials (email, masked password, copy buttons), followed by the slot grid as large visual tiles.
- Each occupied slot tile shows the client's initials avatar, name, amount, next due date and status badge.
- The client detail is a profile card with the avatar, contact chips (phone, which opens WhatsApp through a `https://wa.me/` link, and Spotify email), plan chip and amount.
- The payment history is a vertical timeline, newest first. Each item shows the month as a chip ("oct 2026"), the paid date, the amount and an icon.
- A 12-month strip on the client detail shows one dot per month: paid, overdue, or not applicable (before `startDate` or after cancellation).
- Forms are stepped or grouped in visual sections with icons. Plan type is chosen with 2 large selectable cards ("Suelto $80" / "Promo 2 espacios $150"), not a dropdown. Slots are picked by tapping tiles in a mini slot grid, not from a select.

Responsive rules (mobile-first, Tailwind breakpoints):

- **< 640px (phone):** single column. The header is compact with the logo and a logout icon. Main navigation is a fixed bottom tab bar with icons and labels. Dialogs open as bottom sheets. The primary action is a floating action button (FAB) at the bottom right. The slot grid is 2 columns (the admin tile spans full width on top, then 5 tiles).
- **640–1023px (tablet):** accounts in a 2-column card grid. The slot grid is 3 columns. Dialogs are centered modals.
- **≥ 1024px (desktop):** a left sidebar navigation in `olive-900` replaces the bottom tab bar. Accounts are in a 3-column card grid. The slot grid is 6 columns in one row. The client detail splits into 2 columns: profile on the left, payment timeline on the right.
- The minimum supported width is 360px with no horizontal scroll. Touch targets are at least 44px. Text never goes below 14px. Inputs use 16px text to avoid iOS zoom.
- Long emails and names truncate with an ellipsis and show the full value on copy or in a tooltip.
- Respect `prefers-reduced-motion`. Transitions run 150–250ms and are only on opacity/transform.
- Destructive actions (close account, cancel client) ask for confirmation in a `ConfirmDialog`. They never use `window.confirm`.
- Every list has an empty state. Every async action shows a loading state and an inline error on failure.

---

## Implementation plan

1. **Tooling and cleanup.** Add `tailwindcss`, `@tailwindcss/vite`, `lucide-react`, `zustand`, `react-router-dom`, `date-fns` and `react-day-picker` with pnpm. Wire the Tailwind plugin in `vite.config.ts` and put the theme tokens in `src/index.css`. Replace the template `App.tsx` with an empty `AppShell`. Manual test: `pnpm dev` shows the olive header on a beige background.
2. **Backend: authorizer and schema.** Create `amplify/functions/pin-authorizer/`. Replace the `Todo` schema with Account/Client/Payment using `allow.custom()` and `defaultAuthorizationMode: "lambda"`. Remove `auth` from `backend.ts` and delete `amplify/auth/`. Set the secret with `pnpm exec ampx sandbox secret set ACCESS_PIN`. Manual test: `pnpm exec ampx sandbox` deploys, and a query with a wrong token returns Unauthorized.
3. **Session and login.** Build `shared/api/dataClient.ts`, `features/auth/store/sessionStore.ts` and `LoginPage`. Login validates the PIN by running `Account.list({ limit: 1 })`. The PIN is kept in `sessionStorage` under the key `spoty:pin`. Manual test: a wrong PIN shows "Código incorrecto", a right PIN enters the app, and closing the tab asks for the PIN again.
4. **Pure logic.** Write `pricing.ts`, `paymentStatus.ts` and `accounts/lib/slots.ts`, with no UI. They are covered by unit tests if the testing convention chosen at `/spec-impl` requires them.
5. **Shared UI kit and responsive shell.** Build `Button`, `Input`, `Dialog`, `ConfirmDialog`, `StatusBadge`, `CopyButton`, `EmptyState`, `Spinner`, `Avatar`, `ProgressBar`, `Chip`, `Timeline` and `SelectableCard`, plus `DatePicker` and `DayOfMonthPicker`. `Dialog` is a bottom sheet below 640px and a modal above. `AppShell` shows `BottomTabBar` below 1024px and `Sidebar` above. Manual test: resize from 360px to 1280px and see the navigation switch.
6. **Accounts list and form.** Build `accountsApi`, `accountsStore`, `AccountsPage`, `AccountCard` and `AccountForm` (create/edit). Manual test: create an account and see it listed with `0/5` slots.
7. **Account detail.** Build `AccountDetailPage` with `PasswordField` (show/copy), a copy button for the email and a `SlotGrid` (admin plus 5 free slots).
8. **Client registration.** Build `clientsApi`, `clientsStore` and `ClientForm` for SINGLE and PROMO, with slot selection, defaults and the "Primer pago recibido" option. Manual test: a promo occupies 2 joined tiles with a "Pagado" badge.
9. **Client detail and payments.** Build `ClientDetailPage`, `paymentsApi`, `paymentsStore`, `PaymentForm` and `PaymentHistory`. Registering the current period flips the status to "Pagado".
10. **Move client.** Build `MoveClientDialog`, which offers only accounts with enough free slots and updates `accountId` and `slots`.
11. **Cancel client and close account.** Build `CancelClientDialog`, which sets `CANCELLED` and `cancelledAt` and frees the slots. "Eliminar cuenta" is enabled only with 0 active clients and sets `CLOSED`. A "Mostrar cerradas" toggle shows closed accounts on `AccountsPage`.

---

## Acceptance criteria

- [ ] No PIN appears anywhere in the repository. `git grep` for the real PIN returns nothing.
- [ ] A GraphQL request without a token, or with a wrong one, is rejected with Unauthorized.
- [ ] Entering a wrong PIN shows "Código incorrecto" and does not enter the app.
- [ ] After a correct PIN, reloading the tab keeps the session. Closing the tab and reopening the app asks for the PIN.
- [ ] "Salir" clears `spoty:pin` and returns to `#/login`.
- [ ] `Todo`, `amplify/auth/` and the template UI no longer exist.
- [ ] Creating an account without a cost saves `monthlyCost = 240`.
- [ ] `billingDay` outside 1–31 or an invalid email blocks saving with an inline error.
- [ ] Account detail shows exactly 6 slot tiles: 1 locked admin tile and 5 sellable tiles.
- [ ] The password is masked by default. "Mostrar" reveals it and "Copiar" puts it on the clipboard.
- [ ] Choosing "Suelto" pre-fills `$80`. Choosing "Promo" pre-fills `$150`. Both amounts can be edited before saving.
- [ ] A promo cannot be saved unless exactly 2 free slots of the same account are selected.
- [ ] A promo appears as 2 joined tiles with one "Promo · $150 · 1 pago" label, and creates 1 payment, not 2.
- [ ] An occupied slot cannot be selected for a new client.
- [ ] `paymentDay` defaults to the day of `startDate`.
- [ ] With "Primer pago recibido" checked, a new client shows "Pagado" for the current period.
- [ ] `paymentStatus` returns `PENDING` for `paymentDay = 20`, `today = 2026-10-12` and no payment.
- [ ] `paymentStatus` returns `OVERDUE` for `paymentDay = 10`, `today = 2026-10-12` and no payment.
- [ ] `paymentStatus` returns `PAID` when a payment with `period = "2026-10"` exists.
- [ ] `dueDate("2026-02", 31)` returns `2026-02-28`.
- [ ] Registering a payment adds a row to the client's history and updates the badge without reloading.
- [ ] Moving a SINGLE client to a free slot of another account frees the original slot and occupies the new one.
- [ ] The move dialog does not offer accounts with fewer than 2 free slots for a promo client.
- [ ] Cancelling a client frees their slot(s). The client and their payments are still readable in the data.
- [ ] "Eliminar cuenta" is disabled while the account has active clients.
- [ ] A closed account disappears from the default list and appears under "Mostrar cerradas".
- [ ] Every status badge shows an icon and a text label, not color alone.
- [ ] Text/background pairs used in the theme pass WCAG AA (≥ 4.5:1 for normal text), verified with a contrast checker.
- [ ] At 360px width no screen has horizontal scroll.
- [ ] No `<table>` element exists in `src/` (`git grep "<table" src/` returns nothing).
- [ ] At < 640px a bottom tab bar is visible and the sidebar is hidden. At ≥ 1024px the sidebar is visible and the bottom tab bar is hidden.
- [ ] The slot grid renders 2 columns at 360px, 3 at 768px and 6 at 1280px.
- [ ] At < 640px dialogs open as bottom sheets. At ≥ 640px they open as centered modals.
- [ ] Plan type is selected through 2 cards, and slots are selected by tapping tiles. Neither uses a `<select>`.
- [ ] Payment history renders as a timeline, newest first.
- [ ] Each account card shows an occupancy progress bar and 6 slot dots.
- [ ] Tapping the phone chip opens `https://wa.me/<phone>`.
- [ ] Every interactive element is at least 44×44px at phone width.
- [ ] All UI strings are in Spanish. All identifiers and file names are in English.
- [ ] `pnpm build` (`tsc && vite build`) and `pnpm lint` pass with no errors.

---

## Decisions

- **Yes:** split into 2 specs. This one covers accounts, slots, clients and payments. SPEC 02 covers alerts and the dashboard. Each spec is deliverable on its own.
- **Yes:** an AppSync Lambda authorizer that validates the PIN against the `ACCESS_PIN` secret. This was the user's choice. The PIN is checked server-side, so data cannot be read with a public API key.
- **No:** a frontend-only PIN check. The PIN and the Spotify passwords would be exposed in the bundle and through the API key.
- **No:** a hidden Cognito user with a PIN screen. It was considered and discarded in favor of the Lambda authorizer.
- **Yes:** remove the Cognito `auth` resource. The Lambda authorizer makes it unnecessary.
- **Yes:** the PIN lives in `sessionStorage` until the tab closes. **No:** `localStorage`, which is riskier on a shared device.
- **Yes:** Spotify passwords are stored as plain text in DynamoDB. Access is gated by the authorizer and DynamoDB encrypts at rest. **No:** KMS app-level encryption, which adds complexity that is not needed now.
- **Yes:** Amplify Gen2 Data (AppSync + DynamoDB). It is already in the repo and works from a phone. **No:** `localStorage` persistence.
- **Yes:** slots are derived from `Client.slots` instead of a `Slot` model. Fewer records. A free slot is the absence of an active client.
- **Yes:** a promo is one client with 2 slots, 1 payer, 1 payment day and 1 payment. The second person's name and email are stored in the same record. **No:** 2 clients that share a promo.
- **Yes:** amounts are pre-filled from `PRICES` and stay editable, for discounts.
- **Yes:** manual account and slot choice. **No:** auto-suggesting the fullest account or a waitlist. The user wants to choose.
- **Yes:** payment history per period (`YYYY-MM`). SPEC 02 needs it for monthly earnings. **No:** a single "next payment" toggle.
- **Yes:** overdue starts the day after the due date, with no grace days. This matches the service agreement: the service is cancelled on the day after the due date.
- **Yes:** cancellation is manual. The app marks a client as `OVERDUE`, and the admin removes them in Spotify and presses "Dar de baja". **No:** freeing slots automatically, which could free a slot before the person is really removed.
- **Yes:** "delete account" is a soft close (`CLOSED`). It keeps the history for SPEC 02 earnings and matches the rule "cost of active accounts".
- **Yes:** Tailwind v4 + `lucide-react` + the `ui-ux-pro-max` skill. **No:** Amplify UI React. The user chose Tailwind.
- **Yes:** Zustand, one store per feature. State is shared across features without Context boilerplate. **No:** `useReducer` + Context.
- **Yes:** a feature-based architecture (`src/features/*`, `src/shared/*`).
- **Yes:** a visual-only UI (cards, tiles, timelines, chips). **No:** HTML tables. The user wants everything visual, and tables do not work on phones.
- **Yes:** a bottom tab bar on phones and a sidebar on desktop. The admin mostly uses the app on a phone.
- **Yes:** `HashRouter`. It avoids the SPA rewrite configuration on Amplify Hosting.
- **Yes:** `date-fns` + `react-day-picker` for date math and the calendar UI.
- **Yes:** code and spec in English, UI in Spanish.
- **Pending for `/spec-impl`:** testing conventions (test runner, coverage). They are decided when implementation starts.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| A 6-digit PIN can be brute-forced against the authorizer | Keep the authorizer cache TTL short and never log tokens. The PIN can be rotated with `ampx secret set`. Rate limiting (AWS WAF) is out of scope and noted for later. |
| The PIN leaks through chat, commits or screenshots | The PIN exists only as an Amplify secret. Rotate it if it is exposed. The PIN shared in this conversation should be rotated before production. |
| Spotify passwords readable by anyone with the PIN | This is accepted by design (single admin). Rotate the PIN when sharing devices. |
| Spotify detects members at different addresses and removes them or cancels the account | This is a business risk outside the app. A closed account keeps its history, and moving clients lets the admin relocate them fast. |
| Two writes picking the same slot | This is unlikely with one admin. Slots are re-validated against fresh data right before saving. |
| A payment day of 29–31 in short months | `dueDate` clamps to the last day of the month. This is covered by the acceptance criteria. |

---

## What is **not** in this spec

- Due-date alerts and the earnings dashboard (SPEC 02).
- Spotify billing alerts and a history of payments to Spotify (SPEC 02).
- A calendar view of all due dates (SPEC 02).
- A waitlist or an "open a new account" helper.
- A client portal, notifications, or any Spotify automation.
- Multiple admins, roles, grace days, rate limiting / WAF.

Each one of those, if it lands, goes in its own spec.
