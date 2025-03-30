let isSelectionMode = false;
let isHighlightingEnabled = false;
let overlay = null;
let instructions = [];
let currentLang = 'ru';
let lastHighlighted = null;
let controlPanel = null;
let instructionWindow = null;
let useFullElementFormat = false; // "Полный" по умолчанию
let useCoordinates = true; // "Координаты" включены по умолчанию

const runtime = typeof chrome !== 'undefined' ? chrome : browser;

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

    const header = document.createElement('div');
    header.id = 'panelHeader';
    header.style.cssText = 'cursor: move; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 14px;';
    header.textContent = currentLang === 'ru' ? 'Панель управления' : 'Control Panel';

    const minimizeButton = document.createElement('button');
    minimizeButton.id = 'minimizeButton';
    minimizeButton.style.cssText = 'float: right; background: #D66B0C; color: white; border: none; padding: 4px 10px; border-radius: 4px; margin-left: 5px; font-size: 12px; cursor: pointer;';
    minimizeButton.textContent = currentLang === 'ru' ? 'Свернуть' : 'Minimize';

    const closeButton = document.createElement('button');
    closeButton.id = 'closePanelButton';
    closeButton.style.cssText = 'float: right; background: #D32F2F; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;';
    closeButton.textContent = currentLang === 'ru' ? 'Закрыть' : 'Close';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.id = 'panelButtons';
    buttonsDiv.style.cssText = 'margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px;';

    const highlightButton = document.createElement('button');
    highlightButton.id = 'highlightButton';
    highlightButton.style.cssText = 'background: #0C99D6; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;';
    highlightButton.textContent = currentLang === 'ru' ? 'Подсветить элементы' : 'Highlight Elements';

    const removeHighlightButton = document.createElement('button');
    removeHighlightButton.id = 'removeHighlightButton';
    removeHighlightButton.style.cssText = 'background: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;';
    removeHighlightButton.textContent = currentLang === 'ru' ? 'Снять подсветку' : 'Remove Highlight';

    const toggleFormatButton = document.createElement('button');
    toggleFormatButton.id = 'toggleFormatButton';
    toggleFormatButton.style.cssText = `background: ${useFullElementFormat ? '#28a745' : '#007bff'}; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;`;
    toggleFormatButton.textContent = currentLang === 'ru' ? (useFullElementFormat ? 'Краткий' : 'Полный') : (useFullElementFormat ? 'Short' : 'Full');

    const toggleCoordinatesButton = document.createElement('button');
    toggleCoordinatesButton.id = 'toggleCoordinatesButton';
    toggleCoordinatesButton.style.cssText = `background: ${useCoordinates ? '#ff9800' : '#6c757d'}; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;`;
    toggleCoordinatesButton.textContent = currentLang === 'ru' ? 'Координаты' : 'Coordinates';

    header.appendChild(minimizeButton);
    header.appendChild(closeButton);
    buttonsDiv.appendChild(highlightButton);
    buttonsDiv.appendChild(removeHighlightButton);
    buttonsDiv.appendChild(toggleFormatButton);
    buttonsDiv.appendChild(toggleCoordinatesButton);
    controlPanel.appendChild(header);
    controlPanel.appendChild(buttonsDiv);
    document.body.appendChild(controlPanel);

    makeDraggable(controlPanel, header);

    minimizeButton.addEventListener('click', () => {
      buttonsDiv.style.display = buttonsDiv.style.display === 'none' ? 'flex' : 'none';
      minimizeButton.textContent = buttonsDiv.style.display === 'none'
        ? (currentLang === 'ru' ? 'Развернуть' : 'Expand')
        : (currentLang === 'ru' ? 'Свернуть' : 'Minimize');
    });

    closeButton.addEventListener('click', stopSelectionMode);
    highlightButton.addEventListener('click', enableHighlightMode);
    removeHighlightButton.addEventListener('click', removeHighlightMode);
    toggleFormatButton.addEventListener('click', toggleFormat);
    toggleCoordinatesButton.addEventListener('click', toggleCoordinates);

    const buttons = controlPanel.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.dataset.originalColor = btn.style.background;
      btn.addEventListener('mouseover', () => btn.style.background = darkenColor(btn.style.background));
      btn.addEventListener('mouseout', () => btn.style.background = btn.dataset.originalColor);
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

    const header = document.createElement('div');
    header.id = 'instructionHeader';
    header.style.cssText = 'cursor: move; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 14px;';
    header.textContent = currentLang === 'ru' ? 'Инструкции' : 'Instructions';

    const copyButton = document.createElement('button');
    copyButton.id = 'copyInstructionsButton';
    copyButton.style.cssText = 'float: right; background: #0C99D6; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-right: 5px;';
    copyButton.textContent = currentLang === 'ru' ? 'Копировать' : 'Copy';

    const closeButton = document.createElement('button');
    closeButton.id = 'closeInstructionButton';
    closeButton.style.cssText = 'float: right; background: #D32F2F; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;';
    closeButton.textContent = currentLang === 'ru' ? 'Закрыть' : 'Close';

    const textarea = document.createElement('textarea');
    textarea.id = 'instructionsText';
    textarea.style.cssText = 'width: 100%; height: 180px; margin-top: 10px; background: #2A2F31; color: #E0E0E0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 10px; font-size: 13px; resize: none;';

    header.appendChild(closeButton);
    header.appendChild(copyButton);
    instructionWindow.appendChild(header);
    instructionWindow.appendChild(textarea);
    document.body.appendChild(instructionWindow);

    updateInstructionWindow();
    makeDraggable(instructionWindow, header);

    copyButton.addEventListener('click', () => {
      textarea.select();
      document.execCommand('copy');
      showNotification(currentLang === 'ru' ? 'Инструкции скопированы!' : 'Instructions copied!');
    });

    closeButton.addEventListener('click', () => {
      parseInstructionsFromTextarea();
      instructionWindow.remove();
      instructionWindow = null;
    });

    textarea.addEventListener('change', parseInstructionsFromTextarea);

    const buttons = instructionWindow.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.dataset.originalColor = btn.style.background;
      btn.addEventListener('mouseover', () => btn.style.background = darkenColor(btn.style.background));
      btn.addEventListener('mouseout', () => btn.style.background = btn.dataset.originalColor);
    });
  }
}

