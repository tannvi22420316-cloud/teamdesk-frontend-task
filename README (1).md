# TeamDesk — Employee Self-Service Portal (Frontend Task)

A responsive static website built for the Sciqus Infotech frontend assessment.

## Concept
Instead of six generic placeholder boxes, this is framed as a real product: an internal employee self-service dashboard ("TeamDesk"). This mirrors the kind of product Sciqus itself builds (AMS / Employee Portal / Vendor Portal), so it doubles as a relevant, on-brief design choice.

## Layout mapping to the task spec
- **Header** — sticky top bar with logo, hamburger (mobile only), date, avatar.
- **Sidebar** — Dashboard / My Requests / Documents / Directory / Settings.
  Static column on desktop; slides in as an off-canvas drawer on mobile via
  the hamburger button.
- **Container 1** — Auto-rotating announcement carousel (3 slides, dot nav,
  pauses on hover).
- **Container 2** — Text block: "Today at a glance" summary list.
- **Container 3** — Manual slider with prev/next arrow buttons: "Company
  updates" (4 cards).
- **Container 4** — Upcoming holidays list with live countdown chips showing
  whether each holiday is today, tomorrow, or X days away.
- **Container 5** — Two quick action buttons ("Apply for Leave" and "Raise a
  Ticket") that toggle active purple styling on click and open matching modal
  request forms.
- **Container 6** — Auto-rotating, fade-animated "Team spotlight" testimonial
  slider.

## Pages
All five pages share the same header, sidebar, and design language:
- `index.html` — Dashboard (the 6 required containers) with quick-action modal
  forms for leave requests and support tickets, plus live toast feedback.
- `requests.html` — My Requests: filterable list (All/Pending/Approved/Rejected)
  plus a modal "New Request" form that appends a pending request to the list
  and updates the sidebar pending badge.
- `documents.html` — Documents: searchable grid of document cards with a Download
  action, result counters, and matching document icon styling.
- `directory.html` — Directory: searchable employee list with a Message action,
  live counts, and floating chat popups for quick employee messaging.
- `settings.html` — Settings: profile form, profile photo widget with a camera
  icon and edit badge, and notification toggle switches.

## Tech
Plain HTML5, CSS3 (Grid + Flexbox, media queries, no framework), and vanilla
JavaScript. No build step — open `index.html` directly or serve statically.
`script.js` is shared across all five pages; every block checks that its
target elements exist before wiring up, so it works safely on every page.
The current version also includes modal-based form flows for leave requests,
new requests, and ticket submission, live toast notifications, a dynamic
pending-request badge in the sidebar, holiday countdown chips, document and
employee result counters, and floating chat popups on the Directory page.

## Run locally
```bash
# Option 1: just open the file
open index.html          # macOS
start index.html         # Windows

# Option 2: serve it (recommended, avoids any file:// quirks)
python -m http.server 8000
# then visit http://localhost:8000
```

## Responsive behavior
- **≥1025px**: full sidebar + asymmetric 12-column grid (announcement banner
  full-width, then paired cards).
- **769–1024px**: sidebar stays, cards stack to full width one at a time.
- **≤768px**: sidebar becomes an off-canvas drawer (hamburger menu), all
  containers stack in a single column, buttons stack vertically, and the
  profile/photo widget layout compresses cleanly.

