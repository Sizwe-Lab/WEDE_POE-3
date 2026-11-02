/* ==========================================================================
   Toronto Cupcake – shared site JavaScript (Part 3)
   Modules: navigation, scroll animations, dynamic product catalogue
   (search / sort / filter), image lightbox, accordion, Leaflet map,
   enquiry form (validation + AJAX + quote) and contact form (validation +
   compiled email).
   All user-supplied text is written to the page with textContent (never
   innerHTML) so it cannot inject markup.
   ========================================================================== */
"use strict";

/* ---------- Configuration (edit these values when you deploy) ---------- */
const CONFIG = {
  // Recipient of the compiled contact email (contact.html).
  contactEmail: "hello@torontocupcake.ca",
  // AJAX endpoint for the enquiry form. Create a free form at formspree.io
  // and replace YOUR_FORM_ID. While it still contains YOUR_FORM_ID the site
  // simulates a successful send so the form can be demonstrated offline.
  enquiryEndpoint: "https://formspree.io/f/YOUR_FORM_ID",
  // Business rules used for the enquiry response (cost + availability).
  minLeadDays: 2, // earliest bookable date = today + 2 days
  rushLeadDays: 5, // orders sooner than this attract a rush fee
  rushFeeRate: 0.1,
  largeOrderQty: 48, // orders this big need extended notice
  largeOrderLeadDays: 7,
  discountTiers: [
    { minQty: 24, rate: 0.1 },
    { minQty: 12, rate: 0.05 },
  ],
  closedWeekday: 0, // 0 = Sunday (shop hours are Mon–Sat)
};

/* ---------- Product data (single source of truth for the catalogue) ---- */
const IMG_DIR = "images/optimised/";
const PRODUCTS = [
  {
    id: "vanilla-bloom",
    name: "Vanilla Bloom",
    category: "Classic",
    price: 32,
    description: "Classic vanilla bean frosting, finished with a delicate sugar pearl.",
    image: "vanilla-bean-cupcake-with-cream-frosting",
    alt: "Vanilla bean cupcake with cream frosting",
  },
  {
    id: "midnight-cocoa",
    name: "Midnight Cocoa",
    category: "Classic",
    price: 34,
    description: "Rich dark chocolate sponge paired with velvety cocoa buttercream.",
    image: "midnight-cocoa",
    alt: "Chocolate cupcake with cocoa frosting",
  },
  {
    id: "berry-luxe",
    name: "Berry Luxe",
    category: "Seasonal",
    price: 36,
    description: "Seasonal berry compote layered with strawberry cream for a luxe finish.",
    image: "berry-luxe",
    alt: "Berry seasonal cupcake",
  },
  {
    id: "executive-box",
    name: "Executive Box",
    category: "Corporate Boxes",
    price: 54,
    description: "Curated assorted flavours in a polished presentation for client gifting.",
    image: "executive-box",
    alt: "Corporate gifting box of assorted cupcakes",
  },
  {
    id: "sunrise-citrus",
    name: "Sunrise Citrus",
    category: "Vegan",
    price: 33,
    description: "Bright citrus sponge topped with vegan vanilla bean frosting.",
    image: "sunrise-citrus",
    alt: "Vegan citrus cupcake",
  },
  {
    id: "caramel-charm",
    name: "Caramel Charm",
    category: "Classic",
    price: 35,
    description: "Soft vanilla sponge with buttery caramel swirls and a golden finish.",
    image: "caramel-charm",
    alt: "Caramel cupcake with toffee topping",
  },
];

/* Hub locations for the interactive map on contact.html */
const HUBS = [
  { name: "Downtown Toronto", lat: 43.6532, lng: -79.3832, note: "Core city events and downtown corporate gifting." },
  { name: "North York", lat: 43.7615, lng: -79.4111, note: "Suburban celebrations and office orders." },
  { name: "Scarborough", lat: 43.7731, lng: -79.2578, note: "Family events and local gifting runs." },
];

