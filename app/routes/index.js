var express = require('express');
var router = express.Router();
var pg = require('./postgres');
var conString = pg.conString;

/** Renders / (main page) GET route 
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var index_route = function(req, res, next) {
	//connect to the database to fetch user's fridge content
  pg.connect(conString,function(err,client,pg_done){
  	//if connection failed raise internal error
  	if(err)
      return raiseInternalError(err,client,pg_done,next);
  	//preset data which should be accessible to the page template
    var data = {user: req.user,title: "Cooking genie - Home",page: "index",stylesheet: "index.css",
	    javascript: "index.js"};
    
    client.query("SELECT *,EXTRACT(DAYS FROM (Person_product.expiration_date-now())) AS days_left FROM Person_product JOIN Product ON (Person_product.product_id=Product.product_id) WHERE Person_product.person_id=$1",
      [req.user.person_id],
      function(err,result){
      	//if query failed raise internal error
        if(err)
          return raiseInternalError(err,client,pg_done,next);

        //store result to the data
        data.content = result.rows;
        //query to fetch products info
        client.query("SELECT * FROM Product",function(err,result){
	      	//if query failed raise internal error
          if(err)
            return raiseInternalError(err,client,pg_done,next);

          //store result, render page and release postgres client
          data.products = result.rows;
          res.render('index',data);
          pg_done();
        });
    });
  });
};

router.get('/', index_route);

module.exports = router;
