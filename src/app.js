// src/app.js
// Minimal, deterministic renderer for WEEE Web MVP.
// Ensures the <main id="app"> is always populated.

const App = (() => {
  const state = {
    page: "home",
    query: "",
    cartCount: 0,
    events: [],
  };

  function logEvent(name, props = {}) {
    const evt = { ts: new Date().toISOString(), name, props };
    state.events.push(evt);
    console.log("[event]", evt);
  }

  function $(sel) {
    return document.querySelector(sel);
  }

  function setActiveTab(page) {
    document.querySelectorAll(".tab").forEach((btn) => {
      const isActive = btn.dataset.route === page;
      btn.classList.toggle("active", isActive);
    });
  }

  function renderHome() {
    return `
      <section class="card">
        <h2>Welcome</h2>
        <p>This is a local demo MVP. Use the tabs to navigate through the funnel.</p>
        <ul>
          <li><b>Search</b> for items and see OOS states</li>
          <li><b>Cart</b> shows items you added</li>
          <li><b>Checkout</b> runs a simple review step</li>
        </ul>
      </section>
    `;
  }

  function renderSearch() {
    return `
      <section class="card">
        <h2>Search</h2>
        <div class="row">
          <input id="q" class="input" placeholder="Try typing: milk, apple, rice" value="${escapeHtml(state.query)}" />
          <button id="searchBtn" class="btn">Search</button>
        </div>
        <div id="results" class="stack"></div>
      </section>
    `;
  }

  function renderCart() {
    return `
      <section class="card">
        <h2>Cart</h2>
        <p>Items in cart: <b>${state.cartCount}</b></p>
        <div class="row">
          <button id="addOne" class="btn">+ Add 1</button>
          <button id="removeOne" class="btn ghost">- Remove 1</button>
        </div>
      </section>
    `;
  }

  function renderCheckout() {
    return `
      <section class="card">
        <h2>Checkout</h2>
        <p>Checkout review (demo):</p>
        <ul>
          <li>Delivery preference: leave at door (default)</li>
          <li>Missing/forgotten items check (placeholder)</li>
        </ul>
        <button id="placeOrder" class="btn">Place order</button>
      </section>
    `;
  }

  function render() {
    const root = $("#app");
    if (!root) return;

    setActiveTab(state.page);

    let html = "";
    if (state.page === "home") html = renderHome();
    else if (state.page === "search") html = renderSearch();
    else if (state.page === "cart") html = renderCart();
    else if (state.page === "checkout") html = renderCheckout();
    else html = renderHome();

    root.innerHTML = html;

    // Update cart pill
    const pill = $("#cartCount");
    if (pill) pill.textContent = String(state.cartCount);

    // Wire page-specific handlers
    if (state.page === "search") bindSearch();
    if (state.page === "cart") bindCart();
    if (state.page === "checkout") bindCheckout();
  }

  function bindNav() {
    document.querySelectorAll("[data-route]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.page = btn.dataset.route;
        logEvent("page_view", { page: state.page });
        render();
      });
    });
  }

  function bindSearch() {
    const input = $("#q");
    const btn = $("#searchBtn");
    const results = $("#results");

    const dataset = [
      { id: "milk", name: "Milk", inStock: true },
      { id: "apple", name: "Apple", inStock: true },
      { id: "rice", name: "Rice", inStock: false, substitute: "brown-rice" },
      { id: "brown-rice", name: "Brown Rice", inStock: true },
    ];

    function runSearch() {
      state.query = input ? input.value.trim() : "";
      logEvent("search_submit", { query: state.query });

      const q = state.query.toLowerCase();
      const hits = dataset.filter((x) => x.name.toLowerCase().includes(q));

      if (!results) return;
      if (q.length === 0) {
        results.innerHTML = `<div class="muted">Type something to search.</div>`;
        return;
      }
      if (hits.length === 0) {
        results.innerHTML = `<div class="muted">No results.</div>`;
        return;
      }

      results.innerHTML = hits
        .map((x) => {
          const badge = x.inStock ? `<span class="badge ok">In stock</span>` : `<span class="badge warn">Out of stock</span>`;
          const action = x.inStock
            ? `<button class="btn small" data-add="${x.id}">Add</button>`
            : `<button class="btn small ghost" data-sub="${x.substitute || ""}">View substitute</button>`;
          return `
            <div class="item">
              <div>
                <div class="itemTitle">${x.name}</div>
                ${badge}
              </div>
              <div>${action}</div>
            </div>
          `;
        })
        .join("");

      results.querySelectorAll("[data-add]").forEach((b) => {
        b.addEventListener("click", () => {
          state.cartCount += 1;
          logEvent("add_to_cart", { itemId: b.dataset.add, qty: 1 });
          render();
        });
      });

      results.querySelectorAll("[data-sub]").forEach((b) => {
        b.addEventListener("click", () => {
          const sid = b.dataset.sub;
          logEvent("substitute_click", { substituteId: sid || null });
          if (!sid) return;
          // Auto switch to "search" and show the substitute by setting query
          state.query = "Brown Rice";
          render();
          // run search after render wires handlers
          const newInput = $("#q");
          if (newInput) newInput.value = state.query;
          const newBtn = $("#searchBtn");
          if (newBtn) newBtn.click();
        });
      });
    }

    if (btn) btn.addEventListener("click", runSearch);
    if (input) input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runSearch();
    });

    // initial content
    if (results) results.innerHTML = `<div class="muted">Type something to search.</div>`;
  }

  function bindCart() {
    const add = $("#addOne");
    const rm = $("#removeOne");
    if (add) add.addEventListener("click", () => {
      state.cartCount += 1;
      logEvent("add_to_cart", { itemId: "demo", qty: 1 });
      render();
    });
    if (rm) rm.addEventListener("click", () => {
      const from = state.cartCount;
      state.cartCount = Math.max(0, state.cartCount - 1);
      logEvent("qty_change", { itemId: "demo", from, to: state.cartCount });
      render();
    });
  }

  function bindCheckout() {
    const btn = $("#placeOrder");
    if (btn) btn.addEventListener("click", () => {
      if (state.cartCount === 0) {
        logEvent("checkout_blocked", { reason: "empty_cart" });
        alert("Cart is empty (demo). Add items first.");
        return;
      }
      logEvent("checkout_submit", { cartSize: state.cartCount, deliveryPref: "leave_at_door" });
      alert("Order placed (demo)!");
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function init() {
    bindNav();
    logEvent("page_view", { page: state.page });
    render();
  }

  return { init };
})();

window.addEventListener("DOMContentLoaded", () => App.init());