/* ---------- Small helpers ---------------------------------------------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** Create an element; text is always assigned with textContent (safe). */
function el(tag, attrs = {}, text = "") {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === false || value === null || value === undefined) return;
    if (key === "class") node.className = value;
    else node.setAttribute(key, value === true ? "" : value);
  });
  if (text) node.textContent = text;
  return node;
}

const money = (value) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Strip control characters and collapse stray whitespace from user text. */
const clean = (value) => String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

/* ==========================================================================
   1. Navigation (active link + mobile toggle)
   ========================================================================== */
function initNavigation() {
  const currentPage = document.body.dataset.page;
  $$(".nav-link").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  const toggle = $(".nav-toggle");
  const nav = $(".main-nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* ==========================================================================
   2. Scroll-reveal animation (IntersectionObserver + CSS transitions)
   ========================================================================== */
let revealObserver = null;

function initReveal() {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealElements(document);
}

/** Mark elements inside `scope` so they fade/slide in when scrolled into view. */
function revealElements(scope) {
  if (!revealObserver) return;
  $$(".feature-card, .product-card, .hub-item, .story-copy, .story-image-wrap, .accordion, .styled-form, .map-card", scope).forEach(
    (node, index) => {
      if (node.classList.contains("reveal")) return;
      node.classList.add("reveal");
      node.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
      revealObserver.observe(node);
    }
  );
}

/* ==========================================================================
   3. Image lightbox (shared by the product catalogue)
   ========================================================================== */
const lightbox = (() => {
  let root, image, caption, closeBtn, prevBtn, nextBtn, counter;
  let items = [];
  let index = 0;
  let lastFocus = null;

  function build() {
    root = el("div", { class: "lightbox", role: "dialog", "aria-modal": "true", "aria-label": "Image viewer", hidden: true });
    const figure = el("figure", { class: "lightbox-figure" });
    image = el("img", { class: "lightbox-image", alt: "" });
    caption = el("figcaption", { class: "lightbox-caption" });
    counter = el("span", { class: "lightbox-counter", "aria-live": "polite" });
    figure.append(image, caption);
    closeBtn = el("button", { class: "lightbox-btn lightbox-close", type: "button", "aria-label": "Close image viewer" }, "\u00D7");
    prevBtn = el("button", { class: "lightbox-btn lightbox-prev", type: "button", "aria-label": "Previous image" }, "\u2039");
    nextBtn = el("button", { class: "lightbox-btn lightbox-next", type: "button", "aria-label": "Next image" }, "\u203A");
    root.append(closeBtn, prevBtn, figure, nextBtn, counter);
    document.body.append(root);

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));
    root.addEventListener("click", (event) => {
      if (event.target === root) close(); // click on the dark backdrop
    });
    document.addEventListener("keydown", onKey);
  }

  function show() {
    const item = items[index];
    image.src = item.src;
    image.alt = item.alt;
    caption.textContent = item.caption;
    counter.textContent = `${index + 1} of ${items.length}`;
    const single = items.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
  }

  function step(direction) {
    index = (index + direction + items.length) % items.length;
    show();
  }

  function onKey(event) {
    if (!root || root.hidden) return;
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") step(-1);
    else if (event.key === "ArrowRight") step(1);
    else if (event.key === "Tab") {
      // Keep keyboard focus inside the dialog while it is open.
      const focusable = [closeBtn, prevBtn, nextBtn].filter((b) => !b.hidden);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function open(list, startIndex, trigger) {
    if (!root) build();
    items = list;
    index = startIndex;
    lastFocus = trigger || document.activeElement;
    show();
    root.hidden = false;
    document.body.classList.add("lightbox-open");
    requestAnimationFrame(() => root.classList.add("is-open"));
    closeBtn.focus();
  }

  function close() {
    root.classList.remove("is-open");
    root.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  return { open };
})();

/* ==========================================================================
   4. Dynamic product catalogue: render + filter + search + sort
   ========================================================================== */
function initProducts() {
  const grid = $(".product-grid");
  if (!grid) return;

  const filterButtons = $$(".filter-btn");
  const searchInput = $("#product-search");
  const sortSelect = $("#product-sort");
  const status = $("#product-status");
  const empty = $("#product-empty");
  const resetBtn = $("#product-reset");
  const state = { category: "all", query: "", sort: "featured" };
  let visible = [];

  const sorters = {
    featured: () => 0,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "name-asc": (a, b) => a.name.localeCompare(b.name),
  };

  function createCard(product) {
    const card = el("article", { class: "product-card", "data-category": product.category, "data-id": product.id });

    const zoom = el("button", {
      class: "product-zoom",
      type: "button",
      "aria-label": `View a larger image of ${product.name}`,
    });
    zoom.append(
      el("img", {
        src: `${IMG_DIR}${product.image}-480.webp`,
        srcset: `${IMG_DIR}${product.image}-480.webp 480w, ${IMG_DIR}${product.image}-960.webp 960w`,
        sizes: "(min-width: 1024px) 380px, (min-width: 768px) 45vw, 92vw",
        alt: product.alt,
        width: "480",
        height: "480",
        loading: "lazy",
        decoding: "async",
      })
    );
    zoom.append(el("span", { class: "zoom-hint", "aria-hidden": "true" }, "Click to enlarge"));
    zoom.addEventListener("click", () => {
      const slides = visible.map((p) => ({
        src: `${IMG_DIR}${p.image}-960.webp`,
        alt: p.alt,
        caption: `${p.name} \u2013 ${p.description}`,
      }));
      lightbox.open(slides, visible.indexOf(product), zoom);
    });

    const info = el("div", { class: "product-info" });
    info.append(el("h3", {}, product.name), el("p", {}, product.description));

    const meta = el("div", { class: "product-meta" });
    meta.append(
      el("span", { class: "price" }, money(product.price)),
      el("a", { class: "button button-secondary", href: `enquiry.html?product=${encodeURIComponent(product.id)}` }, "Order")
    );
    info.append(meta);

    card.append(zoom, info);
    return card;
  }

  function update() {
    const query = state.query.toLowerCase();
    visible = PRODUCTS.filter((p) => {
      const matchesCategory = state.category === "all" || p.category === state.category;
      const haystack = `${p.name} ${p.description} ${p.category}`.toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    }).sort(sorters[state.sort] || sorters.featured);

    grid.replaceChildren(...visible.map(createCard));
    revealElements(grid);
    // Cards created after page load are already on screen: show them at once.
    $$(".reveal:not(.in-view)", grid).forEach((card) => card.classList.add("in-view"));

    empty.hidden = visible.length > 0;
    status.textContent = visible.length
      ? `Showing ${visible.length} of ${PRODUCTS.length} cupcakes`
      : "No cupcakes match your search";
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.filter;
      filterButtons.forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      update();
    });
  });

  searchInput?.addEventListener("input", () => {
    state.query = clean(searchInput.value);
    update();
  });
  sortSelect?.addEventListener("change", () => {
    state.sort = sortSelect.value;
    update();
  });
  resetBtn?.addEventListener("click", () => {
    state.category = "all";
    state.query = "";
    state.sort = "featured";
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "featured";
    filterButtons.forEach((btn) => {
      const active = btn.dataset.filter === "all";
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    update();
    searchInput?.focus();
  });

  update();
}

/* ==========================================================================
   5. Accordion (about.html)
   ========================================================================== */
function initAccordion() {
  $$(".accordion").forEach((accordion) => {
    accordion.classList.add("is-enhanced"); // collapses panels only when JS runs
    const triggers = $$(".accordion-trigger", accordion);

    const setExpanded = (trigger, expanded) => {
      trigger.setAttribute("aria-expanded", String(expanded));
      trigger.closest(".accordion-item").classList.toggle("open", expanded);
    };

    triggers.forEach((trigger, i) => {
      setExpanded(trigger, i === 0); // first item open by default
      trigger.addEventListener("click", () => {
        const willOpen = trigger.getAttribute("aria-expanded") !== "true";
        triggers.forEach((other) => setExpanded(other, false)); // one open at a time
        setExpanded(trigger, willOpen);
      });
      trigger.addEventListener("keydown", (event) => {
        const keys = { ArrowDown: 1, ArrowUp: -1 };
        if (keys[event.key]) {
          event.preventDefault();
          triggers[(i + keys[event.key] + triggers.length) % triggers.length].focus();
        } else if (event.key === "Home") {
          event.preventDefault();
          triggers[0].focus();
        } else if (event.key === "End") {
          event.preventDefault();
          triggers[triggers.length - 1].focus();
        }
      });
    });
  });
}

/* ==========================================================================
   6. Interactive map (Leaflet + OpenStreetMap) on contact.html
   ========================================================================== */
function initMap() {
  const mapEl = $("#hub-map");
  if (!mapEl) return;

  if (typeof window.L === "undefined") {
    mapEl.append(el("p", { class: "map-fallback" }, "The interactive map could not be loaded. Our delivery hubs are in Downtown Toronto, North York and Scarborough."));
    return;
  }

  const map = L.map(mapEl, { scrollWheelZoom: false }).setView([43.7, -79.4], 10);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  }).addTo(map);

  const markers = HUBS.map((hub) => {
    const popup = el("div", { class: "map-popup" });
    popup.append(el("strong", {}, hub.name), el("br"), document.createTextNode(hub.note));
    // circleMarker needs no image files, so nothing can fail to load.
    const marker = L.circleMarker([hub.lat, hub.lng], {
      radius: 11,
      color: "#3B2318",
      weight: 3,
      fillColor: "#F2C9C2",
      fillOpacity: 1,
    })
      .bindPopup(popup)
      .bindTooltip(hub.name)
      .addTo(map);
    return marker;
  });
  map.fitBounds(L.featureGroup(markers).getBounds().pad(0.3));

  // "Show on map" buttons beside each hub fly to that marker.
  $$(".hub-btn").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => {
      const i = Number(button.dataset.hub);
      if (!markers[i]) return;
      map.flyTo([HUBS[i].lat, HUBS[i].lng], 12, { animate: !prefersReducedMotion, duration: 1.1 });
      markers[i].openPopup();
      mapEl.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
    });
  });
}

