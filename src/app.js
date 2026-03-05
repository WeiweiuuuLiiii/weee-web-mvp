
// WEEE Grocery MVP (no build step) — a small, portfolio-friendly web demo
// Data is local-only. Use the console to see event logs.

const STORE_KEY = "weee_mvp_cart_v1";

const catalog = [
  { id: "milk", name: "Whole Milk 1gal", price: 4.29, stock: "in", tags: ["dairy"] },
  { id: "eggs", name: "Large Eggs (12)", price: 3.79, stock: "in", tags: ["breakfast"] },
  { id: "banana", name: "Bananas (1lb)", price: 0.69, stock: "in", tags: ["produce"] },
  { id: "strawberry", name: "Strawberries", price: 3.99, stock: "oos", tags: ["produce"] },
  { id: "yogurt", name: "Greek Yogurt", price: 1.59, stock: "in", tags: ["dairy"] },
  { id: "chicken", name: "Chicken Breast", price: 8.99, stock: "in", tags: ["protein"] },
  { id: "tofu", name: "Firm Tofu", price: 2.49, stock: "in", tags: ["protein"] },
  { id: "rice", name: "Jasmine Rice 5lb", price: 10.99, stock: "in", tags: ["pantry"] },
];

const frequent = ["milk", "eggs", "banana", "rice"];

const coupons = [
  { id: "save2", label: "$2 off $25+", minSubtotal: 25, discount: 2 },
  { id: "dairy10", label: "10% off dairy", category: "dairy", percent: 0.10 },
];

function logEvent(name, props = {}) {
  console.log(`[event] ${name}`, { ts: new Date().toISOString(), ...props });
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveCart(cart) {
  localStorage.setItem(STORE_KEY, JSON.stringify(cart));
  updateCartCount();
}
function cartCount(cart) {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}
function money(n) {
  return `$${n.toFixed(2)}`;
}
function getItem(id) {
  return catalog.find(x => x.id === id);
}
function calcSubtotal(cart) {
  let s = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const it = getItem(id);
    if (it) s += it.price * qty;
  }
  return s;
}
function applyCoupons(cart, selectedCouponIds) {
  const subtotal = calcSubtotal(cart);
  let discount = 0;
  for (const cid of selectedCouponIds) {
    const c = coupons.find(x => x.id === cid);
    if (!c) continue;
    if (c.minSubtotal && subtotal >= c.minSubtotal) discount += c.discount;
    if (c.category && c.percent) {
      for (const [id, qty] of Object.entries(cart)) {
        const it = getItem(id);
        if (it && it.tags.includes(c.category)) discount += it.price * qty * c.percent;
      }
    }
  }
  return Math.min(discount, subtotal);
}

const app = document.getElementById("app");
const tabs = [...document.querySelectorAll(".tab")];
const cartCountEl = document.getElementById("cartCount");

let route = "home";
let selectedCoupons = [];
let deliveryPref = { leaveAtDoor: true, noCall: true };
let deliveryTime = "Tomorrow 10am–12pm";

function updateCartCount() {
  const c = loadCart();
  cartCountEl.textContent = String(cartCount(c));
}
updateCartCount();

tabs.forEach(btn => btn.addEventListener("click", () => {
  route = btn.dataset.route;
  tabs.forEach(t => t.classList.toggle("active", t === btn));
  render();
  logEvent("navigate", { route });
}));

function setRoute(r) {
  route = r;
  tabs.forEach(t => t.classList.toggle("active", t.dataset.route === r));
  render();
  logEvent("navigate", { route: r });
}

function addToCart(id, qty = 1) {
  const cart = loadCart();
  cart[id] = (cart[id] || 0) + qty;
  saveCart(cart);
  logEvent("add_to_cart", { id, qty });
}

function removeFromCart(id) {
  const cart = loadCart();
  delete cart[id];
  saveCart(cart);
  logEvent("remove_from_cart", { id });
}

function setQty(id, qty) {
  const cart = loadCart();
  if (qty <= 0) delete cart[id];
  else cart[id] = qty;
  saveCart(cart);
  logEvent("update_qty", { id, qty });
}

