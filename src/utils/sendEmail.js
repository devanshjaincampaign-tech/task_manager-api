// src/utils/sendEmail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send a generic email
// We catch errors and only log them
// Email failure should never break the API response
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send failed:', err.message);
    // Do not throw — email failure is non-critical
  }
};

// Email template for task assignment notification
const taskAssignedEmail = (assigneeName, assignerName, taskTitle, teamName, dueDate) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Task Assigned</h2>
      <p>Hi ${assigneeName},</p>
      <p><strong>${assignerName}</strong> has assigned you a task in <strong>${teamName}</strong>.</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0; color: #333;">${taskTitle}</h3>
        ${dueDate
          ? `<p style="margin: 0; color: #666;">Due: <strong>${new Date(dueDate).toDateString()}</strong></p>`
          : '<p style="margin: 0; color: #666;">No due date set</p>'
        }
      </div>
      <p>Log in to view full task details and get started.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Task Manager API</p>
    </div>
  `;
};

// Email template for status change notification
const taskStatusChangedEmail = (creatorName, taskTitle, oldStatus, newStatus, changerName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Task Status Updated</h2>
      <p>Hi ${creatorName},</p>
      <p>The status of your task has been updated by <strong>${changerName}</strong>.</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0;">${taskTitle}</h3>
        <p style="margin: 0;">
          Status changed: 
          <strong>${oldStatus}</strong> → <strong>${newStatus}</strong>
        </p>
      </div>
    </div>
  `;
};

module.exports = { sendEmail, taskAssignedEmail, taskStatusChangedEmail };