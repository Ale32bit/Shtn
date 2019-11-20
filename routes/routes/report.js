const API = require("../../API");
const {URL, URLSearchParams} = require("url");
const fetch = require("node-fetch");

module.exports = function (app, router) {
    let config = app.config;
    let db = app.db;

    let api = new API(db);
    router = router || app;

    function report(code, reason) {
        if (config.discord_webhook) {
            fetch(config.discord_webhook, {
                method: "POST",
                body: JSON.stringify({
                    embeds: [
                        {
                            type: "rich",
                            title: "Shtn link report",
                            description: reason,
                            fields: [
                                {
                                    name: "Code",
                                    value: code,
                                    inline: true,
                                }
                            ],
                            color: 38536, // #009688
                        }
                    ]
                }),
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } else {
            console.log("New Report:", code, reason)
        }
    }

    router.get(["/report", "/report/"], (req, res, next) => {
        res.render("report", {
            name: config.name,
            motto: config.motto,
            recaptcha_key: config.recaptcha_key,
            title: "Report",
        });
    });

    router.post(["/report", "/report/"], (req, res, next) => {
        let code = req.body.code;
        let reason = req.body.reason;
        let token = req.body.token;

        if (!token) {
            return res.status(400).render("error", {
                name: config.name,
                motto: config.motto,
                error: "Invalid token",
                details: "We could not verify your request"
            });
        }

        if (!code) {
            return res.status(404).render("error", {
                name: config.name,
                motto: config.motto,
                error: "Code not found",
            });
        }

        if (!reason) {
            return res.status(400).render("error", {
                name: config.name,
                motto: config.motto,
                error: "Reason is empty",
            });
        }

        let params = new URLSearchParams();
        params.append('secret', config.recaptcha_secret);
        params.append('response', token);
        params.append('remoteip', req.headers['x-forwarded-for'] || req.connection.remoteAddress);

        fetch('https://www.google.com/recaptcha/api/siteverify', {method: 'POST', body: params})
            .then(res => res.json()) // expecting a json response
            .then(json => {
                if (json.success) {
                    api.resolve(code).then(r => {
                        if (r.success) {
                            if (!r.malicious) {
                                res.status(200).render("message", {
                                    name: config.name,
                                    motto: config.motto,
                                    title: "Reported",
                                    message: "Submitted",
                                    details: "Your report has been submitted and will be reviewed."
                                });

                                report(code, reason);

                            } else {
                                res.status(400).render("error", {
                                    name: config.name,
                                    motto: config.motto,
                                    title: "Already malicious",
                                    message: "The link is already flagged as malicious",
                                });
                            }
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