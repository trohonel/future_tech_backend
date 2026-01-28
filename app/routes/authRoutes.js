const axios = require("axios");
const express = require('express');
const User = require('../model/User');
const {generateJWT} = require("../utils/jwt");
const router = express.Router();
const {OAuth2Client} = require('google-auth-library');
const {generateVerificationCode} = require("../utils/mailer");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const {sendVerificationEmail} = require('../utils/mailer'); // Import the mailer module

// Sign Up Route
router.post('/signup', async (req, res) => {
    const {firstName, lastName, email, password, captchaToken} = req.body;
    if (!captchaToken) {
        return res.status(400).json({message: "Captcha required"});
    }
    // Verify captcha with Google
    const captchaRes = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captchaToken,
            },
        }
    );

    if (!captchaRes.data.success) {
        return res.status(400).json({message: "Captcha verification failed"});
    }
    // Check if user already exists
    const userExists = await User.findOne({email});
    if (userExists) {
        return res.status(201).json({status: 400, message: 'Email is already in use.'});
    }

    // Create new user
    const newUser = new User({
        firstName,
        lastName,
        email,
        password,
    });

    const verificationCode = generateVerificationCode();

    newUser.verificationCode = verificationCode;
    await newUser.save();

    try {
        // Send the verification email
        await sendVerificationEmail(email, verificationCode);
        return res.status(201).json({
            status: 201,
            message: 'Sign up successful. Please check your inbox for the verification link.',
        });
    } catch (error) {
        return res.status(500).json({status: 500, message: 'Error sending verification email.'});
    }

    res.status(201).json({newUser});
});

router.post('/verify-code', async (req, res) => {
    const {email, code} = req.body;

    if (!email || !code) {
        return res.status(400).json({code: 400, message: 'Email and code are required.'});
    }
    // Find the user by verification token
    const user = await User.findOne({email: email});

    if (!user) {
        return res.status(400).json({code: 400, message: 'Invalid or expired token'});
    }
    if (user.verificationCode === code) {
        // Update user to mark as verified
        user.isVerified = true;
        user.verificationCode = null; // Optionally clear the verification token
        await user.save();
        // Code matches, perform further actions (e.g., mark email as verified)
        return res.status(200).json({code: 200, message: 'Email verified successfully!'});
    } else {
        // Invalid code
        return res.status(400).json({code: 400, message: 'Invalid verification code.'});
    }
});

// Sign In Route
router.post('/signin', async (req, res) => {
    const {email, password, captchaToken} = req.body;
    console.log(email);
    if (!captchaToken) {
        return res.status(400).json({message: "Captcha required"});
    }
    // Verify captcha with Google
    const captchaRes = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captchaToken,
            },
        }
    );

    if (!captchaRes.data.success) {
        return res.status(400).json({message: "Captcha verification failed"});
    }
    // Check if user exists
    const user = await User.findOne({email});
    if (!user) {
        return res.status(400).json({message: 'Invalid credentials'});
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return res.status(400).json({message: 'Invalid credentials'});
    }

    // Generate JWT
    const token = generateJWT(user);

    res.json({token: token, user: {email: user.email, firstName: user.firstName, lastName: user.lastName}});
});

// Google-Sign In Route
router.post('/google-signin', async (req, res) => {
    const {idToken} = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const userEmail = payload.email;

        // Check if the user exists, and create a new one if not
        let user = await User.findOne({email: userEmail});

        if (!user) {
            user = new User({
                firstName: payload.given_name,
                lastName: payload.family_name,
                email: userEmail,
                googleId: payload.sub, // Store Google ID for future reference
            });
            res.json({
                user: {email: user.email, firstName: user.firstName, lastName: user.lastName},
            });
        } else {
            // Generate your JWT token to authenticate in your app
            const token = generateJWT(user); // Use your JWT generation function

            // Respond with the JWT token and user info
            res.json({
                token,
                user: {email: user.email, firstName: user.firstName, lastName: user.lastName},
            });
        }


    } catch (error) {
        res.status(500).json({message: "Google sign-in failed"});
    }
});
// Route to handle forgot password request

router.post('/forgot-password', async (req, res) => {
    const {email} = req.body;

    // Generate a random 6-digit verification code
    const verificationCode = generateVerificationCode();

    try {
        // Check if the user exists
        const user = await User.findOne({email});
        if (!user) {
            return res.status(404).json({status: 404, message: 'User not found'});
        }

        // Store the verification code in the user's document (or in memory/session)
        user.verificationCode = verificationCode;
        await user.save();

        // Send the verification email
        await sendVerificationEmail(email, verificationCode);

        res.status(200).json({message: 'Verification code sent to your email'});
    } catch (err) {
        res.status(500).json({message: 'Internal server error'});
    }
});
// Route to reset the password
router.post('/reset-password', async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await User.findOne({email});
        if (!user) {
            return res.status(404).json({status: 404, message: 'User not found'});
        }

        // Hash the new password
        user.password = password; // You need to hash the password before saving
        await user.save();

        res.status(200).json({status: 200, message: 'Password successfully reset'});
    } catch (err) {
        res.status(500).json({status: 500, message: 'Internal server error'});
    }
});

module.exports = router;
