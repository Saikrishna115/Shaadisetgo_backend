const nodemailer = require('nodemailer');
const AppError = require('./appError');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send generic email
exports.sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `ShaadiSetGo <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new AppError('Error sending email', 500);
  }
};

// Send booking confirmation email
exports.sendBookingConfirmationEmail = async (userEmail, booking) => {
  const subject = `Booking Confirmation - ${booking.eventDetails.type}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e91e63;">Booking Confirmation</h2>
      
      <p>Dear ${booking.user.name},</p>
      
      <p>Your booking has been confirmed! Here are the details:</p>
      
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Event Details</h3>
        <p><strong>Event Type:</strong> ${booking.eventDetails.type}</p>
        <p><strong>Date:</strong> ${new Date(booking.eventDetails.date).toLocaleDateString()}</p>
        <p><strong>Venue:</strong> ${booking.eventDetails.venue || 'To be confirmed'}</p>
        <p><strong>Guest Count:</strong> ${booking.eventDetails.guestCount}</p>
      </div>
      
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Vendor Details</h3>
        <p><strong>Service Provider:</strong> ${booking.vendor.businessName}</p>
        <p><strong>Service Category:</strong> ${booking.vendor.serviceCategory}</p>
      </div>
      
      ${booking.package ? `
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Package Details</h3>
        <p><strong>Package Name:</strong> ${booking.package.details.name}</p>
        <p><strong>Total Cost:</strong> ₹${booking.package.totalCost.toLocaleString()}</p>
      </div>
      ` : ''}
      
      <div style="margin-top: 30px;">
        <p>You can view your booking details and track updates by logging into your account.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;

  await exports.sendEmail({
    email: userEmail,
    subject,
    html
  });
};

// Send booking update notification
exports.sendBookingUpdateEmail = async (userEmail, booking, updateType) => {
  let subject = '';
  let message = '';

  switch (updateType) {
    case 'status_change':
      subject = `Booking Status Updated - ${booking.status}`;
      message = `Your booking status has been updated to ${booking.status}`;
      break;
    case 'message':
      subject = 'New Message on Your Booking';
      message = 'You have received a new message regarding your booking';
      break;
    case 'cancellation':
      subject = 'Booking Cancellation Confirmation';
      message = 'Your booking has been cancelled';
      break;
    default:
      subject = 'Booking Update';
      message = 'There has been an update to your booking';
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e91e63;">Booking Update</h2>
      
      <p>Dear ${booking.user.name},</p>
      
      <p>${message}</p>
      
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Booking Details</h3>
        <p><strong>Event Type:</strong> ${booking.eventDetails.type}</p>
        <p><strong>Date:</strong> ${new Date(booking.eventDetails.date).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${booking.status}</p>
      </div>
      
      <div style="margin-top: 30px;">
        <p>Log into your account to view complete details and updates.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;

  await exports.sendEmail({
    email: userEmail,
    subject,
    html
  });
};

// Send payment confirmation email
exports.sendPaymentConfirmationEmail = async (userEmail, booking) => {
  const subject = 'Payment Confirmation - ShaadiSetGo';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e91e63;">Payment Confirmation</h2>
      
      <p>Dear ${booking.user.name},</p>
      
      <p>We have received your payment for the following booking:</p>
      
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
        <p><strong>Transaction ID:</strong> ${booking.payment.transactionId}</p>
        <p><strong>Amount Paid:</strong> ₹${booking.payment.amount.toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${booking.payment.method}</p>
        <p><strong>Date:</strong> ${new Date(booking.payment.timestamp).toLocaleString()}</p>
      </div>
      
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Booking Details</h3>
        <p><strong>Event Type:</strong> ${booking.eventDetails.type}</p>
        <p><strong>Date:</strong> ${new Date(booking.eventDetails.date).toLocaleDateString()}</p>
        <p><strong>Vendor:</strong> ${booking.vendor.businessName}</p>
      </div>
      
      <div style="margin-top: 30px;">
        <p>Thank you for your payment. Your booking is now confirmed.</p>
        <p>You can view your booking details and download the invoice from your account.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;

  await exports.sendEmail({
    email: userEmail,
    subject,
    html
  });
};