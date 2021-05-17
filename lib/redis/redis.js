const redis = require('redis');

const client = redis.createClient(process.env.REDIS_URL); // may require arguments for production

module.exports = client;
