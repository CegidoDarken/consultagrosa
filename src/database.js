// connecting to db
const {createPool} = require('mysql2/promise');
const env = require('dotenv');
require("colors");
env.config();
let connection = createPool({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    port: process.env.DBPORT
});

module.exports = { connection };