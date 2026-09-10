# AI Safety & Security Monitor
Public terminal: https://jrohsc.github.io/ai-safety-monitor/

Source lives in `terminal-source/`. The workflow `.github/workflows/ai-safety-monitor.yml` builds the existing Jekyll homepage plus the terminal, and refreshes public research metadata on a 15-minute schedule. GitHub may delay scheduled runs. Per-source failure states and snapshot timestamps appear in the app; failed sources retain their last available data.

No personal bookmarks, watchlists, credentials or browsing history are included in the published snapshot. Browser preferences stay local to each visitor.

An optional repository secret `OPENALEX_API_KEY` improves metadata access. The app can run without it, with rate-limit status displayed if applicable.
