const {URL} = require("url");
const API = require("../../API");

module.exports = function (app, router) {
    let config = app.config;
    let db = app.db;
    router = router || app;

    let api = new API(db);

    router.get(["/generate", "/generate/*"], (req, res) => {
        let url = req.params[0];
        try {
            url = new URL(url).href;
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: "Malformed URL",
            }).end();
        }

        api.generate(url, config.code_length).then(r => {
            res.status(200).json({
                success: true,
                code: r.code,
                link: r.link,
                malicious: r.malicious,
            }).end();
        })
    })
};