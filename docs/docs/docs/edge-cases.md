# Edge Cases Checklist (v1)

- Search returns 0 results
- Item is out of stock (OOS) and user tries to add to cart
- Duplicate add-to-cart increments quantity
- Cart quantity set to 0 removes item
- Checkout blocked when cart is empty
- Checkout review surfaces "missing/forgotten items" suggestions
- Delivery preference required (default safe value)
- Refresh page does not break navigation (state resets safely)
