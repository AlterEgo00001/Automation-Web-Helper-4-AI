let currentLang = 'ru';
let instructions = [];

const translations = {
  ru: {
    compressHtml: 'Сжать HTML',
    startSelection: 'Начать выбор',
    copy: 'Копировать',
    langRu: 'Русский',
    langEn: 'English',
    placeholder: 'Сжатый HTML или инструкции появятся здесь',
    error: 'Ошибка',
    noActiveTab: 'Нет активной вкладки',
    compressionError: 'Ошибка сжатия',
    selectionStarted: 'Режим выбора запущен',
    copied: 'Скопировано в буфер обмена',
    instructionsShown: 'Инструкции отображены',
    noInstructions: 'Инструкций нет'
  },
  en: {
    compressHtml: 'Compress HTML',
    startSelection: 'Start Selection',
    copy: 'Copy',
    langRu: 'Russian',
    langEn: 'English',
    placeholder: 'Compressed HTML or instructions will appear here',
    error: 'Error',
    noActiveTab: 'No active tab',
    compressionError: 'Compression error',
    selectionStarted: 'Selection mode started',
    copied: 'Copied to clipboard',
    instructionsShown: 'Instructions displayed',
    noInstructions: 'No instructions'
  }
};

function updateLanguage() {
  const t = translations[currentLang];
  document.getElementById('langRu').textContent = t.langRu;
  document.getElementById('langEn').textContent = t.langEn;
  document.getElementById('compressHtml').textContent = t.compressHtml;
  document.getElementById('startSelection').textContent = t.startSelection;
  document.getElementById('copyButton').textContent = t.copy;
  const resultArea = document.getElementById('resultArea');
  resultArea.placeholder = t.placeholder;
}

function toggleCopyButton(show) {
  document.getElementById('copyButton').style.display = show ? 'inline-block' : 'none';
}

function syncState() {
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (response?.state) {
      currentLang = response.state.currentLang || 'ru';
      updateLanguage();
    }
  });
  chrome.runtime.sendMessage({ action: 'getInstructions' }, (response) => {
    if (response?.instructions) {
      instructions = response.instructions;
      showInstructions();
    }
  });
}

function showInstructions() {
  const resultArea = document.getElementById('resultArea');
  const debugOutput = document.getElementById('debugOutput');
  const instructionText = instructions.length
    ? instructions.map((i, idx) => `${idx + 1}. ${i.instruction} [${i.element}]`).join('\n')
    : translations[currentLang].noInstructions;
  resultArea.value = instructionText;
  toggleCopyButton(!!instructions.length);
  debugOutput.textContent = instructions.length ? translations[currentLang].instructionsShown : translations[currentLang].noInstructions;
}

document.addEventListener('DOMContentLoaded', () => {
  const resultArea = document.getElementById('resultArea');
  const tabButtons = document.getElementById('tabButtons');
  const debugOutput = document.getElementById('debugOutput');

  syncState();

  document.getElementById('langRu').addEventListener('click', () => {
    currentLang = 'ru';
    updateLanguage();
    chrome.runtime.sendMessage({ action: 'saveState', state: { currentLang } });
  });

  document.getElementById('langEn').addEventListener('click', () => {
    currentLang = 'en';
    updateLanguage();
    chrome.runtime.sendMessage({ action: 'saveState', state: { currentLang } });
  });

  document.getElementById('compressHtml').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'compressHtml' }, (response) => {
      resultArea.value = '';
      tabButtons.innerHTML = '';
      toggleCopyButton(false);
      if (response.error) {
        resultArea.value = `${translations[currentLang].error}: ${response.error}`;
        debugOutput.textContent = translations[currentLang].compressionError;
      } else {
        const { parts, totalParts } = response.compressedHtml;
        if (totalParts === 1) {
          resultArea.value = parts[0];
          toggleCopyButton(true);
        } else {
          parts.forEach((part, index) => {
            const button = document.createElement('button');
            button.textContent = `${index + 1}`;
            button.addEventListener('click', () => {
              resultArea.value = part;
              toggleCopyButton(true);
              tabButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
              button.classList.add('active');
            });
            tabButtons.appendChild(button);
          });
          resultArea.value = parts[0];
          tabButtons.children[0].classList.add('active');
          toggleCopyButton(true);
        }
      }
    });
  });

  document.getElementById('startSelection').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        debugOutput.textContent = translations[currentLang].noActiveTab;
        return;
      }
      resultArea.value = '';
      tabButtons.innerHTML = '';
      toggleCopyButton(false);
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelection', lang: currentLang }, (response) => {
        if (chrome.runtime.lastError) {
          debugOutput.textContent = `${translations[currentLang].error}: ${chrome.runtime.lastError.message}`;
        } else if (response?.status === 'started') {
          debugOutput.textContent = translations[currentLang].selectionStarted;
        }
      });
    });
  });

  document.getElementById('copyButton').addEventListener('click', () => {
    resultArea.select();
    document.execCommand('copy');
    debugOutput.textContent = translations[currentLang].copied;
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'showInstructions') {
    instructions = message.instructions;
    showInstructions();
  }
});