import sqlite3 from "sqlite3"

let db = new sqlite3.Database("db.sqlite")

db.all("SELECT * FROM Test", function (err, rows) {
    console.log(err);
    console.log(rows);
})

