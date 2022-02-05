const express = require("express");
const scraper = require("./scraper.js");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200 
}

app.use(cors(corsOptions));

app.post("/", async (req, res) => {

  const token = req.body.token;

  scraper.index(token)
    .then(data => {
      res.json(data);
    })

});

app.post("/login", async (req, res) => {

  const user = req.body.user;
  const password = req.body.password;

  scraper.login(user, password)
    .then(data => {
      res.json(data);
    })

});

app.post("/subject", async (req, res) => {
  
  const token = req.body.token;
  const subject_url = req.body.subject_url;

  scraper.subject(token, subject_url)
    .then(data => {
      res.json(data);
    })

})

const server = app.listen(3000, function () {
  console.log("listening on *:3000");
});
