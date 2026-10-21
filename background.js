// Клик по иконке расширения включает или выключает скин и перезагружает вкладку
chrome.action.onClicked.addListener(async (tab) => {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  await chrome.storage.local.set({ enabled: !enabled });
  chrome.action.setBadgeText({ text: enabled ? "off" : "" });
  if (tab && tab.id) chrome.tabs.reload(tab.id);
});

chrome.runtime.onStartup.addListener(async () => {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  chrome.action.setBadgeText({ text: enabled ? "" : "off" });
});
