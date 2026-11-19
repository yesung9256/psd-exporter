penpot.ui.open("PSD Exporter Prototype", "index.html", { width: 360, height: 320 });
function readShape(s) {
  const keys = ["id","name","type","x","y","width","height","rotation","opacity","borderRadius","borderRadiusTopLeft","borderRadiusTopRight","borderRadiusBottomRight","borderRadiusBottomLeft","characters","fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","align"];
  const out = {};
  for (const k of keys) { try { if (s[k] !== undefined) out[k] = s[k]; } catch(e) {} }
  for (const k of ["fills","strokes","shadows"]) { try { out[k] = JSON.parse(JSON.stringify(s[k] || [])); } catch(e) { out[k] = []; } }
  try { out.children = Array.from(s.children || []).map(readShape); } catch(e) { out.children = []; }
  return out;
}
penpot.ui.onMessage(msg => {
  if (msg?.type !== "export") return;
  try {
    const selected = penpot.selection;
    if (selected.length !== 1 || selected[0].type !== "board") throw new Error("Board 하나를 선택해 주세요.");
    penpot.ui.sendMessage({ type:"result", data: { version:1, board:readShape(selected[0]) } });
  } catch(e) { penpot.ui.sendMessage({type:"error",message:String(e.message || e)}); }
});