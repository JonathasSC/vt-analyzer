/* ── FILTRO / ORDENAÇÃO / CÁLCULOS AGREGADOS ── */
function getDisplayScans() {
  let result = [...scans];
  if (filterText) result = result.filter(s => s.summary.hash.toLowerCase().includes(filterText));
  if (sortMode === 'rate-desc') result.sort((a,b) => b.summary.malicious/b.summary.total - a.summary.malicious/a.summary.total);
  else if (sortMode === 'rate-asc') result.sort((a,b) => a.summary.malicious/a.summary.total - b.summary.malicious/b.summary.total);
  return result;
}

/* Agrega, por engine, quantas vezes cada categoria de resultado apareceu entre todos os scans. */
function engineStats() {
  const engineMap = {};
  for (const scan of scans) {
    for (const d of scan.detections) {
      if (!engineMap[d.engine]) engineMap[d.engine] = { mal:0, und:0, uns:0, fail:0, tmo:0 };
      if (d.result==='malicious')   engineMap[d.engine].mal++;
      else if (d.result==='undetected') engineMap[d.engine].und++;
      else if (d.result==='unsupported') engineMap[d.engine].uns++;
      else if (d.result==='failure') engineMap[d.engine].fail++;
      else if (d.result==='timeout') engineMap[d.engine].tmo++;
    }
  }
  return Object.entries(engineMap).map(([name,s]) => {
    const part = s.mal + s.und + s.fail + s.tmo;
    return { name, ...s, part, rate: part>0 ? s.mal/part*100 : 0 };
  });
}

function detNames() {
  const counts = {};
  for (const sc of scans)
    for (const d of sc.detections)
      if (d.detection) counts[d.detection] = (counts[d.detection]||0) + 1;
  return Object.entries(counts).sort((a,b) => b[1]-a[1]);
}
