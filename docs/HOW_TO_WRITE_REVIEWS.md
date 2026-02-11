# How Buyers Can Write Reviews - Complete Guide

## Overview
The ContentSellify marketplace allows **verified buyers** to write reviews for products they've purchased. This ensures authentic feedback and builds trust in the marketplace.

---

## Requirements to Write a Review

### 1. ✅ Must Be a Buyer
- You must have a buyer account (not seller or admin)
- You must be logged in

### 2. ✅ Must Have Purchased the Product
- You must have a completed order for the product
- Order status must be "completed" or "delivered"
- Cannot review products you haven't purchased

### 3. ✅ One Review Per Product
- You can only submit one review per product
- If you already reviewed it, you'll see an edit option
- No duplicate reviews allowed

---

## Step-by-Step: How to Write a Review

### Step 1: Purchase a Product

1. **Browse Marketplace**
   - Go to `http://localhost:3000/marketplace`
   - Browse available products

2. **Buy the Product**
   - Click on a product to view details
   - Click "Buy Now" button
   - Complete payment through Razorpay

3. **Wait for Order Completion**
   - Order status changes to "completed" after successful payment
   - You'll receive a notification
   - You can now review the product

---

### Step 2: Navigate to Product Page

1. **Go to the Product Detail Page**
   - Click on the product from your order history
   - Or search for it in the marketplace
   - URL format: `http://localhost:3000/marketplace/:productId`

2. **Scroll to Reviews Section**
   - The page will automatically scroll to "Reviews & Ratings" section
   - You'll see:
     - Existing reviews (if any)
     - Rating distribution chart
     - "Write a Review" button (if eligible)

---

### Step 3: Submit Your Review

#### If You're Eligible to Review:

You'll see a **review submission form** with:

1. **Star Rating Selector (Required)**
   - Click on stars to select your rating
   - 1 star = Poor
   - 2 stars = Fair
   - 3 stars = Good
   - 4 stars = Very Good
   - 5 stars = Excellent

2. **Review Comment (Optional)**
   - Text area with 1000 character limit
   - Share your experience:
     - Quality of the product
     - Value for money
     - Accuracy of description
     - Any issues encountered

3. **Submit Button**
   - Click "Submit Review"
   - Review appears immediately
   - Seller gets notified

---

## What Happens After Submission

### Immediate Results:
- ✅ Review appears in the reviews list
- ✅ Average rating updates
- ✅ Rating distribution chart updates
- ✅ Seller receives notification

### Seller Response:
- Seller can reply to your review
- Response appears below your review with 💬 icon
- You'll receive a notification when seller responds

### Community Interaction:
- Other users can mark your review as "helpful"
- Helpful votes increase your review's visibility

---

## Review Form UI Breakdown

```
┌──────────────────────────────────────────────────────────┐
│  📝 Write Your Review                                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Your Rating: ⭐⭐⭐⭐⭐                                  │
│  (Click stars to rate: 1-5)                              │
│                                                           │
│  Your Review (Optional):                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Share your experience with this product...       │   │
│  │                                                   │   │
│  │                                                   │   │
│  │                                0/1000 characters │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  [ Submit Review ]                                       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Complete Frontend Component Flow

### ProductReviews Component Location:
`client/app/marketplace/[id]/components/ProductReviews.tsx`

### Component States:

1. **Loading State**
   ```
   Loading reviews...
   ```

2. **No Purchase State**
   ```
   ℹ️ You need to purchase this product to leave a review
   ```

3. **Already Reviewed State**
   ```
   ✅ You've already reviewed this product
   [View your review below]
   ```

4. **Can Review State**
   ```
   [Review Form Appears]
   ```

5. **Reviews Display**
   ```
   ┌─────────────────────────────────────┐
   │ 👤 John Doe                         │
   │ ⭐⭐⭐⭐⭐ 5.0                      │
   │                                      │
   │ Great product! Worth every penny.   │
   │                                      │
   │ 💬 Seller Response:                 │
   │    Thank you for your review!       │
   │                                      │
   │ 👍 5 people found this helpful      │
   └─────────────────────────────────────┘
   ```

---

## API Endpoints Used

### 1. Check if User Can Review
```javascript
GET /api/reviews/can-review/:productId/:orderId
```

**Response:**
```json
{
  "canReview": true,
  "message": "You can review this product"
}
```

### 2. Submit a Review
```javascript
POST /api/reviews
```

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "orderId": "507f1f77bcf86cd799439012",
  "rating": 5,
  "comment": "Excellent product!"
}
```

**Response:**
```json
{
  "message": "Review submitted successfully",
  "review": {
    "_id": "507f1f77bcf86cd799439013",
    "productId": "507f1f77bcf86cd799439011",
    "buyerId": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Doe",
      "profilePictureUrl": "https://..."
    },
    "rating": 5,
    "comment": "Excellent product!",
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}
```

### 3. Get Product Reviews
```javascript
GET /api/reviews/product/:productId?page=1&limit=10
```

**Response:**
```json
{
  "reviews": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "stats": {
    "averageRating": 4.8,
    "totalReviews": 25,
    "distribution": {
      "5": 20,
      "4": 3,
      "3": 1,
      "2": 1,
      "1": 0
    }
  }
}
```

---

## Frontend Code Example

### How the Component Checks Eligibility:

