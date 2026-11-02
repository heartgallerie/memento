# Memento YouTube now-playing companion

This small Chromium extension is needed because a normal website cannot read the title or playback state of another tab. It shares only the current YouTube video title with Memento; it does not read watch history, account details, or video contents.

## Install in Edge or Chrome

1. Pull the latest `web-prototype` branch.
2. Open `edge://extensions` (Edge) or `chrome://extensions`.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select the repository's `browser-extension` folder.
5. Keep the extension enabled, open Memento, then enable **Settings → Now playing → YouTube**.
6. Open a YouTube video in another tab and press Play. The red YouTube pill should appear on your Memento profile. Pause or close the video and it should disappear.

The extension requests broad site access so its lightweight bridge can deliver the title to a locally hosted or deployed Memento tab. The detector itself only runs on YouTube. You can inspect the three small source files before loading it, and remove it at any time from the browser's extensions page.

This is a local browser-extension integration, not a server connection. Spotify is listed in Settings but still needs a Spotify OAuth app configuration before live playback can be read.
