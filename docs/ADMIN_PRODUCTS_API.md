# Admin Product Management - API Documentation

## Base URL
```
https://your-api.com/api/admin
```

## Authentication
All endpoints require:
- **Header:** `Authorization: Bearer {token}`
- **Middleware:** `authMiddleware` and `requireRole(["admin"])`
- **User Role:** Admin

---

## Endpoints

### 1. Get All Products
**Endpoint:** `GET /products/all`

**Description:** Retrieve all products regardless of status.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Premium Ebook Bundle",
    "description": "Complete JavaScript learning guide",
    "price": 999,
    "discount": 10,
    "fileUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "status": "approved",
    "sellerId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Seller",
      "email": "seller@example.com"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  ...
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### 2. Get Product Details
**Endpoint:** `GET /products/:id/details`

**Description:** Get detailed information about a specific product.

**Parameters:**
- `id` (string, required) - Product ID

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Premium Ebook Bundle",
  "description": "Complete JavaScript learning guide",
  "price": 999,
  "discount": 10,
  "fileKey": "products/file123",
  "fileUrl": "https://res.cloudinary.com/...",
  "thumbnailKey": "products/thumb123",
  "thumbnailUrl": "https://res.cloudinary.com/...",
  "status": "approved",
  "rejectionReason": null,
  "changeRequest": "none",
  "pendingChanges": null,
  "sellerId": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Seller",
    "email": "seller@example.com",
    "phone": "+91-9876543210",
    "_id": "507f1f77bcf86cd799439012"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200` - Success
- `404` - Product not found
- `500` - Server error

---

### 3. Edit Product (Admin)
**Endpoint:** `PUT /products/:id/edit`

**Description:** Edit product details and notify seller.

**Parameters:**
- `id` (string, required) - Product ID

**Request Body:**
```json
{
  "title": "Premium JavaScript & React Bundle",
  "description": "Complete guide to modern web development",
  "price": 1299,
  "discount": 15,
  "editReason": "Updated with more content and resources"
}
```

**Request Body Details:**
| Field | Type | Required | Min/Max | Description |
|-------|------|----------|---------|-------------|
| title | string | ❌ | 3-500 | New product title |
| description | string | ❌ | 3-5000 | New product description |
| price | number | ❌ | >0 | Price in Rupees |
| discount | number | ❌ | 0-100 | Discount percentage |
| editReason | string | ✅ | 3-1000 | Reason for edit (shown to seller) |

**Response:**
```json
{
  "message": "Product updated successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Premium JavaScript & React Bundle",
    "description": "Complete guide to modern web development",
    "price": 1299,
    "discount": 15,
    ...
  },
  "changes": [
    "title: \"Premium Ebook Bundle\" → \"Premium JavaScript & React Bundle\"",
    "description updated",
    "price: ₹999 → ₹1299",
    "discount: 10% → 15%"
  ]
}
```

**Seller Notification Sent:**
- Type: `product_edited_by_admin`
- Title: "Product Updated by Administrator"
- Message includes: What was changed and why

**Status Codes:**
- `200` - Success
- `400` - Validation error (invalid editReason)
- `404` - Product not found
- `500` - Server error

**Validation Errors:**
```json
{
  "message": "Edit reason is required (min 3 characters)"
}
```

---

### 4. Delete Product (Admin)
**Endpoint:** `DELETE /products/:id/delete`

**Description:** Permanently delete a product and notify seller.

**Parameters:**
- `id` (string, required) - Product ID

**Request Body:**
```json
{
  "deleteReason": "Product violates copyright policy and contains unauthorized material"
}
```

**Request Body Details:**
| Field | Type | Required | Min/Max | Description |
|-------|------|----------|---------|-------------|
| deleteReason | string | ✅ | 5-1000 | Reason for deletion (shown to seller) |

**Response:**
```json
{
  "message": "Product deleted successfully",
  "deletedProduct": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Premium Ebook Bundle",
    "reason": "Product violates copyright policy and contains unauthorized material"
  }
}
```

**Pre-deletion Actions:**
1. Delete product file from Cloudinary (if exists)
2. Delete product thumbnail from Cloudinary (if exists)
3. Delete product document from MongoDB
4. Send notification to seller

**Seller Notification Sent:**
- Type: `product_deleted_by_admin`
- Title: "Product Deleted by Administrator"
- Message includes: Product title and deletion reason

**Status Codes:**
- `200` - Success
- `400` - Validation error (invalid deleteReason)
- `404` - Product not found
- `500` - Server error

**Validation Errors:**
```json
{
  "message": "Delete reason is required (min 5 characters)"
}
```

---

## Notification Schema

### Edit Notification Example
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439012",
  "type": "product_edited_by_admin",
  "title": "Product Updated by Administrator",
  "message": "Your product \"Premium Ebook Bundle\" has been updated by an administrator.\nChanges: price: ₹999 → ₹1299, discount: 10% → 15%\nReason: Holiday sale pricing adjustment",
  "relatedId": "507f1f77bcf86cd799439011",
  "relatedModel": "Product",
  "isRead": false,
  "icon": "📬",
  "createdAt": "2024-01-20T14:30:00Z"
}
```

