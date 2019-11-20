function asyncLoop(cond, func, cb) { // sigh
    let done = false;
    let exit = false;
    let loop = {
        next: function () {
            if (exit) {
                return;
            }
            if (done || !cond) {
                cb();
                return;
            }

            func(loop);

        },
        exit: function () {
            exit = true;
        },
        break: function () {
            done = true;
        }
    };

    loop.next();

    return loop
}

class API {
    constructor(db) {
        this.db = db;
    }

    static randomCode(length = 5) {
        let charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        let code = "";

        for (let i = 0; i < length; i++) {
            code += charset[Math.floor(Math.random() * (charset.length))]
        }

        return code;
    }

    generate(url, code_length) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM links WHERE link = ?;", [
                url,
            ], (err, r) => {
                if (r) return resolve({
                    code: r.code,
                    link: r.link,
                    malicious: r.malicious > 0,
                    raw: r,
                    success: true,
                });

                asyncLoop(true, (loop) => { // sigh
                    let code = API.randomCode(code_length);
                    this.resolve(code).then(r => {
                        if (r.success) {
                            loop.next();
                        } else {
                            this.db.run("INSERT INTO links (code, link, malicious) VALUES ($code, $link, 0);", {
                                $code: code,
                                $link: url,
                            });
                            resolve({
                                code: code,
                                url: url,
                                malicious: false,
                                raw: r,
                                success: true,
                            });
                            loop.exit();
                        }
                    })
                });
            })
        })

    }

    resolve(code) {
        return new Promise((resolve, reject) => {

            this.db.get("SELECT * FROM links WHERE code = ?;", [
                code,
            ], (err, r) => {
                if (r) {
                    return resolve({
                        code: r.code,
                        link: r.link,
                        malicious: r.malicious > 0,
                        raw: r,
                        success: true,
                    });
                } else {
                    return resolve({
                        success: false,
                        raw: r,
                    })
                }
            })
        });
    }
}

module.exports = API;