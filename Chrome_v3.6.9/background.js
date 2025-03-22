console.log('Background script loaded');

let savedInstructions = [];
let savedState = { 
  isSelectionMode: false, 
  isHighlighting: false, 
  currentLang: 'ru', 
  useFullElementFormat: true 
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'compressHtml') {
    console.log('Received compressHtml request');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        sendResponse({ error: savedState.currentLang === 'ru' ? 'Нет активной вкладки' : 'No active tab' });
        return;
      }
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: compressHtml
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('Script execution error:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else if (results && results[0] && results[0].result) {
          console.log('Compression successful, sending response');
          const compressedResult = results[0].result;
          sendResponse({ compressedHtml: compressedResult });
          // Отправляем результат в content.js для отображения
          chrome.tabs.sendMessage(tabId, { action: 'showCompressedHtml', compressedHtml: compressedResult });
        } else {
          console.error('No result from compressHtml');
          sendResponse({ error: savedState.currentLang === 'ru' ? 'Нет результата от compressHtml' : 'No result from compressHtml' });
        }
      });
    });
    return true; // Асинхронный ответ
  } else if (message.action === 'saveInstructions') {
    savedInstructions = message.instructions || [];
    chrome.storage.local.set({ instructions: savedInstructions });
    sendResponse({ status: 'saved' });
  } else if (message.action === 'getInstructions') {
    chrome.storage.local.get('instructions', (result) => {
      sendResponse({ instructions: result.instructions || savedInstructions });
    });
    return true;
  } else if (message.action === 'showInstructions') {
    savedInstructions = message.instructions || [];
    chrome.storage.local.set({ instructions: savedInstructions });
    sendResponse({ status: 'sent' });
  } else if (message.action === 'saveState') {
    savedState = { ...savedState, ...message.state };
    chrome.storage.local.set({ state: savedState });
    sendResponse({ status: 'state saved' });
  } else if (message.action === 'getState') {
    chrome.storage.local.get('state', (result) => {
      sendResponse({ state: result.state || savedState });
    });
    return true;
  }
});

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