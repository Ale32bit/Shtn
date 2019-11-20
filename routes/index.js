module.exports = {
    api: {
        get: require("./api/get"),
        generate: require("./api/generate"),
        resolve: require("./api/resolve"),
        status: require("./api/status"),
        error_404: require("./api/error_404"),
    },
    index: require("./routes/index"),
    redirect: require("./routes/redirect"),
    generate: require("./routes/generate"),
    api_docs: require("./routes/api_docs"),
    report: require("./routes/report"),
    error_404: require("./routes/error_404"),
};