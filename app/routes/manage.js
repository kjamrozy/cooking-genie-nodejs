var router = require('express').Router();
var pg = require('./postgres');
var conString = pg.conString;
var raiseInternalError = require('./auxiliary');

/** Renders /manage GET route 
@param req - HTTP request
@param res - server response
@param req - callback for passing request to the next function
*/
var manage_get_route = function(req,res,next){
	//connect to the database to fetch products and diets
	pg.connect(conString,function(err,client,pg_done){
		//raise internal error if connection failed
	    if(err)
	    	return raiseInternalError(err,client,pg_done,next);

	    //query for all products from database
	    client.query("SELECT * FROM Product ORDER BY name",function(err,result){
	    	//raise internal error if query failed
		    if(err)
		    	return raiseInternalError(err,client,pg_done,next);

		    var products = result.rows;
		    //query for all diets from database
		    client.query("SELECT * FROM Diet ORDER BY name",function(err,result){
		    	//raise internal error if query failed
			    if(err)
			    	return raiseInternalError(err,client,pg_done,next);

			    var diets = result.rows;
			    //query for all substances in database
			    client.query("SELECT * FROM Substance ORDER BY name",function(err,result){
			    	//raise internal error if query failed
				    if(err)
				    	return raiseInternalError(err,client,pg_done,next);

				    //pass data to the webpage and release postgres client
			    	pg_done();
			    	res.render('manage',{title: "Cooking genie - manage",products: products,diets: diets,substances: result.rows,
			    		user: req.user,message: req.flash('success'),page: "manage"});
				    });
			    });

	    });
	  })
 
};

router.get('/manage',manage_get_route);

module.exports = router;