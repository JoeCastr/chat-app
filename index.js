const config = require("./lib/config");
const express = require("express")
const app = express();
const path = require('path');
const http = require('http').Server(app)
const session = require('express-session');
const morgan = require('morgan');
const PgPersistence = require('./lib/pg-persistence')
const { body,validationResult } = require('express-validator');
const jsStringify = require('js-stringify');
const catchError = require("./lib/catch-error");
const io = require('socket.io')(http);
const LokiStore = require('connect-loki')(session);
const ios = require('socket.io-express-session');
const passport = require('passport')
const initializePassport = require('./lib/passport-config');
const methodOverride = require('method-override');
const flash = require('express-flash');

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
  // store: new LokiStore({}), // the session store has to be secure - according to the express-session docs
                            // the default "MemoryStore" is not secure
}));

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg)
  });

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
});

//app.use(flash()); // I don't have flash isntalled yet
app.use((req, res, next) => { // creating the local variables for the browser - assigning them to variables saved in the session 
  res.locals.username = req.session.username;
  console.log(req.session.signedIn);
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});
app.use((req, res, next) => { // not sure why I need store 
  res.locals.store = new PgPersistence(req.session); // creating a new PgPersistence object - has a username property - has a authenticate method
  console.log("at app.use ( new PgPersistence(req.session) )")
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
      // res.flash("Error", "invalid credentials")
      res.redirect("/signIn")
    } else {
      let session = req.session;
      session.username = username;
      session.signedIn = true;
      //req.flash("info", "Welcome!");
      res.redirect("/mainroom");
    }
  })
);

app.get("/mainroom", 
  requiresAuthentication, 
  (req, res) => {
    const username = req.session.username
    res.render("mainroom", { name: username })
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
      res.redirect("/mainroom")
    } else {
      res.send("Error")
    }
  })
)

// create a user
// app.get("/login/create_user", async(req, res) => {
//   const username = req.params.username

//   res.json(username)
// })

// sign in user

http.listen(5000, () => {
  console.log("server has started on port 5000")
})