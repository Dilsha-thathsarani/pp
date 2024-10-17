// backend/services/emailService.js

const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
  EMAIL_ADDRESS,
} = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

async function sendVerificationEmail(to, token) {
  try {
    const accessToken = await oauth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL_ADDRESS,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

    const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Podio Clone" <${EMAIL_ADDRESS}>`,
      to,
      subject: "Welcome to Podio Clone! Please Verify Your Email",
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f6f6f6;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
          }
          .header img {
            max-width: 150px;
          }
          .content {
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
          }
          .content h1 {
            font-size: 24px;
            color: #333333;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            margin: 20px 0;
            background-color: #007bff;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #999999;
            padding: 20px 0;
          }
          .footer a {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://yourdomain.com/logo.png" alt="Podio Clone Logo">
          </div>
          <div class="content">
            <h1>Welcome to Podio Clone!</h1>
            <p>Hi there,</p>
            <p>We're excited to have you get started. First, you need to confirm your account. Just press the button below.</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
            <p>If you have any questions, feel free to reply to this email—we're always happy to help out.</p>
            <p>Cheers,<br>The Podio Clone Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Podio Clone. All rights reserved.</p>
            <p>
              Podio Clone Inc.<br>
              1234 Street Rd.<br>
              Suite 1234
            </p>
            <p>
              <a href="https://yourdomain.com/privacy">Privacy Policy</a> | 
              <a href="https://yourdomain.com/terms">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log("Verification email sent to:", to);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

async function sendInvitationEmail(to, message, invitationLink) {
  try {
    const accessToken = await oauth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL_ADDRESS,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: `"Podio Clone" <${EMAIL_ADDRESS}>`,
      to,
      subject: "You've been invited to join Podio Clone!",
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invitation to Join Podio Clone</title>
        <style>
          /* ... keep existing styles */
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://yourdomain.com/logo.png" alt="Podio Clone Logo">
          </div>
          <div class="content">
            <h1>You've been invited to join Podio Clone!</h1>
            <p>Hello,</p>
            <p>You've been invited to join a workspace on Podio Clone. Here's a message from the sender:</p>
            <p><em>${message}</em></p>
            <p>To accept the invitation and join the workspace, click the button below:</p>
            <p style="text-align: center;">
              <a href="${invitationLink}" class="button">Accept Invitation</a>
            </p>
            <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
            <p><a href="${invitationLink}">${invitationLink}</a></p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br>The Podio Clone Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Podio Clone. All rights reserved.</p>
            <p>
              Podio Clone Inc.<br>
              1234 Street Rd.<br>
              Suite 1234
            </p>
            <p>
              <a href="https://yourdomain.com/privacy">Privacy Policy</a> | 
              <a href="https://yourdomain.com/terms">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log("Invitation email sent to:", to);
  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw new Error("Failed to send invitation email");
  }
}

module.exports = { sendVerificationEmail, sendInvitationEmail };
