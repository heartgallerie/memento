// Runs in browser tabs and relays extension state into the Memento page.
chrome.runtime.onMessage.addListener(message => {
  if (message?.type === "memento-youtube-state") {
    window.postMessage({ source: "memento-youtube-bridge", title: message.title || "" }, location.origin);
  }
});

window.addEventListener("message", event => {
  if (event.source !== window || event.origin !== location.origin || event.data?.source !== "memento-app" || event.data?.type !== "youtube-state-request") return;
  chrome.runtime.sendMessage({ type: "memento-youtube-get" }, response => {
    if (chrome.runtime.lastError) return;
    window.postMessage({ source: "memento-youtube-bridge", title: response?.title || "" }, location.origin);
  });
});
