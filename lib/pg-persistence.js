const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  async authenticate(username, password) {        // Here I am authenticating my user by determining if their username+password exists in the db
                                                  // the function I'm using is dbQuery and it comes from db-query.js
                                                  // the return value is whater pg module Client.query() returns
    const FIND_HASHED_PASSWORD = 'SELECT password FROM user_list' +
                                 ' WHERE username = $1';

    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    // I want to compare the hashed password to the text password that was enterd
    // how do I reference the hashed password here. Where is it being returned.
    console.log('result.rows[0] is an array and it is equal to this ' + result.rows[0]); 
    
    // for (let index = 0; index < result.rows.length; index += 1) {
    //   console.log(result.rows[index]);
    // }

    let compareSync = bcrypt.compareSync(password, result.rows[0].password); // so result.row is a property that references an aray
                                                                             // but that array is populated with objects

    return result.rowCount > 0 && compareSync;
  }

  async encryptDbPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async register(username, password) {
    const INSERT_NEW_USERNAME = "INSERT INTO user_list(username, password)" +
                                " VALUES ($1, $2)";

    let result = await dbQuery(INSERT_NEW_USERNAME, username, password)
    if (result.rowCount === 0) return false;

    return result.rowCount > 0;
  }
};