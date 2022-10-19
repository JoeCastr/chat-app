const config = require("./lib/config");
const express = require("express");
const app = express();
const path = require("path");
const http = require("http").Server(app);
const session = require("express-session");
const morgan = require("morgan");
const port = process.env.PORT || "5000";
const PgPersistence = require("./lib/pg-persistence");
const { body } = require("express-validator");
const catchError = require("./lib/catch-error");
const io = require("socket.io")(http);
const LokiStore = require("connect-loki")(session);
const redisClient = require("./lib/redis/redis.js");

const options = {
  path: "./loki-session-store.json"
}

app.use(express.json());
app.set("view engine", "pug");
app.use(express.static("public"));
app.use(morgan("common"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: false,
    maxAge: 0.12 * 60 * 60 * 1000, // 5 minutes (60 * 0.12 = 5) times 60 seconds * 1000 milliseconds
    path: "/",
    secure: false,
    secret: config.SECRET,
  },
  name: "login-testing",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore(options)
}));

// define function to iterate through all elements of the redis range
// // for each element, emit that element to all listening websocket clients
function sendMessage(socket) {
  redisClient.lrange("messages", "0", "-1", (err, data) => {
    data.forEach(message => {
      socket.emit('chat message', message);
    });
  });
}

// listen to the 'connection' event of a client, which comes from the front end
io.on("connection", (socket) => {

  sendMessage(socket);

  let socketTracker = setInterval(function() {
    socket.emit("reportUserCount", io.of('/').sockets.size);
  }, 3000);

  console.log(`${socket.id} connected`);
  console.log(`There are ${io.of('/').sockets.size} users connected`);

// add message to the redis list
// emit message event to all listening clients
  socket.on("chat message", (msg) => {
    redisClient.rpush("messages", `${msg}`);

    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected"); 
    clearInterval(socketTracker);
  });
});

app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  next();
});

app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// validate username
const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    res.redirect(301, "/signIn");
  } else {
    next();
  }
};

app.get("/", (req, res) => {
  res.redirect("/signIn");
});

app.get("/signIn", (req, res) => {
  res.render("signIn");
});

app.post("/signIn",
  catchError(async(req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;
    const authenticated = await res.locals.store.authenticate(username, password);
    if (!authenticated) {
      res.render("signIn");
    } else {
      let session = req.session;
      session.username = username;
      session.signedIn = true;
      res.redirect("/mainroom");
    }
  })
);

app.get("/mainroom", 
  requiresAuthentication, 
  (req, res) => {
    const username = req.session.username;
    res.render("mainroom", { 
      name: username
    });
  }
);

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register",
  catchError(async(req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;
    let encryptedPassword = await res.locals.store.encryptDbPassword(password);
    let registered = await res.locals.store.register(username, encryptedPassword);
    if (registered) {
      res.redirect("/signIn");
    } else {
      res.redirect("register");
    }
  })
);

app.post("/logout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect("/");
});

http.listen(port, () => {
  console.log("server has started on port " + port);
})