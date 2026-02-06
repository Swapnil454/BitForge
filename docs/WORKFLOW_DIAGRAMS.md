# Product Lifecycle Flow Diagram

## Complete Product Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRODUCT LIFECYCLE                                   │
└─────────────────────────────────────────────────────────────────────────────┘


                            ┌──────────────┐
                            │ SELLER UPLOAD│
                            └──────┬───────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │   Admin Approval Needed     │
                    │  status: "pending"          │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                              │
              REJECT                          APPROVE
                    │                              │
         ┌──────────▼────────┐          ┌─────────▼──────────┐
         │  status: rejected │          │ status: approved   │
         │  [NOT VISIBLE]    │          │ changeRequest:none │
         └──────────┬────────┘          │ [VISIBLE ON SALE]  │
                    │                   └─────────┬──────────┘
           Seller can edit &                      │
           resubmit update              ┌─────────┴──────────────────────┐
                    │                   │                                │
                    │                   │     SELLER WANTS TO MODIFY     │
                    │                   │                                │
                    │            ┌──────▼──────────┐
                    │            │ SELLER EDITS    │
                    │            └────────┬────────┘
                    │                     │
                    │        changeRequest: pending_update
                    │        [HIDDEN FROM MARKETPLACE]
                    │        [UPDATE PENDING BADGE]
                    │                     │
                    │            ┌────────▼─────────┐
                    │            │  Admin Reviews   │
                    │            │  pendingChanges  │
                    │            └────────┬─────────┘
                    │                     │
                    │         ┌───────────┴────────────┐
                    │         │                        │
                    │       REJECT                  APPROVE
                    │         │                        │
                    │    ┌────▼──────────┐      ┌─────▼────────────┐
                    │    │ Revert to     │      │ Apply all        │
                    │    │ original      │      │ pendingChanges   │
                    │    │ changeRequest │      │ to product       │
                    │    │ = none        │      │ changeRequest=none
                    │    │ [VISIBLE]     │      │ [VISIBLE WITH    │
                    │    │ Show reason   │      │  NEW CONTENT]    │
                    └────┼────┬──────────┘      └─────┬────────────┘
                         │    │                      │
             Seller sees  │    │                      │ Buyers see
             rejection    │    │ Seller can edit     │ updated
             reason &     │    │ again               │ product
             resubmits    │    │
                          │    │
                          └────┴──────┬───────────────┘
                                      │
                            PRODUCT LIFECYCLE
                            CONTINUES...


                    DELETION WORKFLOW (Same Process)
                    ══════════════════════════════════

┌────────────────────────────────────────────────────────┐
│ Approved Product                                       │
│ status: approved, changeRequest: none                  │
└────────────────┬───────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ SELLER DELETES │
         └────────┬───────┘
                  │
     changeRequest: pending_deletion
     [PRODUCT HIDDEN BUT NOT DELETED]
     [DELETION PENDING BADGE]
                  │
         ┌────────▼──────────┐
         │  Admin Reviews    │
         └────────┬──────────┘
                  │
      ┌───────────┴────────────┐
      │                         │
    REJECT                  APPROVE
      │                         │
 ┌────▼───────┐        ┌────────▼────────┐
 │ Revert to  │        │ Delete product  │
 │ visible    │        │ from database   │
 │ state      │        │ and Cloudinary  │
 │ [VISIBLE]  │        │ [PERMANENTLY    │
 │            │        │  REMOVED]       │
 └────────────┘        └─────────────────┘


                   MARKETPLACE VISIBILITY RULES
                   ═════════════════════════════

Product is VISIBLE if:
  ✓ status = "approved"
  ✓ AND changeRequest = "none"

Product is HIDDEN if:
  ✗ status ≠ "approved"  OR
  ✗ changeRequest ≠ "none"

Products with pending changes stay on seller dashboard 
but disappear from marketplace until admin approves.


              ADMIN DASHBOARD CHANGE REQUESTS
              ════════════════════════════════

GET /admin/products/changes/pending
  ↓
Shows all products where:
  changeRequest = "pending_update" OR "pending_deletion"
  ↓
For each request, admin can:
  ✓ POST /admin/products/:id/changes/approve
  ✓ POST /admin/products/:id/changes/reject


              SELLER DASHBOARD STATUS BADGES
              ═════════════════════════════

Pending Products        → Yellow badge "pending"
Approved Products       → Green badge "approved"
Rejected Products       → Red badge "rejected"
Update Pending Approval → Blue pulse badge "Update pending"
Deletion Pending        → Blue pulse badge "Deletion pending"


            API RESPONSE CODES & WORKFLOW
            ═════════════════════════════

Seller edits approved product:
  PATCH /api/products/:id
  Response: 202 Accepted (requires approval)
  
