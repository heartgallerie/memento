# Roadmap

This is a working plan, not a promise that every feature will ship in this order.

## 0. Foundations
- [x] Create the private repository.
- [x] Establish project goals and privacy rules.
- [ ] Choose the desktop application stack.
- [ ] Create the initial app shell and development instructions.

## 1. Desktop journal prototype
- [ ] Main navigation and journal list.
- [ ] Entry editor with headings, emphasis, lists, and timestamps.
- [ ] Reliable local persistence and autosave.
- [ ] Calendar / date browsing.
- [ ] Search entries.
- [ ] Attach images and other files.
- [ ] Export entries in a portable format.

## 2. Archive import
- [ ] Inspect a sample Daybook export's structure.
- [ ] Map dates, headings, text, and media references.
- [ ] Import without modifying the original export.
- [ ] Flag unmatched or ambiguous attachments for review.
- [ ] Preserve source metadata where available.

## 3. Privacy and backup
- [ ] Define the encryption and key-recovery model.
- [ ] Encrypt content and attachments before cloud upload.
- [ ] Add background backup and retry handling.
- [ ] Detect and resolve sync conflicts safely.
- [ ] Test restore on a clean installation.
- [ ] Keep manual export available regardless of cloud sync.

## 4. Memo
- [ ] Connect to a configurable local model endpoint (initially Ollama).
- [ ] Search the archive before answering personal-history questions.
- [ ] Show sources for recalled journal details.
- [ ] Maintain an editable profile with provenance.
- [ ] Separate confirmed facts, user-approved preferences, and AI hypotheses.
- [ ] Require approval before changing the profile.
- [ ] Allow individual memories to be corrected or removed.
- [ ] Let Memo prepare proposed entry and supported-file edits without writing them directly.
- [ ] Build a review screen with before/after diffs and explicit approval.
- [ ] Detect stale proposals before applying them.
- [ ] Keep revision history and allow approved changes to be reverted.
- [ ] Restrict Memo to explicitly supported files and operations.

## 5. Later
- [ ] Evaluate a mobile app after the desktop workflow is stable.
- [ ] Evaluate encrypted cloud storage and cross-device sync.
- [ ] Consider optional features only after the core journal is dependable.

## 6. Future concepts backlog — deferred

> These are ideas to return to after the current app work is stable. They are recorded for future planning only; do not treat them as current implementation tasks.

### Main profile and activity pills
- Expand the main profile with more user-configurable pills.
- Support a mix of manually maintained identity/interest pills and activity/status pills.
- Possible examples: currently listening, currently reading, playing a game, writing, watching something, current obsession, music, film, games, photography, availability / do-not-disturb, and a manually updated status.
- Spotify is the initial realistic media integration to explore for live listening status. Do not assume YouTube integration is useful or available on the user's phone.
- Consider whether pills can link to the relevant Memento page or activity history rather than being purely decorative.
- Keep automatic status sharing optional and user-controlled.

### Phone integrations and quick capture
These are future integrations to investigate, not commitments. Check Android permissions, platform restrictions, APIs, privacy implications, and feasibility before implementation.

- **Android activity / app usage:** optionally show a recent-activity pill or a summary of apps used. Android limits access to app-usage information and requires explicit user permission; avoid collecting more than needed.
- **Calendar integration:** investigate both Google Calendar and Samsung Calendar. Support upcoming events, birthdays, anniversaries, and potentially using calendar events as timeline items. Check whether Samsung Calendar data is accessible through Android's calendar provider and how account permissions work; do not assume a separate Samsung API is required or available.
- **Activity data:** optionally connect supported health/activity data sources for a small daily activity summary. Keep this opt-in and avoid turning Memento into a fitness tracker.
- **Clipboard / quick capture:** provide a deliberate way to save copied text, links, quotes, and other snippets into an inbox for later organisation. Do not silently read or continuously monitor the clipboard.
- **Android Share menu integration:** add Memento as a share target so the user can send content from other apps—such as links, text, images, articles, songs, and locations—directly into a Memento capture inbox. Let the user review and categorise captures.
- **Photos:** optionally import or reference selected recent/favourite photos and use them in memories or timeline entries. Keep permissions scoped to user-selected content where possible.
- **Weather:** consider an optional small current-weather pill if it adds personality or context, not as a core feature.

