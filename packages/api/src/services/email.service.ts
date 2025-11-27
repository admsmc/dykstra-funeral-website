/**
 * Email Service
 * 
 * Handles sending emails for family invitations
 * Currently logs to console in development
 * TODO: Integrate with SendGrid/Resend in production
 */

export interface InvitationEmailData {
  to: string;
  name: string;
  magicLink: string;
  funeralHomeName: string;
  decedentName: string;
  senderName: string;
  expiresAt: Date;
}

/**
 * Generate HTML email template for family invitation
 */
export function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const expiryDays = Math.ceil(
    (data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Portal Invitation - ${data.funeralHomeName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f3ed;
      color: #2c3539;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2c3539 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      font-family: 'Playfair Display', Georgia, serif;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #1e3a5f;
    }
    .message {
      line-height: 1.6;
      margin-bottom: 30px;
      font-size: 16px;
    }
    .cta-button {
      display: block;
      width: fit-content;
      margin: 0 auto;
      padding: 16px 40px;
      background-color: #1e3a5f;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #2c4a70;
    }
    .info-box {
      background-color: #f5f3ed;
      border-left: 4px solid #b8956a;
      padding: 16px 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .info-box strong {
      color: #1e3a5f;
    }
    .footer {
      background-color: #f5f3ed;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #1e3a5f;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e5e5;
      margin: 30px 0;
    }
    .expiry-notice {
      text-align: center;
      font-size: 13px;
      color: #666;
      margin-top: 20px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 20px;
        border-radius: 4px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 30px 20px;
      }
      .cta-button {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>${data.funeralHomeName}</h1>
      <p>Family Portal Invitation</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hello ${data.name},</p>

      <div class="message">
        <p>
          ${data.senderName} from ${data.funeralHomeName} has invited you to access the family portal 
          for <strong>${data.decedentName}</strong>.
        </p>
        <p>
          Through the family portal, you can:
        </p>
        <ul style="line-height: 1.8;">
          <li>View and manage service arrangements</li>
          <li>Review and sign contracts</li>
          <li>Upload photos and memories</li>
          <li>Track payments and financial information</li>
          <li>Communicate with our staff</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <a href="${data.magicLink}" class="cta-button">
        Access Family Portal
      </a>

      <p class="expiry-notice">
        This invitation expires in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}
      </p>

      <div class="divider"></div>

      <!-- Info Box -->
      <div class="info-box">
        <p>
          <strong>Secure Access:</strong> This is a secure, one-time link that will give you access 
          to the family portal. If you didn't expect this invitation or have any concerns, 
          please contact us directly.
        </p>
      </div>

      <div class="message" style="margin-top: 30px;">
        <p>
          If you have any questions or need assistance, please don't hesitate to reach out to our staff. 
          We're here to support you during this difficult time.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>${data.funeralHomeName}</strong><br>
        This email was sent because ${data.senderName} invited you to collaborate on funeral arrangements.
      </p>
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <span style="color: #666; word-break: break-all;">${data.magicLink}</span>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of invitation email
 */
export function generateInvitationEmailText(data: InvitationEmailData): string {
  const expiryDays = Math.ceil(
    (data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return `
${data.funeralHomeName}
Family Portal Invitation

Hello ${data.name},

${data.senderName} from ${data.funeralHomeName} has invited you to access the family portal for ${data.decedentName}.

Through the family portal, you can:
- View and manage service arrangements
- Review and sign contracts
- Upload photos and memories
- Track payments and financial information
- Communicate with our staff

ACCESS FAMILY PORTAL:
${data.magicLink}

This invitation expires in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}.

SECURE ACCESS:
This is a secure, one-time link that will give you access to the family portal. If you didn't expect this invitation or have any concerns, please contact us directly.

If you have any questions or need assistance, please don't hesitate to reach out to our staff. We're here to support you during this difficult time.

---
${data.funeralHomeName}
This email was sent because ${data.senderName} invited you to collaborate on funeral arrangements.
  `.trim();
}

/**
 * Send invitation email
 * 
 * Currently logs to console in development
 * TODO: Integrate with SendGrid/Resend for production
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  // const htmlContent = generateInvitationEmailHTML(data);
  const textContent = generateInvitationEmailText(data);

  // Development: Log to console
  if (process.env['NODE_ENV'] !== 'production') {
    console.log('[Email Service] Invitation Email');
    console.log('=================================');
    console.log('To:', data.to);
    console.log('Subject:', `Family Portal Invitation - ${data.funeralHomeName}`);
    console.log('Magic Link:', data.magicLink);
    console.log('Expires:', data.expiresAt.toLocaleString());
    console.log('\nPlain Text Version:');
    console.log(textContent);
    console.log('\n=================================\n');
    return;
  }

  // Production: Send via email service
  // TODO: Implement with SendGrid, Resend, or similar
  // 
  // Example with Resend:
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // 
  // await resend.emails.send({
  //   from: process.env.EMAIL_FROM || 'noreply@dykstrafuneralhome.com',
  //   to: data.to,
  //   subject: `Family Portal Invitation - ${data.funeralHomeName}`,
  //   html: htmlContent,
  //   text: textContent,
  // });

  console.warn('[Email Service] Production email sending not configured');
  console.log('Would send invitation to:', data.to);
}
