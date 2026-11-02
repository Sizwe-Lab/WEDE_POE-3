# Toronto Cupcake – WEDE POE

A multi-page website for **Toronto Cupcake**, a boutique cupcake bakery and gifting service.

| | |
|---|---|
| **Live site** | `https://YOUR-SITE.netlify.app` *(replace after deploying – see [Deployment](#deployment))* |
| **GitHub repository** | `https://github.com/YOUR-USERNAME/YOUR-REPO` *(replace)* |
| **Pages** | Home, About, Products, Enquiry, Contact |
| **Tech** | HTML5, CSS3 (Grid / Flexbox / media queries), vanilla JavaScript (ES2020), Leaflet 1.9.4 |

---

## Contents

1. [Project structure](#project-structure)
2. [Part 3 – what was added](#part-3--what-was-added)
3. [SEO implementation](#seo-implementation)
4. [Forms and validation](#forms-and-validation)
5. [Security and performance](#security-and-performance)
6. [Deployment](#deployment)
7. [Testing and responsive evidence](#testing-and-responsive-evidence)
8. [Known issues / to-do before submission](#known-issues--to-do-before-submission)
9. [Changelog](#changelog)
10. [References](#references)

---

## Project structure

```
├── index.html / about.html / products.html / enquiry.html / contact.html
├── css/style.css              Single external stylesheet (Part 2 + Part 3 additions)
├── js/script.js               All site JavaScript (Part 3)
├── images/                    Original images
│   └── optimised/             Responsive WebP versions (480 px and 960 px wide)
├── vendor/leaflet/            Self-hosted Leaflet 1.9.4 (map library, BSD-2 licence)
├── robots.txt                 Crawler instructions
├── sitemap.xml                List of pages for search engines
├── _headers                   Security headers (Netlify)
└── docs/screenshots/          Responsive and feature evidence used in this README
```

---

## Part 3 – what was added

### JavaScript enhancements (`js/script.js`)

| Requirement | Implementation | Where |
|---|---|---|
| Accordion | Mission / Vision / Audience on the About page are an accessible accordion (`aria-expanded`, `aria-controls`, one open at a time, arrow / Home / End keys). Content stays visible if JavaScript is off. | `about.html`, `initAccordion()` |
| Interactive map | Leaflet + OpenStreetMap map of the three delivery hubs with popups, tooltips and "Show on map" buttons that fly to each hub. | `contact.html`, `initMap()` |
| Animations and transitions | CSS keyframe fade-ups on page headings, scroll-reveal on cards (IntersectionObserver adds `.in-view`), accordion height transition, lightbox fade. All disabled automatically for visitors who set *reduce motion*. | `style.css`, `initReveal()` |
| Advanced DOM manipulation | Product cards, the product dropdown, the contact-topic dropdown, the lightbox, form error messages and both response panels are built with `createElement` / `replaceChildren`. User text is only ever written with `textContent`. | `el()` helper and every `init*()` function |
| Gallery with lightbox | Click any product image to enlarge it. Previous / next buttons, ← → keys, Esc, click-outside-to-close, focus trap, and focus returns to the clicked image. Navigates only the products currently shown. | `lightbox`, `initProducts()` |
| Dynamic content | The product catalogue is rendered from a `PRODUCTS` data array. The Enquiry page product dropdown is built from the same array so prices cannot drift out of sync. | `PRODUCTS`, `initProducts()` |
| Search and sort | Live search (name, description, category), sort (featured, price low→high, price high→low, A–Z), the existing category filter, a "Showing X of Y" status, and a "no results" state with a reset button. All three controls work together. | `products.html`, `initProducts()` |

### Form functionality

See [Forms and validation](#forms-and-validation).

---

## SEO implementation

### On-page SEO

* **Keyword research / targeting** – Target phrases were chosen from the bakery's offer and location, not from a paid keyword tool, and should be checked against Google Search Console after launch:
  *cupcakes Toronto*, *gourmet cupcakes*, *corporate gift boxes Toronto*, *vegan cupcakes Toronto*, *wedding cupcakes Toronto*, *cupcake delivery North York / Scarborough*.
* **Title tags and meta descriptions** – Every page has a unique title (under about 65 characters) and a unique 120–160 character description containing its main keywords.
* **Header tags** – One `<h1>` per page, then `<h2>` / `<h3>` in order. Footer headings were changed from `<h3>/<h4>` to styled paragraphs so heading levels are not skipped.
* **Image optimisation** – Descriptive file names, descriptive `alt` text, explicit `width`/`height`, `srcset` + `sizes` so phones download the small file, `loading="lazy"` below the fold, `fetchpriority="high"` on the hero.
* **URL structure** – Short, lowercase, descriptive file names (`products.html`, `enquiry.html`). Netlify and GitHub Pages also serve them without the `.html`.
* **Internal linking** – Keyword-rich contextual links between pages (e.g. Home → "gourmet cupcake collection", About → "request a quote", Products → "Request a quote"); "Explore more" links now name the product; footer now links to all five pages.
* **Mobile-friendliness** – Responsive layout with breakpoints at 768 px and 1024 px, viewport tag, and a repaired mobile menu.
* **Structured data (JSON-LD)** – `Bakery` (local business) on Home and Contact; `ItemList` of `Product` with CAD prices on Products.
* **Social sharing** – Open Graph and Twitter Card tags on every page; canonical URL on every page.

### Off-page / local SEO (what can be done in code, and what must be done by the owner)

* **Local SEO** – `Bakery` structured data with `areaServed` (Downtown Toronto, North York, Scarborough), opening hours, phone and email. The phone/email/hours match on Contact, structured data and footer so the business details are consistent.
* **Backlinks and social media** – These cannot be built in code. Recommended actions: create Google Business Profile, Instagram / Facebook / Pinterest pages (footer icons currently point to `#` and should be replaced with real profile URLs), and ask event planners and local blogs to link to the site.

### Additional requests

* `robots.txt` – allows crawling, blocks `/vendor/`, points to the sitemap.
* `sitemap.xml` – all five pages with `lastmod`, `changefreq`, `priority`.
* **Page speed** – images re-encoded to WebP (the largest original, 1.9 MB, is now a 110 KB file), responsive `srcset`, lazy loading, `defer` on scripts, no render-blocking third-party code (Leaflet is self-hosted), long cache headers for images/vendor on Netlify.
* **Security** – see below.

---

## Forms and validation

Both forms use semantic HTML (`label`, `input`, `select`, `textarea`, `autocomplete`, `inputmode`, `required`, `min/max`, `minlength/maxlength`) **and** JavaScript validation (`novalidate` is set so the custom messages are shown instead of the browser's).

| Field | Rule |
|---|---|
| Name | Required, 2–60 characters, letters / spaces / `-` `'` `.` only |
| Email | Required, valid format, max 254 characters |
| Phone | Optional; if given, digits / spaces / `+ ( ) - .` only, 10–15 digits |
| Event type, product, message type | Required (must choose an option) |
| Quantity (enquiry) | Required whole number 1–500 |
| Date needed (enquiry) | Required; at least 2 days ahead; within 12 months; not a Sunday (shop closed) |
| Message | Required, 10–1000 characters, live character counter |

**Error handling** – Errors appear under the field (red text, red border, `aria-invalid`, `aria-describedby`) when the field is left, then update as the visitor types. On submit a summary appears and focus moves to the first invalid field.

### `enquiry.html` – AJAX + instant response

1. Fields are validated.
2. Data is sent with `fetch()` (AJAX) to the form's `action` URL (Formspree), with a 10-second time-out and a clear error message if it fails.
3. The page then shows a response panel **without reloading**: a cost estimate (price × quantity, volume discount of 5 % at 12+ and 10 % at 24+, rush fee of 10 % if fewer than 5 days away) and an availability status (**Available**, **Limited availability**, or **Pending confirmation** for 48+ items inside 7 days). Custom orders get a "personalised quote within one business day" message.
4. Choosing "Order" on a product card opens this form with that product pre-selected (`enquiry.html?product=berry-luxe`).

> Until a real Formspree form ID is added in `CONFIG.enquiryEndpoint` (top of `js/script.js`) the submission is **simulated** and the response panel says "Demo mode".

### `contact.html` – compiled email

After validation the message is compiled into an email (recipient `hello@torontocupcake.ca`, subject, body with the visitor's details). A preview is shown with an **Open in my email app** button (a `mailto:` link) and a **Copy email text** button. The form's `action` is also `mailto:` so it degrades sensibly without JavaScript. To change the recipient edit `CONFIG.contactEmail`.

---

## Security and performance

* **Content Security Policy** (meta tag on every page and `_headers`): scripts, styles, fonts and images only from the site itself (plus OpenStreetMap map tiles); form posts only to the site, `mailto:` or Formspree; no plugins; no inline scripts.
* **XSS-safe output** – all user text is inserted with `textContent`; names containing `<`, `>` etc. are rejected by validation.
* **Spam protection** – hidden honeypot field on both forms.
* **Input hygiene** – control characters stripped; select values re-checked against an allow-list before use; `maxlength` on every text field.
* **External links** use `rel="noopener noreferrer"`; `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` / `frame-ancestors`, `Permissions-Policy` set in `_headers`.
* **No third-party scripts or fonts** – Leaflet is included in `vendor/leaflet/` instead of loading from a CDN.
* **Note:** GitHub Pages cannot send custom HTTP headers, so on GitHub Pages only the `<meta>` CSP and referrer policy apply.

---

## Deployment

1. **Find-and-replace** `YOUR-SITE.netlify.app` with your real domain in **all files** (`*.html`, `robots.txt`, `sitemap.xml`). Replace the GitHub links at the top of this README.
2. Create a free form at [formspree.io](https://formspree.io) and replace `YOUR_FORM_ID` in `js/script.js` (`CONFIG.enquiryEndpoint`) **and** in the `action` attribute of `enquiry.html`.
3. **Netlify:** log in → *Add new site* → *Deploy manually* → drag the project folder in (or *Import from Git* and choose the repository). No build command; publish directory is the repository root.
   **GitHub Pages:** repository → *Settings* → *Pages* → *Deploy from a branch* → `main` / `(root)`. Your URL will be `https://YOUR-USERNAME.github.io/YOUR-REPO/` – if you use this, change the `YOUR-SITE.netlify.app` replacement accordingly (and include `/YOUR-REPO` in the sitemap URLs).
4. Submit the sitemap in Google Search Console.

---

## Testing and responsive evidence

### Automated browser test (Chromium via Playwright) – 52 checks, all passing

* every page loads with no console or Content-Security-Policy errors, one `<h1>` each, and no broken images (except the missing `founder.jpg`, see below)
* products: 6 cards render; search, empty state, reset, price sort, category filter; lightbox opens, arrow-key navigation, Esc closes, focus returns
* about: accordion opens/closes with one item open at a time
* enquiry: empty submit shows 6 errors; bad email / phone / Sunday / too-soon date rejected; markup in the name rejected; valid submit shows the quote (24 × $36 with 10 % discount = **$777.60**) and form resets; rush order shows *Limited availability* and a rush fee; product pre-selection from URL
* contact: map initialises with 3 markers; hub buttons open popups; empty submit shows 4 errors; valid submit builds a correct `mailto:` link
* mobile (375 px): menu button opens the navigation; no sideways scrolling on any page

### Screenshots at different screen sizes

| Page | Desktop (1440 px) | Tablet (820 px) | Mobile (390 px, @2x) |
|---|---|---|---|
| Home | [view](docs/screenshots/index-desktop.jpg) | [view](docs/screenshots/index-tablet.jpg) | [view](docs/screenshots/index-mobile.jpg) |
| About | [view](docs/screenshots/about-desktop.jpg) | [view](docs/screenshots/about-tablet.jpg) | [view](docs/screenshots/about-mobile.jpg) |
| Products | [view](docs/screenshots/products-desktop.jpg) | [view](docs/screenshots/products-tablet.jpg) | [view](docs/screenshots/products-mobile.jpg) |
| Enquiry | [view](docs/screenshots/enquiry-desktop.jpg) | [view](docs/screenshots/enquiry-tablet.jpg) | [view](docs/screenshots/enquiry-mobile.jpg) |
| Contact | [view](docs/screenshots/contact-desktop.jpg) | [view](docs/screenshots/contact-tablet.jpg) | [view](docs/screenshots/contact-mobile.jpg) |

Feature evidence: [lightbox](docs/screenshots/feature-lightbox.jpg) · [validation errors](docs/screenshots/feature-validation-errors.jpg) · [enquiry quote and availability](docs/screenshots/feature-enquiry-quote.jpg) · [accordion](docs/screenshots/feature-accordion.jpg)

> The screenshots were captured in an offline test environment, so the OpenStreetMap tiles on the Contact page appear blank (the markers, popups and controls are real) and the About-page photo shows as missing (see below). **Add your own real-device screenshots here** (e.g. from Chrome DevTools device mode: iPhone, iPad, laptop) to meet the "different devices" requirement.

---

## Known issues / to-do before submission

* **`images/founder.jpg` does not exist** in the project – the About page references it. Add the photo (any JPG about 840 × 1050 px) or remove the `<img>`.
* Replace the `YOUR-SITE`, `YOUR-USERNAME`, `YOUR-REPO` and `YOUR_FORM_ID` placeholders (see [Deployment](#deployment)).
* Footer social links are `#` placeholders.
* Prices are shown "per unit" as in Part 2; the cost estimate multiplies this by the quantity. Adjust the wording if each price is actually per box or per dozen.
* `css/style (1).css` is an older alternative stylesheet that no page links to. Delete it or merge the parts you want.

---

## Changelog

### Part 3 – new work

| # | Area | Change | Files |
|---|---|---|---|
| 1 | JavaScript | Rewrote `script.js` into modules (`initNavigation`, `initReveal`, `initProducts`, `initAccordion`, `initMap`, `initEnquiryForm`, `initContactForm`) with a `CONFIG` block at the top. | `js/script.js` |
| 2 | Dynamic content | Product cards are now generated from a `PRODUCTS` array instead of hard-coded HTML; a `<noscript>` list keeps the range visible without JavaScript. | `products.html`, `js/script.js` |
| 3 | Search / sort | Added a search box and sort dropdown that work together with the existing category filter, plus a results status line and a no-results state. | `products.html`, `css/style.css`, `js/script.js` |
| 4 | Lightbox | Product images open in an accessible lightbox with next/previous, keyboard support and focus handling. | `js/script.js`, `css/style.css` |
| 5 | Accordion | Replaced the three static Mission / Vision / Audience cards with an accordion. | `about.html`, `css/style.css`, `js/script.js` |
| 6 | Map | Replaced the Google Maps iframe with a Leaflet / OpenStreetMap map showing the three delivery hubs; added "Show on map" buttons. Leaflet is self-hosted. | `contact.html`, `vendor/leaflet/`, `js/script.js` |
| 7 | Animation | Added page-heading fade-ups, scroll-reveal for cards, hover/active transitions on filter buttons, and `prefers-reduced-motion` support. | `css/style.css`, `js/script.js` |
| 8 | Forms – validation | Replaced `checkValidity()` with field-by-field JavaScript validation (name, email, phone, select, quantity, date, message), inline error messages, error summary, character counter, `aria-invalid`. | both forms, `js/script.js`, `css/style.css` |
| 9 | Forms – enquiry | Added product, quantity and date fields; AJAX submission with `fetch()` and time-out; cost + availability response panel; product pre-selection from the Order buttons. | `enquiry.html`, `products.html`, `js/script.js` |
| 10 | Forms – contact | Added phone and message-type fields; validated message is compiled into a `mailto:` email with preview and copy button. | `contact.html`, `js/script.js` |
| 11 | Forms – action | Added `action` attributes (Formspree for enquiry, `mailto:` for contact). | both forms |
| 12 | SEO – head | Unique titles and meta descriptions, canonical URLs, robots meta, Open Graph and Twitter tags, favicon. | all pages |
| 13 | SEO – structured data | Added JSON-LD (`Bakery` on Home and Contact, `ItemList` of `Product` on Products). | `index.html`, `contact.html`, `products.html` |
| 14 | SEO – content | Added keyword-rich internal links, descriptive "Explore *product*" link text, lead paragraphs on Products and Enquiry. | `index.html`, `about.html`, `products.html`, `enquiry.html` |
| 15 | SEO – files | Added `robots.txt` and `sitemap.xml`. | root |
| 16 | Performance | Generated 480 px and 960 px WebP versions of every product image (e.g. 1.9 MB PNG → 110 KB); used `srcset`/`sizes`, `width`/`height`, `loading="lazy"`, `fetchpriority="high"` on the hero. | `images/optimised/`, all pages |
| 17 | Security | Added Content Security Policy and referrer policy meta tags, `_headers` file, honeypot fields, safe DOM output (`textContent`), input sanitising and allow-list checks. | all pages, `_headers`, `js/script.js` |
| 18 | Accessibility | Skip-to-content link, visible `:focus-visible` outlines, `role="status"` / `aria-live` regions, labelled dialog, descriptive social-link labels. | all pages, `css/style.css` |
| 19 | Documentation | Rewrote this README with Part 3 information, testing evidence and screenshots. | `README.md`, `docs/` |

### Part 2 feedback edits and corrections found while upgrading

> **Add your lecturer's Part 2 feedback points to this table.** The entries below are issues found and fixed during this upgrade; match them to your feedback where they overlap and add any other feedback items you actioned.

| # | Feedback / issue | Change made | Files |
|---|---|---|---|
| F1 | Hero image did not load on case-sensitive hosts (`Gift-Boxes.webp` vs file `Gift-boxes.webp`) | Corrected the file name in the `src`. | `index.html` |
| F2 | Mobile "Menu" button did nothing: the `.main-nav` container stayed `display: none` below 768 px, so toggling `.nav-links` had no effect | The `open` class is now toggled on `.main-nav` and styled for the mobile breakpoint; Esc closes the menu. | `css/style.css`, `js/script.js` |
| F3 | Footer quick links omitted the Enquiry page | Added the Enquiry link to the footer of every page. | all pages |
| F4 | Heading levels skipped in the footer (`h3`/`h4` with no `h2`) | Footer titles are now styled `<p>` elements (`.footer-heading`, `.footer-subheading`). | all pages, `css/style.css` |
| F5 | Repeated, non-descriptive "Explore more" links | Link text now names the product (e.g. "Explore Vanilla Bloom"). | `index.html` |
| F6 | Horizontal scrolling on the About page at 375 px caused by the single-column grid sizing to the photo | Grid columns use `minmax(0, 1fr)` below 768 px. | `css/style.css` |
| F7 | Large unoptimised images (up to 1.9 MB) | Replaced with responsive WebP versions (see Part 3 #16). | `images/optimised/` |
| F8 | Part 2 asked for screenshot evidence of different screen sizes in the README | Added the screenshot table above. | `README.md`, `docs/screenshots/` |
| F9 | Duplicate stylesheet `style (1).css` | Left unreferenced and flagged in *Known issues*; `style.css` remains the single linked stylesheet. | `css/` |

---

## References

*(Harvard style – add the date you accessed each source.)*

* Agafonkin, V. (2023) *Leaflet – an open-source JavaScript library for interactive maps*, version 1.9.4. Available at: https://leafletjs.com (Accessed: [add date]). Licence: BSD 2-Clause (included in `vendor/leaflet/LICENSE.txt`).
* OpenStreetMap contributors (n.d.) *OpenStreetMap copyright and licence*. Available at: https://www.openstreetmap.org/copyright (Accessed: [add date]). Map data © OpenStreetMap contributors, ODbL.
* Formspree (n.d.) *Formspree documentation*. Available at: https://formspree.io (Accessed: [add date]).
* W3C Web Accessibility Initiative (n.d.) *WAI-ARIA Authoring Practices Guide: Accordion pattern*. Available at: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/ (Accessed: [add date]).
* W3C Web Accessibility Initiative (n.d.) *WAI-ARIA Authoring Practices Guide: Dialog (Modal) pattern*. Available at: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ (Accessed: [add date]).
* Mozilla Developer Network (n.d.) *Intersection Observer API*. Available at: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API (Accessed: [add date]).
* Mozilla Developer Network (n.d.) *Client-side form validation*. Available at: https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation (Accessed: [add date]).
* Schema.org (n.d.) *Bakery*. Available at: https://schema.org/Bakery (Accessed: [add date]).
* Google (n.d.) *SEO Starter Guide*. Available at: https://developers.google.com/search/docs/fundamentals/seo-starter-guide (Accessed: [add date]).
* Sitemaps.org (n.d.) *Sitemaps XML format*. Available at: https://www.sitemaps.org/protocol.html (Accessed: [add date]).
* The Independent Institute of Education (2026) *WEDE Part 2 and Part 3 assessment instructions*. Unpublished assessment brief.
