const fs = require('fs');

try {
  let code = fs.readFileSync('src/app/world-monitor/page.tsx', 'utf8');
  // Normalize line endings
  code = code.replace(/\r\n/g, '\n');

  // 4. Move Right Panel outside of Globe Container
  const rightPanelStart = code.indexOf('{!apertureActive && !isCompactLayout && (\n            <div className="pointer-events-none absolute right-4 top-4 z-10">');
  const rightPanelEndStr = '              </div>\n            </div>\n          )}';
  const rightPanelEnd = code.indexOf(rightPanelEndStr, rightPanelStart);

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
  } else {
    console.log("Could not find right panel");
  }

  // Restore Windows line endings
  code = code.replace(/\n/g, '\r\n');
  fs.writeFileSync('src/app/world-monitor/page.tsx', code);
  console.log("Refactor master 3 successful!");
} catch (e) {
  console.error(e);
}
