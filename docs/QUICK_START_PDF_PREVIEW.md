# 🚀 Quick Start: Testing Automatic PDF Preview Generation

## ⚡ 3-Minute Setup & Test

### Step 1: Install Dependencies (if not already done)
```bash
cd c:\mini Desktop\Fullstack\contentSellify\server
npm install pdf-lib
```

### Step 2: Start the Server
```bash
npm run dev
```

### Step 3: Test Upload

#### Option A: Via Frontend
1. Navigate to: `http://localhost:3000/dashboard/seller/upload`
2. Fill in product details:
   - Title: "Test eBook"
   - Description: "Testing automatic preview generation"
   - Price: 10
   - Format: PDF
   - Language: English
   - Intended Audience: All Levels
3. Upload a PDF file (any PDF with multiple pages)
4. **Do NOT upload a preview PDF** (that field is removed!)
5. Watch the console for:
   ```
   🔍 Starting automatic PDF preview generation...
   📄 PDF has X total pages
   📋 Will show Y real page(s) in preview
   ✅ Preview PDF generation complete!
   ```
6. Submit → Product uploaded! ✅

#### Option B: Via API (Postman/cURL)
```bash
curl -X POST http://localhost:5000/api/products/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test eBook" \
  -F "description=Testing preview" \
  -F "price=10" \
  -F "language=English" \
  -F "format=PDF" \
  -F "intendedAudience=All Levels" \
  -F "pageCount=1" \
  -F "file=@path/to/your.pdf"
```

### Step 4: Verify Preview

#### Check Database
```javascript
// The product should have:
{
  previewPdfUrl: "https://res.cloudinary.com/.../preview_...",
  previewPdfKey: "sellify/previews/preview_...",
  previewPages: [
    { pageNumber: 1, imageUrl: "...", imageKey: "..." },
    { pageNumber: 2, imageUrl: "...", imageKey: "..." }
  ],
  pageCount: 10 // (actual page count)
}
```

#### Check Cloudinary
1. Login to Cloudinary dashboard
2. Navigate to "Media Library"
3. Look for folder: **"sellify/previews"**
4. Find your preview PDF
5. Click to open → You should see:
   - First 2 pages with "PREVIEW ONLY" watermark
   - 2-3 locked pages with 🔒 icon

#### Check Marketplace
1. Navigate to marketplace
2. Find your uploaded product
3. Click "View Preview" or "Preview Available"
4. Preview should open showing watermarked pages + locked pages

---

## 🧪 Test Cases

### Test 1: Single-Page PDF
- Upload a 1-page PDF
- **Expected**: 1 preview page + 2-3 locked pages = 3-4 total pages

### Test 2: Multi-Page PDF
- Upload a 10-page PDF
- **Expected**: 2 preview pages + 2-3 locked pages = 4-5 total pages

### Test 3: Update Product
- Edit an existing product
- Upload a new PDF
- **Expected**: Old preview deleted, new preview generated

### Test 4: Non-PDF File
- Upload a .zip or .epub file
- **Expected**: No preview generated (no error)

---

## 📊 Console Output Reference

### ✅ Successful Generation
```bash
🔍 Starting automatic PDF preview generation...
📄 PDF has 15 total pages
📋 Will show 2 real page(s) in preview
📑 Extracting first 2 page(s)...
✅ Added page 1 with watermark
✅ Added page 2 with watermark
🔒 Adding 3 locked placeholder page(s)...
✅ Added locked page 3
✅ Added locked page 4
✅ Added locked page 5
💾 Preview PDF generated: 245678 bytes
☁️ Uploading preview to Cloudinary...
✅ Preview uploaded to Cloudinary: https://res.cloudinary.com/...
✅ Preview PDF generation complete!
✅ Generated 2 preview page images
```

### ⚠️ Preview Failed (Graceful)
```bash
🔍 Starting automatic PDF preview generation...
❌ Preview generation failed: Invalid PDF format
⚠️ Continuing without preview...
```
**Note**: Product still uploads successfully!

### 📄 Non-PDF File
```bash
📄 Non-PDF file - using legacy preview generation...
```

---

## 🔍 Troubleshooting

### Preview Not Generating?

#### Check 1: Is it a PDF?
```javascript
// In console, check:
console.log("File MIME:", file.mimetype);
// Should be: "application/pdf"
```

#### Check 2: Valid PDF?
- Open the PDF in a PDF reader
- Make sure it's not corrupted
- Try a different PDF

#### Check 3: Cloudinary Credentials?
```bash
# Check .env file:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Check 4: Package Installed?
```bash
cd server
npm list pdf-lib
# Should show: pdf-lib@1.17.1 (or similar)
```

### Preview URL Not Working?

#### Check 1: Upload Type
The preview should be uploaded as **"image"** resource type:
```javascript
cloudinary.uploader.upload_stream({
  resource_type: "image", // ✅ Correct
  format: "pdf",
  // NOT "raw" ❌
```

#### Check 2: Access Mode
```javascript
{
  access_mode: "public", // ✅ Should be public
}
```

### Watermark Not Visible?

Check `addWatermarkToPage()` function:
```javascript
page.drawText("PREVIEW ONLY", {
  opacity: 0.25, // Try increasing to 0.4 for more visibility
  size: 80,      // Try larger size
});
```

---

## 🎯 What to Look For

### ✅ Success Indicators
- Product uploads successfully
- Console shows preview generation logs
- `previewPdfUrl` is populated in database
- Preview opens in browser
- Watermarks are visible
- Locked pages appear after real content

### ❌ Failure Indicators (but non-blocking)
- Console shows "Preview generation failed"
- Product still uploads (graceful degradation)
- `previewPdfUrl` is null/undefined
- No preview button in marketplace

---

## 📝 Quick Verification Checklist

- [ ] Server running without errors
- [ ] pdf-lib package installed
- [ ] PDF file uploads successfully
- [ ] Console shows preview generation logs
- [ ] Preview URL returned in response
- [ ] Preview accessible in Cloudinary
- [ ] Preview visible in marketplace
- [ ] Watermarks present on pages
- [ ] Locked pages appear
- [ ] Original file remains private

---

## 🚀 Next Steps

Once basic testing works:

1. **Test edge cases**:
   - Very large PDFs (50+ MB)
   - PDFs with special characters in content
   - Password-protected PDFs (should fail gracefully)

2. **Test integrations**:
   - Product approval workflow
   - Product update workflow
   - Product deletion

3. **Monitor performance**:
   - Track generation times
   - Monitor Cloudinary storage usage
   - Check for memory leaks

4. **Deploy to production**:
   - Test in staging first
   - Monitor error logs
   - Verify Cloudinary limits

---

## 💡 Pro Tips

### Faster Testing
Create a test PDF quickly:
```bash
# Use any text editor, save as .txt, convert to PDF
# Or download a sample PDF: https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
```

### Debug Mode
Add more logging:
```javascript
console.log("PDF Buffer Length:", pdfBuffer.length);
console.log("Total Pages:", totalPages);
console.log("Preview Pages:", previewPageCount);
```

### Test Different PDFs
- 1-page resume
- 10-page eBook
- 50-page manual
- 100+ page textbook

---

## ✅ Success!

If you see watermarked previews with locked pages, **you're done!** 🎉

The system is working exactly as intended.

---

*Quick Start Guide*  
*Last Updated: February 11, 2026*
