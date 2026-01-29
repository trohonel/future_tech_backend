const path = require('path');

module.exports = {
    entry: './app.js', // Your entry point
    output: {
        path: path.resolve(__dirname, 'build'), // Output directory
        filename: 'bundle.js', // Output file
    },
    target: 'node', // Since this is a Node.js backend
    mode: 'production', // For production mode
};
