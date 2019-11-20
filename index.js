const express = require("express");
const RateLimit = require("express-rate-limit");
const sqlite3 = require("sqlite3").verbose();
const app = express();

console.log("Shtn Server");

const config = require("./config.json");
app.config = config;

const db = new sqlite3.Database("database.sqlite");
app.db = db;

console.log("Checking tables...");

db.run(`CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    link TEXT,
    malicious INTEGER
)`);

const routes = require("./routes");

app.enable('trust proxy');
app.use(require("helmet")());
app.use(require('express-session')({resave: false, saveUninitialized: false, secret: config.sessionSecret}));

app.set('view engine', 'ejs');

app.use(require("morgan")("short"));

app.use(express.urlencoded({
    extended: true,
}));

let apiRouter = express.Router({
    strict: true,
});

routes.api.get(app, apiRouter);
routes.api.generate(app, apiRouter);
routes.api.resolve(app, apiRouter);
routes.api.status(app, apiRouter);

routes.api.error_404(app, apiRouter);

let apiLimiter = new RateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Rate limited",
    },
});

app.use("/api/", apiLimiter);
app.use("/api/", apiRouter);

routes.index(app);
routes.generate(app);
routes.api_docs(app);
routes.report(app);

app.use(express.static("static"));

routes.redirect(app);

routes.error_404(app);

app.listen(config.port, () => console.log(`Listening to port ${config.port}`));

// https://stackoverflow.com/a/14032965

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    console.log("Server is closing...");
    if (exitCode || exitCode === 0) console.log(`Exit code: ${exitCode}`);
    console.log("Closing database...");
    try {
        db.close();
    } catch (e) {
        console.error(e);
    }
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {exit: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));