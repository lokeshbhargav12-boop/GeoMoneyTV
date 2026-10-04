# Aperture playback, AI and mobile controls

## Validation

From the repository root:

```powershell
npm run test:aperture
node --require ./scripts/test/register.cjs --test scripts/test/coal-data.test.ts
node ./node_modules/typescript/bin/tsc --noEmit --incremental false
```

Start a local Next.js server, then run deterministic browser checks:

```powershell
npm run dev -- -p 3010
# In another terminal:
npm run test:aperture:ui
```

`APERTURE_TEST_URL` can point to a different **local** server. The browser suite
intercepts provider calls with fixtures and checks 320, 375, 390, 430, 768 and
1440px layouts. Fixtures are test observations, not live intelligence. It checks
filters, selection persistence, regional evidence, provider failures, feed links,
touch region selection, region-error sheets and document overflow.

For local production compilation, invoke Next.js directly rather than the npm
prebuild hook, which pushes the database schema. On Windows, use consistent
canonical path casing for both the working directory and Next.js CLI (for this
checkout, `C:\Users\nicus\Desktop\GeoMoney_Prod\GeoMoney`). Mixing `c:\` and `C:\`
can cause duplicate webpack modules and misleading React prerender errors.

Validation performed on October 4, 2026: 23 Aperture tests, 8 shared coal/AI
regression tests, TypeScript, whitespace checks, canonical production build and
the browser suite against that build passed. Real Al Jazeera playback reached
Playing/readyState 4 after a user tap. A local production AI connectivity request
using explicitly labeled synthetic evidence returned HTTP 200 in approximately
3.5 seconds via model fallback. These checks do not establish deployed behavior.

## Operational behavior

- Briefing and region-analysis provider calls have a 50-second overall deadline,
  up to three attempts and at most 20 seconds per attempt. The browser cancels at
  55 seconds. Response-body reads remain within the attempt deadline.
- JSON validation happens within fallback. A queried briefing must include an
  actual answer, headline and summary. Unsupported optional provider parameters
  are omitted based on the cached model catalog.
- API failures identify configuration, authentication, rate/quota, timeout,
  invalid output or provider unavailability. Detailed model diagnostics stay
  server-side; prompts and upstream error bodies are not returned to clients.
- Manual requests cancel superseded requests and are never overwritten by later
  automatic briefings. Automatic briefings pause after manual interaction for
  the page session; the user can explicitly regenerate a briefing.
- Named regional queries select from the complete available snapshot before
  sampling. Counts describe the configured regional coverage radius, not a
  complete census. Slow/stopped, moored and anchored observations do not prove
  that a ship is stranded or blocked.
- Streams start with user interaction, not forced autoplay. Channel live pages
  are resolved with a short cache and bounded timeout. A status check confirms
  only the provider's live metadata, not successful playback or local footage.
- News broadcaster pins indicate headquarters. Only location cameras within
  100km are shown as nearby cameras in reports. Street View is recorded imagery.
- Bloomberg was removed from the predefined list because the configured video
  could not be validated as a current live stream. NASA now resolves the official
  channel's current live broadcast instead of claiming an old video is Earth live.

## Deployment checks

After deploying, test a public stream with user-initiated Play on
`https://geomoneytv.com/world-monitor`, submit `Hormuz` and a full regional question,
and check the response code and server-side model diagnostic if AI fails. Verify
provider credentials, credits and deployment function duration (at least 60s).
Ad blockers, consent restrictions, regional restrictions and provider embedding
policies may prevent playback; the UI must keep Retry and Open on provider usable.

The existing database authentication problem remains separate: caching and bounded
settings lookup avoid blocking AI model selection, but do not repair credentials
or restore aircraft/vessel history persistence.