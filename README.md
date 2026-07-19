# Sentinel — QHSE Operations Platform

A private, **local-only** desktop application for the Safety, Environment & Quality
departments of an electrical contractor. No cloud, no subscription — all your data
lives in one SQLite database file on your laptop, owned entirely by you.

Built full-stack: **Electron + React + Vite + Tailwind + Recharts + ExcelJS + SQLite**.

## Run it

```bash
npm install      # first time only
npm run dev      # starts the app
```

Or double-click **`Launch Sentinel.command`** in Finder.

### Demo logins
| User  | Password   | Role                       |
|-------|------------|----------------------------|
| admin | admin123   | Administrator (full access)|
| hr    | hr123      | HR (full edit)             |
| ceo   | ceo123     | Executive (read-only)      |

> Change these in production. Accounts are stored salted+hashed in the local DB.

## Modules
- **Dashboard** — live KPIs, compliance donut, inspection trend, expiry watchlist
- **Employees** — master records + profile drawer with all linked credentials
- **ID cards** — Iqama, Industrial Security Card, Baladiya (Municipality), etc.
- **Licenses** & **Courses / training** — with expiry tracking
- **PPE** — stock/inventory + issued-to-employee with acknowledgment
- **Inspections** — daily site & vehicle checks, NFC/QR tag → asset, checklist, score
- **Assets & tags** — job sites, vehicles, equipment with NFC/QR/barcode tags
- **Document control** — ISO 45001 / 14001 / 9001 with version history
- **Environment** — cooling-oil pulls, staking returns, waste removal, extractor
- **Quality** — non-conformance reports (NCR) + audits
- **Projects** & **Work orders** — assignments and progress
- **Settings** — company profile, theme, data folder, audit trail

## Compliance engine
Every credential is colour-coded automatically:
🟢 valid · 🟡 expiring within 90 days · 🔴 expiring within 30 days or expired.
The bell icon and dashboard surface everything that needs action.

## Excel
Every module has **Export to Excel**. Employees, ID cards, licenses, courses and
environment records also support **Import from Excel** (matches columns by header,
upserts employees by `emp_id`).

## Your data & backups
- Database file: `~/Library/Application Support/sentinel-qhse/sentinel-qhse.sqlite`
- Open the folder anytime from **Settings → Open data folder** (or the database icon in the top bar).
- To back up: copy that `.sqlite` file somewhere safe. To restore: copy it back.

## Build a distributable app (optional)
The current setup runs via `npm run dev`. To package a double-click `.app`,
add `electron-builder` and an `electron:build` script (kept out of v1 to stay simple).
