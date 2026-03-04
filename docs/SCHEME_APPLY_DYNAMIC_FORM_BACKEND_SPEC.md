# Dynamic Scheme Application Form – Backend Implementation Spec

Use this document to implement backend support for **dynamic, per-scheme application form fields**. Admins define custom fields when creating/editing a scheme; applicants see and fill those fields when applying.

---

## Overview

- **Admin side:** When creating/editing a scheme, admins can define `custom_form_fields` (e.g. `annual_income`, `household_type`, scheme-specific questions).
- **Applicant side:** When applying to a scheme, applicants see only the fields defined for that scheme (no hardcoded fields).
- **Backend:** Must store `custom_form_fields` on schemes, return them when schemes are fetched, validate `form_data` on apply, and persist it with the application.

---

## 1. Scheme Model – `custom_form_fields`

### Schema

Add (or ensure) `custom_form_fields` on the Scheme model:

```javascript
// Scheme document
{
  _id: ObjectId,
  scheme_name: String,
  // ... other scheme fields ...
  custom_form_fields: [
    {
      field_key: String,   // e.g. "annual_income", "household_type"
      label: String,       // e.g. "Annual Income (INR)"
      type: String,       // "text" | "number" | "select" | "date" | "textarea" | "checkbox"
      required: Boolean,
      options: String     // optional; for type "select", comma-separated, e.g. "Option1, Option2"
    }
  ]
}
```

### API Behaviour

- **POST /api/schemes** – Accept `custom_form_fields` in request body; persist as stored.
- **POST /api/schemes/update** – Accept `custom_form_fields`; replace on update.
- **GET /api/schemes** and **GET /api/schemes/:id** – Include `custom_form_fields` in response (array, possibly empty).

---

## 2. POST /api/applications/apply

### Current Request (Frontend sends)

```json
{
  "user_id": "ObjectId string",
  "scheme_id": "ObjectId string",
  "form_data": {
    "annual_income": 50000,
    "household_type": "Nuclear",
    "custom_field_1": "value"
  },
  "documents_submitted": [
    {
      "document_type": "Aadhaar Card",
      "file_url": "public/path/to/file.pdf"
    }
  ]
}
```

### Expected Behaviour

1. **Lookup scheme** – Fetch scheme by `scheme_id`.
2. **Validate `form_data` against `custom_form_fields`**:
   - For each field in `scheme.custom_form_fields` where `required === true`, ensure `form_data[field_key]` is present and non-empty.
   - For `type === "number"`, coerce/validate numeric.
   - For `type === "select"`, validate value is in `options` (split by comma).
   - For `type === "date"`, validate ISO date string or accepted format.
   - For `type === "checkbox"`, treat as boolean.
   - Ignore any `form_data` keys that are not in `custom_form_fields` (or reject as invalid—choose one policy).
3. **Create application** – Store `form_data` with the application document.
4. **Return** – 200/201 with application record or success message.

### Application Model

Ensure application documents store `form_data`:

```javascript
// Application document
{
  _id: ObjectId,
  user_id: ObjectId,
  scheme_id: ObjectId,
  // ... other fields ...
  form_data: {
    "annual_income": 50000,
    "household_type": "Nuclear"
  },
  documents_submitted: [{ document_type: String, file_url: String }]
}
```

### Validation Rules (Summary)

| type     | required check                  | value validation                              |
|----------|----------------------------------|-----------------------------------------------|
| text     | non-empty string                | -                                             |
| number   | present, numeric                | parse as number                               |
| select   | present, non-empty              | value in options (split by comma)             |
| date     | present, non-empty              | valid date string                             |
| textarea | non-empty string                | -                                             |
| checkbox | if required, must be truthy     | boolean                                       |

### Error Response (422)

If validation fails:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "annual_income", "message": "Annual Income (INR) is required" },
    { "field": "household_type", "message": "Invalid option selected" }
  ]
}
```

---

## 3. GET Applications – Return `form_data`

When fetching application details (e.g. **GET /api/applications/:id** or list endpoints):

- Include `form_data` in the response so admins/frontend can display applicant answers.
- Ensure `custom_form_fields` (from the scheme) are available where needed to map `field_key` → `label` for display.

---

## 4. Checklist

- [ ] Scheme model stores `custom_form_fields` (array of `{ field_key, label, type, required, options? }`).
- [ ] POST /api/schemes accepts and persists `custom_form_fields`.
- [ ] POST /api/schemes/update accepts and updates `custom_form_fields`.
- [ ] GET /api/schemes and scheme detail endpoints return `custom_form_fields`.
- [ ] POST /api/applications/apply validates `form_data` against `scheme.custom_form_fields`.
- [ ] Application model stores `form_data` (object keyed by `field_key`).
- [ ] GET application(s) includes `form_data` in response.
- [ ] 422 validation errors return field-level messages for frontend display.

---

## 5. Example Flow

1. Admin creates scheme with:
   ```json
   "custom_form_fields": [
     { "field_key": "annual_income", "label": "Annual Income (INR)", "type": "number", "required": true },
     { "field_key": "household_type", "label": "Household Type", "type": "select", "required": true, "options": "Nuclear, Joint, Extended" }
   ]
   ```

2. Applicant fetches scheme (e.g. GET /api/schemes/:id) and receives `custom_form_fields`.

3. Frontend renders form dynamically from `custom_form_fields`.

4. Applicant submits: `form_data: { "annual_income": 50000, "household_type": "Nuclear" }`.

5. Backend validates against scheme’s `custom_form_fields`, creates application with `form_data`.

6. Admin fetches application; `form_data` is returned for display.
