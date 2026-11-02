const playingByTab = new Map();

function currentState() {
  const active = [...playingByTab.values()].filter(item => item.title).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return active?.title || "";
}

async function broadcast() {
  const title = currentState();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map(tab => tab.id == null ? Promise.resolve() : chrome.tabs.sendMessage(tab.id, { type: "memento-youtube-state", title }).catch(() => {})));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "memento-youtube-update" && sender.tab?.id != null) {
    const id = sender.tab.id;
    if (typeof message.title === "string" && message.title.trim()) {
      playingByTab.set(id, { title: message.title.trim(), updatedAt: Date.now() });
    } else {
      playingByTab.delete(id);
    }
    broadcast();
  }
  if (message?.type === "memento-youtube-get") {
    sendResponse({ title: currentState() });
  }
});

chrome.tabs.onRemoved.addListener(id => {
  playingByTab.delete(id);
  broadcast();
});

chrome.tabs.onUpdated.addListener((id, changeInfo) => {
  if (changeInfo.url && !/youtube\.com\//i.test(changeInfo.url)) {
    playingByTab.delete(id);
    broadcast();
  }
});
