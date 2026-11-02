# memento

A private, personal journal and memory archive, with **memo** as its optional AI companion.

Memento is being developed desktop-first so the experience can be tested and refined before considering a mobile version.

## Project principles

- **Local-first:** entries are saved on the device immediately; the app should remain useful offline.
- **Private by design:** personal content should be encrypted before it leaves the device.
- **User-owned data:** entries and attachments must be exportable in open formats.
- **Transparent memory:** memo should distinguish sourced facts from guesses and let the user inspect, edit, and remove remembered information.
- **No silent changes:** suggested profile updates require user approval.
- **Resilient backups:** sync should handle retries, conflicts, and recovery without making a cloud account the only copy.

## Planned parts

- **Journal:** write and organize entries, with rich text and attachments.
- **Archive:** import and search existing journal exports while preserving original dates and source information.
- **Profile:** an editable summary of information the user has chosen to keep.
- **Memo:** an optional AI assistant that can answer questions using the archive and approved profile, with references to source entries where possible.
- **Backup and restore:** encrypted backup and a clear recovery/export path.

## Development approach

The first milestone is a desktop prototype with a local journal store and a usable interface. Cloud sync, encryption, archive import, and AI integration will be introduced in deliberate stages and tested independently.

See [the roadmap](docs/ROADMAP.md) and [architecture notes](docs/ARCHITECTURE.md).

## Privacy

Do not commit journal exports, personal entries, attachments, API keys, model data, database files, or backups to this repository. Use synthetic test data only.

## Status

Early planning / prototype stage. Interfaces and implementation choices may change as the project is tested.