### Delete Notification Example
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "userId": "507f1f77bcf86cd799439012",
  "type": "product_deleted_by_admin",
  "title": "Product Deleted by Administrator",
  "message": "Your product \"Premium Ebook Bundle\" has been deleted by an administrator.\nReason: Product violates copyright policy and contains unauthorized material",
  "relatedId": "507f1f77bcf86cd799439011",
  "relatedModel": "Product",
  "isRead": false,
  "icon": "📬",
  "createdAt": "2024-01-20T14:35:00Z"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthorized: Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied: Admin role required"
}
```

### 404 Not Found
```json
{
  "message": "Product not found"
}
```

### 400 Bad Request
```json
{
  "message": "Validation error: [specific error details]"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error: [error details]"
}
```

---

## Usage Examples

### Example 1: Edit a Product
```bash
curl -X PUT https://api.example.com/api/admin/products/507f1f77bcf86cd799439011/edit \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1299,
    "discount": 15,
    "editReason": "Updated pricing for seasonal sale"
  }'
```

**Response:**
```json
{
  "message": "Product updated successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 1299,
    "discount": 15,
    ...
  },
  "changes": [
    "price: ₹999 → ₹1299",
    "discount: 10% → 15%"
  ]
}
```

### Example 2: Delete a Product
```bash
curl -X DELETE https://api.example.com/api/admin/products/507f1f77bcf86cd799439011/delete \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "deleteReason": "Duplicate product listing - original kept"
  }'
```

**Response:**
```json
{
  "message": "Product deleted successfully",
  "deletedProduct": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Premium Ebook Bundle",
    "reason": "Duplicate product listing - original kept"
  }
}
```

### Example 3: Get Product Details
```bash
curl -X GET https://api.example.com/api/admin/products/507f1f77bcf86cd799439011/details \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Premium Ebook Bundle",
  "description": "Complete JavaScript learning guide",
  "price": 1299,
  "discount": 15,
  "sellerId": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Seller",
    "email": "seller@example.com"
  },
  ...
}
```

---

## Rate Limiting
Currently no rate limiting applied. Consider implementing:
- 100 requests per minute per admin user
- 1000 requests per hour per IP

## Caching
Consider caching GET requests:
- `/products/all` - Cache 5 minutes
- `/products/:id/details` - Cache 2 minutes
- Invalidate on PUT/DELETE operations

## Monitoring & Logging
All operations logged with:
- Admin user ID
- Action type (edit/delete)
- Product ID
- Timestamp
- Reason provided
- Status (success/failure)

---

## Security Considerations

1. **Input Validation**
   - All text fields trimmed and validated
   - Price must be positive number
   - Discount must be 0-100
   - Reasons must meet minimum length

2. **Authorization**
   - Only admins can access these endpoints
   - Token must be valid and active
   - Role verified on every request

3. **Data Integrity**
   - Transactions should be used for atomic operations
   - Cloudinary files deleted before DB record
   - No partial deletions

4. **Audit Trail**
   - Log all edit/delete operations
   - Store original values for reference
   - Track admin who performed action

---

## Integration with Frontend

### Frontend API Service (`/client/lib/api.ts`)
```typescript
adminAPI.getProductDetails(id)
adminAPI.editProduct(id, updateData)
adminAPI.deleteProduct(id, deleteReason)
```

### Frontend Usage
```typescript
// Edit product
await adminAPI.editProduct(productId, {
  price: 1299,
  discount: 15,
  editReason: "Seasonal sale pricing"
});

// Delete product
await adminAPI.deleteProduct(productId, "Violates content policy");
```

---

## Troubleshooting

### Product Edit Not Working
**Possible Causes:**
- Admin token invalid
- Product ID incorrect
- Edit reason too short (<3 chars)
- Price invalid (<=0)

### Seller Not Receiving Notification
**Possible Causes:**
- Seller user ID missing or invalid
- Notification service down
- Seller account disabled

### Cloudinary File Not Deleted
**Possible Causes:**
- Cloudinary credentials invalid
- File key incorrect or missing
- Cloudinary API rate limit exceeded
- Network connectivity issue

---

**Last Updated:** January 28, 2026
**API Version:** 1.0
