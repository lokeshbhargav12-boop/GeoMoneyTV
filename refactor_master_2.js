const fs = require('fs');

try {
  let code = fs.readFileSync('src/app/world-monitor/page.tsx', 'utf8');

  // 1. Wrap Globe in h-[55vh] flex-row layout
  code = code.replace(
    /<div className="relative z-10 flex-1 flex overflow-hidden">/m,
    `{/* ═══ HERO FRAME (GLOBE + HUD) ════════════════════════════════════ */}
      <div className="w-full max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 pb-0">
        <div className="flex flex-col xl:flex-row gap-4 md:gap-6 relative">
          <div 
            className="relative z-10 flex-1 w-full h-[55vh] min-h-[450px] max-h-[700px] flex overflow-hidden rounded-[32px] border border-white/[0.08] shadow-2xl shadow-black/50"
            onMouseEnter={() => { document.body.style.overflow = 'hidden'; }}
            onMouseLeave={() => { document.body.style.overflow = 'auto'; }}
          >`
  );

  // 2. Remove ICON SIDEBAR and LEFT PANEL
  const sidebarStart = code.indexOf('{/* ICON SIDEBAR — Vision Pro glass */}');
  const globeFlexEnd = code.indexOf('<div className="flex-1 relative">');
  console.log('Sidebar bounds:', sidebarStart, globeFlexEnd);
  
  if (sidebarStart !== -1 && globeFlexEnd !== -1) {
    code = code.slice(0, sidebarStart) + code.slice(globeFlexEnd);
  }

  // 3. Add Aperture Map toggle replacing Open intel drawer
  code = code.replace(
    /\{!isCompactLayout && !desktopHudOpen && \([\s\S]*?<div className="pointer-events-none absolute left-\[106px\] top-4 z-20 hidden xl:block">[\s\S]*?<\/div>\s*\)\}/m,
    `{!isCompactLayout && (
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

  // 4. Move Right Panel outside of Globe Container
  const rightPanelStart = code.indexOf('{!apertureActive && !isCompactLayout && (\n            <div className="pointer-events-none absolute right-4 top-4 z-10">');
  const rightPanelEndStr = '              </div>\n            </div>\n          )}';
  const rightPanelEnd = code.indexOf(rightPanelEndStr, rightPanelStart);
  console.log('Right panel bounds:', rightPanelStart, rightPanelEnd);

  if (rightPanelStart !== -1 && rightPanelEnd !== -1) {
    let rightPanelCode = code.slice(rightPanelStart, rightPanelEnd + rightPanelEndStr.length);
    
    // Extracted out of Globe container
    rightPanelCode = rightPanelCode.replace(
      /<div className="pointer-events-none absolute right-4 top-4 z-10">/,
      `</div>\n\n          {/* ═══ RIGHT PANEL: TOPSIDE AI NAVIGATOR ════════════ */}\n          <div className="w-full xl:w-[400px] shrink-0 h-[55vh] min-h-[450px] max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 z-20">`
    );
    rightPanelCode = rightPanelCode.replace(
      /<div className="pointer-events-auto flex w-\[min\(24rem,calc\(100vw-8rem\)\)\] flex-col gap-3">/,
      `<div className="flex flex-col gap-3 pb-4 pr-2">`
    );

    code = code.slice(0, rightPanelStart) + rightPanelCode + code.slice(rightPanelEnd + rightPanelEndStr.length);
  }

  // 5. Close the outer layout wrapper and inject DASHBOARD GRID LAYER
  const endWrapper = code.indexOf('{/* ═══ MOBILE HUD ═════════════════════════════════════════════ */}');
  
  if (endWrapper !== -1) {
    const gridLayer = `
        </div>
      </div>

      {/* ═══ DASHBOARD GRID LAYER ════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
           <ChokepointsWidget data={CHOKEPOINTS} onChokepointClick={handleChokepointClick} />
           <AssetTrackingWidget data={TRACKED_ASSETS} />
           <RiskIndicesWidget data={RISK_INDICES} />
           <SigintWidget data={SIGINT_FEEDS} />
           <CountryBriefsWidget data={COUNTRY_BRIEFS} />
           <SanctionsWidget data={SANCTIONS_DATA} />
           <NuclearMonitorWidget data={NUCLEAR_STATUS} />
        </div>
      </div>

      `;
    code = code.slice(0, endWrapper) + gridLayer + code.slice(endWrapper);
  }

  // 6. Add Widgets Imports
  code = code.replace(
    'import OsintFeed from "@/components/OsintFeed";',
    `import OsintFeed from "@/components/OsintFeed";\nimport { ChokepointsWidget, AssetTrackingWidget, RiskIndicesWidget, SigintWidget, CountryBriefsWidget, SanctionsWidget, NuclearMonitorWidget } from "@/components/WorldMonitorWidgets";`
  );

  fs.writeFileSync('src/app/world-monitor/page.tsx', code);
  console.log("Refactor master 2 successful!");
} catch (e) {
  console.error(e);
}
