const API = require("../../API");

module.exports = function (app, router) {
    let config = app.config;
    let db = app.db;

    let api = new API(db);
    router = router || app;

    router.get(["/resolve", "/resolve/:code"], (req, res) => {
        api.resolve(req.params.code).then(r => {
            if (r.success) {
                res.status(200).end(r.link);
            } else {
                res.status(404).end("Code not found")
            }
        })
    })
};