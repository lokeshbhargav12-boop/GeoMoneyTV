// Acceptance tests for C1 Material Intelligence Relevance (from the spec):
// 1. Generic hospital-laser article must NOT enter a Thulium watchlist.
// 2. Article explicitly covering a thulium-doped laser MUST enter.
// 3. A heavy-rare-earth export-control change can enter Thulium with high
//    relevance even if "Thulium" is not in the headline.
// 4. Every surfaced event explains in one sentence why it is shown.
//
// Run: npx tsx scripts/test-c1-acceptance.ts

import { scoreEventForMaterial, classifyEventText } from '../src/lib/material-events-service'
import { PILOT_APPLICATIONS } from '../src/data/pilot-applications'

function makeThulium() {
  return {
    id: 'test_tm',
    name: 'Thulium',
    symbol: 'Tm',
    materialFamily: 'Heavy Rare Earth',
    category: 'Heavy Rare Earth',
    structuredApplications: PILOT_APPLICATIONS.mat_thulium.map((a) => ({
      name: a.name,
      aliases: JSON.stringify(a.aliases),
      strength: a.strength,
      qualifiesWithoutMention: a.qualifiesWithoutMention,
    })),
    countryRoles: [{ country: 'China', stage: 'refining', sharePct: 90 }],
  }
}

function score(title: string, summary: string) {
  const classification = classifyEventText(title, summary, 'Reuters')
  return scoreEventForMaterial(
    { title, summary, eventType: classification.eventType, severity: classification.severity, countries: [] },
    makeThulium(),
  )
}

const thulium = makeThulium()
let failures = 0

function check(label: string, pass: boolean, detail: string) {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label} — ${detail}`)
  if (!pass) failures++
}

// Test 1: generic hospital-laser article must NOT qualify.
const t1 = score('New hospital laser system improves surgical outcomes', 'Hospitals adopt medical lasers for routine procedures.')
check('T1 generic hospital-laser suppressed', t1 === null || t1.score < 50, `result=${JSON.stringify(t1)}`)

// Test 2: explicit thulium-doped laser article MUST qualify (via application linkage).
const t2 = score('Breakthrough in thulium-doped laser efficiency', 'Researchers demonstrate a new thulium fiber laser design.')
check('T2 thulium-doped laser qualifies', t2 !== null && t2.score >= 70, `score=${t2?.score} level=${t2?.level}`)

// Test 3: HREE export control enters Thulium without naming it (family linkage, high relevance band 70-89).
const t3 = score('China tightens export controls on heavy rare earth elements', 'New licensing requirements cover heavy rare earth separation products.')
check('T3 HREE export control qualifies via family', t3 !== null && t3.score >= 70 && t3.score <= 89, `score=${t3?.score} level=${t3?.level} rel=${t3?.relationshipType}`)

// Test 4: every surfaced event has a one-sentence why-relevant.
const t4 = score('Gallium export licences now required for GaN shipments', 'Exporters of gallium nitride products need licences.')
const t4b = t4 !== null ? null : scoreEventForMaterial(
  { title: 'China restricts gallium and germanium exports', summary: 'Export controls on gallium products.', eventType: 'export_control', severity: 'high', countries: ['China'] },
  { ...thulium, id: 'test_ga', name: 'Gallium', symbol: 'Ga', materialFamily: 'Semiconductor Metal', category: 'Semiconductor Metal', structuredApplications: [] },
)
check('T4 why-relevant present', (t4b?.whyRelevant?.length ?? 0) > 20, `why="${t4b?.whyRelevant}"`)

// Test 5: direct mention beats everything (Level 1, score >= 90 band start 86+).
const t5 = scoreEventForMaterial(
  { title: 'Thulium prices spike on export control fears', summary: 'Thulium markets react.', eventType: 'export_control', severity: 'high', countries: [] },
  thulium,
)
check('T5 direct mention is Level 1 high score', t5 !== null && t5.level === 1 && t5.score >= 90, `score=${t5?.score} level=${t5?.level}`)

console.log(failures === 0 ? '\nAll acceptance tests passed.' : `\n${failures} test(s) FAILED.`)
process.exit(failures === 0 ? 0 : 1)