function renderHome() {
  const cart = loadCart();
  const freqItems = frequent.map(getItem).filter(Boolean);
  const html = `
    <section class="grid">
      <div class="card half">
        <h1>One‑click reorder</h1>
        <div class="muted">Fast add from frequent items, with instant feedback.</div>
        <div class="list">
          ${freqItems.map(it => `
            <div class="item">
              <div class="left">
                <div class="name">${it.name}</div>
                <div class="meta">${money(it.price)} • ${it.tags.join(", ")}</div>
              </div>
              <div class="row">
                <button class="btn primary" data-add="${it.id}">Add</button>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="hr"></div>
        <div class="row">
          <button class="btn" id="goCart">Proceed to cart</button>
          <span class="badge ok">Items in cart: ${cartCount(cart)}</span>
        </div>
      </div>

      <div class="card half">
        <h1>Smart checkout review</h1>
        <div class="muted">Surface missing/forgotten items + delivery preferences before submit.</div>
        <div class="hr"></div>
        <div class="row">
          <span class="badge">${deliveryTime}</span>
          <button class="btn" id="reschedule">Reschedule</button>
        </div>
        <div class="list">
          <div class="item">
            <div class="left">
              <div class="name">Delivery preferences</div>
              <div class="meta">Reduce friction at the door</div>
            </div>
            <div class="row">
              <label class="badge"><input type="checkbox" id="leaveDoor" ${deliveryPref.leaveAtDoor ? "checked":""}/> Leave at door</label>
              <label class="badge"><input type="checkbox" id="noCall" ${deliveryPref.noCall ? "checked":""}/> No call</label>
            </div>
          </div>
        </div>
        <div class="hr"></div>
        <button class="btn primary" id="goCheckout">Review & checkout</button>
      </div>
    </section>
  `;

  app.innerHTML = html;

  app.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.add;
    addToCart(id, 1);
    b.textContent = "Added ✓";
    setTimeout(() => (b.textContent = "Add"), 900);
  }));
  document.getElementById("goCart").onclick = () => setRoute("cart");
  document.getElementById("goCheckout").onclick = () => setRoute("checkout");
  document.getElementById("reschedule").onclick = () => {
    deliveryTime = deliveryTime.includes("Tomorrow") ? "Saturday 2pm–4pm" : "Tomorrow 10am–12pm";
    logEvent("reschedule_delivery", { deliveryTime });
    render();
  };
  document.getElementById("leaveDoor").onchange = (e) => { deliveryPref.leaveAtDoor = e.target.checked; logEvent("toggle_pref", { leaveAtDoor: deliveryPref.leaveAtDoor }); };
  document.getElementById("noCall").onchange = (e) => { deliveryPref.noCall = e.target.checked; logEvent("toggle_pref", { noCall: deliveryPref.noCall }); };
}

function renderSearch() {
  const html = `
    <section class="grid">
      <div class="card half">
        <h1>Search</h1>
        <div class="muted">Try “strawberry” to see out-of-stock recovery.</div>
        <input id="q" class="input" placeholder="Search products…" />
        <div id="results" class="list"></div>
      </div>
      <div class="card half">
        <h1>Recommendations</h1>
        <div class="muted">Suggested substitutions / add-ons.</div>
        <div id="recs" class="list"></div>
      </div>
    </section>
  `;
  app.innerHTML = html;
  const q = document.getElementById("q");
  const results = document.getElementById("results");
  const recs = document.getElementById("recs");

  function show(items) {
    results.innerHTML = items.map(it => {
      const oos = it.stock === "oos";
      return `
        <div class="item">
          <div class="left">
            <div class="name">${it.name}</div>
            <div class="meta">${money(it.price)} • ${it.tags.join(", ")}</div>
          </div>
          <div class="row">
            ${oos ? `<span class="badge warn">Out of stock</span>` : `<span class="badge ok">In stock</span>`}
            <button class="btn primary" data-add="${it.id}" ${oos ? "disabled":""}>Add</button>
            ${oos ? `<button class="btn" data-sub="${it.id}">Find substitute</button>` : ``}
          </div>
        </div>
      `;
    }).join("");
    results.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => addToCart(b.dataset.add, 1)));
    results.querySelectorAll("[data-sub]").forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.sub;
      const it = getItem(id);
      const subs = catalog.filter(x => x.tags.some(t => it.tags.includes(t)) && x.stock === "in" && x.id !== id).slice(0, 3);
      recs.innerHTML = subs.map(s => `
        <div class="item">
          <div class="left">
            <div class="name">${s.name}</div>
            <div class="meta">Suggested substitute • ${money(s.price)}</div>
          </div>
          <button class="btn primary" data-add="${s.id}">Add</button>
        </div>
      `).join("") || `<div class="muted">No substitutes found.</div>`;
      recs.querySelectorAll("[data-add]").forEach(btn => btn.addEventListener("click", () => {
        addToCart(btn.dataset.add, 1);
        logEvent("oos_substitute_added", { oos: id, substitute: btn.dataset.add });
      }));
      logEvent("oos_substitute_viewed", { oos: id, subs: subs.map(x => x.id) });
    }));
  }

  q.addEventListener("input", () => {
    const term = q.value.trim().toLowerCase();
    const items = catalog.filter(it => it.name.toLowerCase().includes(term) || it.id.includes(term));
    show(term ? items : catalog);
    logEvent("search", { term });
  });

  show(catalog);
  recs.innerHTML = `<div class="muted">Select an out-of-stock item to see substitutions.</div>`;
}

function renderCart() {
  const cart = loadCart();
  const rows = Object.entries(cart).map(([id, qty]) => {
    const it = getItem(id);
    if (!it) return "";
    return `
      <div class="item">
        <div class="left">
          <div class="name">${it.name}</div>
          <div class="meta">${money(it.price)} • ${it.tags.join(", ")}</div>
        </div>
        <div class="row">
          <button class="btn" data-dec="${id}">-</button>
          <span class="badge">${qty}</span>
          <button class="btn" data-inc="${id}">+</button>
          <button class="btn danger" data-rm="${id}">Remove</button>
        </div>
      </div>
    `;
  }).join("");

  const subtotal = calcSubtotal(cart);

  app.innerHTML = `
    <section class="grid">
      <div class="card half">
        <h1>Cart</h1>
        <div class="muted">Edit quantities before checkout.</div>
        <div class="list">${rows || `<div class="muted">Your cart is empty.</div>`}</div>
      </div>
      <div class="card half">
        <h1>Order summary</h1>
        <div class="list">
          <div class="item"><div class="left"><div class="name">Subtotal</div></div><div class="badge">${money(subtotal)}</div></div>
          <div class="item"><div class="left"><div class="name">Suggested add‑ons</div><div class="meta">Coupons & quick adds</div></div></div>
        </div>
        <div class="hr"></div>
        <div class="row">
          <button class="btn" id="addYogurt">Add yogurt</button>
          <button class="btn" id="addTofu">Add tofu</button>
        </div>
        <div class="hr"></div>
        <button class="btn primary" id="goCheckout" ${subtotal === 0 ? "disabled":""}>Proceed to checkout</button>
      </div>
    </section>
  `;

  app.querySelectorAll("[data-inc]").forEach(b => b.onclick = () => setQty(b.dataset.inc, (cart[b.dataset.inc] || 0) + 1));
  app.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => setQty(b.dataset.dec, (cart[b.dataset.dec] || 0) - 1));
  app.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => removeFromCart(b.dataset.rm));
  document.getElementById("addYogurt").onclick = () => addToCart("yogurt", 1);
  document.getElementById("addTofu").onclick = () => addToCart("tofu", 1);
  document.getElementById("goCheckout").onclick = () => setRoute("checkout");
}

function renderCheckout() {
  const cart = loadCart();
  const subtotal = calcSubtotal(cart);
  const missing = ["strawberry"].filter(id => (cart[id] || 0) === 0); // demo “forgotten item” example

  const discount = applyCoupons(cart, selectedCoupons);
  const total = Math.max(0, subtotal - discount);

  app.innerHTML = `
    <section class="grid">
      <div class="card half">
        <h1>Checkout review</h1>
        <div class="muted">Verify delivery + catch missing items before submit.</div>
        <div class="hr"></div>

        <div class="item">
          <div class="left">
            <div class="name">Delivery time</div>
            <div class="meta">${deliveryTime}</div>
          </div>
          <button class="btn" id="reschedule">Reschedule</button>
        </div>

        <div class="item">
          <div class="left">
            <div class="name">Delivery preferences</div>
            <div class="meta">Fewer handoffs</div>
          </div>
          <div class="row">
            <label class="badge"><input type="checkbox" id="leaveDoor" ${deliveryPref.leaveAtDoor ? "checked":""}/> Leave at door</label>
            <label class="badge"><input type="checkbox" id="noCall" ${deliveryPref.noCall ? "checked":""}/> No call</label>
          </div>
        </div>

        ${missing.length ? `
          <div class="item">
            <div class="left">
              <div class="name">You might have forgotten</div>
              <div class="meta">${missing.map(id => getItem(id)?.name || id).join(", ")}</div>
            </div>
            <button class="btn primary" id="addMissing">Add</button>
          </div>
        ` : ``}

        <div class="hr"></div>
        <button class="btn primary" id="submit" ${subtotal === 0 ? "disabled":""}>Place order</button>
      </div>

      <div class="card half">
        <h1>Coupons</h1>
        <div class="muted">Simple rules engine to apply order discounts.</div>
        <div class="list">
          ${coupons.map(c => `
            <div class="item">
              <div class="left">
                <div class="name">${c.label}</div>
                <div class="meta">${c.minSubtotal ? `Requires subtotal ≥ ${money(c.minSubtotal)}` : c.category ? `Applies to ${c.category}` : ""}</div>
              </div>
              <label class="badge">
                <input type="checkbox" data-coupon="${c.id}" ${selectedCoupons.includes(c.id) ? "checked":""}/>
                Apply
              </label>
            </div>
          `).join("")}
        </div>

        <div class="hr"></div>
        <div class="list">
          <div class="item"><div class="left"><div class="name">Subtotal</div></div><div class="badge">${money(subtotal)}</div></div>
          <div class="item"><div class="left"><div class="name">Discount</div></div><div class="badge">${money(discount)}</div></div>
          <div class="item"><div class="left"><div class="name">Total</div></div><div class="badge ok">${money(total)}</div></div>
        </div>
      </div>
    </section>
  `;

  document.querySelectorAll("[data-coupon]").forEach(cb => cb.onchange = (e) => {
    const id = cb.dataset.coupon;
    if (e.target.checked) selectedCoupons = [...new Set([...selectedCoupons, id])];
    else selectedCoupons = selectedCoupons.filter(x => x !== id);
    logEvent("toggle_coupon", { id, selected: e.target.checked });
    renderCheckout();
  });

  document.getElementById("reschedule").onclick = () => {
    deliveryTime = deliveryTime.includes("Tomorrow") ? "Saturday 2pm–4pm" : "Tomorrow 10am–12pm";
    logEvent("reschedule_delivery", { deliveryTime });
    renderCheckout();
  };
  document.getElementById("leaveDoor").onchange = (e) => { deliveryPref.leaveAtDoor = e.target.checked; logEvent("toggle_pref", { leaveAtDoor: deliveryPref.leaveAtDoor }); };
  document.getElementById("noCall").onchange = (e) => { deliveryPref.noCall = e.target.checked; logEvent("toggle_pref", { noCall: deliveryPref.noCall }); };

  const addMissing = document.getElementById("addMissing");
  if (addMissing) addMissing.onclick = () => {
    addToCart(missing[0], 1);
    logEvent("add_forgotten_item", { id: missing[0] });
    renderCheckout();
  };

  document.getElementById("submit").onclick = () => {
    logEvent("checkout_submit", { subtotal, discount, total, deliveryTime, deliveryPref, coupons: selectedCoupons });
    localStorage.removeItem(STORE_KEY);
    updateCartCount();
    alert("Order placed (demo). Cart cleared.");
    setRoute("home");
  };
}

function render() {
  if (route === "home") return renderHome();
  if (route === "search") return renderSearch();
  if (route === "cart") return renderCart();
  if (route === "checkout") return renderCheckout();
}

render();
logEvent("app_loaded");

