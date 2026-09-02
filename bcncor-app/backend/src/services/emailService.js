/**
 * services/emailService.js
 *
 * Placeholder for transactional email sending.
 * Will integrate with an email provider (e.g. SendGrid, Resend, Nodemailer).
 *
 * Planned functions:
 *  sendInvite        — send a team invitation email with a sign-up link
 *  sendPasswordReset — send a password reset link to a user
 *  sendCampaignAlert — notify a user when a campaign changes status
 *
 * TODO:
 *  - Choose email provider and install its SDK
 *  - Store API key in .env (e.g. SENDGRID_API_KEY)
 *  - Implement each function below
 */

async function sendInvite({ to, inviterName, inviteUrl }) {
  // TODO: send invitation email
  // Subject: "You've been invited to BcnCor by {inviterName}"
}

async function sendPasswordReset({ to, resetUrl }) {
  // TODO: send password reset email
  // Subject: "Reset your BcnCor password"
  // Include resetUrl with a short expiry notice
}

async function sendCampaignAlert({ to, campaignName, status }) {
  // TODO: send campaign status update email
  // Subject: "Campaign '{campaignName}' is now {status}"
}

module.exports = { sendInvite, sendPasswordReset, sendCampaignAlert };
