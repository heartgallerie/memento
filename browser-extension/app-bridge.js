// Relay extension state into the Memento page. Safe to inject more than once.
if (!globalThis.__mementoAppBridgeInstalled) {
  globalThis.__mementoAppBridgeInstalled = true;

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type === "memento-youtube-state") {
      window.postMessage({ source: "memento-youtube-bridge", title: message.title || "", channelName: message.channelName || "", tabId: message.tabId ?? null }, location.origin);
    }
  });

  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin ||
        event.data?.source !== "memento-app") return;

    if (event.data?.type === "youtube-open-tab") {
      try { chrome.runtime.sendMessage({ type: "memento-youtube-open-tab", tabId: Number.isInteger(event.data.tabId) ? event.data.tabId : null }); } catch {}
      return;
    }
    if (event.data?.type !== "youtube-state-request") return;

    try {
      chrome.runtime.sendMessage({ type: "memento-youtube-get" }, response => {
        if (chrome.runtime.lastError) return;
        window.postMessage({ source: "memento-youtube-bridge", title: response?.title || "", channelName: response?.channelName || "", tabId: response?.tabId ?? null }, location.origin);
      });
    } catch {}
  });
}