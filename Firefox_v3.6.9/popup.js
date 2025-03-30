let currentLang = 'ru';
let instructions = [];
const runtime = typeof chrome !== 'undefined' ? chrome : browser;

const translations = {
  ru: {
    compressHtml: 'Сжать HTML',
    startSelection: 'Начать выбор',
    stopSelection: 'Остановить',
    copy: 'Копировать',
    langRu: 'Русский',
    langEn: 'English',
    placeholder: 'Сжатый HTML или инструкции появятся здесь',
    error: 'Ошибка',
    noActiveTab: 'Нет активной вкладки',
    compressionError: 'Ошибка сжатия',
    selectionStarted: 'Режим выбора запущен',
    selectionStopped: 'Режим выбора остановлен',
    copied: 'Скопировано в буфер обмена',
    instructionsShown: 'Инструкции отображены',
    noInstructions: 'Инструкций нет'
  },
  en: {
    compressHtml: 'Compress HTML',
    startSelection: 'Start Selection',
    stopSelection: 'Stop Selection',
    copy: 'Copy',
    langRu: 'Russian',
    langEn: 'English',
    placeholder: 'Compressed HTML or instructions will appear here',
    error: 'Error',
    noActiveTab: 'No active tab',
    compressionError: 'Compression error',
    selectionStarted: 'Selection mode started',
    selectionStopped: 'Selection mode stopped',
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
  document.getElementById('stopSelection').textContent = t.stopSelection;
  document.getElementById('copyButton').textContent = t.copy;
  document.getElementById('resultArea').placeholder = t.placeholder;
}

function toggleButtons(isSelecting) {
  const startButton = document.getElementById('startSelection');
  const stopButton = document.getElementById('stopSelection');
  const copyButton = document.getElementById('copyButton');
  startButton.style.display = isSelecting ? 'none' : 'inline-block';
  stopButton.style.display = isSelecting ? 'inline-block' : 'none';
  copyButton.style.display = instructions.length || resultArea.value ? 'inline-block' : 'none';
}

function syncState() {
  runtime.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (response?.state) {
      currentLang = response.state.currentLang || 'ru';
      toggleButtons(response.state.isSelectionMode);
      updateLanguage();
    }
  });
  runtime.runtime.sendMessage({ action: 'getInstructions' }, (response) => {
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
  toggleButtons(false);
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
    runtime.runtime.sendMessage({ action: 'saveState', state: { currentLang } });
  });

  document.getElementById('langEn').addEventListener('click', () => {
    currentLang = 'en';
    updateLanguage();
    runtime.runtime.sendMessage({ action: 'saveState', state: { currentLang } });
  });

  document.getElementById('compressHtml').addEventListener('click', () => {
    runtime.runtime.sendMessage({ action: 'compressHtml' }, (response) => {
      resultArea.value = '';
      tabButtons.innerHTML = '';
      toggleButtons(false);
      if (response.error) {
        resultArea.value = `${translations[currentLang].error}: ${response.error}`;
        debugOutput.textContent = translations[currentLang].compressionError;
      } else {
        const { parts, totalParts } = response.compressedHtml;
        if (totalParts === 1) {
          resultArea.value = parts[0];
          toggleButtons(false);
        } else {
          parts.forEach((part, index) => {
            const button = document.createElement('button');
            button.textContent = `${index + 1}`;
            button.addEventListener('click', () => {
              resultArea.value = part;
              toggleButtons(false);
              tabButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
              button.classList.add('active');
            });
            tabButtons.appendChild(button);
          });
          resultArea.value = parts[0];
          tabButtons.children[0].classList.add('active');
          toggleButtons(false);
        }
      }
    });
  });

  document.getElementById('startSelection').addEventListener('click', () => {
    runtime.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        debugOutput.textContent = translations[currentLang].noActiveTab;
        return;
      }
      resultArea.value = '';
      tabButtons.innerHTML = '';
      toggleButtons(true);
      runtime.tabs.sendMessage(tabs[0].id, { action: 'startSelection', lang: currentLang }, (response) => {
        if (runtime.runtime.lastError) {
          debugOutput.textContent = `${translations[currentLang].error}: ${runtime.runtime.lastError.message}`;
          toggleButtons(false);
        } else if (response?.status === 'started') {
          debugOutput.textContent = translations[currentLang].selectionStarted;
        }
      });
    });
  });

  document.getElementById('stopSelection').addEventListener('click', () => {
    runtime.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        debugOutput.textContent = translations[currentLang].noActiveTab;
        return;
      }
      runtime.tabs.sendMessage(tabs[0].id, { action: 'stopSelection' }, (response) => {
        if (runtime.runtime.lastError) {
          debugOutput.textContent = `${translations[currentLang].error}: ${runtime.runtime.lastError.message}`;
        } else if (response?.status === 'stopped') {
          debugOutput.textContent = translations[currentLang].selectionStopped;
          toggleButtons(false);
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

runtime.runtime.onMessage.addListener((message) => {
  if (message.action === 'showInstructions') {
    instructions = message.instructions;
    showInstructions();
  }
});
