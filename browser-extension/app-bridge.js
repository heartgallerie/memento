// Relay extension state into the Memento page. Safe to inject more than once.
if (!globalThis.__mementoAppBridgeInstalled) {
  globalThis.__mementoAppBridgeInstalled = true;

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type === "memento-youtube-state") {
      window.postMessage({ source: "memento-youtube-bridge", title: message.title || "" }, location.origin);
    }
  });

  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin ||
        event.data?.source !== "memento-app" || event.data?.type !== "youtube-state-request") return;

    try {
      chrome.runtime.sendMessage({ type: "memento-youtube-get" }, response => {
        if (chrome.runtime.lastError) return;
        window.postMessage({ source: "memento-youtube-bridge", title: response?.title || "" }, location.origin);
      });
    } catch {}
  });
}