/* ==========================================================================
   7. Form validation framework (shared by both forms)
   ========================================================================== */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}\s'.\-]*$/u;

/** Return today's date as a local-time Date at midnight. */
function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseISODate = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Each validator returns an error string, or "" when the value is valid. */
const VALIDATORS = {
  name(value) {
    if (!value) return "Please enter your name.";
    if (value.length < 2) return "Your name must be at least 2 characters.";
    if (value.length > 60) return "Your name must be 60 characters or fewer.";
    if (!NAME_RE.test(value)) return "Names can only contain letters, spaces, hyphens, apostrophes and full stops.";
    return "";
  },
  email(value) {
    if (!value) return "Please enter your email address.";
    if (value.length > 254) return "That email address is too long.";
    if (!EMAIL_RE.test(value)) return "Enter a valid email address, e.g. name@example.com.";
    return "";
  },
  phone(value) {
    if (!value) return ""; // optional
    if (!/^\+?[\d\s().\-]+$/.test(value)) return "Phone numbers can only contain digits, spaces, + ( ) - and .";
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return "Enter a phone number with 10 to 15 digits, e.g. (416) 555-0147.";
    return "";
  },
  select(value, field) {
    if (!value) return `Please choose ${field.dataset.label || "an option"}.`;
    return "";
  },
  quantity(value) {
    if (!value) return "Please enter how many you need.";
    if (!/^\d+$/.test(value)) return "Quantity must be a whole number.";
    const n = Number(value);
    if (n < 1) return "Quantity must be at least 1.";
    if (n > 500) return "For orders above 500, please use the contact page.";
    return "";
  },
  date(value) {
    if (!value) return "Please choose the date you need your order.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter the date in the format YYYY-MM-DD.";
    const date = parseISODate(value);
    if (Number.isNaN(date.getTime())) return "That date is not valid.";
    const earliest = today();
    earliest.setDate(earliest.getDate() + CONFIG.minLeadDays);
    const latest = today();
    latest.setFullYear(latest.getFullYear() + 1);
    if (date < earliest) return `We need at least ${CONFIG.minLeadDays} days\u2019 notice. Please choose ${earliest.toLocaleDateString("en-CA", { dateStyle: "long" })} or later.`;
    if (date > latest) return "Please choose a date within the next 12 months.";
    if (date.getDay() === CONFIG.closedWeekday) return "We are closed on Sundays. Please choose a Monday to Saturday.";
    return "";
  },
  message(value, field) {
    const min = Number(field.getAttribute("minlength")) || 10;
    const max = Number(field.getAttribute("maxlength")) || 1000;
    if (!value) return "Please tell us a little about your request.";
    if (value.length < min) return `Please write at least ${min} characters (you have ${value.length}).`;
    if (value.length > max) return `Please keep your message under ${max} characters.`;
    return "";
  },
};

