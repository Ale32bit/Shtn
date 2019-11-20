const API = require("../../API");

module.exports = function (app, router) {
    let config = app.config;
    let db = app.db;

    let api = new API(db);
    router = router || app;

    router.get("/:code", (req, res) => {
        api.resolve(req.params.code).then(r => {
            if (r.success) {
                if (r.malicious) {
                    res.status(200).render("malicious", {
                        name: config.name,
                        motto: config.motto,
                        title: "Malicious link",
                        code: r.code,
                        link: r.link,
                    });
                } else {
                    res.redirect(r.link);
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
    })
};