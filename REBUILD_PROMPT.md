# DealFlow — Claude Code Rebuild Prompt

Copy everything below the line and paste it into Claude Code as your initial prompt.

---

Build a complete B2B deal management web application called **DealFlow** for a polymer distribution business. The app manages customers, deals, offers, pricing, orders, and analytics. It is fully client-side with localStorage persistence (no backend database). Build it incrementally — start with project setup, then data layer, then layout, then pages one at a time, verifying each step compiles before moving on.

## Tech Stack

- **Next.js 16** with App Router (`src/` directory)
- **React 19**, **TypeScript 5** (strict mode)
- **Material UI 7** (`@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`)
- **Emotion** for CSS-in-JS (`@emotion/react`, `@emotion/styled`)
- **Zustand 5** with `persist` middleware for state management (all stores save to localStorage)
- **Recharts 3** for charts
- **react-grid-layout** for draggable dashboard
- **@react-pdf/renderer** for PDF generation
- **@anthropic-ai/sdk** for AI chart builder
- **date-fns** for dates, **uuid** for ID generation
- **Docker** for deployment (port 3002)
- Path alias: `@/*` → `./src/*`

Run the dev server on port 3002 (`next dev --port 3002`).

---

## Theme (`src/theme/theme.ts`)

Create a MUI theme with:

- **Primary**: `#002855` (dark navy), light `#2E6DB4`, dark `#001a3a`
- **Secondary**: `#2E6DB4`
- **Warning**: `#F5A623`, **Success**: `#2E7D32`, **Error**: `#D32F2F`
- **Background**: default `#F5F7FA`, paper `#FFFFFF`
- **Text**: primary `#1A1A2E`, secondary `#6B7280`
- **Font**: Inter, Roboto, Helvetica, Arial
- **Typography**: h4 weight 700, h5/h6 weight 600, subtitle1 weight 500, button textTransform none weight 600
- **Shape**: borderRadius 8
- **Component overrides**: Button borderRadius 8 padding 8px 20px; Card borderRadius 12 subtle shadow; Chip fontWeight 500; TableHead cells gray bg `#F5F7FA` uppercase 0.75rem 600 weight; Drawer paper borderRight `1px solid #E5E7EB`

Wrap the app in a ThemeRegistry component using Emotion cache + MUI ThemeProvider + CssBaseline. Import Inter font from Google Fonts in the root layout.

---

## Data Types (`src/types/`)

Define these TypeScript types in separate files, re-exported from `src/types/index.ts`:

### Customer
```ts
{ id: string; name: string; country: string; segment: string; tier: 'A'|'B'|'C'; assignedAM: string; address: string; email: string; phone: string; createdAt: string }
```
Plus `Contact { id, customerId, name, role, email, phone, isPrimary }` and `CustomerNote { id, customerId, body, createdBy, createdAt }`

### Deal
```ts
type DealStatus = 'Draft' | 'Active' | 'Won' | 'Lost' | 'Expired';
{ id: string; customerId: string; name: string; status: DealStatus; createdBy: string; createdAt: string; updatedAt: string }
```

### Product
```ts
type ProductCategory = 'LDPE'|'HDPE'|'PP'|'PVC'|'PS'|'PET';
{ id: string; name: string; legacyName: string; code: string; category: ProductCategory }
```

### Offer
```ts
type OfferStatus = 'Draft'|'Sent'|'Pending'|'Approved'|'Rejected'|'Expired';
type Incoterms = 'FCA'|'FOB'|'CIF'|'CFR'|'EXW'|'DAP'|'DDP';

OfferLine { id: string; productId: string; quantity: number|null; unit: 'MT'|'KG'; pricePerUnit: number; currency: 'USD'|'EUR'; incoterms: Incoterms; paymentTerms: string; belowMSPReason: string|null; belowMSPNote: string }

Offer { id: string; dealId: string; version: number; name: string; status: OfferStatus; currency: 'USD'|'EUR'; incoterms: Incoterms; incotermsLocation: string; paymentTerms: string; validityDate: string; notes: string; lines: OfferLine[]; createdBy: string; createdAt: string; updatedAt: string; sentAt: string|null }
```

