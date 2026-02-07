# Modern Admin Dashboard: How I'd Build It

How I'd structure the Cartpanda admin dashboard (funnels, orders, customers, subscriptions, analytics, disputes, settings, permissions): fast, team-scalable, no big rewrite. Concrete choices, clear boundaries, a few tradeoffs.

---

## 1. Architecture

**Routes and pages**

One app, domain routes: `/funnels`, `/orders`, `/customers`, `/subscriptions`, `/analytics`, `/disputes`, `/settings`. Each area = one feature (folder with routes, components, data hooks). Shared layout (sidebar, header) in `app/`; features own only their slice.

**Feature modules**

Per domain: `features/orders/`, `features/customers/`, etc. Inside: `components/`, `hooks/`, `services/`, `types/`, `utils/`. Feature owns route segment, TanStack Query hooks, UI. Shared presentational components (buttons, inputs, tables, modals) in `shared/`. No cross-feature imports; only public entry points or shared code. Enables parallel shipping.

**Presentational and container components**

**Containers**: data (TanStack Query), state (Zustand) event handlers, API. **Presentational**: props only, no API/store; truly reusable. Containers compose presentational and pass data/callbacks. Keeps UI testable, logic out of dumb components. Use **render props** for flexible list/item or layout; **compound components** for clear APIs without prop drilling.

**Clean architecture and business logic**

Business logic separate from UI. Per feature: `hooks/` for business logic. We don't have to use all the clean architecture layers. No need for entities, DTO. Unit tests hit pure logic; fewer bugs; rule changes in one place.

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

**TanStack Query** for server state. Cache and auto-refetch with `staleTime` and `refetchOnFocus`; `refetchInterval` for dashboards if needed. Mutations via `useMutation` - invalidate cache after. No global store for server data. **Zustand** for client state - filters, sort, pagination, modals, sidebar. Per feature or shared. URL params for shareable lists. Clear split between the two; no manual sync needed.

**Loading, error, empty**

Same pattern everywhere: skeleton/spinner, error + retry, empty + CTA. Shared wrapper hooks or `DataState` component. Tables: filters stored in Zustand or URL, then passed to query key so only one cached request. Pagination works same way - cursor or offset in the key, or `useInfiniteQuery` for infinite scroll.

**Query keys**

Centralized key factory: `queryKeys.orders.list(filters)`, `queryKeys.orders.detail(id)`. Makes invalidation straightforward.

---

## 4. Performance

**Next.js, PPR, SSR**

Next.js: route-based code splitting by default. **PPR** where it fits: static parts (layout, sidebar) prerendered; dynamic (lists, user data) streamed. **SSR** for initial data, then TanStack Query takes over for mutations and refetch.

**Rendering and UX**

Virtualize heavy tables, memoize expensive items, keep fast-changing state low in tree, debounce filters and forms.

**Network**

Parallel requests where possible and prefetch on hover/intent.

**Asset optimization**

Next.js Image for images - lazy load, proper sizing, WebP.

**Measuring "dashboard feels slow"**

Bundle analyzer for chunks over 200KB; Chrome DevTools for runtime issues (layout thrashing, slow queries).

---

## 5. DX and scaling the team

**Onboarding and conventions**

Short "Frontend guide": feature structure, shared vs feature split, data layer (TanStack Query + Zustand), presentational components. One example feature as template to copy. Prettier + ESLint + a11y plugin. Custom rules and instructions for Cursor and Copilot - helps new engineers use AI correctly and avoid common mistakes.

**Stopping one-off UI**

Presentational components stay in shared; containers compose them and handle data/state. Reject new feature-specific buttons if shared + variant works. Use tokens, no one-offs. Storybook helps answer "is there already a component for this?". Full design-system site can wait.

---

## 6. Testing strategy

Unit tests > integration tests > e2e tests. Follow this to decide the number of tests.

**What to test**

**Unit:** Pure logic (formatters, validators, small hooks). Business logic separated in hooks so we test domain/use cases without rendering. Jest for unit tests. **Integration:** Key flows (load list, filter, refetch; submit form, success). RTL + MSW at boundary. Presentational component = test with plain props. **E2E:** Few critical paths (login, open order; create funnel step). Playwright on main and pre-release. Add more when flaky or high-impact.

**Minimum bar**

Per feature: one integration (happy path), unit tests for non-trivial logic. Prefer stable integration tests over 100% coverage.

---

## 7. Release and quality

**Ship fast but safe**

**Feature flags** for big/risky changes; DB or Posthog. **Staged rollouts:** 10% → 50% → 100% if infra allows; else canary then prod. **Error monitoring:** Sentry (or similar), source maps, tag by feature/route.

**What I'd skip at first**

Full design-system site, E2E every page, complex flag UI. Add when needed; document tradeoff.

---

**Summary**

Feature folders, presentational vs container (data in containers only; render props and compound components where useful), clean architecture + centralized errors. TanStack Query + Zustand. Small design system (buy primitives, wrap). Tokens and a11y from start. Next.js PPR and targeted caching. Conventions + short guide so the team replicates without a big rewrite.
