import assert from 'node:assert/strict'
import test from 'node:test'
import { prisma } from '../../src/lib/prisma'
import * as newsService from '../../src/lib/news-service'
import * as tickerService from '../../src/lib/ticker-service'
import * as materialService from '../../src/lib/material-intel-service'
import {
  formatArticlesForPrompt,
  formatMaterialsForPrompt,
  formatTickersForPrompt,
  loadNewsletterData,
  reconcileMaterialHighlights,
  selectMarketSnapshotTickers,
  type NewsletterArticle,
  type NewsletterMaterial,
  type NewsletterTicker,
} from '../../src/lib/newsletter-data-service'

const article: NewsletterArticle = {
  title: 'New export controls announced',
  category: 'commodities',
  description: 'The actual public-feed description with the current development.',
  content: '<p>Fallback article body</p>',
  aiSummary: null,
  aiAnalysis: null,
  sourceName: 'Example Newswire',
  sourceUrl: 'https://example.com/current-story',
  createdAt: new Date('2026-11-19T04:00:00.000Z'),
}

const material: NewsletterMaterial = {
  id: 'material-1',
  materialKey: 'mat_lithium',
  name: 'Lithium',
  symbol: 'Li',
  category: 'Battery Metal',
  price: 12.75,
  unit: 'kg',
  supply: 'Current supply observation',
  demand: 'Current demand observation',
  countries: '["Australia", "Chile"]',
  priceAsOf: '2026-11-19T04:30:00.000Z',
  priceIsLive: true,
  priceChange: 0.75,
  priceChangePercent: 6.25,
  benchmarkLabel: 'Current lithium benchmark',
}

const ticker: NewsletterTicker = {
  label: 'CRUDE OIL',
  symbol: 'CRUDE',
  price: 72.5,
  change: 1.25,
  changePercent: 1.7544,
  previousClose: 71.25,
  type: 'commodity',
  updatedAt: new Date('2026-11-19T04:45:00.000Z'),
}

test('article context uses the public description and source metadata', () => {
  const context = formatArticlesForPrompt([article])
  assert.match(context, /actual public-feed description/)
  assert.match(context, /Example Newswire/)
  assert.match(context, /https:\/\/example\.com\/current-story/)
  assert.doesNotMatch(context, /No summary available/)
})

test('article context falls back to plain-text body when no summary exists', () => {
  const context = formatArticlesForPrompt([{ ...article, description: null, content: '<p>Body&nbsp;context</p>' }])
  assert.match(context, /Body&nbsp;context/)
  assert.doesNotMatch(context, /<p>/)
})

test('material context uses effective benchmark price and provenance', () => {
  const context = formatMaterialsForPrompt([material])
  assert.match(context, /\$12\.75 per kg/)
  assert.match(context, /\+6\.25% benchmark change/)
  assert.match(context, /Current lithium benchmark/)
  assert.match(context, /Live-feed backed/)
  assert.match(context, /Australia, Chile/)
})

test('AI cannot replace a synchronized material price or invent a highlighted material', () => {
  const highlights = reconcileMaterialHighlights([
    {
      name: 'Lithium (Li)',
      priceNote: '$999,999 per tonne',
      supplyChainStatus: 'AI supply analysis',
      geopoliticalExposure: 'AI geopolitical analysis',
    },
    {
      name: 'Unobtainium (Xx)',
      priceNote: '$1 per unit',
      supplyChainStatus: 'Invented',
      geopoliticalExposure: 'Invented',
    },
  ], [material])

  assert.equal(highlights.length, 1)
  assert.equal(highlights[0].name, 'Lithium (Li)')
  assert.match(highlights[0].priceNote, /\$12\.75 per kg/)
  assert.doesNotMatch(highlights[0].priceNote, /999,999/)
  assert.equal(highlights[0].supplyChainStatus, 'AI supply analysis')
})

test('missing AI highlights still render real snapshot prices', () => {
  const highlights = reconcileMaterialHighlights([], [material])
  assert.equal(highlights.length, 1)
  assert.match(highlights[0].priceNote, /\$12\.75 per kg/)
  assert.equal(highlights[0].supplyChainStatus, 'Current supply observation')
})

