/**
 * ==============================================================================
 * ENECTRON - Google Apps Script HTTPS Email Relay
 * ==============================================================================
 * 
 * WHY THIS IS NEEDED:
 * Render Free Tier blocks outbound SMTP traffic on ports 25, 465, and 587.
 * This Google Apps Script acts as a secure HTTPS webhook (running on port 443).
 * Your Express backend sends an HTTPS POST request here, and this script uses
 * Google's built-in MailApp to send the enquiry email directly from your
 * Google Account without needing raw SMTP ports.
 * 
 * SETUP INSTRUCTIONS (Takes ~2 minutes):
 * 1. Open your browser and go to: https://script.google.com/
 * 2. Click "New project" at the top left.
 * 3. Delete any default code in Code.gs and paste this ENTIRE file into it.
 * 4. (Optional but recommended) Change SCRIPT_SECRET below to any secret password.
 * 5. Click "Deploy" (top right) -> "New deployment".
 * 6. Click the gear icon (Select type) -> choose "Web app".
 * 7. Set:
 *    - Description: ENECTRON Email Relay
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone
 * 8. Click "Deploy".
 * 9. Click "Authorize access" -> choose your Google Account -> click "Advanced"
 *    -> click "Go to Untitled project (unsafe)" -> click "Allow".
 * 10. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/.../exec).
 * 11. Add it to Render Environment Variables as: GOOGLE_SCRIPT_URL
 * ==============================================================================
 */

// Define your shared secret (set the same in Render: GOOGLE_SCRIPT_SECRET)
var SCRIPT_SECRET = "enectron_secure_relay_2026";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing POST request body"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);

    // 1. Verify shared secret for security
    if (SCRIPT_SECRET && SCRIPT_SECRET !== "" && data.secret !== SCRIPT_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Unauthorized: Invalid secret token"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Validate email recipient and subject
    if (!data.to || !data.subject || (!data.htmlBody && !data.textBody)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing required email parameters (to, subject, htmlBody/textBody)"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Prepare Mail Options
    var mailOptions = {
      to: data.to,
      subject: data.subject,
      htmlBody: data.htmlBody || data.textBody,
      body: data.textBody || "Please view this email in an HTML-compatible client.",
      replyTo: data.replyTo || data.to
    };

    if (data.cc && data.cc.trim() !== "") {
      mailOptions.cc = data.cc.trim();
    }

    // 4. Send email via Google's native MailApp
    MailApp.sendEmail(mailOptions);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Enquiry email dispatched successfully via Google Apps Script HTTPS relay"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "ENECTRON Google Apps Script Email Relay",
    note: "Send HTTP POST requests with JSON body to dispatch emails"
  })).setMimeType(ContentService.MimeType.JSON);
}
