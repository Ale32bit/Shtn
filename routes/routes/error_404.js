module.exports = function (app, router) {
    let config = app.config;
    router = router || app;

    router.use((req, res, next) => {
        res.status(404).render("error", {
            name: config.name,
            motto: config.motto,
            error: "Error 404",
            details: "Page not found",
            title: "Not found"
        });
    })
};