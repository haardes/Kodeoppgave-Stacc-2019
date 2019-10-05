const express = require("express");
const app = express();
const port = 3000;

app.use(express.static('public_html'));

app.post("/api", (req, res) => {

});

app.get("/api", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));