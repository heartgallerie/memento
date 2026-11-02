// Report a title only while a YouTube video is actively playing.
if (!globalThis.__mementoYoutubeDetectorInstalled) {
  globalThis.__mementoYoutubeDetectorInstalled = true;

  let currentVideo = null;
  let lastTitle = "";
  let lastPlaying = false;
  let lastSentAt = 0;

  function send(title) {
    try {
      chrome.runtime.sendMessage({ type: "memento-youtube-update", title }).catch(() => {});
    } catch {
      // The background script may be restarting; the next heartbeat retries.
    }
  }

  function report() {
    const video = document.querySelector("video");
    const playing = !!video && !video.paused && !video.ended && video.readyState >= 2;
    const title = playing
      ? (document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim()
        || document.title.replace(/\s*[-|] YouTube\s*$/i, "").trim())
      : "";

    if (title !== lastTitle || playing !== lastPlaying || (playing && Date.now() - lastSentAt > 5000)) {
      lastTitle = title;
      lastPlaying = playing;
      lastSentAt = Date.now();
      send(title);
    }

    if (video && video !== currentVideo) {
      currentVideo = video;
      ["play", "playing", "pause", "ended", "emptied"].forEach(name => video.addEventListener(name, report));
    }
  }

  new MutationObserver(report).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener("visibilitychange", report);
  setInterval(report, 1200);
  report();
}