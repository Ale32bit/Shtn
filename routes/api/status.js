module.exports = function (app, router) {
    let config = app.config;
    let db = app.db;

    router = router || app;

    router.get(["/status", "/status/"], (req, res) => {
        res.status(200).json({
            success: true,
            code_length: config.code_length,
        })
    })
};