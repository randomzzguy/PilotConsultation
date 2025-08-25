// Google Apps Script for Contact Form
// This code should be deployed as a Web App in Google Apps Script

// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Google Sheets ID
const SHEET_NAME = 'Contact Submissions'; // Name of the sheet tab
const COMPANY_EMAIL = 'info@pilotconsultation.com';

// Main function to handle POST requests
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, error: 'Missing required fields'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Save to Google Sheets
    const sheetResult = saveToSheet(data);
    
    // Send email notification
    const emailResult = sendEmailNotification(data);
    
    if (sheetResult && emailResult) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Form submitted successfully'}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      throw new Error('Failed to process form submission');
    }
    
  } catch (error) {
    console.error('Error processing form:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to save data to Google Sheets
function saveToSheet(data) {
  try {
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      // Add headers
      sheet.getRange(1, 1, 1, 6).setValues([[
        'Timestamp', 'Name', 'Email', 'Subject', 'Message', 'Status'
      ]]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
    }
    
    // Format timestamp
    const timestamp = new Date(data.timestamp);
    const formattedTimestamp = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    // Add the new row
    sheet.appendRow([
      formattedTimestamp,
      data.name,
      data.email,
      data.subject,
      data.message,
      'New'
    ]);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 6);
    
    return true;
  } catch (error) {
    console.error('Error saving to sheet:', error);
    return false;
  }
}

// Function to send email notification
function sendEmailNotification(data) {
  try {
    const subject = `New Contact Form Submission: ${data.subject}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="color: white; margin: 0; text-align: center;">New Contact Form Submission</h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Contact Details</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #667eea;">${data.email}</a></p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Submitted:</strong> ${Utilities.formatDate(new Date(data.timestamp), Session.getScriptTimeZone(), 'MMMM dd, yyyy \\at HH:mm:ss')}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Message</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea;">
              <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">This email was automatically generated from your website contact form.</p>
          </div>
        </div>
      </div>
    `;
    
    // Send email to company
    MailApp.sendEmail({
      to: COMPANY_EMAIL,
      subject: subject,
      htmlBody: htmlBody,
      replyTo: data.email
    });
    
    // Send auto-reply to customer
    const autoReplySubject = 'Thank you for contacting Pilot Consultation';
    const autoReplyBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="color: white; margin: 0; text-align: center;">Thank You for Your Message</h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p>Dear ${data.name},</p>
            
            <p>Thank you for reaching out to Pilot Consultation. We have received your message and will get back to you within 24 hours.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Your message summary:</p>
              <p style="margin: 5px 0 0 0;"><strong>Subject:</strong> ${data.subject}</p>
            </div>
            
            <p>If you have any urgent inquiries, please don't hesitate to contact us directly at ${COMPANY_EMAIL}.</p>
            
            <p>Best regards,<br>
            <strong>Pilot Consultation Team</strong></p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">This is an automated response. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `;
    
    MailApp.sendEmail({
      to: data.email,
      subject: autoReplySubject,
      htmlBody: autoReplyBody
    });
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Function to handle GET requests (for testing)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ message: 'Contact form endpoint is working!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function to verify setup
function testSetup() {
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Subject',
    message: 'This is a test message.',
    timestamp: new Date().toISOString()
  };
  
  console.log('Testing sheet save...');
  const sheetResult = saveToSheet(testData);
  console.log('Sheet save result:', sheetResult);
  
  console.log('Testing email send...');
  const emailResult = sendEmailNotification(testData);
  console.log('Email send result:', emailResult);
  
  return { sheetResult, emailResult };
}