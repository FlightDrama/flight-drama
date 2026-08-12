# Usability Release Validation

## Development preview checks

- The homepage rendered with the simplified public navigation: Latest, Topics, Videos, Forum, Newsletter and Pro.
- The homepage selected the Latest tab by default and displayed the compact Live now story strip beneath the lead section.
- The new `/topics` page rendered its grouped Airline, Airport, Aircraft and Story hubs with clear labels, descriptions and direct links.
- The topic hub layout used responsive grids that collapse naturally from three columns on desktop to fewer columns at narrower widths.
- The `/topic/ryanair` hub returned a distinct Top coverage area and a Latest coverage area ordered by publication date.
- The global `/news?search=Ryanair` route preserved the reader query in the archive search box, displayed the latest-first sort control, and exposed related topic-hub links.
- A representative article page rendered its published and updated timestamps, estimated reading time, image attribution, audio player, sticky share control, table of contents and contextual related-story links.

## Automated checks

- `pnpm check` completed successfully after the release changes.
- `pnpm test` completed successfully with 4 test files and 13 tests passing, including router-level coverage that article-list requests default to latest-first and preserve a reader discovery query.
- Popularity-based material is confined to the explicitly labelled Top Stories and Most Read experiences; the duplicate unlabelled Trending sidebar was removed.
