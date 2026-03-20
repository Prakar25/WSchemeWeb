# Admin Register Flow – Backend Implementation Spec

Use this document to implement the backend for the Admin Registration flow.

---

## Overview

The frontend has an **Admin Registration** page (`/admin-register`) where new admins can register. They choose a department, role, and provide credentials. After registration, the account stays in **pending** state until a **Super Admin** or **Secretary** verifies it.

---

## 1. POST /api/admin-register

**Endpoint:** `POST /api/admin-register`

**Request body (JSON):**

```json
{
  "username": "string (required)",
  "password": "string (required)",
  "fullName": "string (required)",
  "email": "string (required)",
  "contactNumber": "string (optional, 10-digit mobile)",
  "roleLevel": "number (required, 2–5, excludes Super Admin level 1)",
  "departmentId": "string (optional, ObjectId of department)"
}
```

**Success response (201):**

```json
{
  "status": "success",
  "message": "Registration successful. Your account is pending verification.",
  "admin": {
    "_id": "...",
    "username": "...",
    "fullName": "...",
    "status": "pending"
  }
}
```

**Error response (400):**

```json
{
  "status": "error",
  "message": "Username already exists"
}
```

**Validation:**

- `username`: required, unique
- `password`: required, min length as per your policy
- `fullName`: required
- `email`: required, valid email format
- `contactNumber`: optional, 10-digit Indian mobile if provided
- `roleLevel`: required, 2–5 (level 1 = Super Admin, created separately)
- `departmentId`: optional, if provided must exist in departments collection

**Behaviour:**

1. Create admin record with `status: "pending"`.
2. Store `departmentId` and `roleLevel`.
3. Do not allow login until `status === "verified"` (or equivalent).

---

## 2. Existing APIs Used by Frontend

The Admin Register page fetches:

- **Roles:** `GET /api/admin-roles/for-authorization`
  - Response shape: `{ roles: [{ level, role, displayName }, ...] }`
  - Frontend excludes `level === 1` (Super Admin).

- **Departments:** `GET /api/departments`
  - Response shape: `{ departments: [{ _id, department_name, department_display_name }, ...] }` or direct array.

No backend changes needed for these; they should already exist.

---

## 3. Verification Workflow

- **Pending:** New admins start with `status: "pending"` and cannot log in.
- **Verification:** Only **Super Admin** or **Secretary** can verify a pending admin and set `status: "verified"`.

**To implement:**

1. **GET /api/admin/pending-admins** (or similar)
   - Returns pending admins (for Super Admin/Secretary).
   - Response: list of admins with `username`, `fullName`, `email`, `roleLevel`, `departmentId`, `status`, etc.

2. **POST /api/admin/verify-admin** (or similar)
   - Body: `{ adminId: "...", action: "approve" | "reject" }`
   - Only Super Admin or Secretary can call it.
   - On approve: set admin `status` to `"verified"` (or equivalent).
   - On reject: set `status` to `"rejected"` and optionally store a reason.

3. **Login check**
   - `POST /api/admin-login`: reject login when admin `status !== "verified"`.
   - Return a suitable message, e.g. `"Your account is pending verification."`

---

## 4. Checklist

- [ ] Implement `POST /api/admin-register` with the payload and validations above.
- [ ] Store `departmentId` and `roleLevel` on the admin record.
- [ ] Create admin with `status: "pending"`.
- [ ] Ensure `POST /api/admin-login` rejects pending admins.
- [ ] Add an endpoint (or UI) for Super Admin/Secretary to list pending admins.
- [ ] Add an endpoint for Super Admin/Secretary to approve/reject pending admins.

---

## 5. Optional: Combined Options Endpoint

If you prefer one call for roles + departments:

**Endpoint:** `GET /api/admin-registration-options`

**Response:**

```json
{
  "departments": [
    { "_id": "...", "department_name": "...", "department_display_name": "..." }
  ],
  "roles": [
    { "level": 2, "role": "Admin", "displayName": "Admin" }
  ]
}
```

Frontend can be updated to use this instead of two separate calls. Not required if existing `/admin-roles/for-authorization` and `/departments` work.
