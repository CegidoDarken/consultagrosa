// connecting to db
const mysql = require('mysql');
const env = require('dotenv');
require("colors");
env.config();
let connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    port: process.env.DBPORT
});

connection.connect((err) => {
    console.log("Connecting to the database...".yellow);
    if (err) {
        console.log(`Database: ${connection.state.red}`);
        console.log(`ERROR: ${err.message}`.red);
    } else {
        console.log(`Database: ${connection.state.green}`);
        console.log(`Connected to ${connection.config.database}`.yellow);
    };
});

module.exports = { connection };