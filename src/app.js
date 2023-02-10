require("dotenv").config();
const fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const todoFilePath = process.env.BASE_JSON_PATH;

// Save todos to disk
const saveTodos = async (todos) => {
  await fs.writeFile(
    path.join(__dirname, todoFilePath),
    JSON.stringify(todos, null, 2) + "\n",
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
};

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

app.use(express.static(path.join(__dirname, "/public")));
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

app.get("/todos", (req, res) => {
  try {
    const todos = getTodos();

    res.setHeader("Content-Type", "application/json").send(todos);
  } catch (err) {
    next(err);
  }
});

//Add GET request with path '/todos/overdue'
app.get("/todos/overdue", (req, res) => {
  try {
    const todos = getTodos().filter(
      (todo) => new Date(todo.due) < new Date() && todo.completed === false
    );

    res.setHeader("Content-Type", "application/json").send(todos);
  } catch (err) {
    next(err);
  }
});

//Add GET request with path '/todos/completed'
app.get("/todos/completed", (req, res) => {
  try {
    const todos = getTodos().filter((todo) => todo.completed === true);

    res.setHeader("Content-Type", "application/json").send(todos);
  } catch (err) {
    next(err);
  }
});

//Add POST request with path '/todos'
app.post("/todos", (req, res) => {
  const newTodo = req.body;

  if (!newTodo.name || !newTodo.due) {
    res.status(400).send("Invalid request");
  } else {
    const todos = getTodos();

    newTodo.id = uuidv4();
    newTodo.completed = false;
    newTodo.created = new Date().toISOString();
    todos.push(newTodo);
    saveTodos(todos)
      .then((value) => {
        res
          .setHeader("Content-Type", "application/json")
          .status(201)
          .send(newTodo);
      })
      .catch((err) => next(err));
  }
});

//Add PATCH request with path '/todos/:id
app.patch("/todos/:id", (req, res) => {
  try {
    const id = req.params.id;
    const todos = getTodos();
    const todo = todos.find((todo) => todo.id === id);

    if (todo) {
      todo.name = req.body.name ?? todo.name;
      todo.due = req.body.due ?? todo.due;
      todo.completed = req.body.completed ?? todo.completed;
      saveTodos(todos)
        .then((value) => {
          res.setHeader("Content-Type", "application/json").send(todo);
        })
        .catch((err) => next(err));
    } else {
      res.status(404).send("Todo not found");
    }
  } catch (err) {
    next(err);
  }
});

//Add POST request with path '/todos/:id/complete
app.post("/todos/:id/complete", (req, res) => {
  try {
    const id = req.params.id;
    const todos = getTodos();
    const todo = todos.find((todo) => todo.id === id);

    if (todo) {
      todo.completed = true;
      res.setHeader("Content-Type", "application/json").send(todo);
    } else {
      res.status(404).send("Todo not found");
    }
  } catch (err) {
    next(err);
  }
});

//Add POST request with path '/todos/:id/undo
app.post("/todos/:id/undo", (req, res) => {
  try {
    const id = req.params.id;
    const todos = getTodos();
    const todo = todos.find((todo) => todo.id === id);

    if (todo) {
      todo.completed = false;
      res.setHeader("Content-Type", "application/json").send(todo);
    } else {
      res.status(404).send("Todo not found");
    }
  } catch (err) {
    next(err);
  }
});

//Add DELETE request with path '/todos/:id
app.delete("/todos/:id", (req, res) => {
  try {
    const id = req.params.id;
    const todos = getTodos();
    const index = todos.findIndex((todo) => todo.id === id);

    if (index >= 0) {
      todos.splice(index, 1)
      saveTodos(todos)
        .then((value) => {
          res.send();
        })
        .catch((err) => next(err));
    } else {
      res.status(404).send("Todo not found");
    }
  } catch (err) {
    next(err);
  }
});

// Attach error handling middleware after all regular middleware
app.use(errorLogger);
app.use(errorResponder);
app.use(invalidPathHandler);

module.exports = app;