### Order
```ts
type OrderStatus = 'Created'|'Confirmed'|'Shipped'|'Delivered';
{ id: string; orderNumber: string; offerId: string; dealId: string; customerId: string; status: OrderStatus; createdAt: string }
```

### Pricing
```ts
MSPEntry { id: string; productId: string; month: string; price: number; currency: string; updatedAt: string }
BasePrice { id: string; productId: string; price: number; currency: string; effectiveFrom: string; effectiveTo?: string }
CostEntry { id: string; productId: string; cost: number; currency: string; effectiveDate: string }
PricingRule { id: string; name: string; productId?: string; trigger: 'volume'|'customer_tier'|'incoterms'|'payment_terms'|'category'; condition: object; adjustmentType: 'percentage'|'fixed'; adjustmentValue: number; priority: number; active: boolean }
CustomerOverride { id: string; customerId: string; productId: string; overridePrice: number; currency: string; validFrom: string; validTo?: string; note: string }
Guardrail { id: string; name: string; type: 'min_margin_pct'|'max_discount_pct'|'below_cost'|'below_msp'; threshold: number; action: 'warn'|'block'|'require_approval'; active: boolean }
PricingApproval { id: string; offerId: string; dealId: string; lineProductId: string; requestedPrice: number; computedFloor: number; guardrailId: string; reason: string; requestedBy: string; status: 'pending'|'approved'|'rejected'; createdAt: string }
```

### Activity
```ts
type ActivityAction = 'deal_created'|'deal_updated'|'deal_deleted'|'offer_created'|'offer_sent'|'offer_approved'|'offer_rejected'|'offer_expired'|'order_created'|'pdf_generated'|'status_changed'|'note_added';
ActivityEntry { id: string; entityType: 'deal'|'offer'|'customer'|'order'; entityId: string; dealId: string|null; action: ActivityAction; details: string; userId: string; timestamp: string }
```

### DealNote
```ts
type DealNoteCategory = 'Call Summary'|'Internal Note'|'Price Discussion'|'Customer Feedback';
type DealNotePriority = 'Low'|'Medium'|'High';
DealNote { id: string; dealId: string; body: string; category: DealNoteCategory; priority: DealNotePriority; createdBy: string; createdAt: string; updatedAt: string }
```

### Reminder
```ts
Reminder { id: string; type: 'customer'|'product'; targetId: string; targetName: string; title: string; frequency: 'weekly'|'monthly'|'quarterly'; dueDate: string; status: 'active'|'done'|'snoozed'; createdAt: string }
```

### Settings
```ts
type UserRole = 'account_manager'|'sales_director'|'admin';
AppSettings { currentRole: UserRole; currentUser: string }
```

### ChartBuilder types
Define types for the AI chart builder: `ChartConfig` with fields for `dataSource`, `chartType` (line|bar|pie|area|scatter|table), `title`, `xField`, `yField`, `groupBy`, `filters[]`, `aggregation`, `sort`, `limit`, `joins[]`, `timeGranularity`, `colors[]`, `stacked`, `showLegend`, `showGrid`.

---

## Zustand Stores (`src/stores/`)

Create these stores, each using `persist` middleware with localStorage. Name keys `dealflow-{storename}`.

1. **dealStore** — `deals[]`, CRUD, `getDealById`, `getDealsByCustomer`
2. **offerStore** — `offers[]`, CRUD, `getOffersByDeal`, `getLatestOfferForDeal`, `duplicateAsNewVersion` (copies offer, increments version, resets status to Draft)
3. **customerStore** — `customers[]`, `contacts[]`, `notes[]` (CustomerNote), full CRUD for each
4. **productStore** — `products[]`, CRUD, `getProductById`
5. **pricingStore** — `entries[]` (MSPEntry[]), CRUD, `getMSPForProduct(productId, month)`, `getHistoryForProduct(productId)`
6. **pricingEngineStore** — `basePrices[]`, `costs[]`, `rules[]`, `overrides[]`, `guardrails[]`, `approvals[]` (PricingApproval[]), full CRUD for each
7. **orderStore** — `orders[]`, `addOrder`, `getOrderByOffer`
8. **reminderStore** — `reminders[]`, CRUD, `markDone`, `snooze`, `getUpcoming`
9. **activityStore** — `activities[]`, `addActivity`, `getActivitiesByDeal`, `getRecentActivities`
10. **dealNoteStore** — `notes[]` (DealNote[]), CRUD, `getNotesByDeal`
11. **dashboardStore** — `dashboards[]`, `activeDashboardId`, `chartConfigs{}`, `builderSession`, `isBuilderOpen`. Partially persisted (only dashboards, activeDashboardId, chartConfigs). Includes a default dashboard with 4 preset chart widgets.
12. **settingsStore** — `settings: AppSettings`, defaults to `{currentRole: 'account_manager', currentUser: 'John Mitchell'}`

