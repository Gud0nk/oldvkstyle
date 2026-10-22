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

let groupCheck = { t: 0, value: false };

function isGroupChat(main) {
  const now = Date.now();
  if (now - groupCheck.t > 1000) {
    groupCheck = { t: now, value: /участник/i.test((main.textContent || "").slice(0, 400)) };
  }
  return groupCheck.value;
}

function decorateMessages() {  // это авы и имена в диалогах
  if (!document.documentElement.classList.contains(ROOT_CLASS)) return;

  const main = document.querySelector(".ConvoMain");
  if (!main) return;
  const group = isGroupChat(main);

  const outside = (selector) =>
    [...main.querySelectorAll(selector)].find((e) => !e.closest(".ConvoHistory"));

  const peerImg = outside("img");
  const peerSrc = peerImg ? peerImg.src : "";
  const peerTitle = outside(".PeerTitle__title");
  const peerName = (peerTitle && peerTitle.textContent.trim()) || "Собеседник";

  const mine = [...document.querySelectorAll("#page_header img")].pop();
  const mySrc = mine ? mine.src : "";

  main.querySelectorAll("article.ConvoHistory__messageBlock").forEach((art) => {
    const out = art.classList.contains("ConvoHistory__messageBlock--out");
    if (group && !out) return;  // это чужие авы в группах рисует вк сам
    if (art.querySelector('[class*="Avatar"]')) return;

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

let scheduled = false;  // это следим за страницей не чаще раза за кадр
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
