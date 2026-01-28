// utils/jwt.js
const jwt = require("jsonwebtoken");

function generateJWT(user) {
    // Generate JWT
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
    return token;
}

module.exports = { generateJWT };
