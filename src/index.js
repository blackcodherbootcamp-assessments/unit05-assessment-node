require("dotenv").config();
const fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");
const port = 8080;
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const todoFilePath = process.env.BASE_JSON_PATH;

// Read todos from todos.json into variable
const getTodos = () => require(path.join(__dirname, todoFilePath));

// Error handling Middleware function for logging the error message
const errorLogger = (error, request, response, next) => {
  console.log(`error: ${error.message}`);
};

// Error handling Middleware function reads the error message
// and sends back a response in JSON format
const errorResponder = (error, request, response, next) => {
  response.header("Content-Type", "application/json");

  const status = error.status || 400;
  response.status(status).send(error.message);
};

// Fallback Middleware function for returning
// 404 error for undefined paths
const invalidPathHandler = (request, response, next) => {
  response.status(404);
  response.send("Invalid path");
};

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.raw());
app.use(bodyParser.json());
app.use("/content", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile("./public/index.html", { root: __dirname }, (err) => {
    if (err) {
      console.log(err);
      next(err);
    }
  });
});

app.get("/todos", (_, res) => {
  /*
  res.header("Content-Type","application/json");
  res.sendFile(todoFilePath, { root: __dirname });
  */
  res.status(501).end();
});

//Add GET request with path '/todos/overdue'

//Add GET request with path '/todos/completed'

//Add POST request with path '/todos'

//Add PATCH request with path '/todos/:id

//Add POST request with path '/todos/:id/complete

//Add POST request with path '/todos/:id/undo

//Add DELETE request with path '/todos/:id

// Attach error handling middleware after all regular middleware
app.use(errorLogger);
app.use(errorResponder);
app.use(invalidPathHandler);

module.exports = app;
