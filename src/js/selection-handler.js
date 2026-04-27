// Level / component metadata
const levelData = {
  starters: { name: 'Starters', tests: [1, 2, 3], components: ['Listening', 'Reading & Writing'] },
  movers: { name: 'Movers', tests: [1, 2, 3], components: ['Listening', 'Reading & Writing'] },
  flyers: { name: 'Flyers', tests: [1, 2, 3], components: ['Listening', 'Reading & Writing'] },
  'a2-key': { name: 'A2 Key (KET)', tests: [1, 2, 3], components: ['Listening', 'Reading & Writing'] },
  'b1-preliminary': { name: 'B1 Preliminary (PET)', tests: [1, 2, 3], components: ['Reading', 'Writing'] },
  'b2-first': { name: 'B2 First (FCE)', tests: [1, 2, 3], components: ['Reading & Use of English', 'Writing'] },
  'c1-advanced': { name: 'C1 Advanced (CAE)', tests: [1, 2, 3], components: ['Reading & Use of English', 'Writing'] },
  'c2-proficiency': { name: 'C2 Proficiency (CPE)', tests: [1, 2, 3], components: ['Reading & Use of English', 'Writing'] }
};

function populateTestNumbers(level) {
  const testNumberGroup = document.getElementById('testNumberGroup');
  testNumberGroup.innerHTML = `
    <label for="testNumber">Test Number:</label>
    <select id="testNumber" name="testNumber">
      <option value="">-- Select Test --</option>
      ${levelData[level].tests.map(test => `<option value="${test}">${test}</option>`).join('')}
    </select>
  `;
}

function populateComponents(level) {
  const componentGroup = document.getElementById('componentGroup');
  componentGroup.innerHTML = `
    <label for="component">Component:</label>
    <select id="component" name="component">
      <option value="">-- Select Component --</option>
      ${levelData[level].components.map(component => `<option value="${component}">${component}</option>`).join('')}
    </select>
  `;
}

async function loadHTML(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return '';
    return await resp.text();
  } catch (e) {
    console.warn('Failed to load', path, e);
    return '';
  }
}

