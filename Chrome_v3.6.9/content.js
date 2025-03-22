let isSelectionMode = false;
let isHighlightingEnabled = false;
let overlay = null;
let instructions = [];
let currentLang = 'ru';
let lastHighlighted = null;
let controlPanel = null;
let instructionWindow = null;
let useFullElementFormat = true;
let useCoordinates = false;

function createOverlay() {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'extension-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
      pointer-events: none;
    `;
    document.body.appendChild(overlay);
  }
}

function makeDraggable(element, header) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    let newTop = element.offsetTop - pos2;
    let newLeft = element.offsetLeft - pos1;

    newTop = Math.max(0, Math.min(newTop, window.innerHeight - element.offsetHeight));
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - element.offsetWidth));

    element.style.top = newTop + 'px';
    element.style.left = newLeft + 'px';
    element.style.bottom = 'auto';
    element.style.right = 'auto';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function createControlPanel() {
  if (!controlPanel) {
    controlPanel = document.createElement('div');
    controlPanel.className = 'extension-control-panel';
    controlPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(31, 37, 38, 0.95);
      backdrop-filter: blur(5px);
      border-radius: 8px;
      padding: 15px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      color: #E0E0E0;
      pointer-events: auto;
    `;
    controlPanel.innerHTML = `
      <div id="panelHeader" style="cursor: move; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 14px;">
        ${currentLang === 'ru' ? 'Панель управления' : 'Control Panel'}
        <button id="minimizeButton" style="float: right; background: #D66B0C; color: white; border: none; padding: 4px 10px; border-radius: 4px; margin-left: 5px; font-size: 12px; cursor: pointer;">${currentLang === 'ru' ? 'Свернуть' : 'Minimize'}</button>
        <button id="closePanelButton" style="float: right; background: #D32F2F; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">${currentLang === 'ru' ? 'Закрыть' : 'Close'}</button>
      </div>
      <div id="panelButtons" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px;">
        <button id="highlightButton" style="background: #0C99D6; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;">${currentLang === 'ru' ? 'Подсветить элементы' : 'Highlight Elements'}</button>
        <button id="removeHighlightButton" style="background: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;">${currentLang === 'ru' ? 'Снять подсветку' : 'Remove Highlight'}</button>
        <button id="compressHtmlButton" style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;">${currentLang === 'ru' ? 'Сжать HTML' : 'Compress HTML'}</button>
        <button id="toggleFormatButton" style="background: ${useFullElementFormat ? '#28a745' : '#007bff'}; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;">${currentLang === 'ru' ? (useFullElementFormat ? 'Краткий' : 'Полный') : (useFullElementFormat ? 'Short' : 'Full')}</button>
        <button id="toggleCoordinatesButton" style="background: ${useCoordinates ? '#ff9800' : '#6c757d'}; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;">${currentLang === 'ru' ? 'Координаты' : 'Coordinates'}</button>
      </div>
    `;
    document.body.appendChild(controlPanel);

    const header = document.getElementById('panelHeader');
    makeDraggable(controlPanel, header);

    const minimizeButton = document.getElementById('minimizeButton');
    const panelButtons = document.getElementById('panelButtons');
    minimizeButton.addEventListener('click', () => {
      panelButtons.style.display = panelButtons.style.display === 'none' ? 'flex' : 'none';
      minimizeButton.textContent = panelButtons.style.display === 'none'
        ? (currentLang === 'ru' ? 'Развернуть' : 'Expand')
        : (currentLang === 'ru' ? 'Свернуть' : 'Minimize');
    });

    const closeButton = document.getElementById('closePanelButton');
    closeButton.addEventListener('click', () => {
      removeHighlightMode();
      controlPanel.remove();
      controlPanel = null;
    });

    document.getElementById('highlightButton').addEventListener('click', enableHighlightMode);
    document.getElementById('removeHighlightButton').addEventListener('click', removeHighlightMode);
    document.getElementById('compressHtmlButton').addEventListener('click', compressAndShowHtml);
    document.getElementById('toggleFormatButton').addEventListener('click', toggleFormat);
    document.getElementById('toggleCoordinatesButton').addEventListener('click', toggleCoordinates);

    const buttons = controlPanel.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('mouseover', () => btn.style.background = darkenColor(btn.style.background));
      btn.addEventListener('mouseout', () => btn.style.background = btn.dataset.originalColor || btn.style.background);
      btn.dataset.originalColor = btn.style.background;
    });
  }
}

