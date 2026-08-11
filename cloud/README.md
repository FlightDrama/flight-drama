# Flight Drama Cloud Components

This directory preserves the current cloud-computer components that support the Flight Drama application. It is included alongside the main application source so the operational setup can be restored without relying on a single machine.

| Directory | Purpose |
|---|---|
| `flight-drama-cms/` | Content-management service source and public assets. |
| `flight-drama-prerender/` | Page prerendering utility source. |
| `flight-drama-images/` | Current local image assets used by the supporting workflows. |
| `flight-drama-cron/` | Automation source code and system-job support scripts. |

Secrets, dependency folders, logs, temporary files, and historical backups are intentionally excluded. Restore environment variables only from a secure secret manager or the relevant service configuration; do not commit them to this repository.
