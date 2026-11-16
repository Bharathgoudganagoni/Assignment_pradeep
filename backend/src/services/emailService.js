/**
 * Email Service
 * Handles transactional email notifications to Website Owner, Builder, and Customer.
 */

const { getTransporter } = require('../config/smtp');
require('dotenv').config();

/**
 * Generate HTML template for Owner/Builder notification
 */
function generateOwnerNotificationHtml(enquiry) {
  const brandMagenta = '#9a2579';
  const brandNavy = '#0d2242';
  const dateFormatted = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Website Enquiry</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(13, 34, 66, 0.08); border: 1px solid #e2e8f0;">
            <!-- Header Banner -->
            <tr>
              <td style="background: linear-gradient(90deg, #9b2386 0%, #682375 40%, #29245f 75%, #0b214f 100%); padding: 28px 32px; text-align: left;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">ENECTRON</h1>
                <p style="margin: 6px 0 0; font-size: 14px; color: #e2e8f0;">New Customer Enquiry Received (ID: #${enquiry.id})</p>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #334155;">
                  A new enquiry has been submitted through the ENECTRON website enquiry form. Details are provided below:
                </p>

                <!-- Data Table -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; width: 35%; color: #475569;">Full Name</td>
                    <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${escapeHtml(enquiry.name)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Mobile Number</td>
                    <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a;">
                      <a href="tel:${escapeHtml(enquiry.mobile_number)}" style="color: ${brandMagenta}; text-decoration: none; font-weight: 600;">${escapeHtml(enquiry.mobile_number)}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Email Address</td>
                    <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a;">
                      <a href="mailto:${escapeHtml(enquiry.email)}" style="color: ${brandMagenta}; text-decoration: none; font-weight: 600;">${escapeHtml(enquiry.email)}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Company Name</td>
                    <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(enquiry.company_name || 'Not specified')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Application / Use Case</td>
                    <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; font-weight: 600; color: ${brandNavy};">${escapeHtml(enquiry.application_use_case || 'Not specified')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; vertical-align: top;">Requirement</td>
                    <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(enquiry.requirement || 'No specific requirement provided')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Submission Time</td>
                    <td style="padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">${dateFormatted}</td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <a href="mailto:${escapeHtml(enquiry.email)}?subject=Re:%20ENECTRON%20Enquiry%20(ID:%20#${enquiry.id})" style="display: inline-block; background: ${brandMagenta}; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px;">Reply to Customer</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
                This notification was sent automatically by the ENECTRON Enquiry Management System.<br>
                Enquiry saved securely in MySQL Database.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Generate customer acknowledgement HTML email
 */
function generateCustomerAckHtml(enquiry) {
  const brandMagenta = '#9a2579';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We Received Your Enquiry</title>
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
                <h2 style="margin: 0 0 16px; font-size: 19px; color: #0d2242;">Dear ${escapeHtml(enquiry.name)},</h2>
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                  Thank you for submitting your enquiry regarding <strong>${escapeHtml(enquiry.application_use_case || 'our solutions')}</strong>.
                </p>
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
                  Our expert guidance and engineering team has received your details (Reference ID: <strong>#${enquiry.id}</strong>) and will reach out to you within 24 business hours.
                </p>

                <div style="background-color: #f8fafc; border-left: 4px solid ${brandMagenta}; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                  <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #475569;">Summary of Your Submission:</p>
                  <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5;">${escapeHtml(enquiry.requirement || 'No specific requirement provided')}</p>
                </div>

                <p style="margin: 0; font-size: 14px; color: #64748b;">
                  Best regards,<br>
                  <strong style="color: #0d2242;">The ENECTRON Team</strong>
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
  `;
}

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
 * Send enquiry notification to owner (and optional builder/customer)
 * @param {Object} enquiry - The saved enquiry record from database
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendEnquiryEmail(enquiry) {
  const ownerEmail = process.env.OWNER_EMAIL;
  const builderEmail = process.env.BUILDER_EMAIL;
  const fromEmail = process.env.SMTP_FROM || `ENECTRON <${process.env.SMTP_USER}>`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const errorMsg = 'SMTP credentials not configured in environment variables.';
    console.warn(`[EmailService] ${errorMsg} Skipping email transmission.`);
    return { success: false, error: errorMsg };
  }

  if (!ownerEmail) {
    const errorMsg = 'OWNER_EMAIL environment variable is not defined.';
    console.warn(`[EmailService] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const transporter = getTransporter();

  // 1. Notification to Owner (+ optional Builder CC)
  const ownerMailOptions = {
    from: fromEmail,
    to: ownerEmail,
    replyTo: enquiry.email,
    subject: `New Enquiry from ${enquiry.name} (${enquiry.application_use_case || 'General'}) - ENECTRON #${enquiry.id}`,
    text: `
New Enquiry Received (#${enquiry.id})
Name: ${enquiry.name}
Mobile: ${enquiry.mobile_number}
Email: ${enquiry.email}
Company: ${enquiry.company_name || 'N/A'}
Application: ${enquiry.application_use_case || 'N/A'}
Requirement: ${enquiry.requirement || 'N/A'}
    `.trim(),
    html: generateOwnerNotificationHtml(enquiry)
  };

  if (builderEmail && builderEmail.trim() !== '') {
    ownerMailOptions.cc = builderEmail.trim();
  }

  try {
    const info = await transporter.sendMail(ownerMailOptions);
    console.log(`[EmailService] Notification sent to ${ownerEmail}. Message ID: ${info.messageId}`);

    // 2. Optional acknowledgement to Customer
    const sendCustomerAck = process.env.SEND_CUSTOMER_ACK === 'true';
    if (sendCustomerAck && enquiry.email) {
      try {
        const customerMailOptions = {
          from: fromEmail,
          to: enquiry.email,
          subject: `We have received your enquiry - ENECTRON #${enquiry.id}`,
          text: `Dear ${enquiry.name},\n\nThank you for reaching out to ENECTRON. We have received your enquiry regarding ${enquiry.application_use_case || 'our solutions'} and will contact you shortly.\n\nBest regards,\nENECTRON Team`,
          html: generateCustomerAckHtml(enquiry)
        };
        await transporter.sendMail(customerMailOptions);
        console.log(`[EmailService] Acknowledgement sent to customer (${enquiry.email})`);
      } catch (ackError) {
        console.warn(`[EmailService] Failed to send customer acknowledgement: ${ackError.message}`);
        // Not a fatal failure for the enquiry
      }
    }

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[EmailService Error] Failed to send enquiry email: ${error.message}`);
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
