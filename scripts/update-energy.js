const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'src', 'app', 'energy', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Move AI Analyzer
const analyzerStartStr = '{/* ═══ 6. AI ENERGY GEOPOLITICS ANALYZER ═════════ */}';
const policyStartStr = '{/* ═══ 7. ENERGY POLICY TRACKER ═════════════════ */}';

const analyzerStart = content.indexOf(analyzerStartStr);
const policyStart = content.indexOf(policyStartStr);

let analyzerBlock = content.substring(analyzerStart, policyStart);
content = content.replace(analyzerBlock, '');

// Find where to insert (below Global Energy Dashboard Mix)
const dashboardEndStr = '</motion.section>';
const dashboardEndIndex = content.indexOf(dashboardEndStr, content.indexOf('{/* ═══ 1. GLOBAL ENERGY MIX DASHBOARD ═══════════ */}'));
const insertPosition = dashboardEndIndex + dashboardEndStr.length;

content = content.slice(0, insertPosition) + '\n\n                ' + analyzerBlock + content.slice(insertPosition);

// 2. Add Subnav
const headerEndIndex = content.indexOf('</div>', content.indexOf('{/* ─── HEADER ──────────────────────────────── */}'));
const subnavHTML = `
                {/* ─── HUB NAVIGATION ────────────────────────── */}
                <div className="flex overflow-x-auto gap-3 mb-12 pb-2" style={{scrollbarWidth: 'none'}}>
                    <a href="#dashboard" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">Dashboard</a>
                    <a href="#analyzer" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">AI Analyzer</a>
                    <a href="#calculators" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">Calculators</a>
                    <a href="#storage" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">Energy Storage (ESS)</a>
                    <a href="#policy" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">Policy Tracker</a>
                </div>
`;
content = content.slice(0, headerEndIndex + 6) + '\n' + subnavHTML + content.slice(headerEndIndex + 6);

// Add IDs to sections
content = content.replace('className="mb-16"', 'id="dashboard" className="mb-16"');
content = content.replace('className="mb-16"', 'id="commodities" className="mb-16"');
content = content.replace('className="mb-16"', 'id="calculators" className="mb-16"'); // Solar ROI
// Add id to AI Analyzer
content = content.replace('{/* ═══ 6. AI ENERGY GEOPOLITICS ANALYZER ═════════ */}', '{/* ═══ 6. AI ENERGY GEOPOLITICS ANALYZER ═════════ */}\n                <div id="analyzer"></div>');
content = content.replace('{/* ═══ 7. ENERGY POLICY TRACKER ═════════════════ */}', '<div id="policy"></div>\n                {/* ═══ 7. ENERGY POLICY TRACKER ═════════════════ */}');

// Add "Energy Storage" placeholder between Calculators and Policy
const storageSection = `
                {/* ═══ ENERGY STORAGE ═══════════════════════════ */}
                <motion.section
                    id="storage"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Battery className="w-6 h-6 text-purple-400" />
                        Energy Storage Systems (ESS & BESS)
                    </h2>
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex items-center justify-center min-h-[200px]">
                        <div className="text-center">
                            <Zap className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Energy Storage Analytics Coming Soon</h3>
                            <p className="text-gray-400 text-sm max-w-md mx-auto">Track battery energy storage systems, utility-scale storage deployments, and grid stability metrics.</p>
                        </div>
                    </div>
                </motion.section>
`;
content = content.slice(0, content.indexOf('<div id="policy"></div>')) + storageSection + content.slice(content.indexOf('<div id="policy"></div>'));

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Modified page.tsx');
