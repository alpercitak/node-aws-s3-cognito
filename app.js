require("dotenv").config();

const express = require("express");

const config = {
    "dirname": __dirname,
    "name": process.env.NAME,
    "title": process.env.NAME_READABLE,
    "http": {
        port: process.env.PORT
    }
};

const app = express();

app.set("view engine", "pug");
app.set("views", "./views");

app.use('/assets', express.static(config.dirname + '/public/assets/'));
app.use(express.static(config.dirname + '/public/'));

app.use((req, res, next) => {
    res.locals.config = require("./.config") || {};
    return next();
});
app.get("/", (req, res) => {
    return res.render("home");
});

app.listen(config.http.port);
console.log('%s started on %s | port:%d', config.name, new Date(Date.now()).toISOString(), config.http.port);