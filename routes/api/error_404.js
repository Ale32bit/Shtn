module.exports = function (app, router) {
    router = router || app;
    router.use(function (req, res) {
        res.status(404).json({
            success: false,
            message: "Not found",
        }).end();
    });
};
