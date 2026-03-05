# WEEE Web MVP — Engineering Spec (v1)

## Goal
Ship a lightweight grocery-ordering MVP that validates the core shopping funnel with clear UI state handling and a clean path to full-stack extension.

## Core user flows
1. Search items → browse results + item states
2. Handle out-of-stock (OOS) items → show substitutes/recommendations
3. Add to cart → edit quantities/remove items
4. Checkout review → validate missing/forgotten items + delivery preferences

## Non-goals (v1)
- Payments, authentication, real inventory sync, real order fulfillment

## State model (v1)
- `catalog`: list of items (id, name, price, inStock, tags)
- `cart`: map of itemId → quantity
- `ui`: page, query, selected item, modal states
- `events`: append-only event log for interaction analytics (exportable)

## Engineering principles
- Deterministic UI: each screen is a pure function of state
- Every user action emits an event (analytics-style logging)
- Keep logic modular (render, state transitions, event logging)

## Future full-stack path
- `/api/events` to persist logs
- `/api/cart` to persist cart across sessions
- `/api/search` to back the catalog with real data + ranking
