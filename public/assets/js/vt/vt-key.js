/* ── CHAVE DE API ── */
async function initVtUpload() {
  const savedKey = localStorage.getItem(VT_KEY_STORAGE);
  if (savedKey) document.getElementById('vt-apikey').value = savedKey;
  vtConfig = await fetchVtConfig();
  updateVtKeyHint();
}

function updateVtKeyHint() {
  const hint = document.getElementById('vt-apikey-hint');
  const hasInput = document.getElementById('vt-apikey').value.trim().length > 0;
  hint.textContent = hasInput
    ? 'Chave salva neste navegador (localStorage).'
    : (vtConfig.hasDefaultKey
        ? 'Usando a chave padrão configurada no servidor (.env).'
        : 'Informe sua chave de API da VirusTotal. Free tier: até 4 requisições/min.');
}

function onVtApiKeyInput(val) {
  const trimmed = val.trim();
  if (trimmed) localStorage.setItem(VT_KEY_STORAGE, trimmed);
  else localStorage.removeItem(VT_KEY_STORAGE);
  updateVtKeyHint();
}

function toggleVtKeyVisibility(btn) {
  const input = document.getElementById('vt-apikey');
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.querySelector('.material-symbols-outlined').textContent = showing ? 'visibility' : 'visibility_off';
  btn.setAttribute('aria-label', showing ? 'Mostrar chave' : 'Ocultar chave');
}
