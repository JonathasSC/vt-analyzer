/* ── ESTADO DO UPLOAD (integração VirusTotal) ── */
const VT_KEY_STORAGE = 'vt_dash_apikey';
let vtConfig = { hasDefaultKey: false };
let vtSelectedFiles = [];
let vtPassMode = 'shared';
let vtIndividualPasswords = [];
let vtJobs = [];
