const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  async authenticate(username, password) {        
    const FIND_HASHED_PASSWORD = 'SELECT password FROM user_list' +
                                 ' WHERE username = $1';

    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;
    console.log('result.rows[0] is an array and it is equal to this ' + result.rows[0]); 

    let compareSync = bcrypt.compareSync(password, result.rows[0].password);
    
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

  async retrieveCounter() {
    const RETRIEVE_COUNTER = "SELECT count FROM counters RETURNING count";

    let result = await dbQuery(RETRIEVE_COUNTER)
    if (result.rowCount === 0) return false;

    return result.rows[0];
  }

  async updateCounter(int) {
    const UPDATE_COUNTER = "UPDATE counters SET count = $1 WHERE id = 1";

    let result = await dbQuery(UPDATE_COUNTER);
    if (result.rowCount === 0) return false;

    return result.rowCount > 0;
  }
};