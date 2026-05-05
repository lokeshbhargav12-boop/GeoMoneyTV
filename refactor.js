const fs = require('fs');

try {
  let code = fs.readFileSync('src/app/world-monitor/page.tsx', 'utf8');

  // 1. Remove Constants and replace with imports
  code = code.replace(/\/\/ ─── CHOKEPOINTS ───[\s\S]*?\/\/ ─── RISK INDICES ───[\s\S]*?\];/m, `import {\n  CHOKEPOINTS,\n  TRACKED_ASSETS,\n  SIGINT_FEEDS,\n  SANCTIONS_DATA,\n  COUNTRY_BRIEFS,\n  NUCLEAR_STATUS,\n  RISK_INDICES,\n  getRiskColor,\n  riskBarColor,\n} from "./constants";`);

  // Remove the old risk functions
  code = code.replace(/function getRiskColor[\s\S]*?return "bg-emerald-500";\r?\n}/m, "");

  // 2. Wrap Globe in h-[55vh] flex-row layout
  code = code.replace(
    /<div\s+className="relative z-10 w-full h-\[60vh\] min-h-\[500px\] flex overflow-hidden border-b border-white\/\[0\.06\]"/m,
    `<div className="w-full max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 pb-0">\n        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 relative">\n          {/* Globe Container */}\n          <div \n            className="relative z-10 flex-1 w-full h-[55vh] min-h-[450px] max-h-[700px] flex overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/50"`
  );

  // 3. Remove ICON SIDEBAR and LEFT PANEL
  const sidebarStart = code.indexOf('{/* ICON SIDEBAR — Vision Pro glass */}');
  const globeFlexEnd = code.indexOf('<div className="flex-1 relative">');
  
  if (sidebarStart !== -1 && globeFlexEnd !== -1) {
    code = code.slice(0, sidebarStart) + code.slice(globeFlexEnd);
  } else {
    console.log("Could not find sidebar or left panel limits!");
  }

  // 4. Update the Open intel drawer button to be Aperture Map toggle
  code = code.replace(
    /\{!isCompactLayout && !desktopHudOpen && \([\s\S]*?<div className="pointer-events-none absolute left-\[106px\] top-4 z-20 hidden lg:block">[\s\S]*?<\/div>\s*\)\}/m,
    `{!isCompactLayout && !desktopHudOpen && (
            <div className="pointer-events-none absolute left-4 top-4 z-20 hidden lg:block">
              <button
                type="button"
                onClick={() => setApertureActive(!apertureActive)}
                title="GeoMoney Aperture Street Map (2D)"
                className={\`pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold tracking-[0.1em] transition-all shadow-lg backdrop-blur-xl \${
                  apertureActive
                    ? "bg-cyan-400 text-black border-cyan-300 shadow-cyan-500/30"
                    : "bg-black/65 text-cyan-300 border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/20"
                }\`}
              >
                <Map className="h-3.5 w-3.5" />
                APERTURE 2D MAP
              </button>
            </div>
          )}`
  );

  // 5. Move Right Panel outside of Globe Container
  const rightPanelStart = code.indexOf('{!apertureActive && !isCompactLayout && (', code.indexOf('GodsEyeMap'));
  const rightPanelEndStr = '              </div>\n            </div>\n          )}';
  const rightPanelEnd = code.indexOf(rightPanelEndStr, rightPanelStart) + rightPanelEndStr.length;

  if (rightPanelStart !== -1 && rightPanelEnd !== -1) {
    let rightPanelCode = code.slice(rightPanelStart, rightPanelEnd);
    // Transform right panel classes
    rightPanelCode = rightPanelCode.replace(
      /<div className="pointer-events-none absolute right-4 top-4 z-10">/,
      `</div>\n\n        {/* ═══ RIGHT PANEL: TOPSIDE AI NAVIGATOR ════════════ */}\n        <div className="w-full lg:w-[400px] shrink-0 h-[55vh] min-h-[450px] max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 z-20">`
    );
    rightPanelCode = rightPanelCode.replace(
      /<div className="pointer-events-auto flex w-\[min\(24rem,calc\(100vw-8rem\)\)\] flex-col gap-3">/,
      `<div className="flex flex-col gap-3 pb-4 pr-2">`
    );

    code = code.slice(0, rightPanelStart) + rightPanelCode + code.slice(rightPanelEnd);
  } else {
    console.log("Could not find right panel limits!");
  }

  // 6. Close the outer layout wrapper at the dashboard grid
  const endWrapper = code.indexOf('{/* ═══ DASHBOARD GRID LAYER ════════════════════════════════════ */}');
  if (endWrapper !== -1) {
    code = code.slice(0, endWrapper) + '</div>\n      </div>\n\n      ' + code.slice(endWrapper);
  }

  // 7. Add Widgets Imports
  code = code.replace(
    /import \{ getRiskColor, riskBarColor \} from "\.\/constants";/,
    `import { getRiskColor, riskBarColor } from "./constants";\nimport { ChokepointsWidget, AssetTrackingWidget, RiskIndicesWidget, SigintWidget, CountryBriefsWidget, SanctionsWidget, NuclearMonitorWidget } from "@/components/WorldMonitorWidgets";`
  );

  fs.writeFileSync('src/app/world-monitor/page.tsx', code);
  console.log("Refactor successful!");
} catch (e) {
  console.error(e);
}
