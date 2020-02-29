const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

// middleware to validate if is a string or empty
const messageValidator = (req, res, next) => {
  if (!req.body.text || req.body.text.length === 0) {
    res.status(400).end();
  } else {
    next();
  }
};

//midleware to limit the amount of requests
let requestsLimit = 0;
const limitAmountOfRequests = (req, res, next) => {
  requestsLimit = requestsLimit + 1;
  if (requestsLimit > 5) {
    res.status(429).end();
  } else {
    next();
  }
};

//using all middlewares
app.use(bodyParser.json());
app.use(messageValidator);

//post endpoint and using the midleware to limit the amount of requests locally
app.post("/messages", limitAmountOfRequests, (req, res, next) => {
  console.log(req.body.text);
  res.json(req.body).catch(error => next(error));
});

app.listen(port, () => console.log("listening on port " + port));
