## Dashboard (Overview) plan

Goals
- Build a fast, shareable overview page with:
  - Interactive charts with time-range controls (nuqs-driven):
    - Invoices by status (paid, pending/sent, overdue, cancelled)
    - Receipts by creation method (invoice, manual, auto)
    - Email/engagement events (sent, opened, clicked) from customer_activities table
  - Carousel with high-signal KPIs
  - Mini calendar of upcoming due dates (projects, invoices, feedbacks)
  - “Recent items” (top 5) for invoices, feedbacks, projects

Principles
- Prefer small, aggregated API responses over fetching full tables for charts/KPIs.
- Reuse existing hooks for list widgets when acceptable; introduce dedicated dashboard endpoints for aggregates and server-side limits.
- Use React Query for caching, keyed by nuqs URL params so state is shareable and naturally cached.
- Keep API auth/org scoping identical to current routes (derive org from session > profiles).

State and URL (nuqs)
- Params: `range` ("7d" | "30d" | "90d" | "12m" | "custom"), `from`, `to` (ISO date), `metric` ("invoices" | "receipts" | "engagement" | "feedbacks" | "projects").
- Use these params to build React Query keys: e.g. `['dashboard:metrics', { from, to, metric }]`.
- Default view: last 30 days. Calendar picker can set any custom window within the server cap.

Range handling strategy
- Server hard-cap for metrics: max 12 months per request. Return DAILY buckets covering the entire window and include zero-filled days.
- Client defaults to 30d but can sub-filter any smaller window inside the fetched data without refetching.
- If the user selects a custom range that extends beyond the cached 12m window, issue a new request for that extended window (still capped at 12m).
- Benefits: fewer roundtrips when toggling presets or dragging the calendar, and consistent chart density.

API surface (new, minimal, aggregate-only)
- GET `/api/dashboard/metrics?from&to&metric`
  - metric = `invoices` → time series by day with counts per status and totals.
  - metric = `receipts` → time series by day with counts per `creationMethod` and totals.
  - metric = `feedbacks` → time series by day with counts: `sent`, `completed`, `overdue`; plus `rating` as completion rate percentage (see Feedback rating below).
  - metric = `projects` → time series by day with counts: `created`, `completed`, `active`; optional `overdue_milestones` if we include deliverables.
  - metric = `engagement` → time series by day with counts of `email_sent`, `email_opened`, `invoice_viewed`, `feedback_viewed`, etc. from `customer_activities`.
  - Response shape (example):
    ```json
    {
      "from":"2024-05-01","to":"2024-06-30","bucket":"day",
      "series":[{"date":"2024-05-01","paid":2,"sent":3,"overdue":0,"cancelled":0}],
      "totals":{"paid":12000,"sent":4500,"overdue":800}
    }
    ```
- GET `/api/dashboard/recent?limit=5`
  - Returns three small arrays: `invoices`, `feedbacks`, `projects` (already scoped to org, ordered by `created_at` desc, limited server-side).
- GET `/api/dashboard/calendar?from&to`
  - Normalized upcoming due items across tables → [{ id, type: 'invoice'|'project'|'feedback', title, dueDate, status }].
- Optional: GET `/api/dashboard/cards?from&to`
  - Precomputed KPI cards used by the carousel: outstanding balance, paid this month, invoices due next 7 days, receipts this month, pending feedbacks, etc.

Server queries (Supabase)
- Invoices by status (time series):
  - Group by `date_trunc('day', coalesce(issueDate, created_at))` and `status`.
  - Filter by `organizationId` and `date between from/to`.
  - Consider sums for amounts (totals) and counts for bars/areas.
- Receipts by `creationMethod` (time series):
  - Group by `date_trunc('day', coalesce(paymentConfirmedAt, issueDate, created_at))` and `creationMethod`.
- Engagement events:
  - Use `customer_activities` with `type in ('email_opened','invoice_viewed','feedback_viewed','feedback_link_clicked','invoice_sent','feedback_sent','feedback_reminder')`.
  - Group by day and type.
- Feedbacks (counts + rating):
  - Counts by day for `state in ('sent','completed')`; compute `overdue` as `state not in ('completed','draft') AND dueDate < now()` grouped by `date_trunc('day', coalesce(sentAt, created_at))`.
  - Rating per day: completion rate = `completed / nullif(sent,0)` expressed as 0–100.
- Projects:
  - Created: group by `date_trunc('day', created_at)`.
  - Completed: group by `date_trunc('day', coalesce(signedOn, updatedOn))` when `status in ('completed','signed')`.
  - Active: projects where `status not in ('completed','cancelled')` bucketed by day (daily snapshot approximation: compute running count via cumulative sums or return daily openings/closures and let client form area stacked by cumulative if needed).
- Calendar (due items):
  - Invoices: `dueDate`, state in ('sent','overdue').
  - Projects: payment milestones/deliverables `dueDate` (and/or project `endDate`).
  - Feedbacks: `dueDate` when present.
  - Union on the server and return a small normalized list.