function fieldError(field) {
  const type = field.dataset.validate;
  const fn = VALIDATORS[type];
  return fn ? fn(clean(field.value), field) : "";
}

function showFieldError(field, message) {
  const wrapper = field.closest(".form-field");
  let box = $(".field-error", wrapper);
  if (!box) {
    box = el("p", { class: "field-error", id: `${field.id}-error` });
    wrapper.append(box);
  }
  box.textContent = message;
  wrapper.classList.toggle("has-error", Boolean(message));
  if (message) {
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", box.id);
  } else {
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
  }
}

/** Attach live validation (on blur, then on every keystroke once touched). */
function attachLiveValidation(form) {
  $$("[data-validate]", form).forEach((field) => {
    field.addEventListener("blur", () => showFieldError(field, fieldError(field)));
    const revalidate = () => {
      if (field.closest(".form-field").classList.contains("has-error")) showFieldError(field, fieldError(field));
    };
    field.addEventListener("input", revalidate);
    field.addEventListener("change", revalidate);
  });
}

/** Validate every field; focus the first invalid one. Returns true if all OK. */
function validateForm(form) {
  const summary = $(".form-summary", form);
  let firstInvalid = null;
  let count = 0;
  $$("[data-validate]", form).forEach((field) => {
    const message = fieldError(field);
    showFieldError(field, message);
    if (message) {
      count += 1;
      firstInvalid = firstInvalid || field;
    }
  });
  if (summary) {
    summary.textContent = count ? `Please fix ${count} ${count === 1 ? "field" : "fields"} below before sending.` : "";
    summary.hidden = count === 0;
  }
  if (firstInvalid) firstInvalid.focus();
  return count === 0;
}