Seller edits pending/rejected product:
  PATCH /api/products/:id
  Response: 200 OK (immediate)

Seller deletes approved product:
  DELETE /api/products/:id
  Response: 202 Accepted (requires approval)

Seller deletes pending/rejected product:
  DELETE /api/products/:id
  Response: 200 OK (immediate)

Admin approves change:
  POST /admin/products/:id/changes/approve
  Response: 200 OK (changes live immediately)

Admin rejects change:
  POST /admin/products/:id/changes/reject
  Response: 200 OK (changes discarded)
```

---

## State Transition Table

| Current State | Action | New State | Visible? | Seller Can Edit |
|---|---|---|---|---|
| pending | - | pending | No | Yes |
| pending | Admin approve | approved | Yes | Yes (requires approval) |
| pending | Admin reject | rejected | No | Yes |
| approved, no changes | Edit | approved, pending_update | No | No |
| approved, pending_update | Admin approve | approved, no changes | Yes | Yes |
| approved, pending_update | Admin reject | approved, no changes | Yes | Yes |
| approved, no changes | Delete | approved, pending_deletion | No | No |
| approved, pending_deletion | Admin approve | [DELETED] | No | N/A |
| approved, pending_deletion | Admin reject | approved, no changes | Yes | Yes |
| rejected | Edit | rejected | No | Yes |
| rejected | Delete | [DELETED] | No | N/A |

---

## Data Flow Examples

### Example 1: Seller Edits Approved Product

```
INPUT (from seller):
  PATCH /api/products/123
  { title: "New Title", price: 99 }

SYSTEM PROCESSING:
  1. Fetch product with _id=123
  2. Verify product.status = "approved"
  3. Upload new files to Cloudinary (if any)
  4. Save in product.pendingChanges
  5. Set product.changeRequest = "pending_update"
  6. Save to database

OUTPUT:
  Status: 202
  {
    message: "Update submitted for admin approval",
    changeRequest: "pending_update"
  }

RESULT:
  - Product hidden from marketplace
  - Seller sees blue "Update pending" badge
  - Admin sees in pending changes list
```

### Example 2: Admin Approves Update

```
INPUT (from admin):
  POST /admin/products/123/changes/approve

SYSTEM PROCESSING:
  1. Fetch product with _id=123
  2. Verify product.changeRequest = "pending_update"
  3. Copy pendingChanges to main fields
  4. Delete old files from Cloudinary
  5. Clear pendingChanges
  6. Set changeRequest = "none"
  7. Save to database

OUTPUT:
  Status: 200
  {
    message: "Product update approved",
    product: { ...with new data }
  }

RESULT:
  - Product reappears in marketplace with new content
  - Seller sees green "approved" badge
  - Buyers see updated product
```

### Example 3: Admin Rejects Update

```
INPUT (from admin):
  POST /admin/products/123/changes/reject
  { reason: "Title is inappropriate" }

SYSTEM PROCESSING:
  1. Fetch product with _id=123
  2. Verify product.changeRequest = "pending_update"
  3. Clear pendingChanges
  4. Set changeRequest = "none"
  5. Set changeRejectionReason = "Title is inappropriate"
  6. Save to database

OUTPUT:
  Status: 200
  {
    message: "Product change rejected",
    product: { ...unchanged, changeRejectionReason }
  }

RESULT:
  - Product reappears in marketplace with ORIGINAL content
  - Seller sees "Update pending" badge is gone
  - Seller sees rejection reason on dashboard
  - Seller can edit again and resubmit
```

---

## File Handling During Changes

### When Seller Uploads New Files:
```
1. Seller uploads new file
2. Upload to Cloudinary → new public_id, new URL
3. Store in pendingChanges.fileKey/fileUrl
4. Old files remain in Cloudinary (unchanged)
5. Old file references still in main product document
```

### When Admin APPROVES:
```
1. Copy pendingChanges.fileKey → product.fileKey
2. Copy pendingChanges.fileUrl → product.fileUrl
3. Delete OLD file from Cloudinary
4. New files now active
```

### When Admin REJECTS:
```
1. Do NOT change main product.fileKey/fileUrl
2. Keep files in Cloudinary (no cleanup needed)
3. Seller might upload again → more Cloudinary entries
   (Note: Old files stay until approved change replaces them)
```

### When Seller DELETES Approved Product (approved):
```
1. Set changeRequest = "pending_deletion"
2. Do NOT delete files yet
3. Product remains in Cloudinary until deletion is approved
```

### When Admin APPROVES Deletion:
```
1. Delete product.fileKey from Cloudinary
2. Delete product.thumbnailKey from Cloudinary
3. Delete product document from database
4. Complete cleanup
```
