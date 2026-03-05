# Event Schema (v1)

Each event:
- `ts` (ISO string)
- `name` (string)
- `props` (object)

## Events
- `page_view` { page }
- `search_submit` { query }
- `item_view` { itemId }
- `add_to_cart` { itemId, qty }
- `remove_from_cart` { itemId }
- `qty_change` { itemId, from, to }
- `oos_shown` { itemId }
- `substitute_click` { itemId, substituteId }
- `checkout_start` { cartSize }
- `checkout_submit` { cartSize, deliveryPref }
- `checkout_blocked` { reason }  // e.g., "empty_cart" | "missing_items"
