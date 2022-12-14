const mysql = require("mysql");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "rpm0811",
    database: "churchsystem",
    dateStrings: true
});