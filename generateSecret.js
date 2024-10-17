const crypto = require('crypto');
const fs = require('fs');

const secret = crypto.randomBytes(64).toString('hex');

// Append the secret to the .env file
fs.appendFileSync('.env', `\nJWT_SECRET=${secret}`);

console.log('JWT secret generated and added to .env file');