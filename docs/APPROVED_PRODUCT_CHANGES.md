# Approved Product Edit & Delete Feature

## Overview
This feature enables sellers to edit or delete approved products. When changes are made to an approved product, they are submitted for admin approval before being visible to buyers.

## Changes Made

### 1. **Product Model Update** (`server/src/models/Product.js`)
Added fields to track product change requests:
- `changeRequest`: Enum field tracking status ("none", "pending_update", "pending_deletion")
- `pendingChanges`: Object storing the requested changes (title, description, price, discount, files)
- `changeRejectionReason`: Reason if admin rejects the change

### 2. **Product Controller Updates** (`server/src/controllers/product.controller.js`)

#### New Helper Function: `handleApprovedProductUpdate()`
- Processes update requests for approved products
- Stores changes in `pendingChanges` field
- Sets `changeRequest` to "pending_update"
- Returns 202 status indicating approval is required

#### Updated `updateProduct()` Endpoint
- Now allows editing approved products
- Instead of rejecting approved products, routes them to the change request flow
- Non-approved products are updated immediately as before

#### Updated `deleteProduct()` Endpoint
- Now allows deletion requests for approved products
- Sets `changeRequest` to "pending_deletion"
- For non-approved products, deletes immediately as before

### 3. **Admin Controller Updates** (`server/src/controllers/admin.controller.js`)

#### New Endpoints

**`GET /admin/products/changes/pending`**
- Retrieves all products with pending changes (updates or deletions)
- Returns products with `changeRequest` of "pending_update" or "pending_deletion"

**`POST /admin/products/:id/changes/approve`**
- Approves a pending product change or deletion
- For updates: applies `pendingChanges` to the product
- For deletions: removes product from database and Cloudinary
- Clears `changeRequest` flag

**`POST /admin/products/:id/changes/reject`**
- Rejects a pending change request
- Sets `changeRejectionReason` with reason from admin
- Resets `changeRequest` to "none"
- Keeps the product in its original state

### 4. **Marketplace Controller** (`server/src/controllers/marketplace.controller.js`)
Updated product visibility filters:
- Products must have `status: "approved"`
- AND `changeRequest: "none"` (no pending changes)
- Products with pending updates/deletions are hidden from marketplace until approved

### 5. **Admin Routes** (`server/src/routes/admin.routes.js`)
Added new route handlers for product change management

### 6. **Seller Dashboard UI** (`client/app/dashboard/seller/products/page.tsx`)

#### UI Updates
- **Edit & Delete Buttons**: Now enabled for approved products
- **Status Badges**: Display product approval status
- **Change Request Badges**: Show when an update or deletion is pending admin approval
- **Tooltips**: Inform sellers that changes require admin approval

#### State Tracking
- Added `changeRequest` field to Product interface
- Updated delete handler to recognize pending deletion responses
- Updated update handler to recognize pending update responses
- Both show appropriate success messages when approval is required

#### Disabled States
- Edit/Delete buttons are disabled only when a change is already pending
- Sellers can't submit multiple change requests for the same product simultaneously

## Workflow

### For Sellers
1. Edit an approved product → Submits change request
2. View product status badge showing "Update pending" or "Deletion pending"
3. Can't make additional changes until admin approves/rejects
4. On rejection, seller sees the rejection reason and can edit again

### For Admins
1. Navigate to product change approval section
2. Review pending updates and deletions
3. Approve: Changes become live and visible to buyers
4. Reject: Product returns to current state, seller notified of reason

### For Buyers
1. Only see products with `status: "approved"` AND `changeRequest: "none"`
2. Don't see products with pending updates (outdated version hidden)
3. Don't see products with pending deletion

## Database Impact
- No data loss - all changes tracked in `pendingChanges` until approved
- `changeRejectionReason` persists for seller visibility
- Existing products automatically get `changeRequest: "none"` as default

## API Response Codes
- `202 Accepted`: Change request submitted (requires admin approval)
- `200 OK`: Immediate success (non-approved products)
- `400 Bad Request`: Validation or authorization error
- `404 Not Found`: Product not found

## Testing Checklist
- [ ] Seller can edit approved product
- [ ] Edit appears as "pending update" to seller
- [ ] Edit hidden from marketplace
- [ ] Admin can approve product update
- [ ] Admin can reject product update
- [ ] Seller can see rejection reason
- [ ] Seller can delete approved product
- [ ] Deletion request shows as "pending deletion"
- [ ] Admin can approve deletion
- [ ] Admin can reject deletion
- [ ] Cannot submit changes while one is pending
- [ ] Updated product appears in marketplace after approval
