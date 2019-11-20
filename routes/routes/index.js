module.exports = function (app, router) {
    let config = app.config;
    router = router || app;

    router.get("/", (req, res, next) => {
        res.render("index", {
            name: config.name,
            motto: config.motto,
            recaptcha_key: config.recaptcha_key,
            nologo: true,
        });
    })
};