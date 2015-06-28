var pg = require('pg');
pg.conString = "postgres://postgres:1234@localhost:5432/cooking-genie";

module.exports = pg;