function initCharCounter(textarea) {
  const counter = $(`#${textarea.id}-count`);
  if (!counter) return;
  const max = textarea.getAttribute("maxlength");
  const update = () => {
    counter.textContent = `${textarea.value.length} / ${max}`;
  };
  textarea.addEventListener("input", update);
  update();
}

/* ==========================================================================
   8. Enquiry form: validation, AJAX submission and a cost/availability reply
   ========================================================================== */
function calculateQuote({ product, quantity, date }) {
  const daysAhead = Math.round((date - today()) / 86400000);
  const needsExtendedNotice = quantity >= CONFIG.largeOrderQty;
  const result = { daysAhead, lines: [], total: null, status: "available", availability: "" };

  if (needsExtendedNotice && daysAhead < CONFIG.largeOrderLeadDays) {
    result.status = "pending";
    result.availability = `Large orders (${CONFIG.largeOrderQty}+) normally need ${CONFIG.largeOrderLeadDays} days\u2019 notice. We will check whether we can still fit yours in and reply within one business day.`;
  } else if (daysAhead < CONFIG.rushLeadDays) {
    result.status = "limited";
    result.availability = `Limited availability: your date is less than ${CONFIG.rushLeadDays} days away, so a ${CONFIG.rushFeeRate * 100}% rush fee applies. We will confirm within 24 hours.`;
  } else {
    result.availability = "Good news \u2013 we have capacity on your chosen date. We will email you to confirm the details.";
  }

  if (product) {
    const subtotal = product.price * quantity;
    const tier = CONFIG.discountTiers.find((t) => quantity >= t.minQty);
    const discount = tier ? subtotal * tier.rate : 0;
    const rush = result.status === "limited" ? (subtotal - discount) * CONFIG.rushFeeRate : 0;
    result.lines.push([`${product.name} \u00D7 ${quantity} @ ${money(product.price)}`, money(subtotal)]);
    if (tier) result.lines.push([`Volume discount (${tier.rate * 100}%)`, `\u2212${money(discount)}`]);
    if (rush) result.lines.push([`Rush fee (${CONFIG.rushFeeRate * 100}%)`, money(rush)]);
    result.total = subtotal - discount + rush;
  }
  return result;
}