function optionKey(index) {
  return String.fromCharCode(65 + index);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function defaultQuestionTypeForPart(part) {
  switch (String(part || 'part1')) {
    case 'part1':
      return 'image-choice';
    case 'part3':
      return 'gap-fill';
    default:
      return 'multiple-choice';
  }
}

function normalizeOption(option, index) {
  const label = optionKey(index);
  if (option == null) {
    return { label, text: '', image: '', alt: '' };
  }

  if (typeof option === 'string') {
    return { label, text: option, image: '', alt: '' };
  }

  if (typeof option === 'object') {
    return {
      label: option.label || label,
      text: option.text ?? option.value ?? option.caption ?? '',
      image: option.image ?? option.src ?? option.url ?? '',
      alt: option.alt ?? option.imageAlt ?? option.label ?? ''
    };
  }

  return { label, text: String(option), image: '', alt: '' };
}

function normalizeOptions(options) {
  if (!options) return [];

  if (Array.isArray(options)) {
    return options.map((option, index) => normalizeOption(option, index));
  }

  if (typeof options === 'object') {
    return Object.keys(options).sort().map((key, index) => {
      const normalized = normalizeOption(options[key], index);
      normalized.label = key;
      return normalized;
    });
  }

  return [];
}

function cloneQuestion(question) {
  const options = normalizeOptions(question.options);
  return {
    ...question,
    questionText: question.questionText || question.question || question.text || '',
    type: question.type || defaultQuestionTypeForPart(question.part),
    options: options.length ? options.map(option => ({ ...option })) : []
  };
}

function summarizeOptions(options) {
  const normalized = normalizeOptions(options);
  if (!normalized.length) return '';

  return normalized
    .map(option => {
      const key = option.label || '';
      if (option.image) {
        return `${key}: [image] ${option.image}`;
      }
      return `${key}: ${option.text || ''}`;
    })
    .join(' | ');
}

document.addEventListener('DOMContentLoaded', async () => {
  const selectionContainer = document.getElementById('selectionDashboard');
  const editorContainer = document.getElementById('testEditorContainer');

  const selectionHtml = await loadHTML('components/selection-dashboard.html');
  selectionContainer.innerHTML = selectionHtml;

  const editorTemplate = await loadHTML('components/test-editor.html');

  const levelSelect = document.getElementById('level');
  const form = document.getElementById('testSelector');
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  levelSelect.addEventListener('change', function() {
    const selectedLevel = this.value;
    if (selectedLevel) {
      populateTestNumbers(selectedLevel);
      populateComponents(selectedLevel);
      submitBtn.disabled = false;
    } else {
      document.getElementById('testNumberGroup').innerHTML = '';
      document.getElementById('componentGroup').innerHTML = '';
      submitBtn.disabled = true;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedLevelKey = document.getElementById('level').value;
    const selectedLevelName = levelData[selectedLevelKey] ? levelData[selectedLevelKey].name : selectedLevelKey;
    const testNumberEl = document.getElementById('testNumber');
    const componentEl = document.getElementById('component');
    const selectedTestNumber = testNumberEl ? testNumberEl.value : '';
    const selectedComponent = componentEl ? componentEl.value : '';

    editorContainer.innerHTML = editorTemplate;
    editorContainer.classList.remove('hidden');
    selectionContainer.classList.add('hidden');

    const header = editorContainer.querySelector('h1');
    if (header) header.textContent = `Editing: ${selectedLevelName} - Test ${selectedTestNumber}, ${selectedComponent}`;

    let testDataJson = null;
    try {
      const resp = await fetch('data/test-data.json');
      if (resp.ok) testDataJson = await resp.json();
    } catch (err) {
      console.warn('Could not load test-data.json', err);
    }

    let matchedTest = null;
    if (testDataJson && Array.isArray(testDataJson.tests)) {
      matchedTest = testDataJson.tests.find(t => String(t.testNumber) === String(selectedTestNumber));
    }

    const questionsTbody = editorContainer.querySelector('#questionsTable tbody');
    const modal = editorContainer.querySelector('#questionModal');
    const modalForm = editorContainer.querySelector('#questionForm');
    const modalId = editorContainer.querySelector('#modalQuestionId');
    const modalText = editorContainer.querySelector('#modalQuestionText');
    const modalType = editorContainer.querySelector('#modalQuestionType');
    const modalOptionsWrapper = editorContainer.querySelector('#modalOptionsWrapper');
    const modalOptionsContainer = editorContainer.querySelector('#modalOptionsContainer');
    const modalAddOptionBtn = editorContainer.querySelector('#modalAddOptionBtn');
    const modalCorrect = editorContainer.querySelector('#modalCorrectAnswer');
    const modalPart = editorContainer.querySelector('#modalPartSelect');
    const modalQNum = editorContainer.querySelector('#modalQuestionNumber');
    const modalSaveBtn = editorContainer.querySelector('#modalSaveBtn');
    const modalCancelBtn = editorContainer.querySelector('#modalCancelBtn');
    const modalDeleteBtn = editorContainer.querySelector('#modalDeleteBtn');
    const addBtn = editorContainer.querySelector('#addQuestion');
    const saveBtn = editorContainer.querySelector('#saveTest');
    const versionInput = editorContainer.querySelector('#versionNote');

    let currentQuestions = matchedTest && Array.isArray(matchedTest.questions)
      ? matchedTest.questions.map(cloneQuestion)
      : [];

    function questionTypeLabel(type) {
      switch (String(type || '')) {
        case 'image-choice':
          return 'image-choice';
        case 'gap-fill':
          return 'gap-fill';
        case 'short-answer':
          return 'short-answer';
        default:
          return 'multiple-choice';
      }
    }

    function modalTypeFromPart(part) {
      return defaultQuestionTypeForPart(part || 'part1');
    }

    function buildOptionRow(option, index, readOnly) {
      const key = optionKey(index);
      const normalized = normalizeOption(option, index);
      return `
        <div class="modal-option-row" data-label="${key}">
          <div class="modal-option-label">${key}</div>
          <input class="modal-option-input modal-option-text" data-field="text" data-idx="${index}" value="${escapeHtml(normalized.text)}" placeholder="Option text">
          <input class="modal-option-image-input modal-option-image" data-field="image" data-idx="${index}" value="${escapeHtml(normalized.image)}" placeholder="Local image path">
          <button type="button" class="remove-option"${readOnly ? ' style="display:none"' : ''}>Remove</button>
        </div>
      `;
    }

    function collectModalOptions() {
      if (!modalOptionsContainer) return [];
      return Array.from(modalOptionsContainer.querySelectorAll('.modal-option-row')).map((row, index) => {
        const textInput = row.querySelector('.modal-option-text');
        const imageInput = row.querySelector('.modal-option-image');
        return {
          label: optionKey(index),
          text: textInput ? textInput.value.trim() : '',
          image: imageInput ? imageInput.value.trim() : '',
          alt: optionKey(index)
        };
      }).filter(option => option.text.length || option.image.length);
    }

    function renderOptions(options, type) {
      if (!modalOptionsContainer) return;

      const normalized = normalizeOptions(options);
      const needsOptions = type === 'multiple-choice' || type === 'image-choice';
      const count = type === 'image-choice' ? 3 : normalized.length;
      const rows = normalized.slice(0, count);

      while (type === 'image-choice' && rows.length < 3) {
        rows.push({ label: optionKey(rows.length), text: '', image: '', alt: '' });
      }

      modalOptionsContainer.innerHTML = rows.map((option, index) => buildOptionRow(option, index, type === 'image-choice')).join('');
      if (modalAddOptionBtn) {
        modalAddOptionBtn.style.display = needsOptions && type !== 'image-choice' ? '' : 'none';
      }
      if (modalOptionsWrapper) {
        modalOptionsWrapper.style.display = needsOptions ? '' : 'none';
      }
      if (modalCorrect) {
        modalCorrect.placeholder = type === 'gap-fill' || type === 'short-answer'
          ? 'Exact answer text'
          : 'A, B, C, or exact text';
      }
    }

    function refreshModalType() {
      const type = questionTypeLabel(modalType ? modalType.value : 'multiple-choice');
      renderOptions(collectModalOptions(), type);
    }

    function updateModalForPart() {
      if (!modalType || !modalPart) return;
      const part = modalPart.value || 'part1';
      const defaultType = modalTypeFromPart(part);
      if (part === 'part1') {
        modalType.value = 'image-choice';
      } else if (part === 'part3') {
        modalType.value = 'gap-fill';
      } else if (modalType.value === 'image-choice' || modalType.value === 'gap-fill') {
        modalType.value = defaultType;
      }
      renderOptions(collectModalOptions(), modalType.value);
    }

    function showModal(mode, q) {
      if (!modal) return;
      modal._previousActive = document.activeElement;
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      modal.dataset.mode = mode;

      const defaultType = modalTypeFromPart(modalPart ? modalPart.value : 'part1');

      if (mode === 'edit' && q) {
        modalId.value = q.id;
        modalText.value = q.questionText || '';
        modalType.value = q.type || defaultType;
        if (modalPart && q.part) modalPart.value = q.part;
        if (modalQNum) modalQNum.value = q.questionNumber || q.id || '';
        renderOptions(q.options || [], modalType.value);
        modalCorrect.value = q.correctAnswer || q.answer || '';
      } else {
        modalId.value = '';
        modalText.value = '';
        if (modalPart) modalPart.value = 'part1';
        modalType.value = 'image-choice';
        if (modalQNum) modalQNum.value = '';
        renderOptions([{},{},{}], 'image-choice');
        modalCorrect.value = '';
      }

      setTimeout(() => {
        if (modalText) modalText.focus();
        document.addEventListener('keydown', modalKeyHandler);
      }, 50);

      tryRestoreDraft();
      syncModalError('');
    }

    function hideModal() {
      if (!modal) return;
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      modal.dataset.mode = '';
      document.removeEventListener('keydown', modalKeyHandler);
      try {
        if (modal._previousActive && typeof modal._previousActive.focus === 'function') {
          modal._previousActive.focus();
        }
      } catch (e) {}
      syncModalError('');
    }

    function modalKeyHandler(e) {
      if (!modal || modal.classList.contains('hidden')) return;
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        hideModal();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        const nodes = Array.prototype.slice.call(focusable).filter(n => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    const modalDraftKey = () => `modalDraft:${selectedLevelKey || 'lvl'}:${selectedTestNumber || '0'}:${selectedComponent || 'comp'}`;

    function saveDraft() {
      if (!modal) return;
      const draft = {
        id: modalId.value || '',
        text: modalText ? modalText.value || '' : '',
        type: modalType ? modalType.value : 'multiple-choice',
        options: collectModalOptions(),
        correct: modalCorrect ? modalCorrect.value || '' : '',
        part: modalPart ? modalPart.value : undefined,
        questionNumber: modalQNum ? modalQNum.value : undefined,
        updatedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(modalDraftKey(), JSON.stringify(draft));
      } catch (e) {
        /* ignore */
      }
    }

    let _autosaveTimer = null;
    function scheduleSaveDraft() {
      if (_autosaveTimer) clearTimeout(_autosaveTimer);
      _autosaveTimer = setTimeout(saveDraft, 600);
    }

    function tryRestoreDraft() {
      try {
        const raw = localStorage.getItem(modalDraftKey());
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (!draft) return;
        if (modal.dataset.mode !== 'add' && !(modal.dataset.mode === 'edit' && draft.id && draft.id === modalId.value)) return;

        if (draft.text) modalText.value = draft.text;
        if (draft.type) modalType.value = draft.type;
        if (modalPart && draft.part) modalPart.value = draft.part;
        if (modalQNum && draft.questionNumber) modalQNum.value = draft.questionNumber;
        if (modalCorrect && draft.correct) modalCorrect.value = draft.correct;
        renderOptions(Array.isArray(draft.options) ? draft.options : [], modalType.value);
      } catch (e) {
        /* ignore */
      }
    }

    function syncModalError(message) {
      const errorEl = editorContainer.querySelector('#modalError');
      if (!errorEl) return;
      errorEl.textContent = message || '';
      errorEl.style.display = message ? 'block' : 'none';
    }

    function renderQuestionsTable() {
      if (!questionsTbody) return;
      questionsTbody.innerHTML = '';

      currentQuestions.forEach(q => {
        const normalized = cloneQuestion(q);
        const tr = document.createElement('tr');
        tr.dataset.qid = normalized.id;
        const partLabel = normalized.part || 'part1';
        const qnumLabel = normalized.questionNumber || normalized.id || '';
        tr.innerHTML = `
          <td>${escapeHtml(partLabel)}#${escapeHtml(qnumLabel)}</td>
          <td class="qt">${escapeHtml(normalized.questionText)}</td>
          <td class="qo">${escapeHtml(summarizeOptions(normalized.options))}</td>
          <td class="qa">${escapeHtml(normalized.correctAnswer || normalized.answer || '')}</td>
          <td><button class="edit" type="button">Edit</button> <button class="delete" type="button">Delete</button></td>
        `;
        questionsTbody.appendChild(tr);
      });
    }

    function updatePreview() {
      if (!window.previewHandler) return;
      window.previewHandler.setTestData({
        level: selectedLevelName,
        testNumber: selectedTestNumber,
        component: selectedComponent,
        questions: currentQuestions.map(cloneQuestion)
      });
    }

    renderQuestionsTable();

    if (modalPart) {
      modalPart.addEventListener('change', updateModalForPart);
    }
    if (modalType) {
      modalType.addEventListener('change', refreshModalType);
    }
    if (modalText) modalText.addEventListener('input', scheduleSaveDraft);
    if (modalCorrect) modalCorrect.addEventListener('input', scheduleSaveDraft);
    if (modalQNum) modalQNum.addEventListener('input', scheduleSaveDraft);
    if (modalOptionsContainer) modalOptionsContainer.addEventListener('input', scheduleSaveDraft);

    if (modalAddOptionBtn) {
      modalAddOptionBtn.addEventListener('click', () => {
        const current = collectModalOptions();
        current.push({ label: optionKey(current.length), text: '', image: '', alt: '' });
        renderOptions(current, modalType ? modalType.value : 'multiple-choice');
        scheduleSaveDraft();
      });
    }

    if (modalOptionsContainer) {
      modalOptionsContainer.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button.remove-option');
        if (!btn) return;
        const row = btn.closest('.modal-option-row');
        if (row) row.remove();
        scheduleSaveDraft();
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => showModal('add'));
    }

    if (modalSaveBtn) {
      modalSaveBtn.addEventListener('click', () => {
        const mode = modal.dataset.mode || 'add';
        const idVal = modalId.value;
        const textVal = modalText.value && modalText.value.trim();
        const typeVal = modalType ? modalType.value : 'multiple-choice';
        const options = collectModalOptions();
        const correctVal = modalCorrect.value && modalCorrect.value.trim();
        const partVal = modalPart ? modalPart.value : 'part1';
        const qnumRaw = modalQNum && modalQNum.value ? modalQNum.value : null;
        const qnumVal = qnumRaw ? Number(qnumRaw) : null;

        clearErrors();

        if (!textVal) {
          syncModalError('Question text is required.');
          modalText.focus();
          return;
        }

        if (!qnumRaw) {
          syncModalError('Question number is required.');
          if (modalQNum) modalQNum.focus();
          return;
        }

        const requiresChoices = typeVal === 'multiple-choice' || typeVal === 'image-choice';
        if (requiresChoices && partVal === 'part1' && options.length !== 3) {
          syncModalError('Part 1 must have exactly 3 options.');
          return;
        }

        if (requiresChoices && options.length < (partVal === 'part1' ? 3 : 2)) {
          syncModalError('Add enough options for this question.');
          return;
        }

        if (partVal === 'part1' && typeVal === 'image-choice' && options.some(option => !option.image)) {
          syncModalError('Part 1 image choices need a local image path for every option.');
          return;
        }

        const conflict = currentQuestions.find(q => q.part === partVal && q.questionNumber != null && Number(q.questionNumber) === qnumVal && (mode === 'add' || String(q.id) !== String(idVal)));
        if (conflict) {
          syncModalError(`Question number ${qnumVal} is already used in ${partVal}. Choose a different number.`);
          if (modalQNum) modalQNum.focus();
          return;
        }

        const newQuestion = {
          id: mode === 'add'
            ? (currentQuestions.length ? Math.max(...currentQuestions.map(x => Number(x.id))) + 1 : 1)
            : Number(idVal),
          questionText: textVal,
          type: typeVal,
          part: partVal,
          questionNumber: qnumVal,
          correctAnswer: correctVal || ''
        };

        if (requiresChoices) {
          newQuestion.options = options.slice(0, partVal === 'part1' ? 3 : options.length);
        }

        if (mode === 'add') {
          currentQuestions.push(newQuestion);
        } else if (mode === 'edit' && idVal) {
          const idx = currentQuestions.findIndex(x => String(x.id) === String(idVal));
          if (idx !== -1) {
            currentQuestions[idx] = {
              ...currentQuestions[idx],
              ...newQuestion
            };
          }
        }

        try {
          localStorage.removeItem(modalDraftKey());
        } catch (e) {
          /* ignore */
        }

        renderQuestionsTable();
        hideModal();
        updatePreview();
      });
    }

    function clearErrors() {
      syncModalError('');
    }

    if (modalCancelBtn) {
      modalCancelBtn.addEventListener('click', () => {
        hideModal();
        scheduleSaveDraft();
      });
    }

    if (modalDeleteBtn) {
      modalDeleteBtn.addEventListener('click', () => {
        const idVal = modalId.value;
        if (!idVal) {
          hideModal();
          return;
        }
        if (!confirm('Delete this question?')) return;
        const idx = currentQuestions.findIndex(x => String(x.id) === String(idVal));
        if (idx !== -1) currentQuestions.splice(idx, 1);
        renderQuestionsTable();
        try {
          localStorage.removeItem(modalDraftKey());
        } catch (e) {
          /* ignore */
        }
        hideModal();
        updatePreview();
      });
    }

    if (questionsTbody) {
      questionsTbody.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const tr = btn.closest('tr');
        const qid = tr ? tr.dataset.qid : null;
        if (!qid) return;
        const idx = currentQuestions.findIndex(x => String(x.id) === String(qid));
        if (idx === -1) return;

        if (btn.classList.contains('delete')) {
          if (!confirm('Delete this question?')) return;
          currentQuestions.splice(idx, 1);
          renderQuestionsTable();
          updatePreview();
          return;
        }

        if (btn.classList.contains('edit')) {
          showModal('edit', currentQuestions[idx]);
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const payload = {
          metadata: {
            level: selectedLevelName,
            levelKey: selectedLevelKey,
            testNumber: selectedTestNumber,
            component: selectedComponent,
            versionNote: versionInput ? versionInput.value : '',
            updatedAt: new Date().toISOString()
          },
          questions: currentQuestions.map(cloneQuestion)
        };

        try {
          localStorage.setItem('runTestDraft', JSON.stringify(payload));
        } catch (e) {
          console.warn('Could not save runTestDraft to localStorage', e);
        }

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const namePart = `${selectedLevelKey || 'level'}-test${selectedTestNumber || '0'}-${selectedComponent ? selectedComponent.replace(/\s+/g, '-') : 'component'}`;
        a.download = `${namePart}.json`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        try {
          window.open('../exercise1.html', '_blank');
        } catch (e) {
          console.warn('Could not open runner window', e);
        }
      });
    }

    if (window.PreviewHandler) {
      window.previewHandler = new window.PreviewHandler();
      updatePreview();
    }
  });
});