- Recent items:
  - Prefer DB function `get_recent_items()` for a lightweight cross-type feed; otherwise three select queries with `limit`.

Hooks (new)
- Create `main/hooks/dashboard/use-dashboard.ts` with:
  - `useDashboardMetrics({ from, to, metric })` → calls `/api/dashboard/metrics`.
  - `useDashboardRecent({ limit })` → calls `/api/dashboard/recent`.
  - `useDashboardCalendar({ from, to })` → calls `/api/dashboard/calendar`.
  - `useDashboardCards({ from, to })` → calls `/api/dashboard/cards`.
- Query options:
  - `staleTime`: 5–10m for aggregates; `gcTime`: 30m.
  - Keys include the normalized `{ from, to, metric }` so switching range reuses cache.

What to reuse vs. create
- Reuse existing hooks for detail drawers or list pages.
- For dashboard widgets:
  - Charts/KPIs → new aggregate endpoints (avoid fetching thousands of rows).
  - “Recent items” → either new `/api/dashboard/recent` (preferred) or extend existing routes with `?limit=5` (keep old behavior as default to avoid breaking `useInvoices` etc.).
  - If we do extend, add params to `/api/invoices` and `/api/receipts` handlers but keep backward-compatible defaults; create parallel hooks like `useInvoicesRecent(limit)` to avoid altering current behavior.

UI structure
- Replace demo chart in `protected/_components/chart-area-interactive.tsx` with a generic `DashboardChart` that accepts `{ series, config, timeRange }`.
- Use `nuqs` in a parent `DashboardControls` to manage `range/from/to/metric` and pass to hooks.
- `OverviewCarousel` becomes KPI carousel fed by `useDashboardCards`.
- Add `UpcomingCalendar` component fed by `useDashboardCalendar`.
- Add `RecentItems` component showing three lists, each item linking to its detail page.
- Keep skeletons/loading states for each widget; do not block the whole page.

Prefetching for snappy UX
- In `protected/(sidebar)/page.tsx`, add a server-side prefetcher similar to existing settings prefetcher:
  - Compute `{ from, to }` for the default range (e.g., 90d ending today).
  - Prefetch metrics, cards, calendar, and recent via server and wrap page content in `<HydrationBoundary state={dehydratedState}>`.
  - This makes the first render instant while still using React Query on the client.

Data shapes (client-friendly)
- Charts expect `[ { date: 'YYYY-MM-DD', desktop: number, mobile: number } ]` now; we will generalize to keys per series:
  - Invoices: `{ date, paid, sent, overdue, cancelled }`.
  - Receipts: `{ date, invoice, manual, auto }`.
  - Feedbacks: `{ date, sent, completed, overdue, rating }` (rating is 0–100; render as line with right Y-axis).
  - Projects: `{ date, created, completed, active }`.
  - Engagement: `{ date, email_sent, email_opened, link_clicked, invoice_viewed, feedback_viewed }`.

Unified JSON contracts (for generic chart component)
- Common envelope for every metric response from `/api/dashboard/metrics`:
  - `from`: ISO date string
  - `to`: ISO date string
  - `bucket`: "day" | "week" | "month"
  - `metric`: one of "invoices" | "receipts" | "feedbacks" | "projects" | "engagement"
  - `series`: array of `{ date: 'YYYY-MM-DD', ...seriesKeys }`
  - `totals`: object with rollups by series key (optional per metric)
  - `meta`: `{ unit: 'count' | 'currency' | 'percent', seriesKeys: string[], config: Record<string, { label: string, color: string }> }`

- Invoices example:
  {
    "from": "2025-01-01",
    "to": "2025-03-31",
    "bucket": "day",
    "metric": "invoices",
    "series": [ { "date": "2025-01-01", "paid": 2, "sent": 3, "overdue": 0, "cancelled": 0 } ],
    "totals": { "paid": 12000, "sent": 4500, "overdue": 800, "cancelled": 0 },
    "meta": {
      "unit": "count",
      "seriesKeys": ["paid","sent","overdue","cancelled"],
      "config": {
        "paid": { "label": "Paid", "color": "var(--chart-1)" },
        "sent": { "label": "Sent", "color": "var(--chart-2)" },
        "overdue": { "label": "Overdue", "color": "var(--chart-3)" },
        "cancelled": { "label": "Cancelled", "color": "var(--chart-4)" }
      }
    }
  }

- Receipts example:
  {
    "from": "2025-01-01",
    "to": "2025-03-31",
    "bucket": "day",
    "metric": "receipts",
    "series": [ { "date": "2025-01-01", "invoice": 1, "manual": 2, "auto": 0 } ],
    "totals": { "invoice": 20, "manual": 45, "auto": 5 },
    "meta": {
      "unit": "count",
      "seriesKeys": ["invoice","manual","auto"],
      "config": {
        "invoice": { "label": "From Invoice", "color": "var(--chart-1)" },
        "manual": { "label": "Manual", "color": "var(--chart-2)" },
        "auto": { "label": "Auto", "color": "var(--chart-3)" }
      }
    }
  }

