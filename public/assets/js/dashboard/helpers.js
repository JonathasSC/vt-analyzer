/* ── HELPERS DE UI ── */
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function icon(name, cls) {
  return '<span class="material-symbols-outlined'+(cls?' '+cls:'')+'">'+name+'</span>';
}

function emptyState(msg) {
  return '<div class="empty">'+icon('inbox','empty-icon')+escapeHtml(msg)+'</div>';
}

function toast(msg, type) {
  const el = document.getElementById('toast');
  const icons = { ok:'check_circle', err:'error', warn:'warning' };
  el.innerHTML = icon(icons[type]||'info','t-icon')+'<span>'+escapeHtml(msg)+'</span>';
  el.className = 'show '+(type||'');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>el.className='', 3200);
}