function createInstructionWindow() {
  if (!instructionWindow) {
    instructionWindow = document.createElement('div');
    instructionWindow.className = 'extension-instruction-window';
    instructionWindow.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 420px;
      background: rgba(31, 37, 38, 0.95);
      backdrop-filter: blur(5px);
      border-radius: 8px;
      padding: 15px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      color: #E0E0E0;
      pointer-events: auto;
      animation: slideUp 0.3s ease-out;
    `;
    instructionWindow.innerHTML = `
      <div id="instructionHeader" style="cursor: move; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 14px;">
        ${currentLang === 'ru' ? 'Инструкции' : 'Instructions'}
        <button id="closeInstructionButton" style="float: right; background: #D32F2F; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">${currentLang === 'ru' ? 'Закрыть' : 'Close'}</button>
        <button id="copyInstructionsButton" style="float: right; background: #0C99D6; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-right: 5px;">${currentLang === 'ru' ? 'Копировать' : 'Copy'}</button>
      </div>
      <textarea id="instructionsText" style="width: 100%; height: 180px; margin-top: 10px; background: #2A2F31; color: #E0E0E0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 10px; font-size: 13px; resize: none;"></textarea>
    `;
    document.body.appendChild(instructionWindow);
    updateInstructionWindow();

    const header = document.getElementById('instructionHeader');
    makeDraggable(instructionWindow, header);

    const copyButton = document.getElementById('copyInstructionsButton');
    copyButton.addEventListener('click', () => {
      const textarea = document.getElementById('instructionsText');
      textarea.select();
      try {
        document.execCommand('copy');
        showNotification(currentLang === 'ru' ? 'Инструкции скопированы!' : 'Instructions copied!');
      } catch (err) {
        console.error('Ошибка копирования:', err);
        alert('Копирование не удалось. Используйте Ctrl+C.');
      }
    });

    const closeButton = document.getElementById('closeInstructionButton');
    closeButton.addEventListener('click', () => {
      parseInstructionsFromTextarea();
      instructionWindow.remove();
      instructionWindow = null;
    });

    const textarea = document.getElementById('instructionsText');
    textarea.addEventListener('change', () => parseInstructionsFromTextarea());

    const buttons = instructionWindow.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('mouseover', () => btn.style.background = darkenColor(btn.style.background));
      btn.addEventListener('mouseout', () => btn.style.background = btn.dataset.originalColor || btn.style.background);
      btn.dataset.originalColor = btn.style.background;
    });
  }
}

function updateInstructionWindow() {
  if (instructionWindow) {
    const textarea = document.getElementById('instructionsText');
    if (textarea) {
      textarea.value = instructions.length
        ? instructions.map((i, idx) => `${idx + 1}. ${i.instruction} [${i.element}]`).join('\n')
        : (currentLang === 'ru' ? 'Инструкций нет' : 'No instructions');
    }
  }
}

function parseInstructionsFromTextarea() {
  const textarea = document.getElementById('instructionsText');
  if (textarea) {
    instructions = textarea.value.split('\n').filter(line => line.trim()).map(line => {
      const match = line.match(/^\d+\.\s*(.+?)\s*\[(.*?)\]$/);
      return match ? { instruction: match[1].trim(), element: match[2].trim() } : { instruction: line.trim(), element: '' };
    });
    saveInstructionsToBackground();
  }
}

function compressAndShowHtml() {
  const compressedResult = compressHtml();
  if (!instructionWindow) {
    createInstructionWindow();
  }
  const textarea = document.getElementById('instructionsText');
  if (textarea) {
    if (compressedResult.error) {
      textarea.value = currentLang === 'ru' ? `Ошибка: ${compressedResult.error}` : `Error: ${compressedResult.error}`;
    } else {
      const { parts, totalParts } = compressedResult;
      textarea.value = totalParts > 1
        ? `${currentLang === 'ru' ? 'Часть 1 из' : 'Part 1 of'} ${totalParts}:\n${parts[0]}`
        : parts[0];
    }
  }
}

function compressHtml() {
  try {
    if (!document.body) throw new Error('Document not loaded');
    const tagMap = {
      'div': 'd', 'header': 'h', 'section': 's', 'footer': 'f',
      'article': 'a', 'main': 'm', 'nav': 'n', 'ul': 'u', 'li': 'l',
      'span': 'p', 'button': 'b', 'img': 'i', 'form': 'r',
      'a': 'a', 'h1': 'h1', 'h2': 'h2', 'h3': 'h3', 'h4': 'h4'
    };
    const seen = new Set();
    const elements = document.querySelectorAll('body *');
    const compressedHtml = Array.from(elements)
      .filter(el => {
        const tag = el.tagName.toLowerCase();
        return !['script', 'style', 'svg', 'noscript', 'meta', 'link', 'path', 'circle', 'defs', 'lineargradient', 'stop', 'rect', 'mask', 'g', 'clippath'].includes(tag);
      })
      .map(el => {
        const shortTag = tagMap[el.tagName.toLowerCase()] || el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className && typeof el.className === 'string' ? `.${el.className.trim().replace(/\s+/g, '.')}` : '';
        const isTextTag = ['a', 'h1', 'h2', 'h3', 'h4'].includes(el.tagName.toLowerCase());
        const text = isTextTag && el.textContent ? `:${el.textContent.trim().slice(0, 20).replace(/[\n\t\r]+/g, ' ')}` : '';
        const elementStr = `${shortTag}${id}${classes}${text}`;
        return seen.has(elementStr) ? null : (seen.add(elementStr), elementStr);
      })
      .filter(Boolean);

    const elementCount = compressedHtml.length;
    const parts = [];
    const maxElementsPerPart = 1500;

    if (elementCount <= maxElementsPerPart) {
      parts.push(compressedHtml.join(','));
    } else {
      for (let i = 0; i < elementCount; i += maxElementsPerPart) {
        parts.push(compressedHtml.slice(i, i + maxElementsPerPart).join(','));
      }
    }

    return { parts: parts, totalParts: parts.length };
  } catch (error) {
    console.error('Compression error:', error.message);
    return { error: error.message };
  }
}

function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  clearHighlight();
}

function removeAllUI() {
  removeOverlay();
  if (controlPanel) {
    controlPanel.remove();
    controlPanel = null;
  }
  if (instructionWindow) {
    parseInstructionsFromTextarea();
    instructionWindow.remove();
    instructionWindow = null;
  }
}

function highlightElement(event) {
  if (!isSelectionMode || !isHighlightingEnabled) return;

  const target = document.elementFromPoint(event.clientX, event.clientY);
  if (!target || target.closest('.extension-control-panel, .extension-instruction-window')) return;

  clearHighlight();
  target.style.outline = '2px solid #0C99D6';
  target.style.boxShadow = '0 0 8px rgba(12, 153, 214, 0.5)';
  target.style.transition = 'outline 0.1s, box-shadow 0.1s';
  lastHighlighted = target;

  showElementTooltip(target, event.clientX, event.clientY);
}

function clearHighlight() {
  if (lastHighlighted) {
    lastHighlighted.style.outline = '';
    lastHighlighted.style.boxShadow = '';
    lastHighlighted.style.transition = '';
    lastHighlighted = null;
    removeElementTooltip();
  }
}

function showElementTooltip(element, x, y) {
  removeElementTooltip();
  const tooltip = document.createElement('div');
  tooltip.className = 'extension-tooltip';
  tooltip.textContent = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className.split(' ').join('.')}` : ''}`;
  tooltip.style.cssText = `
    position: absolute;
    top: ${y + 10}px;
    left: ${x + 10}px;
    background: rgba(12, 153, 214, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10001;
    pointer-events: none;
  `;
  document.body.appendChild(tooltip);
}

function removeElementTooltip() {
  const tooltip = document.querySelector('.extension-tooltip');
  if (tooltip) tooltip.remove();
}

function enableHighlightMode() {
  if (!isHighlightingEnabled) {
    isSelectionMode = true;
    isHighlightingEnabled = true;
    createOverlay();
    createInstructionWindow();
    document.addEventListener('mouseover', highlightElement);
    document.addEventListener('click', handleAllClicks, { capture: true });
    saveStateToBackground();
  }
}

function removeHighlightMode() {
  if (isHighlightingEnabled) {
    isSelectionMode = false;
    isHighlightingEnabled = false;
    document.removeEventListener('mouseover', highlightElement);
    document.removeEventListener('click', handleAllClicks, { capture: true });
    removeOverlay();
    clearHighlight();
    saveStateToBackground();
  }
}

function handleAllClicks(event) {
  if (!isSelectionMode || !isHighlightingEnabled) return;

  const target = document.elementFromPoint(event.clientX, event.clientY);

  if (target.closest('.extension-control-panel, .extension-instruction-window')) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  selectElement(event, target);
}

function selectElement(event, target) {
  if (target.tagName.toLowerCase() === 'svg' || target.tagName.toLowerCase() === 'path') {
    target = target.closest('span, div, button, a, p, li, ul, ol, section, article') || target.parentElement;
  }

  if (!document.body.contains(target)) {
    console.log('Элемент не найден в DOM');
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const elementDesc = getFullElementDescription(target, x, y);
  clearHighlight();

  const instruction = prompt(
    currentLang === 'ru' ? `Инструкция для ${elementDesc}:` : `Instruction for ${elementDesc}:`,
    currentLang === 'ru' ? 'Нажми сюда' : 'Click here'
  );
  if (instruction === null) {
    // Оставляем режим подсветки активным
  } else if (instruction?.trim()) {
    instructions.push({ element: elementDesc, instruction: instruction.trim() });
    updateInstructionWindow();
    saveInstructionsToBackground();
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 10001;
    animation: fadeInOut 2s ease-in-out;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fadeInOut {
    0% { opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
  .extension-overlay {
    pointer-events: none !important;
  }
  .extension-control-panel,
  .extension-instruction-window {
    pointer-events: auto !important;
    z-index: 10000 !important;
  }
`;
document.head.appendChild(style);

function toggleFormat() {
  useFullElementFormat = !useFullElementFormat;
  updateInstructionWindow();
  const toggleButton = document.getElementById('toggleFormatButton');
  if (toggleButton) {
    toggleButton.textContent = currentLang === 'ru' ? (useFullElementFormat ? 'Краткий' : 'Полный') : (useFullElementFormat ? 'Short' : 'Full');
    toggleButton.style.background = useFullElementFormat ? '#28a745' : '#007bff';
    toggleButton.dataset.originalColor = toggleButton.style.background;
  }
  saveStateToBackground();
}

function toggleCoordinates() {
  useCoordinates = !useCoordinates;
  const toggleCoordinatesButton = document.getElementById('toggleCoordinatesButton');
  if (toggleCoordinatesButton) {
    toggleCoordinatesButton.style.background = useCoordinates ? '#ff9800' : '#6c757d';
    toggleCoordinatesButton.dataset.originalColor = toggleCoordinatesButton.style.background;
  }
  updateInstructionWindow();
  saveStateToBackground();
}

function getFullElementDescription(element, x, y) {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = element.className ? `.${element.className.trim().replace(/\s+/g, '.')}` : '';

  if (useCoordinates && useFullElementFormat) {
    return `<${tag}${classes ? ` class="${element.className}"` : ''}>: X: ${x} Y: ${y}`;
  } else if (!useFullElementFormat) {
    let fullHtml = element.outerHTML;
    if (element.children.length > 0) {
      fullHtml = `<${tag}${Array.from(element.attributes)
        .map(attr => ` ${attr.name}="${attr.value}"`)
        .join('')}>${element.innerText.trim().replace(/[\n\t\r]+/g, ' ')}</${tag}>`;
    }
    return useCoordinates ? `${fullHtml} X: ${x} Y: ${y}` : fullHtml;
  } else {
    let value = '';
    if (tag === 'input' || tag === 'textarea') {
      value = element.value ? `value="${element.value.slice(0, 20).replace(/[\n\t\r]+/g, ' ')}"` : '';
    }
    return `${tag}${id}${classes}${value ? `: ${value}` : ''}`;
  }
}

function saveInstructionsToBackground() {
  chrome.runtime.sendMessage({ action: 'saveInstructions', instructions });
}

function saveStateToBackground() {
  chrome.runtime.sendMessage({
    action: 'saveState',
    state: { isSelectionMode, isHighlighting: isHighlightingEnabled, currentLang, useFullElementFormat, useCoordinates }
  });
}

function restoreState() {
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (response?.state) {
      isSelectionMode = response.state.isSelectionMode || false;
      isHighlightingEnabled = response.state.isHighlighting || false;
      currentLang = response.state.currentLang || 'ru';
      useFullElementFormat = response.state.useFullElementFormat !== undefined ? response.state.useFullElementFormat : true;
      useCoordinates = response.state.useCoordinates || false;
      if (isSelectionMode && isHighlightingEnabled) {
        createOverlay();
        createControlPanel();
        createInstructionWindow();
        document.addEventListener('mouseover', highlightElement);
        document.addEventListener('click', handleAllClicks, { capture: true });
      } else if (isSelectionMode) {
        createControlPanel();
      }
    }
  });
  chrome.runtime.sendMessage({ action: 'getInstructions' }, (response) => {
    if (response?.instructions) {
      instructions = response.instructions;
      updateInstructionWindow();
    }
  });
}

function darkenColor(color) {
  if (color.includes('rgb')) {
    const [r, g, b] = color.match(/\d+/g).map(Number);
    return `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
  }
  return color;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelection') {
    isSelectionMode = true;
    isHighlightingEnabled = false;
    currentLang = message.lang || 'ru';
    createControlPanel();
    saveStateToBackground();
    sendResponse({ status: 'started' });
  } else if (message.action === 'stopSelection') {
    isSelectionMode = false;
    isHighlightingEnabled = false;
    document.removeEventListener('mouseover', highlightElement);
    document.removeEventListener('click', handleAllClicks, { capture: true });
    removeAllUI();
    chrome.runtime.sendMessage({ action: 'showInstructions', instructions });
    saveStateToBackground();
    sendResponse({ status: 'stopped' });
  } else if (message.action === 'compressHtml') {
    const compressedResult = compressHtml();
    sendResponse({ compressedHtml: compressedResult });
  }
});

window.addEventListener('beforeunload', saveStateToBackground);
document.addEventListener('DOMContentLoaded', restoreState);