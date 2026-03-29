'use strict';

const config = require('../config');
const logger = require('../utils/logger');

/**
 * Send an email via the Resend HTTP API.
 *
 * @param {object} opts
 * @param {string} opts.to       Recipient email
 * @param {string} opts.subject  Email subject
 * @param {string} opts.html     HTML body
 * @param {string} [opts.text]   Plain-text fallback
 * @param {string} [opts.replyTo] Reply-to address
 * @returns {Promise<object>}    Resend API response
 */
async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = config.email.resendApiKey;

  if (!apiKey) {
    const err = new Error('Email service is not configured. Please contact support.');
    err.statusCode = 503;
    throw err;
  }

  try {
    const body = {
      from: config.email.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    if (text) body.text = text;
    if (replyTo) body.reply_to = replyTo;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.message || data?.error || JSON.stringify(data);
      logger.error('Resend API error', { status: response.status, error: errMsg, to, subject });
      const err = new Error('Email service is temporarily unavailable. Please try again shortly.');
      err.statusCode = 503;
      throw err;
    }

    logger.info('Email sent via Resend', { id: data.id, to, subject });
    return data;
  } catch (error) {
    if (error?.statusCode) throw error;
    logger.error('Resend transport error', { error: error.message, to, subject });
    const transportErr = new Error('Email service is temporarily unavailable. Please try again shortly.');
    transportErr.statusCode = 503;
    throw transportErr;
  }
}

/**
 * Send an account verification email with a 6-digit code.
 */
async function sendVerificationEmail(to, code) {
  await sendEmail({
    to,
    subject: `${code} — Verify your PeptideDosage account`,
    text: `Welcome to PeptideDosage!\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, you can safely ignore this email.`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:600px;margin:auto;padding:40px 20px">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="color:#0f172a;font-size:24px;margin:0">PeptideDosage</h1>
        </div>
        <h2 style="color:#0f172a;font-size:20px;margin-bottom:8px">Verify your email</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6">Welcome to PeptideDosage! Use the code below to verify your email address.</p>
        <div style="margin:32px 0;text-align:center">
          <div style="display:inline-block;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:12px;padding:20px 40px">
            <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a">${code}</span>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.5;text-align:center">
          This code expires in <strong style="color:#475569">10 minutes</strong>.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
        <p style="color:#94a3b8;font-size:12px">If you did not create a PeptideDosage account, you can safely ignore this email.</p>
      </div>
    `,
  });

  logger.info('Verification email sent', { to });
}

/**
 * Send a password reset email with a 6-digit code.
 */
async function sendPasswordResetEmail(to, code) {
  await sendEmail({
    to,
    subject: `${code} — Reset your PeptideDosage password`,
    text: `You requested a password reset for your PeptideDosage account.\n\nYour reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:600px;margin:auto;padding:40px 20px">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="color:#0f172a;font-size:24px;margin:0">PeptideDosage</h1>
        </div>
        <h2 style="color:#0f172a;font-size:20px;margin-bottom:8px">Reset your password</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6">You requested a password reset for your PeptideDosage account. Use the code below.</p>
        <div style="margin:32px 0;text-align:center">
          <div style="display:inline-block;background:#fef2f2;border:2px dashed #fca5a5;border-radius:12px;padding:20px 40px">
            <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a">${code}</span>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.5;text-align:center">
          This code expires in <strong style="color:#475569">10 minutes</strong>.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
        <p style="color:#94a3b8;font-size:12px">If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>
      </div>
    `,
  });

  logger.info('Password reset email sent', { to });
}

/**
 * Send a peptide request email to admins.
 */
async function sendPeptideRequestEmail({ requesterName, requesterEmail, peptideName, goal, details, userId }) {
  await sendEmail({
    to: config.email.adminTo,
    replyTo: requesterEmail,
    subject: `New peptide request: ${peptideName}`,
    text: `A new peptide request has been submitted.\n\nRequester: ${requesterName}\nRequester Email: ${requesterEmail}\nUser ID: ${userId}\nPeptide Name: ${peptideName}\nGoal: ${goal}\n\nDetails:\n${details}`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:680px;margin:auto;color:#0f172a;padding:40px 20px">
        <h2 style="margin-bottom:8px">New Peptide Request</h2>
        <p style="margin-top:0;color:#475569">A user submitted a peptide request from the platform.</p>
        <table cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0">
          <tr><td style="font-weight:600;width:180px;border-bottom:1px solid #e2e8f0">Requester</td><td style="border-bottom:1px solid #e2e8f0">${requesterName}</td></tr>
          <tr><td style="font-weight:600;border-bottom:1px solid #e2e8f0">Email</td><td style="border-bottom:1px solid #e2e8f0">${requesterEmail}</td></tr>
          <tr><td style="font-weight:600;border-bottom:1px solid #e2e8f0">User ID</td><td style="border-bottom:1px solid #e2e8f0">${userId}</td></tr>
          <tr><td style="font-weight:600;border-bottom:1px solid #e2e8f0">Peptide</td><td style="border-bottom:1px solid #e2e8f0">${peptideName}</td></tr>
          <tr><td style="font-weight:600">Goal</td><td>${goal}</td></tr>
        </table>
        <h3 style="margin:18px 0 8px">Details</h3>
        <div style="white-space:pre-wrap;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;color:#1e293b">${details}</div>
      </div>
    `,
  });

  logger.info('Peptide request email sent', { to: config.email.adminTo, requesterEmail });
}

/**
 * Send a newsletter subscription notification to admins.
 */
async function sendNewsletterSubscriptionEmail(subscriberEmail) {
  await sendEmail({
    to: config.email.adminTo,
    replyTo: subscriberEmail,
    subject: `New newsletter subscriber: ${subscriberEmail}`,
    text: `A new user has subscribed to the peptide insights newsletter.\n\nSubscriber Email: ${subscriberEmail}\nSubscribed At: ${new Date().toISOString()}`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:680px;margin:auto;color:#0f172a;padding:40px 20px">
        <h2 style="margin-bottom:8px">New Newsletter Subscriber</h2>
        <p style="margin-top:0;color:#475569">A visitor has subscribed to receive peptide insights.</p>
        <table cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0">
          <tr><td style="font-weight:600;width:180px;border-bottom:1px solid #e2e8f0">Subscriber Email</td><td style="border-bottom:1px solid #e2e8f0">${subscriberEmail}</td></tr>
          <tr><td style="font-weight:600">Subscribed At</td><td>${new Date().toISOString()}</td></tr>
        </table>
        <p style="margin-top:16px;color:#475569;font-size:13px">You can reach out to this subscriber at <a href="mailto:${subscriberEmail}" style="color:#1e3a8a">${subscriberEmail}</a>.</p>
      </div>
    `,
  });

  logger.info('Newsletter subscription email sent', { to: config.email.adminTo, subscriberEmail });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendPeptideRequestEmail, sendNewsletterSubscriptionEmail };
