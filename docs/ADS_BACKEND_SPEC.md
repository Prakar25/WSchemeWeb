# Advertisements API – Backend Spec

Ads are shown in the **FlowingMenu** on the **public homepage** (logged out) and **public user dashboard** (logged in). They are managed only by **Super Admin** in System Admin → **Advertisement**.

---

## 1. Public endpoint (no auth)

**GET** `/api/ads/public`

- **Purpose:** Return only **active** ads, in display order. Used by home and public dashboard.
- **Response shape (one of):**
  - `{ data: Ad[] }`
  - `{ ads: Ad[] }`
  - `Ad[]` (array at root)

**Ad shape (minimal):**

```json
{
  "id": "string (or _id)",
  "text": "string (title shown in menu)",
  "link": "string (URL, e.g. https://... or #)",
  "image": "string (image URL)",
  "image_url": "string (alternative field name)",
  "order": "number (optional, for sort; lower = first)",
  "active": "boolean (optional; default true)"
}
```

- If the backend uses nested image object: `image: { url: "..." }` is also supported by the frontend.

---

## 2. Admin endpoints (Super Admin only)

Base path: `/api/ads`. Auth: require Super Admin (e.g. by role/roleLevel).

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/ads` | List all ads (for management). |
| POST | `/api/ads` | Create ad. Body: `{ text, link, image_url?, order?, active? }`. |
| PUT | `/api/ads/:id` | Update ad. Body: same as create. |
| DELETE | `/api/ads/:id` | Delete ad. |
| POST | `/api/ads/reorder` | (Optional) Reorder. Body: `{ order: string[] }` (ids in desired order). |

**Create/Update body example:**

```json
{
  "text": "Welfare Schemes",
  "link": "https://example.com/schemes",
  "image_url": "https://...",
  "order": 0,
  "active": true
}
```

- **text:** Required. Shown in the FlowingMenu.
- **link:** Required (can be `"#"`). Where the menu item links to.
- **image_url:** Optional. Image shown in the marquee. Can also be stored as `image: { url: "..." }`.
- **order:** Optional number. Lower = higher in list.
- **active:** Optional boolean. Only ads with `active !== false` should be returned by `GET /api/ads/public`.

---

## 3. Frontend usage

- **Public:** `AdsSection` calls `GET /api/ads/public` and renders `FlowingMenu` with the result. If the API fails or returns empty, default placeholder items are shown (e.g. “Welfare Schemes”, “Women & Child”, “Government of Sikkim”).
- **System Admin:** Sidebar has **Advertisement**. The page at `/system-admin/advertisement` uses:
  - `GET /api/ads` – list
  - `POST /api/ads` – create
  - `PUT /api/ads/:id` – update
  - `DELETE /api/ads/:id` – delete

---

## 4. Access control

- **GET /api/ads/public:** No auth; returns only active ads.
- **GET/POST/PUT/DELETE /api/ads:** Restrict to **Super Admin** (e.g. by role or roleLevel). Return 403 if not allowed.

---

## 5. Suggested DB model (example)

- `_id`, `text`, `link`, `image` (object or string), `order` (number), `active` (boolean), `createdAt`, `updatedAt`.

Once these endpoints and shapes are implemented, the existing frontend will load and manage ads without further changes.
