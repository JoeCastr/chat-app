const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcrypt");

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = getUserByEmail(email)
    if (user === null) {
      return done(null, false, { message: 'No user with that email'}); // first parameter is an error to pass - we have none defined atm
                                                        // second parameter is the user that was found - we found no user so we pass 'false'
                                                        // third parameter is an object with a message property - it will be used as our error message
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else { // this condiditon is for if the user password did not match
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id) )
  passport.deserializeUser((id, done) => done(null, getUserById(id)))
}

module.exports = initialize