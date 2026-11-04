const playingByTab = new Map();
let restorePromise;

async function restoreState() {
  if (!restorePromise) {
    restorePromise = chrome.storage.session.get("mementoPlayingByTab").then(({ mementoPlayingByTab }) => {
      for (const [id, item] of Object.entries(mementoPlayingByTab || {})) {
        if (item && typeof item.title === "string" && item.title) playingByTab.set(Number(id), item);
      }
    }).catch(() => {});
  }
  await restorePromise;
}

async function saveState() {
  await chrome.storage.session.set({ mementoPlayingByTab: Object.fromEntries(playingByTab) }).catch(() => {});
}

function currentState() {
  const current = [...playingByTab.entries()]
    .filter(([, item]) => item.title && Date.now() - item.updatedAt < 15000)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)[0];
  return current ? { title: current[1].title, tabId: current[0] } : { title: "", tabId: null };
}

async function broadcast() {
  await restoreState();
  const state = currentState();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map(tab => tab.id == null
    ? Promise.resolve()
    : chrome.tabs.sendMessage(tab.id, { type: "memento-youtube-state", title: state.title, tabId: state.tabId }).catch(() => {})));
}

async function injectIntoExistingTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    let file = null;
    if (/^https:\/\/(www\.)?youtube\.com\//i.test(tab.url)) file = "youtube-detector.js";
    else if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.3\.218)(:\d+)?\//i.test(tab.url)) file = "app-bridge.js";
    if (file) await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [file] }).catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(() => injectIntoExistingTabs());
chrome.runtime.onStartup.addListener(() => injectIntoExistingTabs());

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "memento-youtube-update" && sender.tab?.id != null) {
    restoreState().then(async () => {
      const id = sender.tab.id;
      if (typeof message.title === "string" && message.title.trim()) {
        playingByTab.set(id, { title: message.title.trim(), url: sender.tab.url || "", updatedAt: Date.now() });
      } else {
        playingByTab.delete(id);
      }
      await saveState();
      await broadcast();
    });
  }
  if (message?.type === "memento-youtube-get") {
    restoreState().then(() => sendResponse(currentState()));
    return true;
  }
  if (message?.type === "memento-youtube-open-tab") {
    restoreState().then(async () => {
      const requestedId = Number.isInteger(message.tabId) ? message.tabId : currentState().tabId;
      const playing = requestedId == null ? null : playingByTab.get(requestedId);
      if (requestedId == null || !playing || Date.now() - playing.updatedAt >= 15000) {
        sendResponse({ ok: false, reason: "No active YouTube tab was found." });
        return;
      }
      const tab = await chrome.tabs.get(requestedId).catch(() => null);
      if (!tab || !/^https:\/\/(www\.)?youtube\.com\//i.test(tab.url || "")) {
        sendResponse({ ok: false, reason: "The YouTube tab is no longer available." });
        return;
      }
      try {
        await chrome.tabs.update(requestedId, { active: true });
        if (tab.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, reason: String(error) });
      }
    }).catch(error => sendResponse({ ok: false, reason: String(error) }));
    return true;
  }
});

chrome.tabs.onRemoved.addListener(id => {
  restoreState().then(async () => {
    playingByTab.delete(id);
    await saveState();
    broadcast();
  });
});

chrome.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  if (changeInfo.url && !/youtube\.com\//i.test(changeInfo.url)) {
    restoreState().then(async () => {
      playingByTab.delete(id);
      await saveState();
      broadcast();
    });
  }
  if (changeInfo.status === "complete" && tab.url) {
    if (/^https:\/\/(www\.)?youtube\.com\//i.test(tab.url)) {
      chrome.scripting.executeScript({ target: { tabId: id }, files: ["youtube-detector.js"] }).catch(() => {});
    } else if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.3\.218)(:\d+)?\//i.test(tab.url)) {
      chrome.scripting.executeScript({ target: { tabId: id }, files: ["app-bridge.js"] }).catch(() => {});
    }
  }
});

restoreState();