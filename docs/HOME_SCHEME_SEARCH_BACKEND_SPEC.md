# Home Page Scheme Search – Backend Spec

## Overview

The public home page (logged-out) has a Search Schemes section with two filters: **Age Group** and **Category**. When the user clicks "Search Schemes", the frontend calls the schemes API with these filters. This document describes what the frontend sends and what it expects from the backend.

---

## APIs Used

### 1. GET /api/categories/simple (or /api/categories)

**Purpose:** Populate the Category dropdown.

**Request:** `GET /api/categories/simple` (no body)

**Response shape:** Each category: `{ _id, category_name, name, displayName }`

```json
{
  "status": "success",
  "categories": [
    { "_id": "69a123...", "category_name": "women", "name": "women", "displayName": "Women" },
    { "_id": "69a456...", "category_name": "children", "name": "children", "displayName": "Children" }
  ],
  "count": 2
}
```

**Fields used by frontend:**
- `_id` or `id` – used as `category_id` when filtering
- `category_name` or `name` or `categoryName` – displayed in the dropdown

---

### 2. GET /api/schemes (filtered)

**Purpose:** Fetch schemes for the home page, optionally filtered by age and category.

**Request:** `GET /api/schemes?...query_params`

**Query parameters sent by frontend:**

| Parameter      | Type   | Description                                                                 |
|----------------|--------|-----------------------------------------------------------------------------|
| `approved_only`| string | `"true"` – only return approved schemes                                    |
| `filter_type`  | string | `"scheme"` – scheme-level filter                                           |
| `age_group`    | string | (optional) Only sent if user selects an age range. Values: see below       |
| `category_id`  | string | (optional) Only sent if user selects a category (ObjectId from categories) |

**`age_group` values (and ranges):**
| Value | Range |
|-------|-------|
| `"20-30"` | 20–30 |
| `"30-40"` | 30–40 |
| `"40-50"` | 40–50 |
| `"50-60"` | 50–60 |
| `"60-70"` | 60–70 |
| `"70_and_above"` | 70–150 |
| `"all"` or omitted | No age filter |

**Age filter logic (overlap):** Include scheme if  
`scheme.scheme_eligibility.lower_age_limit <= selectedMax` AND  
`scheme.scheme_eligibility.upper_age_limit >= selectedMin`

**`category_id`:** Filters by `scheme.category` (ObjectId string).

**Example requests:**
```
GET /api/schemes?approved_only=true&filter_type=scheme
GET /api/schemes?approved_only=true&filter_type=scheme&age_group=20-30
GET /api/schemes?approved_only=true&filter_type=scheme&category_id=69a1234567890abcdef12345
GET /api/schemes?approved_only=true&filter_type=scheme&age_group=40-50&category_id=69a1234567890abcdef12345
```

**Expected response:** Same as current schemes API (array of scheme objects or `{ data: [...] }`). Frontend expects:
- Array of scheme objects, each with at least: `_id` or `scheme_id`, `scheme_name`, `scheme_description`, `scheme_image_file_url`, `approval_status`

---

## Backend Implementation Status

**WSchemeAPI** implements this spec:
- `routes/schemes.js`: `category_id` (filters by `scheme.category`) and `age_group` (overlap logic using `scheme_eligibility.lower_age_limit` / `upper_age_limit`)
- `routes/categories.js`: `GET /simple` returns `{ _id, category_name, name, displayName }` per category
