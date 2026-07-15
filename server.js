require('dotenv').config();
const path = require('path');
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 650 * 1024 * 1024 } });

const VT_BASE = 'https://www.virustotal.com/api/v3';
const DIRECT_UPLOAD_LIMIT = 32 * 1024 * 1024;

function resolveApiKey(candidate) {
  const key = (candidate || '').trim() || (process.env.VT_API_KEY || '').trim();
  return key || null;
}

function forwardVtError(res, vtResp, vtJson) {
  return res.status(vtResp.status).json(vtJson);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/config', (req, res) => {
  res.json({ hasDefaultKey: Boolean((process.env.VT_API_KEY || '').trim()) });
});

app.post('/api/vt/scan', upload.single('file'), async (req, res) => {
  try {
    const apiKey = resolveApiKey(req.body.apiKey);
    if (!apiKey) return res.status(400).json({ error: 'Chave de API da VirusTotal não informada.' });
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    const password = (req.body.password || '').trim();
    let uploadUrl = `${VT_BASE}/files`;

    if (req.file.size > DIRECT_UPLOAD_LIMIT) {
      const urlResp = await fetch(`${VT_BASE}/files/upload_url`, { headers: { 'x-apikey': apiKey } });
      const urlJson = await urlResp.json();
      if (!urlResp.ok) return forwardVtError(res, urlResp, urlJson);
      uploadUrl = urlJson.data;
    }

    const form = new FormData();
    form.append('file', new Blob([req.file.buffer]), req.file.originalname);
    if (password) form.append('password', password);

    const vtResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'x-apikey': apiKey },
      body: form,
    });
    const vtJson = await vtResp.json();
    if (!vtResp.ok) return forwardVtError(res, vtResp, vtJson);

    res.json({ analysisId: vtJson.data.id, fileName: req.file.originalname, size: req.file.size });
  } catch (err) {
    res.status(502).json({ error: 'Falha ao comunicar com a VirusTotal.', detail: err.message });
  }
});

app.get('/api/vt/analysis/:id', async (req, res) => {
  try {
    const apiKey = resolveApiKey(req.query.apiKey);
    if (!apiKey) return res.status(400).json({ error: 'Chave de API da VirusTotal não informada.' });

    const vtResp = await fetch(`${VT_BASE}/analyses/${encodeURIComponent(req.params.id)}`, {
      headers: { 'x-apikey': apiKey },
    });
    const vtJson = await vtResp.json();
    if (!vtResp.ok) return forwardVtError(res, vtResp, vtJson);

    res.json(vtJson);
  } catch (err) {
    res.status(502).json({ error: 'Falha ao comunicar com a VirusTotal.', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Argus Dashboard rodando em http://localhost:${PORT}`);
});
