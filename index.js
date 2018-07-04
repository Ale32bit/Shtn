const express = require("express");
const app = express();
const Maria = require("mariasql");
const config = require("./config.json");

const query = function (query, placeholders, options) {
    return new Promise((resolve, reject) => {
        let c = new Maria(config.sql);

        c.query(query, placeholders, options = null, function (err, rows) {
            if (err) return reject(err);
            resolve(rows);
        });

        c.end();
    })
};

(() => {
    query("CREATE TABLE IF NOT EXISTS `codes` ( `id` INT NOT NULL AUTO_INCREMENT , `code` VARCHAR(32) NOT NULL , `redirect` TEXT NOT NULL , `clicks` INT NOT NULL DEFAULT '0' , PRIMARY KEY (`id`));").catch(console.error);
})();

const generator = function () {
    let text = "";
    let char_list = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 5; i++) {
        text += char_list.charAt(Math.floor(Math.random() * char_list.length));
    }
    return text;
};

const fix = function (s) {
    if (!s.match(/^[a-zA-Z]+:\/\//)) {
        s = 'http://' + s;
    }
    return s;
};

// why do IDEs always scream
/**
 * @return {boolean}
 */
function isURL(str) {
    let pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(str);
}

const getCode = function (url) {
    return new Promise((resolve, reject) => {
        url = fix(url);
        query("SELECT code FROM codes WHERE redirect=:url", {url: url}).then(rows => {
            if (rows.length > 0) {
                return resolve(rows[0].code);
            } else {
                reject("URL not found")
            }
        })
    });
};

const getURL = function (code) {
    return new Promise((resolve, reject) => {
        query("SELECT redirect FROM codes WHERE code=:code", {
            code: code,
        })
            .then(rows => {
                if (rows.length > 0) {
                    resolve(rows[0].redirect);
                } else {
                    reject("Code not found");
                }
            })
    });
};

const create = function (url) {
    return new Promise((resolve, reject) => {
        url = fix(url);
        getCode(url)
            .then(c => {
                resolve(c);
            })
            .catch(async e => {
                let found = false;
                let newCode;
                while (!found) {
                    newCode = generator();
                    try {
                        let c = await getCode(newCode);
                    } catch (e) {
                        found = true;
                        query("INSERT INTO codes (redirect, code, clicks) VALUES (:url, :code, 0)", {
                            url: url,
                            code: newCode,
                        });
                        console.log("Created " + newCode + ": " + url);
                        resolve(newCode);
                    }
                }
            })
    });
};

const updateClicks = function (code) {
    query("SELECT clicks, id FROM codes WHERE code=:code", {
        code: code,
    })
        .then(rows => {
            if (rows.length > 0) {
                let clicks = rows[0].clicks;
                clicks++;
                query("UPDATE codes SET clicks=:clicks WHERE id=:id", {
                    id: rows[0].id,
                    clicks: clicks,
                });
            }
        })
        .catch(console.error);
};

const getClicks = function (code) {
    return new Promise((resolve, reject) => {
        query("SELECT clicks FROM codes WHERE code=:code", {code: code})
            .then(rows => {
                if (rows.length > 0) {
                    resolve(rows[0].clicks);
                } else {
                    reject("Code not found");
                }
            })

    })
};

app.use(require("helmet")());
app.use(require('express-session')({resave: false, saveUninitialized: false, secret: config.sessionSecret}));

app.set('view engine', 'ejs');

let apiRouter = express.Router({});
app.use("/api", apiRouter);
let viewRouter = express.Router({});
app.use("/view", viewRouter);

app.get('/', (req, res) => {
    res.render('index', {name: config.name, url: config.url, motto:config.motto})
});

app.get('/generate', (req, res) => {
    if (req.query.url) {
        if (isURL(req.query.url)) {
            create(req.query.url).then(c => {
                res.render('gen', {code: c, name: config.name, url: config.url})
            })
        } else {
            res.render("error", {error: "Invalid URL", name: config.name, url: config.url});
        }
    } else {
        res.render("error", {error: "Please provide an URL to shorten", name: config.name, url: config.url});
    }
});

app.get("/docs", (req, res) => {
    res.render("docs");
});

app.get("/json/:code", function (req, res) {
    if (!req.params.code) {
        res.send("{}");
        return;
    }
    query("SELECT * FROM codes WHERE code=:code", {
        code: req.params.code,
    }).then(rows => {
        if (rows.length > 0) {
            let data = {
                code: req.params.code,
                url: rows[0].redirect,
                clicks: rows[0].clicks,
            };
            res.send(JSON.stringify(data));
        } else {
            res.send("{}");
        }
    });
});

app.get("/json", function (req, res) {
    res.send("{}")
});

app.use(express.static("./public"));

app.get("/:id", function (req, res) {
    getURL(req.params.id)
        .then(url => {
            updateClicks(req.params.id);
            console.log(req.params.id + " -> " + url);
            res.redirect(301, url);
        })
        .catch(e => {
            res.status(404).render("error", {error: "Code not found", name: config.name, url: config.url});
        });
});

viewRouter.get("/:id", function (req, res) { // view
    getURL(req.params.id)
        .then(url => {
            getClicks(req.params.id)
                .then(clicks => {
                    res.render("view", {
                        clicks: clicks,
                        redirectUrl: url,
                        code: req.params.id,
                        name: config.name,
                        url: config.url,
                    })
                });
        })
        .catch(e => {
            res.status(404).render("error", {error: "Code not found"});
        });
});

apiRouter.get("/", function (req, res) {
    res.render("docs", {name: config.name, url: config.url});
});

apiRouter.get("/generate/:url", function (req, res) { // api
    if (req.params.url) {
        if (isURL(req.params.url)) {
            create(req.params.url).then(c => {
                res.send(c);
            })
        } else {
            res.send("Invalid URL")
        }
    } else {
        res.send("Please provide an URL");
    }
});

apiRouter.get("/generate", function (req, res) {
    res.send("Please provide an URL");
});

apiRouter.get("/resolve/:code", function (req, res) {
    if (req.params.code) {
        getURL(req.params.code)
            .then(url => {
                res.send(url).end();
            })
            .catch(e => {
                res.send("Code not found");
            })
    } else {
        res.send("Please provide a code");
    }
});

apiRouter.get("/resolve", function (req, res) {
    res.send("Please provide a code");
});

apiRouter.get("/clicks/:code", function (req, res) {
    if (req.params.code) {
        getURL(req.params.code)
            .then(() => {
                getClicks(req.params.code)
                    .then(clicks => {
                        res.send(clicks);
                    })
            })
            .catch(e => {
                res.send("Code not found");
            })
    } else {
        res.send("Please provide a code");
    }
});

apiRouter.get("/clicks", function (req, res) {
    res.send("Please provide a code");
});

app.use(function (req, res) {
    res.status(404).render("error", {error: "Error 404 - File not found"});
});

app.listen(config.port, () => console.log("Listening to " + config.port));