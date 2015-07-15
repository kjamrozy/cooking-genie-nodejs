var express = require('express');
var router = express.Router();
var pg = require('./postgres');
var conString = pg.conString;
var raiseInternalError = require('./auxiliary');

/** Renders /products GET route 
@param req - HTTP request
@param res - server response
@param req - callback for passing request to the next function
*/
var products_get_route = function(req,res,next){
	res.render("products",{title: "Cooking genie - Products",page: "products",user: req.user});
};

router.get('/products.html',products_get_route);

module.exports = router;