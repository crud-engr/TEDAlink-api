const mongoose = require('mongoose');
const log = require('../common/logger/logger');
require('dotenv').config();

exports.connect = async () => {
    try {
        const DATABASE_URL = process.env.DATABASE_URL;
        const db = await mongoose.connect(DATABASE_URL, {});
        log.info(`database connected`);
    } catch (error) {
        log.error(`database connection error: ${error}`);
        process.exit(1);
    }
};