---

## Seed Data (`src/data/`)

Create realistic JSON seed data files for the polymer distribution domain:

- **customers.json** — 10 global customers (Germany, USA, Netherlands, Mexico, Turkey, Brazil, India, Poland, France, UK). Segments: Packaging, Automotive, Construction, Agriculture, Consumer Goods. Tiers: A/B/C mix. 3 Account Managers: John Mitchell, Sarah Chen, Marco Rodriguez.
- **products.json** — 25 polymer products from real suppliers (ExxonMobil, SABIC, LyondellBasell, INEOS, Dow, Borealis, TotalEnergies, Braskem, Formosa, Reliance). Categories: LDPE, HDPE, PP, PVC, PS, PET. Each has name, legacyName, code.
- **pricing.json** — 300 MSP entries (25 products × 12 months, Apr 2025 – Mar 2026). Prices range $725–$1640 USD/MT with realistic monthly trends.
- **basePrices.json** — 25 entries, one per product, effective from 2026-03-01.
- **costs.json** — 25 entries (supplier costs, $705–$1200 range, lower than base prices).
- **pricingRules.json** — 9 rules: volume discounts (500+ MT → 5%), tier discounts (A → 3%, B → 1%), payment term surcharge (60+ days → 1.5%), incoterms adjustments, product-specific overrides.
- **customerOverrides.json** — 4 entries for key strategic accounts with negotiated prices.
- **guardrails.json** — 4 rules: min 10% margin (require_approval), below MSP (warn), max 15% discount (block), below cost (block).
- **deals.json** — 8 deals across customers with mix of statuses.
- **offers.json** — 15 offers with versioning, multiple lines per offer, various statuses.
- **orders.json** — 5 orders linked to approved offers.
- **reminders.json** — 5 reminders (customer and product types, various frequencies).
- **activities.json** — 20 activity entries tracking deal/offer/order lifecycle.
- **dealNotes.json** — 7 notes across deals with different categories and priorities.

Create a `SeedInitializer` component that loads in the app layout. It checks each store — if empty, it loads the corresponding JSON seed data. It only seeds once (subsequent loads skip if data exists).

---

## Layout System

### AppShell (`src/components/layout/AppShell.tsx`)
- Fixed TopBar at top
- Responsive sidebar drawer: 260px wide, permanent on md+, temporary on mobile
- Main content area with proper offsets
- Uses `useHydration()` hook — shows a centered spinner until hydrated

### Sidebar (`src/components/layout/Sidebar.tsx`)
- Logo: HandshakeIcon + "DealFlow" text in primary color
- Nav items: Dashboard (`/dashboard`), Customers (`/customers`), Deals (`/deals`), Catalog (`/products`), [divider], Analytics (`/analytics`)
- Active item: primary bg with white text, bold font
- Footer: "DealFlow v1.0"

### TopBar (`src/components/layout/TopBar.tsx`)
- White AppBar, fixed position
- Right side: GlobalSearch button, Notification bell with badge, Profile avatar with dropdown menu
- Badge count shows unread notifications + active reminders

### GlobalSearch (`src/components/layout/GlobalSearch.tsx`)
- Modal dialog triggered by search icon or ⌘K
- Searches across deals, customers, products, offers
- Quick navigation to results

