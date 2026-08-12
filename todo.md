# Flight Drama Platform TODO

## Phase 1: Foundation
- [x] Upload brand logo asset to Manus storage
- [x] Set up global CSS design system (black/yellow brand, typography, animations)
- [x] Configure dark theme with Flight Drama brand colours in index.css

## Phase 2: Database Schema
- [x] articles table (title, slug, content, excerpt, category, tags, author, featuredImage, videoUrl, postType, views, publishedAt)
- [x] categories table (name, slug, description, colour)
- [x] authors table (name, bio, avatar, social links)
- [x] forum_boards table (name, slug, description, icon)
- [x] forum_threads table (boardId, userId, title, content, views, isPinned, isLocked)
- [x] forum_replies table (threadId, userId, content, parentReplyId)
- [x] newsletter_subscribers table (email, name, status, tier, subscribedAt)
- [x] pro_memberships table (userId, stripeCustomerId, stripeSubscriptionId, status, expiresAt)
- [x] ad_slots table (position, label, content, isActive)
- [x] redirects table (oldPath, newPath, statusCode)
- [x] Generate and apply migration SQL

## Phase 3: Backend Routers
- [x] articles router (list, getBySlug, getByCategory, search, create, update, delete)
- [x] categories router (list, getBySlug)
- [x] forum router (boards, threads, replies, create, vote)
- [x] newsletter router (subscribe, unsubscribe, list for admin)
- [x] crm router (subscriber stats, engagement metrics, user management)
- [x] stripe router (createCheckout, webhook, getSubscription)
- [x] redirects router (resolve old WP URLs)
- [x] admin router (post management, user management, ad slots)

## Phase 4: Homepage & Navigation
- [x] Global navigation header with Flight Drama logo, nav links, search, auth
- [x] Breaking news ticker
- [x] Hero section with featured article
- [x] Masonry/grid news feed mixing articles, social embeds, video cards
- [x] Category filter tabs
- [x] Sidebar with trending articles, newsletter CTA, social follow links
- [x] Footer with links, social, newsletter
- [x] Scroll to top button

## Phase 5: Content Pages
- [x] Article detail page (full content, author, tags, share buttons, related articles)
- [x] Video section page with embedded player and video grid
- [x] Forum boards listing page
- [x] Forum thread listing page (ForumBoardPage)
- [x] Forum thread detail page with threaded replies
- [x] Create thread / reply form (authenticated)
- [x] Category archive page

## Phase 6: Newsletter & Membership
- [x] Newsletter signup page and modal
- [x] Email capture with welcome email trigger
- [x] Flight Drama Pro membership page
- [x] Stripe checkout integration
- [x] Pro member dashboard (manage subscription)
- [x] SEO 301 redirects from old WordPress URL structure

## Phase 7: CRM Admin Backend
- [x] Admin dashboard overview (stats: articles, subscribers, members, revenue)
- [x] Article management (list, search, delete, bulk ops)
- [x] Subscriber management (list, filter, search, export)
- [x] User management (list, roles)
- [x] Ad slot management (toggle active/inactive)

## Phase 8: Testing & Polish
- [x] Vitest tests for key routers (7 tests passing)
- [x] Mobile responsiveness on all pages
- [x] Scroll to top on all pages
- [x] Breaking news ticker
- [x] 89 articles seeded with redirects
- [x] Forum boards and demo threads seeded
- [x] Newsletter subscribers seeded
- [x] Ad slots seeded

## Usability Release: Latest, Discovery, and Reading Experience
- [x] Make latest stories the default across homepage modules and present Top Stories as a separate user-selectable view.
- [x] Redesign the home feed for rapid mobile scanning with a clear lead story, compact breaking row, and consistent story-card metadata.
- [x] Add mobile-friendly predictive search with popular airline, airport, and aircraft discovery routes.
- [x] Expand category pages into topic hubs and add reusable airline, airport, and aircraft topic views.
- [x] Improve article readability with estimated reading time, clear publication details, optional table of contents, image attribution, sticky sharing, and contextual related coverage.
- [x] Add automated tests for latest-first ordering, discovery results, and article reading utilities.

## Reader Freshness and Saved Topics Release
- [x] Add a homepage freshness notice when the newest published story exceeds a documented age threshold.
- [x] Expand the curated topic hub catalogue with additional airlines and regional airports.
- [x] Add persistent saved-topic preferences for authenticated readers.
- [x] Add an in-product alert inbox and alert preference controls for new saved-topic stories.
- [x] Integrate new-story alert creation into the article publishing flow without affecting draft or rejected articles.
- [x] Add automated tests for freshness thresholds, saved-topic preferences, and new-story alerts.
- [x] Add an integration-style test for notification creation and article destination when a matching story is published.
- [x] Add a test confirming draft and rejected flows do not create saved-topic notifications.
