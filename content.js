// Скрипт поверх vk.ru: включает скин, переименовывает меню и добавляет аватарки с именами в личных диалогах

const ROOT_CLASS = "vk2015";

// Включаем сразу, чтобы не мигал новый дизайн; если скин выключен в настройках, снимаем класс
document.documentElement.classList.add(ROOT_CLASS);
chrome.storage.local.get("enabled").then(({ enabled = true }) => {
  if (!enabled) document.documentElement.classList.remove(ROOT_CLASS);
});

/* ---------- Левое меню: названия как в 2015 году ---------- */

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
const MENU_SELECTORS = ["#layout_sidebar"];

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

/* ---------- Личные диалоги: аватарка и имя у каждой серии сообщений ---------- */
// Современный ВК в личных диалогах не подписывает сообщения, из-за этого непонятно, где чьё.
// В 2015 году у каждой серии сообщений были аватарка и имя автора. В групповых чатах ВК делает это сам.

let groupCheck = { t: 0, value: false };

function isGroupChat(main) {
  const now = Date.now();
  if (now - groupCheck.t > 1000) {
    groupCheck = { t: now, value: /участник/i.test((main.textContent || "").slice(0, 400)) };
  }
  return groupCheck.value;
}

function decorateMessages() {
  if (!document.documentElement.classList.contains(ROOT_CLASS)) return;

  const main = document.querySelector(".ConvoMain");
  if (!main || isGroupChat(main)) return;

  // всё, что вне списка сообщений (то есть шапка диалога), даёт данные о собеседнике
  const outside = (selector) =>
    [...main.querySelectorAll(selector)].find((e) => !e.closest(".ConvoHistory"));

  const peerImg = outside("img");
  const peerSrc = peerImg ? peerImg.src : "";
  const peerTitle = outside(".PeerTitle__title");
  const peerName = (peerTitle && peerTitle.textContent.trim()) || "Собеседник";

  const mine = [...document.querySelectorAll("#page_header img")].pop();
  const mySrc = mine ? mine.src : "";

  main.querySelectorAll("article.ConvoHistory__messageBlock").forEach((art) => {
    if (art.querySelector('[class*="Avatar"]')) return; // родная аватарка уже есть

    const wrap = art.querySelector(":scope > .ConvoHistory__messageWrapper");
    const content = art.querySelector(".ConvoMessage__content");
    if (!wrap || !content) return;

    const out = art.classList.contains("ConvoHistory__messageBlock--out");

    // первое ли это сообщение в серии от одного автора
    const prevItem = art.closest(".VirtualScrollItem")?.previousElementSibling;
    const prev = prevItem && prevItem.querySelector("article.ConvoHistory__messageBlock");
    const first = !prev || prev.classList.contains("ConvoHistory__messageBlock--out") !== out;

    // аватарка
    let ava = art.querySelector(":scope > .vk2015-ava");
    if (!ava) {
      ava = document.createElement("div");
      ava.className = "vk2015-ava";
      ava.appendChild(document.createElement("img"));
      art.insertBefore(ava, wrap);
    }
    const src = out ? mySrc : peerSrc;
    const img = ava.firstChild;
    if (src && img.getAttribute("src") !== src) img.setAttribute("src", src);
    ava.style.visibility = first && src ? "visible" : "hidden";

    // имя автора
    let name = content.querySelector(":scope > .vk2015-name");
    if (!name) {
      name = document.createElement("div");
      name.className = "vk2015-name";
      content.insertBefore(name, content.firstChild);
    }
    const label = out ? "Вы" : peerName;
    if (name.textContent !== label) name.textContent = label;
    name.style.display = first ? "block" : "none";
  });
}

/* ---------- Следим за страницей: ВК дорисовывает интерфейс динамически ---------- */

let scheduled = false;
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    renameMenu();
    decorateMessages();
  });
}).observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", () => {
  renameMenu();
  decorateMessages();
});