test('market snapshot selects available real tickers and formats session change', () => {
  const selected = selectMarketSnapshotTickers([
    { ...ticker, symbol: 'GOLD', label: 'GOLD' },
    ticker,
    { ...ticker, symbol: 'URANIUM', label: 'URANIUM' },
  ])
  assert.deepEqual(selected.map((t) => t.symbol), ['CRUDE', 'URANIUM', 'GOLD'])
  const context = formatTickersForPrompt([ticker])
  assert.match(context, /\$72\.50/)
  assert.match(context, /\+1\.25 \(\+1\.75%\)/)
})

test('loader refreshes all sources before reading and returns dashboard-aligned prices', async () => {
  const events: string[] = []
  const original = {
    syncNews: newsService.syncNewsToDatabase,
    ensureTickers: tickerService.ensureTickerDataFresh,
    syncMaterials: materialService.syncMaterialPrices,
    listMaterials: materialService.listMaterialsWithPrices,
    findArticles: prisma.article.findMany,
    findMaterials: prisma.rareEarthMaterial.findMany,
    findTickers: prisma.commodityPrice.findMany,
  }

  try {
    // The TypeScript CommonJS test loader calls these module properties at
    // invocation time, allowing the loader's dependencies to be stubbed here.
    ;(newsService as any).syncNewsToDatabase = async () => { events.push('sync-news'); return 3 }
    ;(tickerService as any).ensureTickerDataFresh = async () => { events.push('sync-tickers'); return 4 }
    ;(materialService as any).syncMaterialPrices = async () => {
      events.push('sync-materials')
      return { updated: 2, failed: [], skipped: [], details: [] }
    }
    ;(materialService as any).listMaterialsWithPrices = async () => {
      events.push('read-priced-materials')
      return [{
        id: 'material-1', materialKey: 'mat_lithium', name: 'Lithium', symbol: 'Li',
        category: 'Battery Metal', description: '', price: 10, unit: 'kg',
        effectivePrice: 12.75, effectiveUnit: 'kg', priceAsOf: material.priceAsOf,
        priceIsLive: true, priceChange: 0.75, priceChangePercent: 6.25,
        benchmarkLabel: 'Current lithium benchmark', lastUpdated: material.priceAsOf,
      }]
    }
    ;(prisma.article as any).findMany = async () => { events.push('read-articles'); return [article] }
    ;(prisma.rareEarthMaterial as any).findMany = async () => {
      events.push('read-materials')
      return [{ ...material, price: 10, materialKey: 'mat_lithium', lastUpdated: new Date('2026-01-01') }]
    }
    ;(prisma.commodityPrice as any).findMany = async () => {
      events.push('read-tickers')
      return [{ ...ticker, changePercent: undefined }]
    }

    const result = await loadNewsletterData({ articleLimit: 10 })
    assert.equal(result.sync.newsAdded, 3)
    assert.equal(result.sync.tickersUpdated, 4)
    assert.equal(result.sync.materialPricesUpdated, 2)
    assert.equal(result.materials[0].price, 12.75)
    assert.equal(result.tickers[0].changePercent, 1.7543859649122806)

    for (const read of ['read-articles', 'read-materials', 'read-priced-materials', 'read-tickers']) {
      assert.ok(events.indexOf(read) > events.indexOf('sync-news'), `${read} happened before news sync`)
      assert.ok(events.indexOf(read) > events.indexOf('sync-tickers'), `${read} happened before ticker sync`)
      assert.ok(events.indexOf(read) > events.indexOf('sync-materials'), `${read} happened before material sync`)
    }
  } finally {
    ;(newsService as any).syncNewsToDatabase = original.syncNews
    ;(tickerService as any).ensureTickerDataFresh = original.ensureTickers
    ;(materialService as any).syncMaterialPrices = original.syncMaterials
    ;(materialService as any).listMaterialsWithPrices = original.listMaterials
    ;(prisma.article as any).findMany = original.findArticles
    ;(prisma.rareEarthMaterial as any).findMany = original.findMaterials
    ;(prisma.commodityPrice as any).findMany = original.findTickers
  }
})
