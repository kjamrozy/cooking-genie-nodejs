var router = require('express').Router();
var pg = require('./postgres');
var conString = pg.conString;

var manage_get_route = function(req,res,next){
	res.render('manage',{title: "Cooking genie - Manage",user: req.user,page: "manage"});
};

router.get('/manage',manage_get_route);

module.exports = router;