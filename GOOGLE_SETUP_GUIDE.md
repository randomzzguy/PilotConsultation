# Google Sheets & Apps Script Setup Guide

This guide will help you set up the contact form integration with Google Sheets and email notifications.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Contact Form Submissions" (or any name you prefer)
4. **Important**: Note the name of your sheet tab (usually "Sheet1" for new sheets)
5. Copy the spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part

## Step 2: Set up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Delete the default code in `Code.gs`
4. Copy and paste the entire content from `google-apps-script.js` into `Code.gs`
5. Update the configuration variables at the top:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual spreadsheet ID
   const SHEET_NAME = 'Contact Submissions'; // You can change this if needed
   const COMPANY_EMAIL = 'info@pilotconsultation.com'; // This is already set correctly
   ```

## Step 3: Deploy as Web App

1. In Google Apps Script, click "Deploy" > "New deployment"
2. Click the gear icon next to "Type" and select "Web app"
3. Set the following:
   - **Description**: "Contact Form Handler"
   - **Execute as**: "Me" (important)
   - **Who has access**: "Anyone" (CRITICAL - this automatically handles CORS)
4. Click "Deploy"
5. **Important**: You may see a security warning. Click "Advanced" then "Go to [your project name] (unsafe)" to authorize the script
6. **Important**: Copy the Web App URL that appears
7. Click "Done"

### Important: If you update the script later
If you make changes to the Google Apps Script code (like adding CORS headers), you need to:
1. Click "Deploy" > "Manage deployments"
2. Click the pencil icon next to your existing deployment
3. Change the version to "New version"
4. Click "Deploy"
5. The Web App URL will remain the same, but the changes will take effect

## Step 4: Update Your Website

1. Open `index.html`
2. Find this line in the JavaScript section:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
   ```
3. Replace `'YOUR_GOOGLE_SCRIPT_URL_HERE'` with the Web App URL you copied in Step 3

## Step 5: Test the Setup

1. In Google Apps Script, you can run the `testSetup()` function to verify everything works:
   - Click on the function dropdown and select `testSetup`
   - Click the "Run" button
   - Check the execution log for any errors

2. Test the actual form on your website:
   - Fill out all fields with valid data
   - Submit the form
   - Check your Google Sheet for the new entry
   - Check your email for notifications

## What the System Does

### When a form is submitted:

1. **Validation**: Checks that all fields are filled and email is valid
2. **Google Sheets**: Saves the submission with timestamp to your spreadsheet
3. **Email Notifications**: 
   - Sends a detailed notification to `info@pilotconsultation.com`
   - Sends an auto-reply confirmation to the customer
4. **User Feedback**: Shows success/error notifications on the website

### Google Sheet Structure:

The sheet will automatically create these columns:
- **Timestamp**: When the form was submitted
- **Name**: Customer's full name
- **Email**: Customer's email address
- **Subject**: Message subject
- **Message**: Full message content
- **Status**: Defaults to "New" (you can update this manually)

## Troubleshooting

### CORS Errors ("No 'Access-Control-Allow-Origin' header")
If you see this error: `Access to fetch at 'https://script.google.com/...' has been blocked by CORS policy`

**Root Cause**: The Google Apps Script Web App is not properly configured to allow cross-origin requests.

**Solution**:
1. **Check deployment settings** in Google Apps Script:
   - Go to your script project
   - Click "Deploy" → "Manage deployments"
   - Verify these settings:
     - **Execute as**: "Me" 
     - **Who has access**: "Anyone" ← This is CRITICAL for CORS

2. **If settings are wrong**:
   - Click the pencil icon to edit
   - Change "Who has access" to "Anyone"
   - Click "Deploy" to update

3. **If you made script changes**:
   - Create a new deployment version
   - Update the URL in your `index.html`

**Why this works**: When you set access to "Anyone", Google automatically handles CORS headers for the Web App.

### Sheet Name Errors
If you get errors about the sheet not being found:

**Problem**: The `SHEET_NAME` in your script doesn't match the actual tab name in your Google Sheet.

**Solution**:
1. **Check your Google Sheet tab name** (bottom of the sheet, usually "Sheet1")
2. **Update the script**:
   ```javascript
   const SHEET_NAME = 'Sheet1'; // Use your actual tab name
   ```
3. **Redeploy** the Web App after making changes

**Common tab names**:
- New sheets: "Sheet1"
- Renamed sheets: Whatever you named it
- Multiple tabs: Make sure you're using the correct one

### Common Issues:

1. **CORS Error ("Access to fetch has been blocked by CORS policy")**:
   - This means the Google Apps Script needs to be updated with CORS headers
   - Copy the updated `google-apps-script.js` code that includes CORS headers
   - Redeploy the Web App with a new version (see "If you update the script later" section)
   - Wait a few minutes for changes to propagate

2. **"Failed to send message" error**:
   - Check that the Google Script URL is correctly set in `index.html`
   - Verify the Web App is deployed with "Anyone" access
   - Check the Apps Script execution log for errors
   - Ensure you're using the latest version with CORS headers

3. **Emails not sending**:
   - Verify the `COMPANY_EMAIL` is correct in the Apps Script
   - Check your Gmail spam folder
   - Ensure the Apps Script has permission to send emails

4. **Data not saving to sheet**:
   - Verify the `SPREADSHEET_ID` is correct
   - Check that the spreadsheet is accessible by the same Google account
   - Run the `testSetup()` function to debug

### Permissions:

When you first run the script, Google will ask for permissions to:
- Access your Google Sheets
- Send emails on your behalf
- Access external URLs

These permissions are required for the system to work.

## Security Notes

- The Web App URL should be kept secure as it allows form submissions
- Consider adding additional validation or rate limiting if needed
- The system automatically validates email formats and required fields
- All data is stored securely in your Google account

## Customization Options

### Email Templates:
You can customize the email templates in the `sendEmailNotification()` function in the Apps Script.

### Sheet Structure:
You can modify the columns and data saved in the `saveToSheet()` function.

### Validation Rules:
Additional validation can be added in both the frontend JavaScript and the Apps Script.

---

**Need Help?** If you encounter any issues, check the Google Apps Script execution log for detailed error messages.