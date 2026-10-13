# Energy reliability and UX review

## Scope

Energy Hub, Fossil Energy, Coal, Oil & Gas, Infrastructure, shared maps and
planning calculators. Existing unrelated working-tree edits were preserved.

## Implemented fixes

- Only timestamped market observations enter the Energy quote feed. Valid zero
  changes are preserved; missing quotes show unavailable. Observation time and
  delayed/stale status are exposed.
- Removed fabricated climate/news fallback events and fixed shipping counts.
  Infrastructure no longer synthesizes vessel positions, speeds or IDs.
- NASA event categories and latest point geometry are retained. Unknown demand
  and missing storage readings do not become numeric zero observations. Monthly
  generation uses monthly EIA requests; petroleum thousand-barrel values are
  normalized to the displayed million-barrel units. Independent reads run in
  parallel. Data confidence checks real, recent storage observations.
- Fixed fossil “All” filtering to Coal/Gas/Oil. Historical operating-only source
  limitations are explicit for Construction/Permitting and LNG terminals.
  Watchlist categories are no longer labelled map overlays.
- Infrastructure navigation activates workspace tabs. Feed refresh preserves
  workspace state and reports failure. 3D assets honor layer filters and send
  clicks to the inspector, as in 2D.
- Calculator validation rejects missing, negative, non-finite and impossible
  values. Zero tariff/sun hours have no payback rather than NaN; zero wind factor
  remains zero. Coal calculator results are hidden when inputs are invalid.
- Form labels, selected toggle states, alerts, mobile map-control placement,
  missing-data fallbacks and 3D failure handling were improved.
- Oil & Gas forecast/tank scenes and Infrastructure output/balance/macro models
  are explicitly illustrative, not AI forecasts, telemetry or satellite feeds.
  Forecast curves are deterministic. The demo no longer requests location.
- Regional analysis sends layers, totals and source status and surfaces provider
  failures. Energy AI validates returned structures and states that no live
  evidence was supplied.
- Coal internal API calls use the request origin/configured port and deadlines.
  Missing/stale AIS coverage is unavailable, not low congestion. Receipts are
  labelled receipts rather than production. Missing aggregate fields no longer
  crash the page.

## Verification

- `npm run test:energy`: 13 deterministic model/data/reference checks, no network,
  database or cache writes.
- `npm run test:energy:ui`: Puppeteer at 390px and 1440px across five pages. Checks
  validation, source notices, fossil status, navigation, refresh persistence and
  failure handling, accessible toggles, 2D/3D switching and horizontal overflow.
  Provider responses are intercepted fixtures, not evidence of live feed health.
- `npm run test:aperture`: existing 23 checks passed.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`:
  passed.
- Real local `/api/map/power-plants?fuels=Coal,Gas,Oil&minMW=50&limit=50000`:
  HTTP 200, 5,410 fossil-only reference records.

No database setup or production build was run: the project's prebuild performs
database setup. Lint could not run because the installed environment lacks
ESLint and a project configuration; Next's lint command prompts for setup.

## Remaining limitations / next phase

- Verify provider credentials, source licensing, deployment routing and live
  freshness in the deployed environment. Passing UI fixtures does not certify
  Yahoo/EIA/AIS/OpenRouter availability.
- Infrastructure has no connected vessel-position provider. Balance, macro,
  asset utilization and output histories are still clearly labelled example
  assumptions, not production intelligence. Replace these with sourced providers
  before using them operationally.
- WRI v1.3 is a historical operating inventory. Construction/permitting and
  genuine LNG-terminal datasets require additional sources.
- Static capacity highlights, policies and timeline content need source/year
  verification. Storage analytics and Energy admin controls remain Coming Soon.
- Full WCAG contrast audit, production performance testing, live map picking,
  provider tile availability and device-specific WebGL/context-loss testing
  remain necessary. The UI checks do not establish all of these.
- The existing Coal cache-writing suite was not run in this pass; the new Energy
  suite covers source-failure/origin contracts without altering the AI cache.