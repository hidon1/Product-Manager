# Product Manager Parameter Map

מסמך זה מרכז שמות פרמטרים ברורים לשימוש ב-API.

## 1) פרמטרים של עיצוב (Designer)

- `theme.primaryColor` — צבע ראשי.
- `theme.cardBackground` — צבע כרטיס.
- `theme.textColor` — צבע טקסט.
- `theme.buttonColor` — צבע כפתור.
- `theme.cardTone` — סוג רקע כרטיס (`solid` / `gradient` / `glass` / `outline`).
- `theme.cardShadow` — עומק צל (`none` / `soft` / `medium` / `strong`).
- `theme.cardPadding` — ריווח פנימי בכרטיס.
- `theme.borderRadius` — עיגול פינות כרטיס.
- `theme.imageHeight` — גובה תמונת מוצר.
- `theme.textAlign` — יישור טקסט.
- `theme.desktopColumns` — מספר כרטיסים בשורה בדסקטופ.
- `theme.mobileColumns` — מספר כרטיסים בשורה במובייל.
- `theme.showCart` — הצגת כפתור הוספה לסל (כן/לא).
- `theme.cartButtonText` — טקסט ברירת מחדל לכפתור הוספה לסל.
- `theme.animationStyle` — סוג אנימציה גלובלית לכרטיס.
- `theme.animationDuration` — מהירות אנימציה בשניות.
- `theme.animationDelay` — השהיית אנימציה בשניות.
- `theme.applyMode` — מצב החלת עיצוב (`all` / `selected`).
- `theme.selectedProductId` — מזהה כרטיס יעד כאשר `applyMode=selected`.

## 2) פרמטרים של ניהול מוצרים (Product)

- `product.id` / `product.productId` — מזהה מוצר.
- `product.name` — שם מוצר.
- `product.price` — מחיר.
- `product.description` — תיאור.
- `product.tags[]` — תגיות מוצר (טקסט + צבע + צורה).
- `product.tagStyles` — עיצוב תגיות לפי שם תגית.
- `product.imageUrl` — קישור תמונה.
- `product.accentColor` — צבע ראשי למוצר.
- `product.cardBackground` — צבע גוף הכרטיס למוצר.
- `product.buttonStyle` — צורת כפתור הוספה לסל.
- `product.cartButtonText` — טקסט כפתור הוספה לסל ברמת מוצר.
- `product.showCart` — הצגת כפתור סל למוצר (`show` / `hide` / `default`).
- `product.useSiteTheme` — שימוש בעיצוב אתר או מותאם מוצר (`inherit` / `custom`).
- `product.variants[]` — קטגוריות בחירה ואפשרויות.
- `product.colors[]` — צבעים שהופקו מהווריאציות.
- `product.active` — מוצר פעיל (כן/לא).
- `product.status` — סטטוס מוצר (`active` / `inactive`).
- `product.published` — פרסום ציבורי (כן/לא).
- `product.imageStorageMode` — אופן שמירת תמונה (`storage` / `firestore-inline`).
- `product.createdAt` — תאריך יצירה.
- `product.updatedAt` — תאריך עדכון.

## 3) הערות שימוש API

- עדיפות הגדרת טקסט כפתור: `product.cartButtonText` ואז `theme.cartButtonText`.
- אנימציה נשלטת בעיצוב (Theme) באמצעות `theme.animationStyle`, `theme.animationDuration`, `theme.animationDelay`.
