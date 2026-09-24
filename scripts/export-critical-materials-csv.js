const fs = require('fs')
const path = require('path')

const INPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'critical-materials.ts')
const OUTPUT_FILE = path.join(__dirname, '..', 'exports', 'critical-materials-client.csv')

function loadCriticalMaterials() {
  const source = fs.readFileSync(INPUT_FILE, 'utf8')
  const match = source.match(
    /export const CRITICAL_MATERIALS_DATA:\s*CriticalMaterialSeed\[\]\s*=\s*(\[[\s\S]*\])\s*$/
  )

  if (!match) {
    throw new Error('Could not parse CRITICAL_MATERIALS_DATA from critical-materials.ts')
  }

  const data = Function(`"use strict"; return (${match[1]});`)()
  if (!Array.isArray(data)) {
    throw new Error('Parsed CRITICAL_MATERIALS_DATA is not an array')
  }

  return data
}

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const raw = Array.isArray(value) ? value.join(' | ') : String(value)
  return `"${raw.replace(/"/g, '""')}"`
}

function toCsv(data) {
  const headers = [
    'name',
    'symbol',
    'category',
    'description',
    'applications',
    'countries',
    'source',
    'supply',
    'demand',
    'unit',
    'price',
  ]

  const rows = [headers.join(',')]

  for (const item of data) {
    const row = [
      csvEscape(item.name),
      csvEscape(item.symbol),
      csvEscape(item.category),
      csvEscape(item.description),
      csvEscape(item.applications),
      csvEscape(item.countries),
      csvEscape(item.source),
      csvEscape(item.supply),
      csvEscape(item.demand),
      csvEscape(item.unit),
      csvEscape(item.price ?? ''),
    ]
    rows.push(row.join(','))
  }

  return rows.join('\n')
}

function main() {
  const data = loadCriticalMaterials()
  const csv = toCsv(data)

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
  fs.writeFileSync(OUTPUT_FILE, csv, 'utf8')

  console.log(`Exported ${data.length} materials to: ${OUTPUT_FILE}`)
}

main()
