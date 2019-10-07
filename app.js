const express = require("express");
const fs = require("fs");
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

app.get("/download/json", (req, res) => {
    if (!nedbetalingsplan) {
        return;
    }

    let content = JSON.stringify(nedbetalingsplan);

    fs.writeFile("nedbetalingsplan.json", content, (err) => {
        if (err) {
            console.log(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment;filename=' + "nedbetalingsplan.json" + '');
            res.sendFile(__dirname + "/nedbetalingsplan.json");
        }
    });
});

app.get("/download/csv", (req, res) => {
    if (!nedbetalingsplan) {
        return;
    }

    const outFileName = "nedbetalingsplan.csv";

    let CSVString = "DATO:,GEBYRER:,TERMINBELOP:,RENTER:,AVDRAG:,RESTBELOP:";

    nedbetalingsplan.innbetalinger.forEach(bet => {
        CSVString += "\n";
        CSVString += `${bet.dato},${bet.gebyrer},${bet.terminbelop},${bet.renter},${bet.avdrag},${bet.restbelop}`;

        //Forårsaker en feil i rekkefølgen på elementene
        /* Object.keys(bet).forEach(key => {
            CSVString += `${bet[key]},`;
        }); */
    });

    fs.writeFile(outFileName, CSVString, err => {
        if (err) {
            console.log(err);
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment;filename=' + "nedbetalingsplan.csv" + '');
        res.sendFile(__dirname + "/nedbetalingsplan.csv");
    });
});

app.listen(port, () => console.log(`Listening on port ${port}!`));