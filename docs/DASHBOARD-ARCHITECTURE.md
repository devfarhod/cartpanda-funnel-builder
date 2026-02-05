# Modern Admin Dashboard: How I'd Build It

How I'd structure the Cartpanda admin dashboard (funnels, orders, customers, subscriptions, analytics, disputes, settings, permissions): fast, team-scalable, no big rewrite. Concrete choices, clear boundaries, a few tradeoffs.

---

## 1. Architecture

**Routes and pages**  
One app, domain routes: `/funnels`, `/orders`, `/customers`, `/subscriptions`, `/analytics`, `/disputes`, `/settings`. Each area = one feature (folder with routes, components, data hooks). Shared layout (sidebar, header) in `app/`; features own only their slice.

**Feature modules**  
Per domain: `features/orders/`, `features/customers/`, etc. Inside: `components/`, `hooks/`, `api/` (or `queries/`), optional `types/`, `utils/`. Feature owns route segment, SWR hooks, UI. Shared presentational components (buttons, inputs, tables, modals) in `shared/`. No cross-feature imports; only public entry points or shared code. Enables parallel shipping.

**Presentational and container components**  
**Containers**: data (SWR/Zustand), event handlers, API. **Presentational**: props only, no API/store; truly reusable. Containers compose presentational and pass data/callbacks. Keeps UI testable, logic out of dumb components. Use **render props** for flexible list/item or layout; **compound components** (e.g. `<Card>`, `<Card.Header>`, `<Table>`, `<Table.Row>`) for clear APIs without prop drilling.

**Clean architecture and business logic**  
Business logic separate from UI. Per feature: `domain/` or `logic/` for rules and use cases. UI and data layer call into it. Unit tests hit pure logic; fewer bugs; rule changes in one place.

**Centralized error handling**  
One place: shared handler maps API errors to user messages and reporting. Same "something went wrong", retry, logging everywhere. No ad-hoc try/catch per screen. Easy to fix or extend.

**Avoiding spaghetti**  
Strict shared vs feature split. Feature-only code stays in feature; shared when two need it. Short "Frontend guide": read it, mimic an example feature.

---

## 2. Design system

**Build vs buy**  
Small buy: Radix (or similar) for modals, dropdowns, tabs; we get a11y and behavior. Wrap in our presentational components. Custom charts/tables: we build, presentational (data in, render only), full control.

**Consistency and accessibility**  
Tokens for colors, spacing, typography, radii (CSS vars or token file). One theme. No magic numbers. WCAG 2.1 AA: focus, labels, roles, keyboard. Lint with eslint-plugin-jsx-a11y. Skip full design-system site at first; add when team/surface grows.

---

## 3. Data fetching and state

**Server state vs client state**  
**SWR** for server state (orders, customers, funnels, analytics): cache, revalidate, loading/error. No global store for that. **Background fetching**: `revalidateOnFocus`, `revalidateOnReconnect`; optional `revalidateOnInterval` for dashboards; `mutate` for optimistic updates. **Zustand** for client state (filters, sort, pagination, modals, sidebar) per feature or shared; or URL for shareable lists. Clear split: no manual sync.

**Loading, error, empty**  
Same pattern everywhere: skeleton/spinner, error + retry, empty + CTA. Shared `DataState` or wrapper hooks. Tables: filters/sort in Zustand or URL; in SWR key so one cached request. Pagination: cursor/offset in key.

---

## 4. Performance

**Next.js, PPR, caching**  
Next.js: route code splitting by default. **PPR** where it fits: static shell (layout, sidebar) prerendered; dynamic holes (lists, user data) streamed. **Caching**: `fetch` + `revalidate`, route segment config; only where it helps (e.g. reference data, slightly stale dashboards).

**Rendering and UX**  
Virtualize heavy tables. Memoize expensive items; keep fast-changing state low. Debounce filters/forms.

**Measuring "dashboard feels slow"**  
Web Vitals (LCP, INP/FID); "time to first table row" or TTI for main lists. Log with tag `page=orders`. Alert on p95 regression.

---

## 5. DX and scaling the team

**Onboarding and conventions**  
Short "Frontend guide": feature structure, shared vs feature, data (SWR + Zustand), presentational vs container. One example feature as template. Prettier + ESLint + a11y plugin; PR template (feature touched? data change? a11y?). New engineers copy template, add feature folder.

**Stopping one-off UI**  
Presentational in shared; containers compose and handle data. Reject new feature button if shared + variant works. Tokens only. Storybook for "is there a component for this?". No full design-system doc day one.

---

## 6. Testing strategy

**What to test**  
**Unit:** Pure logic (formatters, validators, small hooks). Business logic separated so we test domain/use cases without rendering. Vitest or Jest. **Integration:** Key flows (load list, filter, refetch; submit form, success). RTL + MSW at boundary. Containers = natural place; presentational = test with plain props. **E2E:** Few critical paths (login, open order; create funnel step). Playwright on main and pre-release. Add more when flaky or high-impact.

**Minimum bar**  
Per feature: one integration (happy path), unit tests for non-trivial logic. Prefer stable integration tests over 100% coverage.

---

## 7. Release and quality

**Ship fast but safe**  
**Feature flags** for big/risky changes; simple provider or env. **Staged rollouts:** 10% → 50% → 100% if infra allows; else canary then prod. **Error monitoring:** Sentry (or similar), source maps, tag by feature/route.

**What I'd skip at first**  
Full design-system site, E2E every page, complex flag UI. Add when needed; document tradeoff.

---

**Summary**  
Feature folders, presentational vs container (data in containers only; render props and compound components where useful), clean architecture + centralized errors. SWR (with background revalidation and optimistic UX) + Zustand. Small design system (buy primitives, wrap). Tokens and a11y from start. Next.js PPR and targeted caching. Conventions + short guide so the team replicates without a big rewrite.
