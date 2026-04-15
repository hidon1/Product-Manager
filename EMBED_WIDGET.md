# Product Widget Embed (No iframe)

המימוש מבוסס על עיקרון אחד: **Script → Fetch JSON → Render**.

## Public API

Endpoint קבוע לדוגמה:

- `/public-api/products.json`

ה־JSON מחזיר רשימת `stores`, כאשר לכל חנות יש `storeId` ו־`products`.

## הטמעה אצל לקוח קצה

```html
<div id="store-widget"></div>
<script
  async
  defer
  src="https://your-domain.com/widget.js"
  store-id="demo-store-he"
  target="#store-widget"
  api-base="https://your-domain.com/public-api/products.json"
></script>
```

> אפשר להשאיר רק `store-id` אם משתמשים בברירות המחדל (`#store-widget` ו־`/public-api/products.json`).

## Events

ה־widget מפזר אירועים גלובליים:

- `pmw:loaded`
- `pmw:error`
- `pmw:add-to-cart`
- `pmw:product-click`

דוגמה:

```html
<script>
  window.addEventListener("pmw:add-to-cart", function (event) {
    console.log("Add to cart", event.detail.product);
  });
</script>
```

## התאמת עיצוב (אופציונלי)

```html
<script>
  window.ProductWidgetConfig = {
    "demo-store-he": {
      columns: 4,
      theme: {
        primary: "#0ea5e9",
        cardBackground: "#ffffff"
      }
    }
  };
</script>
```
