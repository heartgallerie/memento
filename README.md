# memento

A private, personal journal and memory archive, with **memo** as its optional AI companion.

Memento is being developed as a browser-first web app so the interface can be tested and refined quickly. A dedicated mobile app can follow later.

## Run the prototype

Requirements: Node.js 20 or newer and npm.

```bash
git clone --branch web-prototype https://github.com/heartgallerie/memento.git
cd memento
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

The current prototype is a frontend demonstration. It uses synthetic example entries and browser localStorage; it does not connect an account, import a real archive, or provide cloud sync, encryption, or a live AI model yet.

## Project principles

- **Generic application:** account connection, archive import, and profile setup happen inside Memento, not through hardcoded personal details.
- **Local-first direction:** the app should remain useful offline where practical, with explicit storage and sync behavior.
- **Private by design:** personal content should be encrypted before it leaves the device.
- **User-owned data:** entries and attachments must be exportable in open formats.
- **Transparent memory:** Memo should distinguish sourced facts from guesses and let the user inspect, edit, and remove remembered information.
- **No silent changes:** Memo's proposed edits require review and approval before they are saved.
- **Resilient backups:** sync should handle retries, conflicts, and recovery without making a cloud account the only copy.

## Planned parts

- **Journal:** write and organize entries, with rich text and attachments.
- **Archive:** import and search existing journal exports while preserving original dates and source information.
- **Profile:** an editable summary of information the user has chosen to keep.
- **Memo:** an optional AI assistant that can answer questions using the archive and approved profile, with references to source entries where possible.
- **Change review:** Memo can prepare entry/file edits, show a before-and-after diff, and apply only the exact changes the user approves.
- **Backup and restore:** encrypted backup and a clear recovery/export path.

## Privacy

Do not commit real journal exports, personal entries, attachments, API keys, model data, database files, or backups to this repository. Use synthetic test data only.

## Status

Early browser prototype. Interfaces and implementation choices may change as the project is tested.

See [the roadmap](docs/ROADMAP.md) and [architecture notes](docs/ARCHITECTURE.md).
