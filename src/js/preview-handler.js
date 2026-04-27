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
      const option = normalizeOption(options[key], index);
      option.label = key;
      return option;
    });
  }

  return [];
}

function optionHasImage(options) {
  return normalizeOptions(options).some(option => Boolean(option.image));
}

function makeImageFallback(label) {
  const safeLabel = escapeHtml(label || '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" role="img" aria-label="Missing image">
    <rect width="480" height="360" rx="28" fill="#f3f4f6"/>
    <rect x="40" y="40" width="400" height="280" rx="24" fill="#ffffff" stroke="#d1d5db" stroke-width="4" stroke-dasharray="14 10"/>
    <text x="50%" y="46%" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#6b7280">Image unavailable</text>
    <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">${safeLabel}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

class PreviewHandler {
  constructor() {
    this.currentTestData = null;
    this.initEventListeners();
  }

  initEventListeners() {
    const toggle = document.getElementById('togglePreview');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const editorArea = document.getElementById('editorArea');
      const previewArea = document.getElementById('previewArea');

      if (!editorArea || !previewArea) return;

      if (editorArea.classList.contains('active')) {
        editorArea.classList.remove('active');
        editorArea.classList.add('hidden');
        previewArea.classList.remove('hidden');
        this.renderPreview();
      } else {
        previewArea.classList.add('hidden');
        editorArea.classList.remove('hidden');
        editorArea.classList.add('active');
      }
    });
  }

  setTestData(testData) {
    this.currentTestData = testData;
    const previewArea = document.getElementById('previewArea');
    if (previewArea && !previewArea.classList.contains('hidden')) {
      this.renderPreview();
    }
  }

  renderOptionCards(options, question) {
    const normalized = normalizeOptions(options);
    const useImages = optionHasImage(normalized);

    return normalized.map((option, index) => {
      const key = option.label || optionKey(index);
      const isCorrect = String(question.correctAnswer || '').trim() === String(key).trim();
      const text = option.text ? `<span class="preview-option-text">${escapeHtml(option.text)}</span>` : '';
      const image = option.image ? `
        <span class="preview-option-media">
          <img src="${escapeHtml(option.image)}" alt="${escapeHtml(option.alt || `${key} option`)}" onerror="this.onerror=null;this.src='${makeImageFallback(key)}'">
        </span>` : '';

      return `
        <div class="preview-option ${useImages ? 'preview-option--image' : 'preview-option--text'}${isCorrect ? ' correct-answer' : ''}">
          <span class="preview-option-key">${escapeHtml(key)}</span>
          ${image}
          ${text}
        </div>
      `;
    }).join('');
  }

  renderQuestion(question, index) {
    const questionText = question.questionText || question.question || question.text || `Question ${index + 1}`;
    const type = question.type || (optionHasImage(question.options) ? 'image-choice' : 'multiple-choice');
    const options = normalizeOptions(question.options);
    const questionNumber = question.questionNumber || question.id || index + 1;

    const optionsHtml = (() => {
      if (type === 'short-answer' || type === 'gap-fill') {
        return question.answer || question.correctAnswer
          ? `<div class="preview-answer-note">Answer: ${escapeHtml(question.answer || question.correctAnswer)}</div>`
          : '<div class="preview-answer-note">Answer area reserved for later content.</div>';
      }

      if (!options.length) {
        return '<div class="preview-answer-note">No options provided yet.</div>';
      }

      if (type === 'image-choice' || optionHasImage(options)) {
        return `<div class="preview-option-grid">${this.renderOptionCards(options, question)}</div>`;
      }

      return `
        <ul class="preview-option-list">
          ${options.map((option, optionIndex) => `
            <li class="preview-option-item${String(question.correctAnswer || '').trim() === optionKey(optionIndex) ? ' correct-answer' : ''}">
              <span class="preview-option-key">${escapeHtml(option.label || optionKey(optionIndex))}</span>
              <span class="preview-option-text">${escapeHtml(option.text)}</span>
            </li>
          `).join('')}
        </ul>
      `;
    })();

    return `
      <article class="preview-question preview-question--${escapeHtml(type)}">
        <div class="preview-question-head">
          <span class="preview-question-number">Q${escapeHtml(questionNumber)}</span>
          <span class="preview-question-type">${escapeHtml(type.replace(/-/g, ' '))}</span>
        </div>
        <p class="preview-question-text">${escapeHtml(questionText)}</p>
        ${optionsHtml}
      </article>
    `;
  }

  renderPreview() {
    const previewContainer = document.getElementById('testPreviewContainer');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';
    if (!this.currentTestData) return;

    const testContainer = document.createElement('div');
    testContainer.className = 'test-container';

    const header = document.createElement('header');
    header.innerHTML = `<h2>${escapeHtml(this.currentTestData.level || '')} - Test ${escapeHtml(this.currentTestData.testNumber || '')}</h2>`;
    testContainer.appendChild(header);

    const componentTitle = document.createElement('h3');
    componentTitle.textContent = this.currentTestData.component || '';
    testContainer.appendChild(componentTitle);

    if (Array.isArray(this.currentTestData.questions) && this.currentTestData.questions.length) {
      const questionsSection = document.createElement('div');
      questionsSection.className = 'questions-section';
      questionsSection.innerHTML = this.currentTestData.questions.map((question, index) => this.renderQuestion(question, index)).join('');
      testContainer.appendChild(questionsSection);
    }

    previewContainer.appendChild(testContainer);
  }
}

window.PreviewHandler = PreviewHandler;
