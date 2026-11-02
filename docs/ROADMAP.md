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
