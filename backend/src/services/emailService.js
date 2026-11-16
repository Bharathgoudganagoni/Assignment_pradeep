/**
 * Email Service
 * Handles transactional email notifications to fixed RECEIVER_EMAIL and optional customer acknowledgement.
 */

const { getTransporter, getFromAddress } = require('../config/smtp');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate HTML template for ENECTRON Owner / Receiver notification
 */
function generateOwnerNotificationHtml(enquiry) {
  const brandMagenta = '#9a2579';
  const brandNavy = '#0d2242';
  const dateFormatted = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

  const visitorName = escapeHtml(enquiry.user_name);
  const mobileNumber = escapeHtml(enquiry.mobile_number);
  const visitorEmail = escapeHtml(enquiry.user_email);
  const companyName = escapeHtml(enquiry.company_name || 'Not specified');
  const application = escapeHtml(enquiry.application || 'Not specified');
  const requirement = escapeHtml(enquiry.requirement || 'No specific requirement provided');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ENECTRON | New Business Enquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(13, 34, 66, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner with Brand Gradient -->
          <tr>
            <td style="background: linear-gradient(90deg, #9b2386 0%, #682375 40%, #29245f 75%, #0b214f 100%); padding: 28px 32px; text-align: left;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">ENECTRON</h1>
              <p style="margin: 6px 0 0; font-size: 14px; color: #e2e8f0; font-weight: 500;">New Business Enquiry Notification</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px; font-size: 18px; color: ${brandNavy}; font-weight: 700;">New Business Enquiry</h2>
              <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.5; color: #475569;">
                A new customer enquiry has been submitted through the ENECTRON website enquiry form. Submission details are provided below:
              </p>

              <!-- Details Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; width: 35%; color: #475569;">Visitor Name</td>
                  <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${visitorName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Mobile Number</td>
                  <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a;">
                    <a href="tel:${mobileNumber}" style="color: ${brandMagenta}; text-decoration: none; font-weight: 600;">${mobileNumber}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Visitor Email</td>
                  <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a;">
                    <a href="mailto:${visitorEmail}" style="color: ${brandMagenta}; text-decoration: none; font-weight: 600;">${visitorEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Company Name</td>
                  <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Application / Industry</td>
                  <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; font-weight: 600; color: ${brandNavy};">${application}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; vertical-align: top;">Detailed Requirement</td>
                  <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a; line-height: 1.5; white-space: pre-wrap;">${requirement}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Submission Time</td>
                  <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">${dateFormatted}</td>
                </tr>
              </table>

              <!-- Reply Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${visitorEmail}?subject=Re:%20ENECTRON%20Enquiry%20from%20${encodeURIComponent(enquiry.user_name)}" style="display: inline-block; background: ${brandMagenta}; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px;">Reply to ${visitorName}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
              This notification was sent automatically by the ENECTRON Enquiry Management System.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate customer acknowledgement HTML email
 */
function generateCustomerAckHtml(enquiry) {
  const brandMagenta = '#9a2579';
  const brandNavy = '#0d2242';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Received Your Enquiry | ENECTRON</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(13, 34, 66, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(90deg, #9b2386 0%, #682375 40%, #29245f 75%, #0b214f 100%); padding: 28px 32px; text-align: left;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">ENECTRON</h1>
              <p style="margin: 6px 0 0; font-size: 14px; color: #e2e8f0;">Thank you for contacting us!</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 19px; color: ${brandNavy};">Dear ${escapeHtml(enquiry.user_name)},</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                Thank you for submitting your enquiry regarding <strong>${escapeHtml(enquiry.application || 'our solutions')}</strong>.
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
                Our expert guidance and engineering team has received your details and will connect with you shortly.
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid ${brandMagenta}; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #475569;">Summary of Your Requirement:</p>
                <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5;">${escapeHtml(enquiry.requirement || 'No specific requirement provided')}</p>
              </div>

              <p style="margin: 0; font-size: 14px; color: #64748b;">
                Best regards,<br>
                <strong style="color: ${brandNavy};">The ENECTRON Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
              By submitting this form, you agreed to be contacted by the ENECTRON team regarding your enquiry.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send enquiry notification to the fixed RECEIVER_EMAIL
 * @param {Object} enquiry - Sanitized enquiry details
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendEnquiryEmail(enquiry) {
  const receiverEmail = process.env.RECEIVER_EMAIL || process.env.OWNER_EMAIL;
  const builderEmail = process.env.BUILDER_EMAIL;
  const fromEmail = getFromAddress();

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const errorMsg = 'SMTP credentials not configured in environment variables.';
    console.warn(`[EmailService] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  if (!receiverEmail) {
    const errorMsg = 'RECEIVER_EMAIL (or OWNER_EMAIL) environment variable is not defined.';
    console.warn(`[EmailService] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const transporter = getTransporter();

  // Plain-text fallback
  const plainText = `
ENECTRON | New Business Enquiry
===========================================

Visitor Name: ${enquiry.user_name}
Mobile Number: ${enquiry.mobile_number}
Visitor Email: ${enquiry.user_email}
Company Name: ${enquiry.company_name || 'Not specified'}
Application / Industry: ${enquiry.application || 'Not specified'}
Detailed Requirement:
${enquiry.requirement || 'No specific requirement provided'}

Submission Time: ${new Date().toLocaleString('en-US', { timeZoneName: 'short' })}
  `.trim();

  // Email to fixed receiver
  const mailOptions = {
    from: fromEmail,
    to: receiverEmail,
    replyTo: enquiry.user_email,
    subject: `ENECTRON | New Business Enquiry – ${enquiry.user_name}`,
    text: plainText,
    html: generateOwnerNotificationHtml(enquiry)
  };

  if (builderEmail && builderEmail.trim() !== '') {
    mailOptions.cc = builderEmail.trim();
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Notification successfully delivered to ${receiverEmail}. Message ID: ${info.messageId}`);

    // Optional customer acknowledgement email
    if (process.env.SEND_CUSTOMER_ACK === 'true' && enquiry.user_email) {
      try {
        const customerMailOptions = {
          from: fromEmail,
          to: enquiry.user_email,
          subject: 'We have received your enquiry – ENECTRON',
          text: `Dear ${enquiry.user_name},\n\nThank you for reaching out to ENECTRON. We have received your enquiry regarding ${enquiry.application || 'our solutions'} and will contact you shortly.\n\nBest regards,\nENECTRON Team`,
          html: generateCustomerAckHtml(enquiry)
        };
        await transporter.sendMail(customerMailOptions);
        console.log(`[EmailService] Customer acknowledgement sent to ${enquiry.user_email}`);
      } catch (ackError) {
        console.warn(`[EmailService] Could not send customer acknowledgement: ${ackError.message}`);
      }
    }

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[EmailService Error] Failed to send email via SMTP: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendEnquiryEmail,
  generateOwnerNotificationHtml,
  generateCustomerAckHtml
};