- Feedbacks example (with rating line as percent):
  {
    "from": "2025-01-01",
    "to": "2025-03-31",
    "bucket": "day",
    "metric": "feedbacks",
    "series": [ { "date": "2025-01-01", "sent": 5, "completed": 3, "overdue": 1, "rating": 60 } ],
    "totals": { "sent": 120, "completed": 90, "overdue": 8 },
    "meta": {
      "unit": "count",
      "seriesKeys": ["sent","completed","overdue","rating"],
      "config": {
        "sent": { "label": "Sent", "color": "var(--chart-1)" },
        "completed": { "label": "Completed", "color": "var(--chart-2)" },
        "overdue": { "label": "Overdue", "color": "var(--chart-3)" },
        "rating": { "label": "Completion %", "color": "var(--chart-4)" }
      }
    }
  }

- Projects example:
  {
    "from": "2025-01-01",
    "to": "2025-03-31",
    "bucket": "day",
    "metric": "projects",
    "series": [ { "date": "2025-01-01", "created": 2, "completed": 1, "active": 10 } ],
    "totals": { "created": 60, "completed": 50 },
    "meta": {
      "unit": "count",
      "seriesKeys": ["created","completed","active"],
      "config": {
        "created": { "label": "Created", "color": "var(--chart-1)" },
        "completed": { "label": "Completed", "color": "var(--chart-2)" },
        "active": { "label": "Active", "color": "var(--chart-3)" }
      }
    }
  }

- Engagement example:
  {
    "from": "2025-01-01",
    "to": "2025-03-31",
    "bucket": "day",
    "metric": "engagement",
    "series": [ { "date": "2025-01-01", "email_sent": 4, "email_opened": 3, "link_clicked": 1, "invoice_viewed": 2, "feedback_viewed": 1 } ],
    "meta": {
      "unit": "count",
      "seriesKeys": ["email_sent","email_opened","link_clicked","invoice_viewed","feedback_viewed"],
      "config": {
        "email_sent": { "label": "Emails Sent", "color": "var(--chart-1)" },
        "email_opened": { "label": "Opens", "color": "var(--chart-2)" },
        "link_clicked": { "label": "Clicks", "color": "var(--chart-3)" },
        "invoice_viewed": { "label": "Invoice Views", "color": "var(--chart-4)" },
        "feedback_viewed": { "label": "Feedback Views", "color": "var(--chart-5)" }
      }
    }
  }

Performance considerations
- Add DB indexes (if not already):
  - `invoices(organizationId, issueDate, created_at, status)`
  - `receipts(organizationId, paymentConfirmedAt, issueDate, created_at, creationMethod)`
  - `customer_activities(organizationId, created_at, type)`
  - `projects(organizationId, endDate)`, `paymentTerms(dueDate)`, `deliverables(dueDate)`
- API responses capped by range; enforce server-side `from/to` maximum window (e.g., 365 days) to prevent accidental heavy requests.

Security and auth
- All dashboard endpoints follow the existing pattern:
  - `createClient()` → `auth.getUser()` → fetch `profiles.organizationId` → scope queries.
- Never accept `organizationId` from the client.

Phased implementation
1) Wire `nuqs` controls + placeholder widgets using mock data (keep current visuals working).
2) Implement `/api/dashboard/metrics` (invoices + receipts) and the `useDashboardMetrics` hook; swap the chart to live data.
3) Implement `/api/dashboard/cards` and feed the carousel.
4) Implement `/api/dashboard/recent` + `useDashboardRecent` and render lists.
5) Implement `/api/dashboard/calendar` + `useDashboardCalendar` and render mini calendar.
6) Add server prefetch/hydration on the page and tune `staleTime`/`gcTime`.
7) Add engagement series (from `customer_activities`) to metrics endpoint.
8) Add indices if needed after observing query plans.

Why not use existing hooks directly for charts?
- Fetching full `invoices`/`receipts` and aggregating on the client will scale poorly and duplicates logic across devices; aggregates are faster to compute in SQL and far smaller over the wire. We’ll still reuse existing hooks for lists and CRUD flows elsewhere.

Open questions / decisions
- Calendar scope: include deliverables + payment milestones or only high-level project dates? (initially invoices/feedbacks/projects; add milestones later if needed.)
- KPIs to highlight in carousel (candidate set): outstanding balance, paid last 30d, invoices due next 7d, receipts confirmed last 30d, pending feedbacks.
- Chart default metric: invoices; allow switching to receipts/engagement via a select.

Next concrete edits (when implementing)
- `app/api/dashboard/{metrics,recent,calendar,cards}/route.ts`
- `hooks/dashboard/use-dashboard.ts`
- Update `protected/(sidebar)/page.tsx` to include `DashboardPrefetcher` and wire widgets.
- Replace `ChartAreaInteractive` data source with `useDashboardMetrics` and `nuqs`.


