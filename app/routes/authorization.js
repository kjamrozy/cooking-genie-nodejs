var bcrypt = require('bcrypt-node');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var pg = require('pg');
var conString = "postgres://postgres:1234@localhost:5432/cooking-genie";

module.exports = passport;