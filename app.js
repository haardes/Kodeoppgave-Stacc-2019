const express = require("express");
const serial = require("./plan/serial");
const ammortising = require("./plan/ammortising");
const app = express();
const port = 3000;

app.use(express.static('public_html'));
app.use(express.json());

app.post("/api", (req, res) => {
    if (req.headers["content-type"] != "application/json") {
        return;
    }

    if (!req.body.laanetype) {
        return;
    }

    if (req.body.laanetype === "SERIE") {
        let nedbetalingsplan = serial.generatePlan(req.body);
        res.json({
            nedbetalingsplan
        });
    } else if (req.body.laanetype === "ANNUITET") {
        let nedbetalingsplan = ammortising.generatePlan(req.body);
        res.json({
            nedbetalingsplan
        });
    }
});

app.listen(port, () => console.log(`Listening on port ${port}!`));