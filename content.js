const ROOT_CLASS = "vk2015";

document.documentElement.classList.add(ROOT_CLASS);  // это сразу включает скин
chrome.storage.local.get("enabled").then(({ enabled = true }) => {
  if (!enabled) document.documentElement.classList.remove(ROOT_CLASS);
});

const LABELS = {  // это названия пунктов меню как в 2015
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

const MENU_SELECTORS = ["#layout_sidebar"];  // это где искать меню

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

function isGroupChat() {
  const status = document.querySelector(".ConvoHeader__status");
  return !!status && /участник/i.test(status.textContent);
}

function avatarSrc(box) {  // это картинка может быть тегом img или фоном
  if (!box) return "";
  const img = box.querySelector("img");
  if (img && img.src) return img.src;
  for (const el of [box, ...box.querySelectorAll("*")]) {
    const m = getComputedStyle(el).backgroundImage.match(/url\(["']?(.+?)["']?\)/);
    if (m) return m[1];
  }
  return "";
}

function decorateMessages() {  // это авы и имена в диалогах
  if (!document.documentElement.classList.contains(ROOT_CLASS)) return;

  const main = document.querySelector(".ConvoMain");
  if (!main) return;
  const group = isGroupChat();

  const header = document.querySelector(".ConvoHeader");
  const peerSrc = avatarSrc(header && header.querySelector(".ConvoHeader__avatar"));
  const title = header && header.querySelector(".ConvoTitle__author");
  const peerName = (title && title.textContent.trim()) || "Собеседник";

  const mine = [...document.querySelectorAll("#page_header img")].pop();
  const mySrc = mine ? mine.src : "";

  main.querySelectorAll("article.ConvoHistory__messageBlock").forEach((art) => {
    const out = art.classList.contains("ConvoHistory__messageBlock--out");
    if (group && !out) return;  // это чужие авы в группах рисует вк сам
    const nativeAva = [...art.querySelectorAll('[class*="Avatar"]')].some((a) => !a.closest(".ConvoMessage"));
    if (nativeAva) return;  // это родная ава есть, внутри сообщения (реакции) не считаем

    const wrap = art.querySelector(":scope > .ConvoHistory__messageWrapper");
    const content = art.querySelector(".ConvoMessage__content");
    if (!wrap || !content) return;

    const prevItem = art.closest(".VirtualScrollItem")?.previousElementSibling;
    const prev = prevItem && prevItem.querySelector("article.ConvoHistory__messageBlock");
    const first = !prev || prev.classList.contains("ConvoHistory__messageBlock--out") !== out;  // это начало серии

    let ava = art.querySelector(":scope > .vk2015-ava");
    if (!ava) {
      ava = document.createElement("div");
      ava.className = "vk2015-ava";
      ava.appendChild(document.createElement("img"));
      art.insertBefore(ava, wrap);
    }
    ava.classList.toggle("vk2015-ava--group", group);
    const src = out ? mySrc : peerSrc;
    const img = ava.firstChild;
    if (src && img.getAttribute("src") !== src) img.setAttribute("src", src);
    ava.style.visibility = first && src ? "visible" : "hidden";

    let name = wrap.querySelector(":scope > .vk2015-name");  // это имя над сообщением, а не внутри: так фото не наедет
    if (!name) {
      name = document.createElement("div");
      name.className = "vk2015-name";
      wrap.insertBefore(name, wrap.firstChild);
    }
    const label = out ? "Вы" : peerName;
    if (name.textContent !== label) name.textContent = label;
    name.style.display = first ? "block" : "none";
    name.classList.toggle("vk2015-name--on", first);
  });
}

const TAB_ICONS = { "Фото": "photo", "Музыка": "music", "Видео": "video", "Альбомы": "albums", "Клипы": "clips", "Статьи": "articles" };

function markTabIcons() {  // это вкладки профиля: метка по названию, иконку рисует css
  if (!document.documentElement.classList.contains(ROOT_CLASS)) return;
  document.querySelectorAll('[class*="TabsMenu__menuItem"]').forEach((label) => {
    const key = TAB_ICONS[label.textContent.trim()];
    const tab = label.closest(".vkuiInternalTappable");
    const ico = tab && tab.firstElementChild;
    if (key && ico && ico.dataset.vk2015Ico !== key) ico.dataset.vk2015Ico = key;
  });
}

let scheduled = false;  // это следим за страницей не чаще раза за кадр
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    renameMenu();
    decorateMessages();
    markTabIcons();
  });
}).observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", () => {
  renameMenu();
  decorateMessages();
  markTabIcons();
});
