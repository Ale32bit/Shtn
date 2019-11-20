const sqlite3 = require("sqlite3").verbose();

let code = process.argv[2];
let flag = Number.parseInt(process.argv[3] || 1);

let db = new sqlite3.Database("database.sqlite");
db.run("UPDATE links SET malicious = $boo WHERE code = $code;", {
    $boo: flag,
    $code: code,
}, (err, r) => {
    console.log(err, r);
});