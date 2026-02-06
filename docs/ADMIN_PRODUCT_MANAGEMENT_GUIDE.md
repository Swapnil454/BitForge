# Admin Product Management - Quick Guide

## 🚀 Quick Start

### Access the Feature
1. Log in as Admin
2. Go to Dashboard (`/dashboard/admin`)
3. Click **"All Products"** button in Quick Actions
4. You're now on the Products Management Page

---

## 📋 Dashboard Features

### View Products
- **See all products** in a card grid layout
- **Filter by status:** All, Approved, Pending, Rejected
- **Search** by product name, seller name, or seller email
- **Product card shows:**
  - Product thumbnail
  - Title & description (preview)
  - Price and discount
  - Status badge
  - Seller information

### Product Details
- Click **"View Details"** on any product card
- See full product information in a modal
- View complete seller details
- If rejected, see rejection reason
- From here, you can Edit or Delete the product

---

## ✏️ Editing Products

### How to Edit
1. Open a product card
2. Click **"View Details"** (or click **"Edit"** directly)
3. In the detail modal, click **"Edit Product"**
4. Modify any fields:
   - **Title** - Product name
   - **Description** - Detailed description
   - **Price (₹)** - In Rupees
   - **Discount (%)** - 0-100%
   - **Edit Reason** ⭐ *Required* - Why you're making changes

### Edit Reason
- Minimum 3 characters required
- Be specific about why you're editing (e.g., "Price correction", "Typo in description")
- **This will be sent to the seller as notification**

### What Happens After Edit
✅ Product details updated
✅ Seller receives notification with:
  - What was changed
  - The reason for changes
✅ Product reflects changes immediately

---

## 🗑️ Deleting Products

### How to Delete
1. Open a product card
2. Click **"Delete"** button (or open details and click "Delete Product")
3. A confirmation modal appears with warnings
4. Enter **Delete Reason** (minimum 5 characters)
5. Click **"Confirm Delete"**

### Delete Reason
- Minimum 5 characters required
- Explain why the product is being removed (e.g., "Violates content policy", "Duplicate listing", "Copyright issue")
- **This will be sent to the seller as notification**

### What Happens After Delete
✅ Product permanently deleted from database
✅ Product files deleted from Cloudinary cloud storage
✅ Product removed from all marketplaces immediately
✅ Seller receives notification with:
  - Product that was deleted
  - The reason for deletion
⚠️ **This action CANNOT be undone!**

---

## 🔔 Seller Notifications

### Notification Types

#### 1️⃣ Edit Notification (`product_edited_by_admin`)
**When:** Admin edits a product
**What Seller Sees:**
- "Product Updated by Administrator"
- Changes made (title/description/price/discount)
- Edit reason provided

**Example:**
```
Title: Product Updated by Administrator
Message: Your product "Laptop" has been updated by an administrator.
Changes: price: ₹50000 → ₹48000, discount: 10% → 15%
Reason: Holiday sale price adjustment
```

#### 2️⃣ Delete Notification (`product_deleted_by_admin`)
**When:** Admin deletes a product
**What Seller Sees:**
- "Product Deleted by Administrator"
- Product title that was deleted
- Delete reason

**Example:**
```
Title: Product Deleted by Administrator
Message: Your product "Ebook.pdf" has been deleted by an administrator.
Reason: File contains copyrighted material
```

### Where Sellers See Notifications
- Notification bell icon in their dashboard
- Notification center page
- Real-time notification popup (if enabled)

---

## 🔍 Search & Filter Guide

### Status Filters
- **All** - Shows all products regardless of status
- **Approved** - Products live on marketplace
- **Pending** - Awaiting admin review
- **Rejected** - Admin rejected, seller notified

### Search Bar
- Type product name to find by title
- Type seller email to find their products
- Type seller name to find their products
- **Real-time search** - results update as you type

### Viewing Product Status

| Status | Color | Meaning |
|--------|-------|---------|
| **Approved** | Green | Live on marketplace |
| **Pending** | Yellow | Under review |
| **Rejected** | Red | Rejected by admin |

---

## ⚙️ Validation Rules

### For Editing
- ✓ Title: minimum 3 characters
- ✓ Price: must be > 0
- ✓ Discount: 0-100%
- ✓ Edit Reason: minimum 3 characters
- ✓ All fields automatically trimmed

### For Deleting
- ✓ Delete Reason: minimum 5 characters
- ✓ Confirmation required
- ✓ Warning displayed about permanence

### General Rules
- ✓ Can edit any product (any status)
- ✓ Can delete any product (any status)
- ✓ Files automatically cleaned from cloud storage
- ✓ Seller always notified

---

## 📝 Best Practices

### When Editing
1. Be clear about why you're making changes
2. Edit reasons help sellers understand platform decisions
3. Use professional language
4. Consider if seller could have done this themselves

### When Deleting
1. Double-check before confirming (action irreversible)
2. Provide clear, professional reason
3. Document policy violations if applicable
4. Consider contacting seller first if it's an error

### Communication
1. Always provide detailed reasons (helps seller)
2. Use consistent language/tone
3. Be fair and impartial
4. Document all significant actions

---

## 🚨 Common Issues

### Issue: Product not showing in search
**Solution:** Check if filters are too restrictive. Click "All" filter button.

### Issue: Changes not appearing after edit
**Solution:** Refresh the page or navigate away and back.

### Issue: Cannot delete product
**Solution:** Ensure delete reason is at least 5 characters and you're logged in as admin.

### Issue: Seller didn't receive notification
**Solution:** Check:
- Product belongs to an active seller
- Seller's account is valid
- Try creating another edit/delete to trigger notification

---

## 📊 Product Management Stats

### Viewing Stats
- Dashboard shows total products
- Breakdown by status available
- Seller information for attribution

### Exporting Data
Currently available through:
- Card view with all visible data
- Product details modal
- Search filters for specific subsets

---

## 🔐 Permissions & Security

### Admin Only
- Only users with "admin" role can access this feature
- Edit and delete actions tracked and logged
- Seller verification on notifications

### Data Protection
- No personal seller data exposed to other sellers
- Edit/delete reasons not shown to other sellers
- Only relevant seller receives notifications

---

## 📞 Support

### For Technical Issues
- Check browser console for errors
- Ensure you have admin role
- Try clearing cache and refreshing

### For Questions
- Contact system administrator
- Check documentation
- Review policy guidelines

---

**Last Updated:** January 28, 2026
**Version:** 1.0