```typescript
const checkCanReview = async () => {
  if (!user || user.role !== "buyer") return;
  
  try {
    // Get user's orders for this product
    const ordersRes = await buyerAPI.getOrders();
    const relevantOrder = ordersRes.orders.find(
      (order: any) =>
        order.productId === productId &&
        (order.status === "completed" || order.status === "delivered")
    );

    if (relevantOrder) {
      // Check with backend if can review
      const canReviewRes = await reviewAPI.canReview(
        productId,
        relevantOrder._id
      );
      setCanReview(canReviewRes.canReview);
      setOrderId(relevantOrder._id);
    }
  } catch (error) {
    console.error("Failed to check review eligibility:", error);
  }
};
```

### How Reviews Are Submitted:

```typescript
const handleSubmitReview = async () => {
  if (!orderId || !rating) {
    toast.error("Please provide a rating");
    return;
  }

  try {
    setSubmitting(true);
    await reviewAPI.createReview({
      productId,
      orderId,
      rating,
      comment: reviewComment,
    });

    toast.success("Review submitted successfully!");
    setShowReviewForm(false);
    setRating(0);
    setReviewComment("");
    
    // Refresh reviews
    fetchReviews();
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Failed to submit review");
  } finally {
    setSubmitting(false);
  }
};
```

---

## Review Moderation

### Admin Can:
- View all reviews (including hidden ones)
- Hide inappropriate reviews
- Delete spam reviews
- Monitor review quality

### Hidden Reviews:
- Not visible to public
- Buyer and seller can still see them
- Can be unhidden by admin

---

## Review Analytics

### Visible on Seller Profile:
- Total reviews received
- Average rating across all products
- Recent reviews from buyers
- Rating trend over time

### Visible on Product Page:
- Average rating
- Total review count
- Rating distribution (5-star breakdown)
- Most helpful reviews highlighted

---

## Troubleshooting

### Problem: "You can't review this product"

**Causes:**
1. Haven't purchased the product
2. Order not completed yet
3. Already submitted a review

**Solution:**
- Complete the purchase first
- Wait for order status to be "completed"
- Edit your existing review instead

### Problem: "Review submission failed"

**Causes:**
1. Network error
2. Invalid rating (not 1-5)
3. Comment too long (>1000 chars)
4. Order verification failed

**Solution:**
- Check your internet connection
- Ensure rating is between 1-5 stars
- Trim comment to 1000 characters
- Contact support if order issue

### Problem: Review form not showing

**Causes:**
1. Not logged in as buyer
2. Not purchased the product
3. Already reviewed the product

**Solution:**
- Login with buyer account
- Purchase the product first
- Edit your existing review

---

## Best Practices for Writing Reviews

### ✅ Do:
- Be honest and constructive
- Mention specific features (page count, quality, clarity)
- Rate fairly based on value for money
- Update your review if product gets updated
- Help other buyers make informed decisions

### ❌ Don't:
- Post fake or spam reviews
- Use offensive language
- Review products you haven't purchased
- Include personal information
- Violate marketplace policies

---

## Review Guidelines

1. **Be Honest**: Share your genuine experience
2. **Be Specific**: Mention what you liked/disliked
3. **Be Fair**: Consider price vs. quality
4. **Be Helpful**: Help other buyers decide
5. **Be Respectful**: No personal attacks on sellers

---

## Example Review Workflow

### Scenario: John wants to review an eBook he bought

1. **John logs in** as a buyer
2. **Navigates** to the eBook product page
3. **Already purchased** the eBook 2 days ago
4. **Scrolls down** to "Reviews & Ratings" section
5. **Sees** "Write a Review" form
6. **Clicks** 5 stars ⭐⭐⭐⭐⭐
7. **Types** review comment:
   ```
   "Excellent eBook on React! Clear explanations, 
   practical examples, and well-structured content. 
   Worth every rupee. Highly recommended for beginners."
   ```
8. **Clicks** "Submit Review"
9. **Review appears** immediately below
10. **Seller responds** 1 hour later:
    ```
    "Thank you John! Glad you found it helpful. 
    Feel free to reach out if you have any questions!"
    ```
11. **Other buyers** mark John's review as helpful

---

## Technical Implementation Summary

### Backend Validation:
- ✅ Verify user is logged in
- ✅ Verify user is a buyer
- ✅ Verify order exists and is completed
- ✅ Verify user bought this product
- ✅ Verify no duplicate review
- ✅ Validate rating (1-5)
- ✅ Validate comment length (≤1000 chars)

### After Submission:
- ✅ Save review to database
- ✅ Update seller's average rating
- ✅ Send notification to seller
- ✅ Return review with populated buyer info
- ✅ Update UI in real-time

### Security:
- ✅ JWT authentication required
- ✅ Order ownership verification
- ✅ XSS protection on comments
- ✅ Rate limiting to prevent spam
- ✅ Admin moderation capability

---

## Database Schema

### Review Document:
```javascript
{
  _id: ObjectId,
  productId: ObjectId (ref: Product),
  buyerId: ObjectId (ref: User),
  sellerId: ObjectId (ref: User),
  orderId: ObjectId (ref: Order),
  rating: Number (1-5),
  comment: String (max 1000),
  helpfulCount: Number,
  isHidden: Boolean,
  sellerResponse: {
    text: String,
    respondedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
- `{ productId: 1, buyerId: 1 }` - Unique compound index (one review per buyer per product)
- `{ productId: 1, createdAt: -1 }` - Fast product review queries
- `{ buyerId: 1 }` - Buyer's review history
- `{ sellerId: 1 }` - Seller's received reviews

---

## Success! 🎉

You now know how buyers can write reviews on ContentSellify! The system ensures:
- Only verified purchasers can review
- Authentic and trustworthy feedback
- Seller accountability and transparency
- Social proof for products
- Better buyer decision-making

For questions or support, contact the platform administrators.
