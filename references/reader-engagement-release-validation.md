# Reader Freshness and Saved Topics Release Validation

## Homepage freshness

The development preview rendered the homepage freshness notice because the newest published story is older than the documented 72-hour threshold. The notice identifies the age of the newest story and explains that Flight Drama is showing the latest verified coverage available.

## Topics and alerts

An expanded airline topic hub loaded successfully in the development preview and displayed the sign-in-to-follow call to action for an unauthenticated reader. The `saved_topics` table and the `notifications.linkUrl` field were verified in the database. Signed-in readers can save a topic, switch its in-product alert on or off, remove it, and open a saved-topic alert directly from the notification inbox. Alert records are created only when an article is published through direct editorial creation or a draft approval flow.

## Automated checks

The freshness threshold utility, topic lookup utilities, latest-first discovery contract and saved-topic text matching are covered by the Vitest suite. The most recent run completed successfully with 4 test files and 19 tests passing. The suite now includes an integration-style assertion that a matching published article creates an actionable saved-topic notification, together with a negative check for draft editing and rejection paths.
