const config = require("./lib/config");
const express = require("express")
const app = express();
const path = require('path');
const http = require('http').Server(app);
const flash = require('express-flash');
const session = require('express-session');
const morgan = require('morgan');
const host = process.env.HOST;
const port = process.env.PORT || '5000';
const PgPersistence = require('./lib/pg-persistence')
const { body,validationResult } = require('express-validator');
const jsStringify = require('js-stringify');
const catchError = require("./lib/catch-error");
const io = require('socket.io')(http);
const LokiStore = require('connect-loki')(session);
const ios = require('socket.io-express-session');
// const methodOverride = require('method-override');
// require("@babel/core").transform("code", {
//   presets: ["@babel/preset-env"],
// });

app.use(express.json())
app.set('view engine', 'pug')
app.use(express.static("public"));
app.use(morgan("common"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: false,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in milliseconds
    path: "/",
    secure: false,
    secret: config.SECRET,
  },
  name: "login-testing",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}), // the session store has to be secure - according to the express-session docs
                            // the default "MemoryStore" is not secure
}));

const onlineCount = [];

io.on('connection', (socket) => {
  onlineCount.push(1)

  console.log('a user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg)
  });

  socket.on('disconnect', () => {
    console.log('user disconnected')
    onlineCount.shift();
  })
});

app.use(flash());
app.use((req, res, next) => { // creating the local variables for the browser - assigning them to variables saved in the session 
  res.locals.username = req.session.username;
  console.log(req.session.signedIn);
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session); // creating a new PgPersistence object - has a username property - has a authenticate method
  //console.log("at app.use ( new PgPersistence(req.session) )")
  next();
});

// validate username
const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    console.log("declaring the requiresAuthentication const")
    res.redirect(302, "/signIn");
  } else {
    next();
  }
};
//test
app.get("/", (req, res) => {
  res.redirect("/signIn")
})

app.get("/signIn", (req, res) => {
  res.render("signIn")
})

app.post("/signIn",
  catchError(async(req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password
    const authenticated = await res.locals.store.authenticate(username, password)
    if (!authenticated) {
      req.flash("failure")
      res.redirect("/signIn", {
        flash: req.flash()
      })
    } else {
      let session = req.session;
      session.username = username;
      session.signedIn = true;
      req.flash("info", "Welcome!");
      res.locals.message = req.flash();
      res.redirect("/mainroom");
    }
  })
);

app.get("/mainroom", 
  requiresAuthentication, 
  (req, res) => {
    const username = req.session.username
    res.render("mainroom", { 
      name: username
    })
  }
)

app.get("/register", (req, res) => {
  res.render("register");
})

app.post("/register",
  catchError(async(req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password
    let encryptedPassword = await res.locals.store.encryptDbPassword(password);
    let registered = await res.locals.store.register(username, encryptedPassword);
    if (registered) {
      res.redirect("/signIn")
    } else {
      res.send("Error")
    }
  })
)



app.post("/logout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect("/");
});

http.listen(port, () => {
  console.log("server has started on port " + port);
})

module.exports = onlineCount;