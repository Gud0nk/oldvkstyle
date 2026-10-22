chrome.action.onClicked.addListener(async (tab) => {  // это клик по иконке включает и выключает скин
  const { enabled = true } = await chrome.storage.local.get("enabled");
  await chrome.storage.local.set({ enabled: !enabled });
  chrome.action.setBadgeText({ text: enabled ? "off" : "" });
  if (tab && tab.id) chrome.tabs.reload(tab.id);
});

chrome.runtime.onStartup.addListener(async () => {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  chrome.action.setBadgeText({ text: enabled ? "" : "off" });
});
