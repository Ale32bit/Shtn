const API = require("../../API");
const {URL, URLSearchParams} = require("url");
const fetch = require("node-fetch");

module.exports = function (app, router) {
    let config = app.config;
    let db = app.db;

    let api = new API(db);
    router = router || app;

    router.get("/generate", (req, res) => {
        let url = req.query.url;
        let token = req.query.token;

        if (!token) {
            return res.status(400).render("error", {
                name: config.name,
                motto: config.motto,
                error: "Invalid token",
                details: "We could not verify your request"
            }).end();
        }

        try {
            url = new URL(url);
        } catch (e) {
            return res.status(400).render("error", {
                name: config.name,
                motto: config.motto,
                error: "Invalid URL",
            }).end();
        }

        let params = new URLSearchParams();
        params.append('secret', config.recaptcha_secret);
        params.append('response', token);
        params.append('remoteip', req.headers['x-forwarded-for'] || req.connection.remoteAddress);

        fetch('https://www.google.com/recaptcha/api/siteverify', {method: 'POST', body: params})
            .then(res => res.json()) // expecting a json response
            .then(json => {
                if (json.success) {
                    api.generate(url.href).then(r => {
                        if (r.success) {
                            res.status(200).render("generate", {
                                name: config.name,
                                motto: config.motto,
                                title: r.code,
                                code: r.code,
                                link: r.link,
                            });
                        } else {
                            res.status(404).render("error", {
                                name: config.name,
                                motto: config.motto,
                                title: "Not found",
                                error: "Code not found",
                                details: "This code does not exist or it has been deleted",
                            });
                        }
                    })
                } else {
                    res.status(403).render("error", {
                        name: config.name,
                        motto: config.motto,
                        title: "Failure",
                        error: "Verification refused",
                        details: "Your request failed verification",
                    });
                }
            });
    })
};