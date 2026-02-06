# Product Changes API Documentation

## Overview
These endpoints handle the workflow for editing and deleting approved products with admin approval.

---

## Seller Endpoints

### Edit Approved Product
**Endpoint:** `PATCH /api/products/:productId`
**Auth:** Required (seller)
**Body:** Form data with product fields

```bash
curl -X PATCH http://localhost:4000/api/products/123 \
  -H "Authorization: Bearer TOKEN" \
  -F "title=New Title" \
  -F "description=New Description" \
  -F "price=99.99" \
  -F "discount=10" \
  -F "file=@product.zip" \
  -F "thumbnail=@thumb.jpg"
```

**For Approved Products:**
- Returns `202 Accepted` with `changeRequest: "pending_update"`
- Changes stored in `pendingChanges` field
- Product remains visible at old state until admin approves

**For Pending/Rejected Products:**
- Returns `200 OK` with updated product
- Changes applied immediately

**Response (Approved Product):**
```json
{
  "message": "Update submitted for admin approval",
  "changeRequest": "pending_update"
}
```

---

### Delete Approved Product
**Endpoint:** `DELETE /api/products/:productId`
**Auth:** Required (seller)
**Body:** Empty

```bash
curl -X DELETE http://localhost:4000/api/products/123 \
  -H "Authorization: Bearer TOKEN"
```

**For Approved Products:**
- Returns `202 Accepted` with `changeRequest: "pending_deletion"`
- Product remains visible until admin approves deletion

**For Pending/Rejected Products:**
- Returns `200 OK`
- Product deleted immediately

**Response (Approved Product):**
```json
{
  "message": "Deletion submitted for admin approval",
  "changeRequest": "pending_deletion"
}
```

---

## Admin Endpoints

### Get Pending Product Changes
**Endpoint:** `GET /admin/products/changes/pending`
**Auth:** Required (admin)

```bash
curl http://localhost:4000/admin/products/changes/pending \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
[
  {
    "_id": "product_id_1",
    "title": "Original Title",
    "description": "Original Description",
    "price": 50,
    "discount": 0,
    "status": "approved",
    "changeRequest": "pending_update",
    "pendingChanges": {
      "title": "New Title",
      "description": "New Description",
      "price": 75,
      "discount": 10,
      "fileKey": "new_file_key",
      "fileUrl": "https://...",
      "thumbnailKey": "new_thumb_key",
      "thumbnailUrl": "https://..."
    },
    "sellerId": {
      "_id": "seller_id",
      "name": "John Seller",
      "email": "seller@example.com"
    },
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-26T12:00:00Z"
  },
  {
    "_id": "product_id_2",
    "title": "To Delete",
    "status": "approved",
    "changeRequest": "pending_deletion",
    "sellerId": { ... },
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-26T12:00:00Z"
  }
]
```

---

### Approve Product Change
**Endpoint:** `POST /admin/products/:productId/changes/approve`
**Auth:** Required (admin)
**Body:** Empty

```bash
curl -X POST http://localhost:4000/admin/products/123/changes/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**For Pending Updates:**
- Applies all `pendingChanges` to the product
- Clears `pendingChanges` field
- Sets `changeRequest: "none"`
- Product becomes visible in marketplace with new data

**For Pending Deletions:**
- Removes product from database
- Deletes files from Cloudinary (main file + thumbnail)
- Product no longer visible anywhere

**Response (Update Approval):**
```json
{
  "message": "Product update approved",
  "product": {
    "_id": "product_id",
    "title": "New Title",
    "description": "New Description",
    "price": 75,
    "discount": 10,
    "fileKey": "new_file_key",
    "fileUrl": "https://...",
    "thumbnailKey": "new_thumb_key",
    "thumbnailUrl": "https://...",
    "status": "approved",
    "changeRequest": "none",
    "pendingChanges": null
  }
}
```

**Response (Deletion Approval):**
```json
{
  "message": "Product deletion approved and product removed"
}
```

---

### Reject Product Change
**Endpoint:** `POST /admin/products/:productId/changes/reject`
**Auth:** Required (admin)
**Body:**
```json
{
  "reason": "Changes don't meet quality standards. Please improve..."
}
```

```bash
curl -X POST http://localhost:4000/admin/products/123/changes/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Title is inappropriate"
  }'
```

**Action:**
- Clears `pendingChanges` field
- Sets `changeRequest: "none"`
- Stores reason in `changeRejectionReason`
- Product remains in its original state
- Seller can see rejection reason and resubmit

**Response:**
```json
{
  "message": "Product change rejected",
  "product": {
    "_id": "product_id",
    "title": "Original Title",
    "description": "Original Description",
    "price": 50,
    "discount": 0,
    "status": "approved",
    "changeRequest": "none",
    "pendingChanges": null,
    "changeRejectionReason": "Title is inappropriate"
  }
}
```

---

## Product Model Fields

### Main Fields
- `title`: string
- `description`: string
- `price`: number
- `discount`: number
- `fileKey`: Cloudinary public_id
- `fileUrl`: Cloudinary secure URL
- `thumbnailKey`: Cloudinary public_id
- `thumbnailUrl`: Cloudinary secure URL

### Status Fields
- `status`: "pending" | "approved" | "rejected"
- `rejectionReason`: string (initial approval rejection)

### Change Request Fields
- `changeRequest`: "none" | "pending_update" | "pending_deletion"
- `pendingChanges`: Object containing all updated fields
- `changeRejectionReason`: string (change rejection reason)

---

## Workflow Diagram

```
APPROVED PRODUCT
       ↓
   Seller Edits/Deletes
       ↓
  changeRequest = pending_update/deletion
  pendingChanges = {...}
       ↓
  [HIDDEN FROM MARKETPLACE]
       ↓
    Admin Reviews
       ↓
   ┌─────────────────────────────────┐
   ↓                                 ↓
APPROVE                          REJECT
   ↓                                 ↓
Apply Changes              Reset to Original
changeRequest=none    changeRequest=none
[VISIBLE NOW]         [VISIBLE ORIGINAL]
```

---

## Error Codes

| Code | Scenario |
|------|----------|
| 202 Accepted | Change request submitted successfully |
| 200 OK | Immediate change applied (non-approved product) |
| 400 Bad Request | Insufficient data, validation error, or unauthorized |
| 403 Forbidden | User doesn't own the product |
| 404 Not Found | Product doesn't exist |
| 500 Server Error | Cloudinary or database error |

---

## Cloudinary Integration

### File Operations During Changes
- **Update:** Old files deleted only when admin approves (prevents data loss)
- **Rejection:** New uploaded files remain until replaced by another update
- **Deletion:** Files deleted only when deletion is approved

### File Storage
- Main products: `sellify/products/`
- Thumbnails: `sellify/thumbnails/`

---

## Notes
- Sellers cannot make multiple simultaneous change requests for the same product
- All changes are immutable once submitted (must reject and resubmit to change)
- Buyers never see products with `changeRequest !== "none"`
- Product visibility flow: pending updates/deletions → hidden from marketplace → approved → visible with new content
