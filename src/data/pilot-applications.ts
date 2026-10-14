// Pilot structured applications (F2) for the five QA-pilot materials.
// These drive the C1 relevance scorer: aliases are match terms, strength
// weights the score, and qualifiesWithoutMention controls whether an
// article can qualify for the material without naming it. Weak/broad
// entries can NEVER qualify an article on their own (spec P0-5).

export interface PilotApplicationSeed {
  name: string
  aliases: string[]
  relationship: 'direct_use' | 'compound' | 'downstream_technology' | 'sector'
  strength: 'direct' | 'strong' | 'moderate' | 'weak'
  qualifiesWithoutMention: boolean
  notes?: string
}

export const PILOT_APPLICATIONS: Record<string, PilotApplicationSeed[]> = {
  mat_thulium: [
    {
      name: 'Thulium-doped lasers',
      aliases: ['thulium laser', 'tm-doped laser', 'tm:fiber laser', 'thulium fiber laser'],
      relationship: 'direct_use',
      strength: 'direct',
      qualifiesWithoutMention: true,
      notes: 'Spec example: article explicitly covering a thulium-doped laser must enter the Thulium watchlist.',
    },
    {
      name: 'Thulium medical laser systems',
      aliases: ['thulium medical laser', 'thulium surgical laser', 'tm:yag'],
      relationship: 'downstream_technology',
      strength: 'strong',
      qualifiesWithoutMention: true,
    },
    {
      name: 'Thulium-170 portable X-ray sources',
      aliases: ['thulium-170', 'tm-170', 'thulium x-ray source'],
      relationship: 'downstream_technology',
      strength: 'strong',
      qualifiesWithoutMention: true,
    },
    // Broad sector terms — present for display/completeness, but they can
    // never qualify an article on their own.
    {
      name: 'Medical lasers',
      aliases: ['medical lasers'],
      relationship: 'sector',
      strength: 'weak',
      qualifiesWithoutMention: false,
      notes: 'Weak unless a thulium link is established. A generic hospital-laser article must NOT enter the Thulium watchlist.',
    },
    {
      name: 'Defence optics',
      aliases: ['defence optics', 'defense optics'],
      relationship: 'sector',
      strength: 'weak',
      qualifiesWithoutMention: false,
    },
  ],
  mat_gallium: [
    {
      name: 'GaN semiconductors',
      aliases: ['gallium nitride', 'gan', 'gan hemt', 'gan power'],
      relationship: 'compound',
      strength: 'direct',
      qualifiesWithoutMention: true,
    },
    {
      name: 'GaAs semiconductors',
      aliases: ['gallium arsenide', 'gaas'],
      relationship: 'compound',
      strength: 'direct',
      qualifiesWithoutMention: true,
    },
    {
      name: 'RF power amplifiers',
      aliases: ['rf amplifier', 'rf power amplifier', 'rf front-end'],
      relationship: 'downstream_technology',
      strength: 'strong',
      qualifiesWithoutMention: true,
      notes: 'GaN/GaAs-based RF chains depend directly on gallium supply.',
    },
    {
      name: 'Power electronics',
      aliases: ['power electronics'],
      relationship: 'sector',
      strength: 'weak',
      qualifiesWithoutMention: false,
    },
  ],
  mat_natural_graphite: [
    {
      name: 'Lithium-ion battery anodes',
      aliases: ['graphite anode', 'battery anode', 'anode material', 'anode-grade graphite'],
      relationship: 'direct_use',
      strength: 'direct',
      qualifiesWithoutMention: true,
    },
    {
      name: 'Spherical graphite processing',
      aliases: ['spherical graphite', 'coated spherical graphite'],
      relationship: 'direct_use',
      strength: 'direct',
      qualifiesWithoutMention: true,
    },
    {
      name: 'EV batteries',
      aliases: ['ev battery', 'electric vehicle battery'],
      relationship: 'downstream_technology',
      strength: 'moderate',
      qualifiesWithoutMention: false,
    },
  ],
  mat_copper: [
    {
      name: 'Copper cathode',
      aliases: ['copper cathode', 'lme copper', 'copper concentrate'],
      relationship: 'direct_use',
      strength: 'direct',
      qualifiesWithoutMention: true,
    },
    {
      name: 'Grid and electrification wiring',
      aliases: ['copper wiring', 'copper cable'],
      relationship: 'downstream_technology',
      strength: 'strong',
      qualifiesWithoutMention: true,
    },
    {
      name: 'EV and renewable buildout',
      aliases: ['electrification'],
      relationship: 'sector',
      strength: 'moderate',
      qualifiesWithoutMention: false,
    },
  ],
  mat_uranium: [
    {
      name: 'U3O8 / yellowcake',
      aliases: ['u3o8', 'yellowcake', 'uranium concentrate', 'uranium oxide'],
      relationship: 'direct_use',
      strength: 'direct',
      qualifiesWithoutMention: true,
    },
    {
      name: 'Nuclear fuel and enrichment',
      aliases: ['nuclear fuel', 'uranium enrichment', 'enriched uranium', 'leu fuel'],
      relationship: 'downstream_technology',
      strength: 'strong',
      qualifiesWithoutMention: true,
    },
    {
      name: 'Nuclear reactors',
      aliases: ['nuclear reactor', 'smr', 'small modular reactor'],
      relationship: 'sector',
      strength: 'moderate',
      qualifiesWithoutMention: false,
    },
  ],
}
