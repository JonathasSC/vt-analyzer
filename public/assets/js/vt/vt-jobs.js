/* ── ENVIO, POLLING E RESULTADO DOS JOBS DE ANÁLISE ── */
async function submitVtUploads() {
  if (!vtSelectedFiles.length) { toast('Selecione ao menos um arquivo.', 'warn'); return; }
  const apiKeyInput = document.getElementById('vt-apikey').value.trim();
  if (!apiKeyInput && !vtConfig.hasDefaultKey) { toast('Informe a chave de API da VirusTotal.', 'err'); return; }
  const sharedPassword = document.getElementById('vt-pass-shared-input').value;

  const btn = document.getElementById('vt-submit-btn');
  btn.disabled = true;
  btn.classList.add('loading');

  vtJobs = vtSelectedFiles.map((file, index) => ({
    file,
    password: vtPassMode === 'shared' ? sharedPassword : (vtIndividualPasswords[index] || ''),
    status: 'aguardando',
    analysisId: null,
    error: null,
  }));
  renderVtJobs();

  for (const job of vtJobs) {
    await runVtJob(job, apiKeyInput);
  }

  btn.disabled = false;
  btn.classList.remove('loading');
  toast('Processamento concluído.', 'ok');
}

async function runVtJob(job, apiKey) {
  try {
    // Se o hash já foi analisado antes, reaproveita o relatório existente em vez de
    // reenviar o arquivo — evita gastar cota de upload/análise da VirusTotal à toa.
    job.status = 'verificando hash…'; renderVtJobs();
    const hash = await sha256Hex(job.file);
    const cached = await fetchVtReport(hash, apiKey);
    if (cached) {
      const scan = vtResultToScan(cached, job.file.name);
      scans.push(scan); save(); render();
      job.status = 'concluído (já conhecido)'; renderVtJobs();
      return;
    }

    job.status = 'enviando…'; renderVtJobs();
    job.analysisId = await uploadForScan(job.file, apiKey, job.password);
    job.status = 'analisando…'; renderVtJobs();
    await pollVtAnalysis(job, apiKey);
  } catch (err) {
    job.status = 'erro'; job.error = err.message; renderVtJobs();
  }
}

function vtSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pollVtAnalysis(job, apiKey) {
  const maxAttempts = 30;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await vtSleep(attempt === 0 ? 5000 : 15000);
    const json = await fetchAnalysis(job.analysisId, apiKey);

    const status = json.data.attributes.status;
    if (status === 'completed') {
      const scan = vtResultToScan(json, job.file.name);
      scans.push(scan); save(); render();
      job.status = 'concluído'; renderVtJobs();
      return;
    }
    job.status = 'analisando (' + status + ')…'; renderVtJobs();
  }
  throw new Error('Tempo limite ao aguardar o resultado da análise.');
}

/* VT usa categorias mais granulares (harmless/suspicious/type-unsupported/confirmed-timeout);
   aqui elas são normalizadas para os buckets que o dashboard já sabe renderizar. */
function vtResultToScan(vtJson, fileName) {
  const attrs = vtJson.data.attributes;
  const fileInfo = (vtJson.meta && vtJson.meta.file_info) || {};
  const results = attrs.results || attrs.last_analysis_results || {};
  const detections = [];
  let malicious = 0, undetected = 0, unsupported = 0, failure = 0;

  for (const engine in results) {
    const r = results[engine];
    let bucket;
    if (r.category === 'malicious' || r.category === 'suspicious') { bucket = 'malicious'; malicious++; }
    else if (r.category === 'harmless' || r.category === 'undetected') { bucket = 'undetected'; undetected++; }
    else if (r.category === 'type-unsupported') { bucket = 'unsupported'; unsupported++; }
    else { bucket = (r.category === 'timeout' || r.category === 'confirmed-timeout') ? 'timeout' : 'failure'; failure++; }
    detections.push({ engine: r.engine_name || engine, result: bucket, detection: r.result || null });
  }

  return {
    summary: {
      hash: fileInfo.sha256 || attrs.sha256 || '',
      hash_type: 'SHA-256',
      total: detections.length,
      malicious, undetected, unsupported, failure,
      fileName,
    },
    detections,
  };
}

function vtJobIcon(status) {
  if (status.startsWith('concluído')) return 'check_circle';
  if (status === 'erro') return 'error';
  if (status.startsWith('enviando')) return 'upload';
  if (status.startsWith('analisando')) return 'search';
  return 'hourglass_empty';
}

function renderVtJobs() {
  const container = document.getElementById('vt-jobs');
  if (!vtJobs.length) { container.innerHTML = ''; return; }
  container.innerHTML = vtJobs.map(job => {
    const cls = job.status.startsWith('concluído') ? 'up-ok' : job.status === 'erro' ? 'up-err' : 'up-pending';
    return '<div class="up-job ' + cls + '">' +
      icon(vtJobIcon(job.status), 'up-job-icon') +
      '<span class="up-job-name" title="' + escapeHtml(job.file.name) + '">' + escapeHtml(job.file.name) + '</span>' +
      '<span class="up-job-status">' + escapeHtml(job.error || job.status) + '</span>' +
    '</div>';
  }).join('');
}
