/* ── CHAMADAS AO BACKEND (/api/config, /api/vt/*) ── */
async function fetchVtConfig() {
  try {
    const res = await fetch('/api/config');
    return await res.json();
  } catch {
    return { hasDefaultKey: false };
  }
}

function vtErrorMessage(json, fallback) {
  if (!json) return fallback;
  if (json.error && json.error.message) return json.error.message;
  if (typeof json.error === 'string') return json.error;
  return fallback;
}

async function sha256Hex(file) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Consulta se a VirusTotal já tem um relatório para esse hash — evita reenviar o arquivo. */
async function fetchVtReport(hash, apiKey) {
  const query = apiKey ? ('?apiKey=' + encodeURIComponent(apiKey)) : '';
  const res = await fetch('/api/vt/report/' + hash + query);
  if (res.status === 404) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(vtErrorMessage(json, 'Falha ao consultar hash na VirusTotal.'));
  return json;
}

async function uploadForScan(file, apiKey, password) {
  const fd = new FormData();
  fd.append('file', file, file.name);
  if (apiKey) fd.append('apiKey', apiKey);
  if (password) fd.append('password', password);

  const res = await fetch('/api/vt/scan', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(vtErrorMessage(json, 'Falha no envio.'));
  return json.analysisId;
}

async function fetchAnalysis(analysisId, apiKey) {
  const query = apiKey ? ('?apiKey=' + encodeURIComponent(apiKey)) : '';
  const res = await fetch('/api/vt/analysis/' + analysisId + query);
  const json = await res.json();
  if (!res.ok) throw new Error(vtErrorMessage(json, 'Falha ao consultar análise.'));
  return json;
}
