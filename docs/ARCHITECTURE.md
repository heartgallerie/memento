# Architecture notes

## Product boundaries

- **Memento** is the journal, archive, profile, and data-management application.
- **Memo** is an optional assistant inside Memento. It is not the source of truth for the archive.
- The application must be generic. Account connection, archive import, and profile setup happen inside Memento; no personal account details or journal content are hardcoded into the application or repository.

The original journal entries remain the canonical record. A generated profile is a compact, editable index of useful context, not a replacement for the entries.

## Desktop-first milestones

Start with a desktop prototype to refine the writing experience and information architecture. Keep storage and AI access behind clear interfaces so the desktop implementation can later be replaced or complemented by a mobile client.

The initial prototype should work without an internet connection and without an AI model.

## Data layers

1. **Original archive:** imported entries and attachments, preserved with source metadata.
2. **Working journal:** entries created or edited in Memento.
3. **Profile:** user-approved facts and preferences, each with provenance where possible.
4. **Memo retrieval index:** searchable references into the archive; it must be rebuildable from source data.
5. **Conversation history:** separate from journal entries unless the user explicitly chooses to save something.
6. **Change proposals and revisions:** pending AI edits are kept separate from saved content; approved changes create a revision that can be reviewed and reverted.

## Privacy requirements

- Store journal content locally first.
- Encrypt private content and attachments before sending them to any cloud provider.
- Never commit real journal content, exports, attachments, databases, credentials, or backups to Git.
- Keep encryption keys separate from cloud-stored ciphertext.
- Design and test recovery before relying on encrypted cloud backup. If the only key is lost, encrypted data may be unrecoverable.
- Be clear that cloud providers may still see operational metadata such as account identity, file sizes, and access times.
- Provide portable export and restore paths.

## Memo behavior

- Retrieve relevant source entries for factual questions about the user's past.
- Cite or link back to the source entry when possible.
- Do not present an inference as a confirmed fact.
- Suggest profile edits rather than silently applying them.
- Let the user inspect, correct, and remove profile items.
- Do not treat the model's conversation context as a reliable archive.

## Proposed change workflow

Memo may be allowed to create or edit supported workspace content when the user explicitly instructs it to do so. It must never silently write those changes.

1. **Prepare:** Memo creates a pending proposal, not a direct write to the saved entry or file.
2. **Review:** Memento shows the target, operation, and a readable before/after diff. New content and deletions must be clearly identified.
3. **Confirm:** The user explicitly approves the proposal. No approval means no change.
4. **Apply:** Memento verifies the target has not changed since the proposal was prepared, then applies the approved change.
5. **Recover:** Keep revision history sufficient to inspect and revert an applied change.

Additional safeguards:
- Approval is specific to the displayed proposal; edits made after approval require a new review.
- If the target changed while the proposal was pending, stop and regenerate the diff rather than overwrite newer content.
- Deletions and bulk changes need especially clear review and explicit confirmation.
- Keep a record of what changed, when, and whether it was initiated by Memo or the user.
- Define supported file types and permitted operations explicitly. Do not give Memo unrestricted access to the user's filesystem.
- Imported original archive material should remain preserved; edits should normally create a working copy or a separately versioned revision.

## Initial technical direction (not yet locked)

A desktop shell with a web-based UI is a reasonable prototype path. Keep the UI, local persistence, archive import, retrieval, change proposal/review, and model-provider integration as separate modules. Choose the exact framework after checking the development setup and trade-offs.

For local AI, begin with a configurable OpenAI-compatible endpoint so a local Ollama server can be used without making the app depend on one model vendor.
