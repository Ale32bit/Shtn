const API = require("../../API");

module.exports = function (app, router) {
    let config = app.config;
    let db = app.db;

    let api = new API(db);
    router = router || app;

    router.get(["/get", "/get/:code"], (req, res) => {
        api.resolve(req.params.code).then(r => {
            if (r.success) {
                res.status(200).json({
                    success: true,
                    code: r.code,
                    link: r.link,
                    malicious: r.malicious,
                }).end()
            } else {
                res.status(404).json({
                    success: false,
                    message: "Code not found",
                }).end()
            }
        })
    })
};