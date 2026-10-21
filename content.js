// Скрипт поверх vk.ru: включает скин и переименовывает пункты левого меню в стиле 2015

const ROOT_CLASS = "vk2015";

// Включаем сразу, чтобы не мигал новый дизайн; если скин выключен в настройках, снимаем класс
document.documentElement.classList.add(ROOT_CLASS);
chrome.storage.local.get("enabled").then(({ enabled = true }) => {
  if (!enabled) document.documentElement.classList.remove(ROOT_CLASS);
});

// Названия пунктов меню: как в 2015 году
const LABELS = {
  "Профиль": "Моя Страница",
  "Лента": "Мои Новости",
  "Новости": "Мои Новости",
  "Мессенджер": "Мои Сообщения",
  "Сообщения": "Мои Сообщения",
  "Друзья": "Мои Друзья",
  "Сообщества": "Мои Группы",
  "Группы": "Мои Группы",
  "Фотографии": "Мои Фотографии",
  "Музыка": "Мои Аудиозаписи",
  "Видео": "Мои Видеозаписи",
  "Закладки": "Мои Закладки",
  "Документы": "Мои Документы",
  "Игры": "Мои Игры"
};

// Где искать меню. Если ВК поменяет вёрстку, достаточно поправить этот список
const MENU_SELECTORS = ["#side_bar", "#react_rootLeftMenuRoot", "[class*='LeftMenu']"];

function renameMenu() {
  if (!document.documentElement.classList.contains(ROOT_CLASS)) return;

  document.querySelectorAll(MENU_SELECTORS.join(",")).forEach((menu) => {
    const walker = document.createTreeWalker(menu, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue.trim();
      if (LABELS[text]) node.nodeValue = node.nodeValue.replace(text, LABELS[text]);
    }
  });
}

// ВК дорисовывает интерфейс динамически, поэтому следим за изменениями (не чаще раза за кадр)
let scheduled = false;
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; renameMenu(); });
}).observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", renameMenu);