function updateInstructionWindow() {
  const textarea = document.getElementById('instructionsText');
  if (textarea) {
    textarea.value = instructions.length
      ? instructions.map((i, idx) => `${idx + 1}. ${i.instruction} [${i.element}]`).join('\n')
      : (currentLang === 'ru' ? 'Инструкций нет' : 'No instructions');
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

function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  clearHighlight();
}

function stopSelectionMode() {
  isSelectionMode = false;
  isHighlightingEnabled = false;
  document.removeEventListener('mouseover', highlightElement);
  document.removeEventListener('click', handleAllClicks, { capture: true });
  if (controlPanel) {
    controlPanel.remove();
    controlPanel = null;
  }
  if (instructionWindow) {
    parseInstructionsFromTextarea();
    instructionWindow.remove();
    instructionWindow = null;
  }
  removeOverlay();
  runtime.runtime.sendMessage({ action: 'showInstructions', instructions });
  saveStateToBackground();
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
  const desc = getFullElementDescription(element, x, y);
  tooltip.textContent = useFullElementFormat ? desc : `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className.split(' ').join('.')}` : ''}`;
  const rect = element.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  tooltip.style.cssText = `
    position: absolute;
    top: ${rect.top + scrollY + 10}px;
    left: ${rect.left + scrollX + 10}px;
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
    isHighlightingEnabled = false;
    document.removeEventListener('mouseover', highlightElement);
    document.removeEventListener('click', handleAllClicks, { capture: true });
    removeOverlay();
    saveStateToBackground();
  }
}

function handleAllClicks(event) {
  if (!isSelectionMode || !isHighlightingEnabled) return;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  if (target.closest('.extension-control-panel, .extension-instruction-window')) return;

  event.preventDefault();
  event.stopPropagation();
  selectElement(event, target);
}

function selectElement(event, target) {
  if (target.tagName.toLowerCase() === 'svg' || target.tagName.toLowerCase() === 'path') {
    target = target.closest('span, div, button, a, p, li, ul, ol, section, article') || target.parentElement;
  }
  if (!document.body.contains(target)) return;

  const x = event.clientX;
  const y = event.clientY;
  const elementDesc = getFullElementDescription(target, x, y);
  clearHighlight();

  const instruction = prompt(
    currentLang === 'ru' ? `Инструкция для ${elementDesc}:` : `Instruction for ${elementDesc}:`,
    currentLang === 'ru' ? 'Нажми сюда' : 'Click here'
  );
  if (instruction?.trim()) {
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
`;
document.head.appendChild(style);

function toggleFormat() {
  useFullElementFormat = !useFullElementFormat;
  const toggleButton = document.getElementById('toggleFormatButton');
  if (toggleButton) {
    toggleButton.textContent = currentLang === 'ru' ? (useFullElementFormat ? 'Краткий' : 'Полный') : (useFullElementFormat ? 'Short' : 'Full');
    toggleButton.style.background = useFullElementFormat ? '#28a745' : '#007bff';
    toggleButton.dataset.originalColor = toggleButton.style.background;
  }
  updateInstructionWindow();
  saveStateToBackground();
}

function toggleCoordinates() {
  useCoordinates = !useCoordinates;
  const toggleButton = document.getElementById('toggleCoordinatesButton');
  if (toggleButton) {
    toggleButton.style.background = useCoordinates ? '#ff9800' : '#6c757d';
    toggleButton.dataset.originalColor = toggleButton.style.background;
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
    const value = (tag === 'input' || tag === 'textarea') && element.value
      ? `value="${element.value.slice(0, 20).replace(/[\n\t\r]+/g, ' ')}"`
      : '';
    return `${tag}${id}${classes}${value ? `: ${value}` : ''}`;
  }
}

function saveInstructionsToBackground() {
  runtime.runtime.sendMessage({ action: 'saveInstructions', instructions });
}

function saveStateToBackground() {
  runtime.runtime.sendMessage({
    action: 'saveState',
    state: { isSelectionMode, isHighlightingEnabled, currentLang, useFullElementFormat, useCoordinates }
  });
}

function restoreState() {
  runtime.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (response?.state) {
      isSelectionMode = response.state.isSelectionMode;
      isHighlightingEnabled = response.state.isHighlightingEnabled;
      currentLang = response.state.currentLang || 'ru';
      useFullElementFormat = response.state.useFullElementFormat ?? false;
      useCoordinates = response.state.useCoordinates ?? true;
      if (isSelectionMode) {
        createControlPanel();
        if (isHighlightingEnabled) {
          createOverlay();
          createInstructionWindow();
          document.addEventListener('mouseover', highlightElement);
          document.addEventListener('click', handleAllClicks, { capture: true });
        }
      }
    }
  });
  runtime.runtime.sendMessage({ action: 'getInstructions' }, (response) => {
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

runtime.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelection') {
    isSelectionMode = true;
    isHighlightingEnabled = false;
    currentLang = message.lang || 'ru';
    createControlPanel();
    saveStateToBackground();
    sendResponse({ status: 'started' });
  } else if (message.action === 'stopSelection') {
    stopSelectionMode();
    sendResponse({ status: 'stopped' });
  }
});

document.addEventListener('DOMContentLoaded', restoreState);
