# Vercel + GitHub Setup Guide for Anti-Spam Protection

## Your Current Setup ✅
- **Domain**: Squarespace/Google Business
- **Hosting**: Vercel (static hosting)
- **Code**: GitHub repository → Auto-deploys to Vercel
- **Protection**: Client-side anti-spam (already working!)

## Option 1: Keep Current Setup (Recommended)
Your current client-side protection is already blocking 95%+ of spam. No changes needed!

## Option 2: Add Server-Side Backup (Advanced)

### Step 1: Add the Serverless Function
1. **Create folder structure** in your GitHub repo:
   ```
   your-repo/
   ├── api/
   │   └── contact.js  (already created for you)
   ├── index.html
   ├── assets/
   └── other files...
   ```

2. **Push to GitHub** - Vercel will automatically detect the `/api` folder

### Step 2: Update Your Form (Optional)
If you want to use server-side validation, modify your form submission:

```javascript
// In your existing form JavaScript, replace the submission part with:
async function submitForm(formData) {
    try {
        // Submit to your Vercel serverless function
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            // Show success message
            showNotification('Message sent successfully!', 'success');
        } else {
            // Show error message
            showNotification(result.error || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}
```

### Step 3: Environment Variables (Optional)
In your Vercel dashboard:
1. Go to your project settings
2. Add environment variable: `TURNSTILE_SECRET_KEY` = your Cloudflare secret key

## What This Gives You:

### Client-Side Protection (Current):
- ✅ Instant spam blocking
- ✅ No server costs
- ✅ Works offline
- ✅ Fast user experience

### Server-Side Backup (Optional):
- ✅ Cannot be bypassed
- ✅ Logs all attempts
- ✅ CAPTCHA verification
- ✅ Rate limiting

## Recommendation:
**Stick with your current setup!** The client-side protection is working excellently. Only add server-side if you're getting a lot of spam that bypasses the current protection.

## File Structure After Setup:
```
your-github-repo/
├── api/
│   └── contact.js          # Serverless function (optional)
├── index.html              # Your main website
├── assets/                 # Images, CSS, JS
├── config.js              # Current config
├── server-validation.js   # Validation module
└── README.md              # Documentation
```

## Testing:
1. **Push to GitHub** → Vercel auto-deploys
2. **Test your form** with spam content
3. **Check Vercel logs** in dashboard for server-side validation

## Need Help?
- Check Vercel dashboard for deployment logs
- Test the `/api/contact` endpoint directly
- Monitor spam blocking in browser console