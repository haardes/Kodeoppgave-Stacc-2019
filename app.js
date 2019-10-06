const express = require("express");
const fs = require("fs");
const path = require("path");
const serial = require("./plan/serial");
const ammortising = require("./plan/ammortising");
const app = express();
const port = 3000;
let nedbetalingsplan;

app.use(express.static('public_html'));
app.use(express.json());

function getNedbetalingsPlan(req) {
    if (req.headers["content-type"] != "application/json") {
        return;
    }

    if (!req.body.laanetype) {
        return;
    }

    if (req.body.laanetype === "SERIE") {
        nedbetalingsplan = serial.generatePlan(req.body);
    } else if (req.body.laanetype === "ANNUITET") {
        nedbetalingsplan = ammortising.generatePlan(req.body);
    }

    return nedbetalingsplan;
}

app.post("/api", (req, res) => {
    let nedbetalingsplan = getNedbetalingsPlan(req);

    if (!nedbetalingsplan) return;

    res.json({
        nedbetalingsplan
    });
});

app.listen(port, () => console.log(`Listening on port ${port}!`));