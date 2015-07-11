var router = require('express').Router();
var pg = require('./postgres');
var conString = pg.conString;
var raiseInternalError = require('./auxiliary');

router.get('/account',function(req,res,next){
	res.render('account',{title: "Cooking genie - Account",user: req.user});
});

module.exports = router;