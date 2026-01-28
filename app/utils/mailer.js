// mailer.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const SES_HOST = 'email-smtp.us-east-2.amazonaws.com';
const SES_PORT = 587;
const SES_USER = 'AKIA4WM3YC4CKKDA4QPT'; // Your SMTP username
const SES_PASS = 'BLnzvm4Y4Nwm6azgnAIX8ulqAyZHHxXBPva/F/oGKwMe'; // Your SMTP password

// Configure the transporter with Amazon SES credentials
const transporter = nodemailer.createTransport({
    host: SES_HOST,
    port: SES_PORT,
    secure: false, // Using STARTTLS
    auth: {
        user: SES_USER,
        pass: SES_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Disable TLS certificate validation
    },
});

// Generate a random 6-digit verification code
const generateVerificationCode = () => {
    return crypto.randomInt(100000, 999999).toString(); // Generate a random 6-digit number
};

// Send the email with verification code
const sendVerificationEmail = async (email, verificationCode) => {
    const mailOptions = {
        from: 'mvp@eventssmarter.com', // Sender address (your email)
        to: email, // Receiver email
        subject: '[FutureTech] Email Verification Code', // Email subject
        text: `Your verification code is: ${verificationCode}`, // Plain text body
        html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`, // HTML body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
    } catch (error) {
    }
};

module.exports = { sendVerificationEmail, generateVerificationCode };