### useHydration hook (`src/hooks/useHydration.ts`)
Simple hook that returns `false` on server, `true` after mount. Used in every page to prevent SSR hydration mismatches with Zustand.

---

## Page Routes

All app pages are inside `src/app/(app)/` which uses the AppShell layout.

### Root (`/`) — Redirects to `/dashboard`

### Dashboard (`/dashboard`)
Grid layout with these widgets:
- **PipelineSankey** (full width) — SVG Sankey diagram showing deal flow: Opportunity → Offer → Order, with Lost and Expired branches. Clickable nodes open a PipelineDrawer with filtered deal list. Classify deals: if has approved offer with order → Order; if has any offer → Offer; otherwise → Opportunity. Lost and Expired from deal status.
- **MonthlySummary** + **UpcomingReminders** (2 columns)
- **PricingSimulator** + **PendingApprovals** (2 columns)
- **RecentActivity** (full width)

**MonthlySummary**: Cards showing current month metrics — total revenue from orders, active deals count, offers sent, conversion rate.

**UpcomingReminders**: List of next 5 upcoming reminders with due dates, snooze/done actions.

**PricingSimulator**: Quick calculator — select product, enter quantity, customer tier, incoterms, payment terms. Uses the pricing engine to show computed price, margin, and any guardrail warnings.

**PendingApprovals**: List of PricingApproval records with status='pending'.

**RecentActivity**: Last 10 activity entries with icons per action type, relative timestamps, links to deals.

### Deals (`/deals`)
- **Filters**: Search input (deal name/customer name), Customer multi-select, Status multi-select, Month filter
- **Table**: Columns — Deal Name, Customer, Last Offer Status (chip), # Products (from latest offer lines), Last Updated (relative), Owner (AM), Delete icon
- **Create Deal** button opens dialog: deal name input + customer select dropdown
- Row click navigates to `/deals/[id]`
- Sort by updatedAt descending

