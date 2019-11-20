module.exports = function (app, router) {
    let config = app.config;
    router = router || app;

    router.get(["/docs", "/docs/"], (req, res, next) => {
        res.render("api_docs", {
            name: config.name,
            motto: config.motto,
            title: "API Docs",
            notfixed: true,
        });
    })
};