var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('./routes/authorization');
var session = require('express-session');
var flash = require('connect-flash');
var md5 = require('MD5');
var pg = require('./routes/postgres');
var conString = pg.conString;

var account = require('./routes/account');
var routes = require('./routes/index');
var manage = require('./routes/manage');
var advisor = require('./routes/advisor');
var products = require('./routes/products');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: '%I05V~N5U803}`GdLZFVi-_^KuSiZQ' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.get('/signin',function(req,res,next){
  res.render('signin',{error: req.flash("error")});
});

app.get('/signup',function(req,res,next){
  res.render('signup',{error: req.flash('error')});
});
app.post('/signup',passport.authenticate('signup',{successRedirect: '/',failureRedirect: '/signup',failureFlash: true,successFlash: true}));
app.post('/signin',passport.authenticate('signin',{successRedirect: '/',failureRedirect: '/signin',failureFlash: true}) );

//ensure that user is logged in begore accessing the page
app.use(function(req,res,next){
  if(req.isAuthenticated()){ 
    res.locals = {md5: md5(req.user.email),
      error: req.flash('error'),success: req.flash('success')};
    console.log((req.flash('error')!=[]));
    return next();
  }
  res.redirect('/signin');
});

app.use('/', routes);
app.use(manage);
app.use(account);
app.use(advisor);
app.use(products);

app.get('/signout',function(req,res,next){
  req.logout();
  res.redirect('/');
});

//route for accessing the about webpage
app.get('/about',function(req,res,next){
  res.render('about',{page: "about",title: "Cooking genie - About",user: req.user,message: req.flash('success')});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
        var error = new Error('Not found');
        error.status = 404
        return next(error);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    page: "index",
    error: {}
  });
});


module.exports = app;