### Deal Detail (`/deals/[id]`)
- **Header**: Editable deal name (inline text field), customer name subtitle, breadcrumbs
- **Status dropdown** with colored options: Draft (#6B7280), Active (#1D4ED8), Won (#059669), Lost (#DC2626), Expired (#9CA3AF)
- **Action buttons**: Create Offer (→ `/deals/[id]/offers/new`), Create Order (enabled only when latest offer is Approved and no order exists), Delete
- **5 Tabs**:
  1. **Offers** — Table of all offer versions for this deal: Version #, Name, Status chip, # Lines, Total Value, Date, Actions (view/duplicate). Click to view.
  2. **Products** — Aggregated product list from all offers with latest pricing.
  3. **Notes** — DealNotes with category chips, priority badges, CRUD. Includes voice dictation button using Web Speech API.
  4. **Activity Log** — Filtered activity entries for this deal with icons and labels per action type.
  5. **Files** — Placeholder tab for PDF attachments.

### New Offer (`/deals/[id]/offers/new`)
- Auto-names the offer: "{CustomerName} – {MonthYear} – V{nextVersion}"
- **OfferForm** component with:
  - Header fields: name, currency (USD/EUR), incoterms select, incoterms location, payment terms, validity date, notes
  - **Product Lines table**: Add/remove lines. Each line: product select (from product store), quantity, unit (MT/KG), price per unit, currency, incoterms, payment terms. Below-MSP reason dropdown if price < current MSP, with optional note field.
  - **PricingPanel** sidebar: For each line, shows computed price from pricing engine, base price, applied adjustments, margin vs cost, margin vs MSP, guardrail violations with color-coded warnings.
  - Save → adds to offer store, logs activity, redirects to deal detail

### Offer View (`/deals/[id]/offers/[offerId]`)
- Full offer detail with all lines displayed
- Status management (Draft → Sent → Pending → Approved/Rejected)
- PDF download button using react-pdf
- Duplicate as new version button

### Offer Edit (`/deals/[id]/offers/[offerId]/edit`)
- Same as new offer form but pre-populated with existing offer data

### Customers (`/customers`)
- **Filters**: Search (name), Country multi-select, Segment multi-select, Assigned AM multi-select
- **Table**: Customer Name, Country, Segment, Assigned AM, # Deals, Last Updated
- Row click → `/customers/[id]`
- Sort alphabetical by name

### Customer Detail (`/customers/[id]`)
- **5 Tabs**:
  1. **Overview** — Company info cards: name, country, segment, tier badge, AM, address, email, phone
  2. **Deals** — List of customer's deals with status chips
  3. **Contacts** — Contact list with add/edit dialog (name, role, email, phone, isPrimary toggle)
  4. **Products** — Products this customer has ordered, with price history line chart using Recharts
  5. **Notes** — CustomerNotes with add/edit

### Catalog / Products (`/products`)
- **3 tabs** (controlled via URL query param `?tab=products|pricing|guardrails`):
  1. **Products Tab**: Search by name/code, filter by category. Table: Name, Legacy Name, Code, Category, Current MSP. Row click → `/products/[id]`.
  2. **Pricing Matrix Tab** (PricingMatrixTab component):
     - Product select dropdown
     - Editable base price and cost fields
     - MSP price history line chart (Recharts Line chart)
     - Pricing rules table — list active rules with trigger, condition, adjustment
     - Edit rules capability
  3. **Guardrails Tab** (GuardrailsTab component):
     - Table of guardrails: name, type, threshold, action, active toggle
     - Add/edit guardrail dialog
     - Color-coded action badges (warn=yellow, block=red, require_approval=orange)

### Product Detail (`/products/[id]`)
- Product info: name, legacy name, code, category
- Current MSP display
- Price history chart

### Pricing (`/pricing`) — Redirects to `/products?tab=pricing`

### Analytics (`/analytics`)
- **Custom Dashboard Builder** using react-grid-layout for draggable/resizable chart cards
- **DashboardToolbar**: Add chart button, dashboard name, layout controls
- **4 Default Charts**: WinRateByProduct, WinRateByCustomer, MonthlyActivity, MarginAnalysis (all built with Recharts)
- **AI Chart Builder Dialog**: Opens a chat interface where users describe charts in natural language. Sends request to `/api/ai/chart`. Claude generates a ChartConfig which renders as a Recharts chart.
- **DynamicChart** component: Takes a ChartConfig and renders the appropriate Recharts chart type (Line, Bar, Pie, Area, Scatter, or HTML table)

### Reminders (`/reminders`)
- List all reminders with status badges
- Create reminder dialog: type (customer/product), target select, title, frequency (weekly/monthly/quarterly), due date
- Actions: Mark Done, Snooze, Delete
- Filter by status, type

### Settings (`/settings`)
- Current user role selector
- Current user name

---

## Pricing Engine (`src/lib/pricingEngine.ts`)

Implement `computePrice(input, data) → PricingResult`:

**Input**: productId, quantity, customerId, customerTier, incoterms, paymentTerms, productCategory

**Logic**:
1. Find latest effective BasePrice for the product
2. Find latest Cost for the product
3. Find current MSP (most recent month)
4. Check for active CustomerOverride — if exists, return override price immediately (skip rules)
5. Filter active PricingRules matching this product/scenario
6. Sort rules by priority (lower number = applied first)
7. Apply rules cumulatively — each adjusts the running price:
   - `volume`: check quantity in minQuantity–maxQuantity range. Only apply highest-priority volume rule.
   - `customer_tier`: check tier in tiers array
   - `incoterms`: check incoterms in incoterms array
   - `payment_terms`: parse "Net X" to get days, check >= paymentTermsMinDays
   - `category`: check category in categories array
   - Adjustments: `percentage` → multiply, `fixed` → add/subtract dollar amount
8. Check guardrails on final price:
   - `min_margin_pct`: `(finalPrice - cost) / finalPrice * 100 >= threshold`
   - `max_discount_pct`: `(basePrice - finalPrice) / basePrice * 100 <= threshold`
   - `below_cost`: `finalPrice >= cost`
   - `below_msp`: `finalPrice >= msp`
9. Return PricingResult: `{ basePrice, adjustments[], finalPrice, cost, msp, marginVsCost, marginVsMSP, guardrailViolations[], hasOverride }`

Create a `usePricingEngine()` hook that merges all pricing stores and returns a memoized `computePrice` function.

---

## AI Chart API (`src/app/api/ai/chart/route.ts`)

POST endpoint that:
1. Receives: `{ prompt, conversationHistory[], dataSource?, chartType?, currentConfig?, dataSummary }`
2. Reads `ANTHROPIC_API_KEY` from env
3. Builds messages array with system prompt documenting all 7 data sources (customers, deals, offers, orders, products, activities, pricing), their schemas, entity relationships, and chart guidelines
4. Calls Claude claude-sonnet-4-20250514 with forced tool use: tool `generate_chart_config` that returns a ChartConfig JSON
5. Extracts the tool result and any text explanation
6. Returns `{ config: ChartConfig, explanation: string }`

The system prompt (`src/lib/chartSystemPrompt.ts`) should document all data source fields, join patterns (e.g., offers join to customers via deals), offer line flattening, aggregation functions (count, sum, avg, min, max, distinct_count), and time granularity options.

Create a `chartDataResolver.ts` that takes a ChartConfig and resolves it to data: fetch raw data from stores → apply joins → apply filters → flatten offer lines → group/aggregate → sort → limit.

Create a `dataSummaryBuilder.ts` that generates field statistics (unique values, min/max, top values) for any data source to send as context to the AI.

---

## PDF Generation (`src/components/pdf/OfferPDF.tsx`)

Using @react-pdf/renderer, create an A4 PDF template:
- **Header**: "Vinmar International" company name
- **Customer & Offer Info**: Two columns — customer details on left, offer reference on right
- **Terms**: Incoterms, Currency, Payment Terms in 3-column layout
- **Product Table**: Product Name (35%), Quantity (12%), Unit (10%), Price/Unit (15%), MSP (13%), Total (15%). Striped rows.
- **Total**: Sum of all line totals
- **Notes**: Offer notes if present
- **Signature blocks**: Two columns for signatures
- Colors: `#002855`, `#2E6DB4`, `#F5F7FA`

Create a `PDFDownloadButton` component that wraps the PDF in a download link.

---

## Shared Components (`src/components/shared/`)

- **PageHeader**: Title, optional subtitle, breadcrumbs, action buttons slot
- **StatusChip**: Colored chip mapping deal/offer statuses to colors
- **EmptyState**: Icon + message for empty lists
- **MultiSelectFilter**: Autocomplete-based multi-select for filter dropdowns
- **DateRangeFilter**: Date range picker using MUI X date pickers
- **ConfirmDialog**: Reusable confirmation dialog for destructive actions

---

## Docker Deployment

**Dockerfile** (multi-stage):
1. `base`: node:20-alpine
2. `deps`: install with npm ci
3. `builder`: copy source, run `next build` (standalone output)
4. `runner`: copy standalone + static, run as non-root user `nextjs`, expose port 3002

**docker-compose.yml**: Single service `dealflow`, port 3002:3002, restart unless-stopped.

**next.config.ts**: `output: 'standalone'`

**.dockerignore**: node_modules, .next, .git

---

## Key Implementation Notes

1. **Every page** must use the `useHydration()` hook and show a loading state until hydrated. This prevents SSR/client mismatches with Zustand stores.
2. **All components are client components** (`'use client'` directive) since they use Zustand stores.
3. **Activity logging**: Every significant action (create deal, create/send/approve offer, create order, status change) should log an ActivityEntry.
4. **Status colors** used throughout the app: Draft=#6B7280, Active=#1D4ED8, Won=#059669, Lost=#DC2626, Expired=#9CA3AF. Offer statuses: Draft=#6B7280, Sent=#1D4ED8, Pending=#F5A623, Approved=#059669, Rejected=#DC2626, Expired=#9CA3AF.
5. **Recharts formatters** — when using Recharts Tooltip `formatter` or `labelFormatter` props, cast callback functions with `as any` to avoid TypeScript incompatibilities with Recharts 3 generics.
6. **All state is client-side** — no API routes except the AI chart endpoint. All data persists in localStorage via Zustand persist middleware.
7. **SeedInitializer** runs once on app load and populates empty stores from JSON files. It should check `store.length === 0` before seeding.