/**
 * AJAX submission. Posts FormData to the form's action URL with fetch().
 * While the placeholder endpoint is in place the request is simulated.
 */
async function submitAjax(form, formData) {
  const endpoint = form.getAttribute("action") || CONFIG.enquiryEndpoint;
  if (endpoint.includes("YOUR_FORM_ID")) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { ok: true, simulated: true };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    return { ok: response.ok, simulated: false };
  } finally {
    clearTimeout(timer);
  }
}

function initEnquiryForm() {
  const form = $("#enquiry-form");
  if (!form) return;

  const productSelect = $("#product", form);
  const dateInput = $("#event-date", form);
  const submitBtn = $("button[type='submit']", form);
  const errorBox = $(".form-error", form);
  const response = $("#enquiry-response");

  // Populate the product dropdown from the shared product data.
  PRODUCTS.forEach((p) => productSelect.append(el("option", { value: p.id }, `${p.name} \u2013 ${money(p.price)}`)));
  productSelect.append(el("option", { value: "custom" }, "Custom order / not sure yet"));
  const preselect = new URLSearchParams(window.location.search).get("product");
  if (preselect && $$("option", productSelect).some((o) => o.value === preselect)) productSelect.value = preselect;

  // Constrain the date picker to bookable dates.
  const earliest = today();
  earliest.setDate(earliest.getDate() + CONFIG.minLeadDays);
  dateInput.min = toISODate(earliest);

  attachLiveValidation(form);
  initCharCounter($("#message", form));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    response.hidden = true;

    if ($("#website", form).value) return; // honeypot: bots fill hidden fields
    if (!validateForm(form)) return;

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Sending\u2026";

    try {
      const result = await submitAjax(form, new FormData(form));
      if (!result.ok) throw new Error("Request failed");

      const product = PRODUCTS.find((p) => p.id === productSelect.value) || null;
      const quote = calculateQuote({
        product,
        quantity: Number(clean($("#quantity", form).value)),
        date: parseISODate(dateInput.value),
      });
      renderEnquiryResponse(response, {
        name: clean($("#full-name", form).value),
        email: clean($("#email", form).value),
        orderType: $("#order-type", form).value,
        date: parseISODate(dateInput.value),
        product,
        quote,
        simulated: result.simulated,
      });
      form.reset();
      $$(".form-field", form).forEach((f) => f.classList.remove("has-error"));
      $(".form-summary", form).hidden = true;
      $("#message-count").textContent = `0 / ${$("#message", form).getAttribute("maxlength")}`;
      response.hidden = false;
      response.focus();
      response.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    } catch (error) {
      errorBox.textContent = `Sorry, we could not send your enquiry. Please try again, or email ${CONFIG.contactEmail}.`;
      errorBox.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

function renderEnquiryResponse(container, data) {
  const { name, email, orderType, date, product, quote, simulated } = data;
  container.replaceChildren();
  container.className = `enquiry-response status-${quote.status}`;

  container.append(el("h2", { class: "response-title" }, `Thank you, ${name}!`));
  container.append(
    el("p", {}, `We received your ${orderType.toLowerCase()} enquiry for ${date.toLocaleDateString("en-CA", { dateStyle: "full" })}. A confirmation will be sent to ${email}.`)
  );

  const badgeText = { available: "Available", limited: "Limited availability", pending: "Pending confirmation" }[quote.status];
  const availability = el("div", { class: "availability" });
  availability.append(el("span", { class: `badge badge-${quote.status}` }, badgeText), el("p", {}, quote.availability));
  container.append(availability);

  if (product && quote.total !== null) {
    container.append(el("h3", {}, "Your estimated cost"));
    const list = el("dl", { class: "quote-list" });
    quote.lines.forEach(([label, amount]) => list.append(el("dt", {}, label), el("dd", {}, amount)));
    list.append(el("dt", { class: "quote-total" }, "Estimated total"), el("dd", { class: "quote-total" }, money(quote.total)));
    container.append(list);
    container.append(el("p", { class: "fine-print" }, "This is an estimate before delivery and taxes. Our team will confirm the final price."));
  } else {
    container.append(el("p", {}, "Because this is a custom order, we will prepare a personalised quote and email it within one business day."));
  }
  if (simulated) {
    container.append(el("p", { class: "fine-print demo-note" }, "Demo mode: add your Formspree form ID in js/script.js to deliver enquiries to your inbox."));
  }
  container.append(el("a", { class: "button button-secondary", href: "products.html" }, "Keep browsing cupcakes"));
}

/* ==========================================================================
   9. Contact form: validation, then a compiled email the visitor can send
   ========================================================================== */
const CONTACT_TOPICS = ["General question", "Delivery and timing", "Feedback or compliment", "Partnership or press"];

function buildEmail({ name, email, phone, topic, message }) {
  const subject = `[Toronto Cupcake] ${topic} from ${name}`;
  const body = [
    "Hello Toronto Cupcake team,",
    "",
    message,
    "",
    "\u2014\u2014\u2014",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    `Message type: ${topic}`,
  ].join("\n");
  const href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, href };
}

function initContactForm() {
  const form = $("#contact-form");
  if (!form) return;

  const preview = $("#email-preview");
  const topicSelect = $("#contact-topic", form);
  CONTACT_TOPICS.forEach((t) => topicSelect.append(el("option", { value: t }, t)));

  attachLiveValidation(form);
  initCharCounter($("#contact-message", form));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if ($("#contact-website", form).value) return; // honeypot
    preview.hidden = true;
    if (!validateForm(form)) return;

    const topic = topicSelect.value;
    if (!CONTACT_TOPICS.includes(topic)) return; // guards against tampered <option> values
    const email = buildEmail({
      name: clean($("#contact-name", form).value),
      email: clean($("#contact-email", form).value),
      phone: clean($("#contact-phone", form).value),
      topic,
      message: clean($("#contact-message", form).value),
    });

    preview.replaceChildren();
    preview.append(el("h2", { class: "response-title" }, "Your email is ready to send"));
    preview.append(el("p", {}, `It will be addressed to ${CONFIG.contactEmail}. Check it below, then open it in your email app.`));
    const box = el("div", { class: "email-box" });
    box.append(el("p", {}, `To: ${CONFIG.contactEmail}`), el("p", {}, `Subject: ${email.subject}`), el("pre", {}, email.body));
    preview.append(box);

    const actions = el("div", { class: "email-actions" });
    actions.append(el("a", { class: "button button-primary", href: email.href }, "Open in my email app"));
    const copyBtn = el("button", { class: "button button-secondary", type: "button" }, "Copy email text");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(`To: ${CONFIG.contactEmail}\nSubject: ${email.subject}\n\n${email.body}`);
        copyBtn.textContent = "Copied!";
      } catch (error) {
        copyBtn.textContent = "Copy failed \u2013 select the text manually";
      }
      setTimeout(() => (copyBtn.textContent = "Copy email text"), 2500);
    });
    actions.append(copyBtn);
    preview.append(actions);

    preview.hidden = false;
    preview.focus();
    preview.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  });
}

/* ---------- Start everything once the DOM is ready --------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initReveal();
  initProducts();
  initAccordion();
  initMap();
  initEnquiryForm();
  initContactForm();
});
