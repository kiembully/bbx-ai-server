const nodemailer = require('nodemailer');

const sendInvoiceEmail = async (recipientEmail, oid, invoiceurl) => {
  // Set up the email transporter using nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Or any other email service you are using
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  // Compose the email
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email address
    to: recipientEmail, // Recipient's email address
    subject: 'Paypal Invoice Sent',
    html: `
      <p>Dear Customer,</p>
      <p>We have sent you a PayPal invoice. Please use the following link to view and complete your payment:</p>
      <p><strong>Order ID:</strong> ${oid}</p>
      <p><strong>Invoice URL:</strong> <a href="${invoiceurl}">${invoiceurl}</a></p>
      <p>Thank you for your business!</p>
      <p>Best regards,<br>Your Company</p>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendInvoiceEmail