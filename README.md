# Automation Web Helper 4 AI

![213211](https://github.com/user-attachments/assets/bcad109a-c24e-4957-9e83-070ac2390cb9)


Этот проект — расширение для браузеров Chrome и Firefox, созданное для помощи в автоматизации задач и обучении ИИ через анализ веб-страниц. Работает как инструмент для разработчиков, тестировщиков и всех, кто хочет упростить взаимодействие с веб-контентом.

---

## Что это и для чего нужно?

**Automation Web Helper 4 AI** — это инструмент, который:
- Позволяет сжимать HTML-код страницы для быстрого анализа структуры сайта.
- Дает возможность создавать инструкции для веб-элементов, чтобы обучать ИИ или автоматизировать действия (например, клики, заполнение форм).
- Упрощает работу с веб-страницами, минимизируя ручной труд при сборе данных или тестировании.

### Как работает?
1. **Сжатие HTML**:  
   - Сжимает HTML всей страницы, заменяя теги на короткие коды (например, `div` → `d`), добавляя ID, классы и текст (до 20 символов для тегов вроде `h1`, `a`).  
   - Исключает ненужные элементы (script, style, svg и т.д.).  
   - Если результат большой, разбивает его на части (до 1500 элементов на часть).  
   - Показывает сжатый код в popup-окне или окне инструкций на странице.

2. **Режим выбора элементов**:  
   - Запускает панель управления на странице с функциями подсветки элементов и создания инструкций.  
   - Подсвечивает элементы на странице, позволяет кликать на них и добавлять инструкции (например, "Нажми сюда").  
   - Инструкции сохраняются и отображаются в специальном окне.

3. **Popup-интерфейс**:  
   - Открывается при клике на иконку расширения, содержит кнопки для сжатия HTML, переключения языка и запуска режима выбора.  
   - Выводит результаты сжатия или инструкции с возможностью копирования.

---

## Возможности

- **Сжатие HTML**: Быстрое сжатие структуры страницы с разбивкой на части, если нужно.  
- **Создание инструкций**: Подсветка и аннотирование элементов для ИИ или автоматизации.  
- **Локализация**: Поддержка русского и английского языков.  
- **Копирование**: Лёгкий экспорт сжатого HTML или инструкций в буфер обмена.  
- **Гибкость**: Настраиваемый формат описания элементов (краткий/полный, с координатами или без).  

---

## Установка

### Для Chrome
- Скачайте папку `Chrome_v3.6.9` из этого репозитория.
- Откройте `chrome://extensions/`.
- Включите "Режим разработчика" (переключатель вверху справа).
- Нажмите "Загрузить распакованное расширение" и выберите папку `Chrome_v3.6.9`.
- Откройте любую страницу, кликните на иконку расширения и попробуйте "Сжать HTML" или "Начать выбор".

*Официальная версия для Chrome Web Store не планируется, так как публикация платная.*

### Для Firefox (версия 58 и выше)
- Вариант 1: Установите официальную версию с [addons.mozilla.org](https://addons.mozilla.org/ru/firefox/addon/automation-web-helper-4-ai/).
- Вариант 2: Установка из исходников:
  - Скачайте папку `Firefox_v3.6.9` из этого репозитория.
  - Откройте `about:debugging#/runtime/this-firefox`.
  - Нажмите "Загрузить временное дополнение" и выберите `manifest.json` из папки `Firefox_v3.6.9`.
- Перейдите на любую страницу и проверьте работу через иконку расширения.

---

## Требования

- **Chrome**: Любая современная версия.  
- **Firefox**: Версия 58 или выше.  

---

## Устранение неполадок

- **Если сжатие не работает**:  
  - Убедитесь, что страница полностью загружена (нет ошибок "Document not loaded").  
  - Проверьте консоль DevTools (F12) на наличие ошибок и сообщите в Issues.  
- **Если режим выбора не запускается**:  
  - Перезагрузите расширение (Chrome: "Обновить" в `chrome://extensions/`, Firefox: переустановите).  
- **Для отладки**: Откройте DevTools (F12) и смотрите логи в консоли.

---

## Совместимость

- Работает с блокировщиками рекламы без конфликтов.  
- Подходит для любых сайтов, где доступен DOM (не работает на системных страницах вроде `chrome://` или `about:`).

---

## Лицензия

MIT License — используйте как хотите, но упомяните меня, если будете форкать.

---

## Контакты

Вопросы, баги, идеи? Пишите в Issues или на почту: **antibrutsystem@mail.ru** (Антибрут).

---

# Automation Web Helper 4 AI (English)

This project is a browser extension for Chrome and Firefox designed to assist with automation tasks and AI training by analyzing web pages. It’s a tool for developers, testers, and anyone looking to streamline web interactions. Project icon: `icon128.png`.

Published on the official Firefox site: [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/automation-web-helper-4-ai/)  
For Chrome, I’m not paying for developer registration, so it’s not published there (but the source code is available here).

Works great with ad blockers (uBlock Origin, AdBlock, etc.). If something breaks — don’t blame me, figure it out yourself!

---

## What is it and why use it?

**Automation Web Helper 4 AI** is a tool that:
- Compresses HTML code of a webpage for quick structural analysis.  
- Lets you create instructions for web elements to train AI or automate tasks (e.g., clicks, form filling).  
- Simplifies working with web pages, reducing manual effort for data collection or testing.

### How it works?
1. **HTML Compression**:  
   - Compresses the entire page’s HTML, replacing tags with short codes (e.g., `div` → `d`), adding IDs, classes, and text (up to 20 characters for tags like `h1`, `a`).  
   - Excludes unnecessary elements (script, style, svg, etc.).  
   - Splits large results into parts (up to 1500 elements per part) and displays them with part indicators (e.g., "Part 1 of 3").  
   - Shows compressed code in the popup or an instructions window on the page.

2. **Element Selection Mode**:  
   - Launches a control panel on the page with options to highlight elements and create instructions.  
   - Highlights elements with a darkened overlay, lets you click them, and add instructions (e.g., "Click here").  
   - Instructions are saved and shown in a dedicated window.

3. **Popup Interface**:  
   - Opens when clicking the extension icon, featuring buttons for HTML compression, language switching, and starting selection mode.  
   - Displays compression results or instructions with a copy option.

---

## Features

- **HTML Compression**: Fast page structure compression with optional splitting into parts.  
- **Instruction Creation**: Highlight and annotate elements for AI or automation.  
- **Localization**: Supports Russian and English.  
- **Copying**: Easy export of compressed HTML or instructions to the clipboard.  
- **Flexibility**: Customizable element description format (short/full, with/without coordinates).  

---

## Installation

### For Chrome
- Download the `Chrome_v3.6.9` folder from this repository.  
- Open `chrome://extensions/`.  
- Enable "Developer mode" (toggle in the top right).  
- Click "Load unpacked" and select the `Chrome_v3.6.9` folder.  
- Open any webpage, click the extension icon, and try "Compress HTML" or "Start Selection".  

*Official Chrome Web Store version isn’t planned due to paid registration.*

### For Firefox (version 58 and above)
- Option 1: Install the official version from [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/automation-web-helper-4-ai/).  
- Option 2: Install from source:  
  - Download the `Firefox_v3.6.9` folder from this repository.  
  - Open `about:debugging#/runtime/this-firefox`.  
  - Click "Load Temporary Add-on" and select `manifest.json` from the `Firefox_v3.6.9` folder.  
- Visit any webpage and test it via the extension icon.

---

## Requirements

- **Chrome**: Any recent version.  
- **Firefox**: Version 58 or higher.  

---

## Troubleshooting

- **If compression fails**:  
  - Ensure the page is fully loaded (no "Document not loaded" errors).  
  - Check the DevTools console (F12) for errors and report them in Issues.  
- **If selection mode doesn’t start**:  
  - Reload the extension (Chrome: "Update" in `chrome://extensions/`, Firefox: reinstall).  
- **For debugging**: Open DevTools (F12) and check console logs.

---

## Compatibility

- Works seamlessly with ad blockers, no conflicts observed.  
- Suitable for any site with an accessible DOM (won’t work on system pages like `chrome://` or `about:`).

---

## License

MIT License — use it however you like, just give me a shoutout if you fork it.

---

## Contact

Questions, bugs, or suggestions? File an Issue or email me at **antibrutsystem@mail.ru** (Antibrut).
