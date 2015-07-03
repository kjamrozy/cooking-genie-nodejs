var bcrypt = require('bcrypt-node');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var pg = require('./postgres');
var conString = pg.conString;

/** Used to sign user in. 
@param {string} email - user's email
@param {string} password - user's password
@param done - authentication callback used for returning user's instance
*/
var signIn = function(email,password,done){
  //connect to the postgres database
  pg.connect(conString,function(err,client,pg_done){
    //look up for the Person with specified email(username)
    client.query("SELECT * FROM Person WHERE email=$1",[email],function(err,result){
      //return the client to the pool
      pg_done();

      //if query failed fail authorization
      if(err)
        return done(null,false,{message: "Internal server error: "+err});

      var user = result.rows[0];

      //if there is no user then email must be invalid
      if(!user)
        return done(null,false,{message: "Invalid email"});

      //if password is correct return user
      if(bcrypt.compareSync(password,user.password_digested))
        return done(null,user);

      //password is invalid so fail authentication with error info
      done(null,false,{message: "Invalid password"});
    });
  });
};

/** Used for signes user up
@param req - HTTP request
@param {string} email - user's email
@param {string} password - user's password
*/
var signUpUser = function(req,email,password,done){
    if(req.body.name=='')
      return done(null,false,{message: "Name shouldn't be empty"});

    if(req.body.surname=='')
          return done(null,false,{message: "Surname shouldn't be empty"});

    //passwords should match each other
    if(req.body.password!=req.body.password_confirmed)
      return done(null,false,{message: "Password is ambigous"});

    if(password.length<8)
      return done(null,false,{message: "Password should be at least 8 characters long"});

    //simple pattern checking for email
    if(!email.match(/([\w\.]+)@[\w\.]+/))
      return done(null,false,{message: "Email is invalid"});

    //connect to the database to add new user
    pg.connect(conString,function(err,client,pg_done){

      //first we need to check if there is already user with the same email
      client.query("SELECT * FROM Person WHERE email=$1",[email],function(err,result){
        //auxiliary function for reducing boilerplate code
        var failAuth = function(msg){
          pg_done();
          done(null,false,{message: msg})
        };

        //if error occurred then terminate registration
        if(err)
          failAuth(err);

        //if there is indeed already an email like that raise an error
        if(result.rows.length>0)
          failAuth("There is an account with email like that");

        //synchronous hash password
        var hash = bcrypt.hashSync(req.body.password);

        //insert user to the database
        var query = client.query("INSERT INTO Person(email,password_digested,name,surname) VALUES ($1,$2,$3,$4)",
          [email,hash,req.body.name,req.body.surname],function(err,result){
            //if insertion failed then terminate registration
            if(err)
              failAuth(err);

            //now we query for that user we've just created
            client.query("SELECT * FROM Person WHERE email=$1",[email],function(err,result){
              //if insertion failed then terminate registration
              if(err)
                failAuth(err);

              //if result query is empty something went wrong
              if(result.rowCount==0)
                failAuth("Error when fetching user from database");

              pg_done();
              done(null,result.rows[0],{message: "Your account has been succesfully created!"}); 
            });
        });
      });
  });
};

/** Returns person_id as a session id */
var serializeUser = function(user,done){
    done(null,user.person_id);
}

/** Provided with session id, which corresponds to the person_id field of person relation, deserializes user from database. 
@param id - session id, by convention it corresponds to some person(person_id field) record
@param done - authentication callback, used to pass user object after deserialization
 */
var deserializeUser = function(id,done){
  //connect to the database to deserialize the user
  pg.connect(conString,function(err,client,pg_done){
    var query = client.query("SELECT * FROM Person WHERE person_id = $1",
        [id],function(err,result){
        pg_done();
        //if query failed user authentication failed too
        if(err)
          return done(null,false);
        //return user instance
        done(null,result.rows[0]);
      });
    });
};

passport.use('signin',new localStrategy(signIn));
passport.use("signup",new localStrategy({passReqToCallback: true},signUpUser));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

module.exports = passport;