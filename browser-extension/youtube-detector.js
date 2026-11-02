// Reports a title only while a YouTube video is actively playing.
let currentVideo = null;
let lastTitle = "";

function report() {
  const video = document.querySelector("video");
  const playing = !!video && !video.paused && !video.ended && video.readyState >= 2;
  const title = playing ? (document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim() || document.title.replace(/\\s*[-|] YouTube\\s*$/i, "").trim()) : "";
  if (title !== lastTitle) {
    lastTitle = title;
    chrome.runtime.sendMessage({ type: "memento-youtube-update", title }).catch(() => {});
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
