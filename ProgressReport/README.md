# Dagaz Progress Dashboard

React + Vite dashboard for tracking daily productivity sessions with CSV import, month filtering, sorting, pagination, and inline edit/delete.

This system lets you record, review, and analyze daily work sessions in one place. You can ingest data from a CSV or start with a built-in sample, then filter by month, sort any column, and page through entries. Each row is editable by clicking it—edits scroll you to the form, and saves scroll you back with a highlight so you see changes instantly. Summary cards and live form chips show key productivity metrics, while localStorage keeps your data and draft entries persistent between sessions.

## Description

Dagaz Progress Dashboard is a lightweight productivity tracker for dagaz assoc. It ingests CSVs or sample data, lets you log daily sessions with a single time input, and computes activity efficiency automatically. You can filter by month, sort any column, paginate, and edit by clicking rows. The form and table stay in sync with smooth scrolling and highlights, while summaries surface totals, minutes per activity, and activities per site. Data and in-progress drafts persist locally so you can pick up where you left off.

## Quick start

```bash
npm install
npm run dev
```

Place an optional CSV in `src/data` (any `*.csv`); the first file found will load, otherwise fallback dummy data is used.

## Key features

- Auth gate with simple email/password and display name.
- Add Session form with a single HH:MM(:SS) time input, validation, and live computed chips (hours decimalised, total activities, productivity per hour, average activities per site).
- Optional CSV ingestion plus localStorage persistence for rows and draft entries.
- Month filter, sortable headers (asc/desc), and pagination (10 rows/page).
- Clickable table rows to edit; delete with confirm; smooth scroll to form when editing and back to the saved row with highlight after saving.
- Summary cards for totals, minutes per activity, and average activities per site over the filtered set.

## Form calculations (per entry)

- `hoursDecimalised`: HH:MM(:SS) converted to decimal hours.
- `totalActivities`: ordersInput + disputedOrders + emailsFollowedUp + updatedOrders + videosUploaded.
- `productivityPerHour`: totalActivities / hoursDecimalised.
- `averageActivitiesPerSite`: totalActivities / (branches * hoursDecimalised).

## Dashboard aggregations (filtered rows)

- Totals: hours, activities, orders, disputed, emails, averageActivitiesPerSite (summed).
- Minutes per activity: (total hours * 60) / total activities (0 if none).
- Average activities per site (summary): mean of per-row averageActivitiesPerSite across filtered rows.

## Data flow

- `src/data/initialData.js`: loads first `*.csv` via `import.meta.glob` (raw) else uses fallback dataset; parses rows and computes numeric fields.
- `App.jsx`: owns auth, rows, form state, validation, sorting, filtering, pagination, editing, and scroll-to-row behavior.
- `DashboardPage.jsx`: wiring layer for header, table, form, modal, and stats.
- `SessionTable.jsx`: sortable headers; row click to edit; highlights active/saved rows; prev/next pagination controls.
- `AddSessionForm.jsx`: inputs, live computed chips, edit mode title/button, cancel edit, and scroll anchor.

## Editing workflow

1) Click a row to enter edit mode; page scrolls to the form and pre-fills values.
2) Save changes; the page scrolls back to that row and highlights it.
3) Delete uses a confirm dialog; if confirmed, the row is removed.

## Scripts

- `npm run dev` — start dev server.
- `npm run build` — production build.
- `npm run preview` — preview production build.

## Notes

- Time input accepts `HH:MM` or `HH:MM:SS` and is converted to decimal hours for all calculations.
- LocalStorage stores rows and the in-progress form; clearing browser storage resets to CSV/fallback data.
- Sorting defaults to date desc; every header is clickable to toggle asc/desc.

## Build log (high level)

- Day 1: 
- Scaffolded Vite + React app; added auth gate and baseline layout. Implemented Add Session form with single time input, validation, and computed chips. Added localStorage persistence for rows and drafts.
- Implemented CSV ingestion with fallback data, date parsing, and numeric conversions. Added month filter, summary cards (totals, minutes per activity, activities per site), and initial table layout.
- Added sorting on all headers, pagination (10/page), and minimal spreadsheet styling. Switched to inline row editing by clicking rows; added edit/save and delete flows with confirm.
- Improved UX with smooth scroll to form on edit and back to the saved row with highlight after save; added active-row highlighting. Refined README and descriptions for metrics and data flow.
