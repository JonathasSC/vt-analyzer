/* ── SELEÇÃO DE ARQUIVOS / DROPZONE / SENHAS ── */
function setVtSelectedFiles(fileList) {
  vtSelectedFiles = Array.from(fileList || []);
  vtIndividualPasswords = vtSelectedFiles.map(() => '');
  renderVtFileList();
}

function onVtFilesSelected(input) {
  setVtSelectedFiles(input.files);
}

function initVtDropzone() {
  const dropzone = document.getElementById('vt-dropzone');
  if (!dropzone) return;
  ['dragenter', 'dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(evt => dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  }));
  dropzone.addEventListener('drop', e => setVtSelectedFiles(e.dataTransfer.files));
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('vt-files').click();
    }
  });
}

function setVtPassMode(mode, btnEl) {
  vtPassMode = mode;
  document.querySelectorAll('.up-pass-opt').forEach(b => b.classList.toggle('active', b === btnEl));
  const shared = document.getElementById('vt-pass-shared-input');
  shared.style.display = mode === 'shared' ? '' : 'none';
  renderVtFileList();
}

function setVtIndividualPassword(index, val) {
  vtIndividualPasswords[index] = val;
}

function removeVtFile(index) {
  vtSelectedFiles.splice(index, 1);
  vtIndividualPasswords.splice(index, 1);
  renderVtFileList();
}

function renderVtFileList() {
  const container = document.getElementById('vt-file-list');
  if (!vtSelectedFiles.length) { container.innerHTML = ''; return; }
  container.innerHTML = vtSelectedFiles.map((file, index) => {
    const sizeTxt = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    const passField = vtPassMode === 'individual'
      ? '<input type="password" class="up-input up-pass-ind" placeholder="Senha (opcional)" value="' + escapeHtml(vtIndividualPasswords[index] || '') + '" oninput="setVtIndividualPassword(' + index + ',this.value)">'
      : '';
    return '<div class="up-file-row">' +
      icon('description', 'up-file-icon') +
      '<div class="up-file-meta"><span class="up-file-name" title="' + escapeHtml(file.name) + '">' + escapeHtml(file.name) + '</span><span class="up-file-size">' + sizeTxt + '</span></div>' +
      passField +
      '<button type="button" class="up-file-remove" onclick="removeVtFile(' + index + ')" title="Remover arquivo">' + icon('close') + '</button>' +
    '</div>';
  }).join('');
}
