/* ── ESTADO ── */
const STORAGE_KEY = 'vt_dash_v3';
let scans = [];
let filterText = '';
let sortMode = 'default';

function cloneData(d) { return JSON.parse(JSON.stringify(d)); }

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(scans)); }

function init() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) { try { scans = JSON.parse(raw); } catch { scans = cloneData(INITIAL_DATA); } }
  else { scans = cloneData(INITIAL_DATA); save(); }
  render();
}