### On this day and memory resurfacing
- Create an **On this day** area that surfaces things from the same calendar date in previous years.
- Possible throwbacks: journal entries, photos, posts, logged songs/albums, people mentioned, and places visited.
- Present a small daily memory card or set of throwbacks, with links back to the original entries.
- Include controls to dismiss, hide, or limit resurfacing of particular memories.
- Consider a random-memory feature as a companion, not a replacement for date-based throwbacks.

### Journal prompts and reflection
- Add a dedicated writing-prompt area to the journal home.
- Prompt categories could include reflection, memories, people, creative writing, and future-oriented questions.
- Examples:
  - Reflection: "What has changed about you recently?"
  - Memories: "What's a small moment you wish you could revisit?"
  - People: "Who has influenced you more than they probably realise?"
  - Creative: "Describe a place without mentioning its name."
  - Future: "What would you like your life to look like a year from now?"
- Allow a new prompt on demand and optionally rotate daily prompts.
- Later, explore prompts generated from the user's own existing entries so they feel relevant rather than generic.
- Make it easy to start a normal journal entry from a prompt, but never make journalling feel like a compulsory task.

### Directory / personal wiki
- Revisit the People section as a broader **Directory** or personal wiki: a set of editable pages about people, places, topics, and things.
- **People pages:** give each person a small editable social-profile-like page with a name, avatar/cover, description, social links, birthday, tags, notes, photos, and related memories or journal entries.
- **Places pages:** document locations with a name, cover/photos, address or map location, description, personal notes, visits, and related people/events/entries.
- **Topics pages:** document artists, films, games, interests, projects, and other subjects.
- **Things pages:** document objects, possessions, collections, and items with stories attached.
- Each page could support custom fields, tags/categories, links, images, attachments, and a timeline of related journal entries.
- Support relationships between pages, such as "related to", "visited with", "created by", and "located in".
- Consider custom page types later so the user is not restricted to a fixed set of categories.
- The goal is a personal Wikipedia of the user's life, not merely a contacts list. Keep it editable and enjoyable to organise.

### Life Timeline
- Explore a chronological **Life Timeline** assembled from existing Memento data.
- Potential items: journal entries, people added, places visited, events, logged music, and projects started.
- Allow filtering by people, places, music, projects, or showing everything.
- Connect timeline items back to their source pages and entries.
- The Directory describes what something is; the Journal captures what the user was thinking; the Timeline shows when things happened.

### Cloud AI / cross-device Memo
The current local-model approach is not suitable for a phone that cannot run the same models comfortably. Revisit a cloud-backed AI option so Memo can be used from a phone, PC, or other device without depending on the user's PC being online or powerful enough to host inference.

- Investigate hosted inference providers, especially **Cloudflare Workers AI** (the likely service discussed), alongside other providers and their current free tiers, model catalogue, limits, latency, pricing, data handling, and regional availability. Do not assume free usage will cover normal long-term use.
- Distinguish the pieces: Memento's backend handles authentication, conversation history, memory retrieval, permissions, and provider routing; a hosted inference provider runs the model. Cloudflare Workers can host backend logic, while Workers AI provides model inference.
- Keep the model provider interchangeable behind a common API so Memento is not permanently tied to Cloudflare. Retain optional local Ollama support on PC as another provider/fallback.
- Make conversation history available across devices.
- Let Memo reference relevant journal entries and Directory pages, with source links when recalling personal details.
- Explore using Memo for conversational journalling: the user can talk through their day, receive thoughtful follow-up questions, and optionally turn parts of the conversation into journal entries. Do not force every conversation to become an entry.
- Potential abilities: help the user start writing, reflect on older entries, connect related memories, and understand relevant People / Places / Topics pages.
- Use retrieval to send only relevant context to the model rather than the entire archive with every request.
- Provide clear controls for which memories, entries, and personal data cloud AI can access. Explain what is sent to the provider and when; make cloud access opt-in and respect excluded/private entries.
- Review privacy, security, retention, provider terms, API-key protection, rate limits, and cost before choosing an implementation.
- Keep AI-generated inferences distinct from user-confirmed facts. Never silently rewrite the user's archive or profile.

### Suggested order when these ideas are revisited
1. Main profile pill concepts and Spotify activity.
2. Directory foundations: People, Places, Topics, and Things.
3. On this day and journal prompts.
4. Android quick capture and Share menu, then evaluate calendar and other phone integrations.
5. Life Timeline, once enough data types are connected.
6. Cloud AI research and architecture, then a small cross-device Memo prototype.

These priorities are provisional. Reliable storage, backup, privacy, and the existing core app experience remain more important than adding integrations.

