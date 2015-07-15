var express = require('express');
var router = express.Router();
var pg = require('./postgres');
var conString = pg.conString;
var raiseInternalError = require('./auxiliary');

/** Renders /products GET route 
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var products_get_route = function(req,res,next){
//connect to the database to fetch the products
pg.connect(conString,function(err,client,pg_done){
		//raise internal error if connection failed
    if(err)
    	return raiseInternalError(err,client,pg_done,next);

    //query for all products in database
    client.query("SELECT * FROM Product ORDER BY name ASC",function(err,result){
    	//raise internal error if query failed
	    if(err)
	    	return raiseInternalError(err,client,pg_done,next);

    	pg_done();

    	//if the extension is json return json
    	if(req.path.match( /\/products\.([\w]+)/ )[1]=="json")
    		return res.json(result.rows);
    	res.render('products',{title: "Cooking genie - Products",user: req.user,products: result.rows});
    });
  })
};

/** Renders website exactly like products_get_route but with much fewer products
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var search_route = function(req,res,next){
	//connect to the database to fetch products that fit the request
	pg.connect(conString,function(err,client,pg_done){
		if(err)
			return raiseInternalError(err,client,pg_done,next);

		//fetch products which have name like specified by query parameter
		client.query("SELECT * FROM Product WHERE product.name LIKE $1 ORDER BY product.name ASC",
			["%"+req.body.query+"%"],
			function(err,result){
				if(err)
					return raiseInternalError(err,client,pg_done,next);

				//render products page with selected products and release pg client
				pg_done();
				res.render('products',{title: "Cooking genie - Products",products: result.rows,user: req.user});
			});
	});
};

var product_get_route = function(req,res,next){	//connect to the database
  pg.connect(conString,function(err,client,pg_done){
		//raise internal error if connection failed
	  if(err)
	    	return raiseInternalError(err,client,pg_done,next);

	  //query for product with specified id
    client.query("SELECT * FROM Product WHERE product_id = $1", [req.params.id],function(err,result){
      //raise internal error if query failed
		  if(err)
		    return raiseInternalError(err,client,pg_done,next);

		  //raise not found error if there is no rows
      if(result.rowCount==0){
        pg_done();
        var error = new Error('Not found');
        error.status = 404
        error.details = details;
        return next(error);
      }
      var product = result.rows[0];
      //perform natural join to get all ingredients(possibly none) required to craft product
      client.query(
        "SELECT product_recipe.ingredient_product_id AS product_id,"+
        "sub_prod.name AS name,"+
        "sub_prod.quantity_magnitude AS quantity_magnitude,"+
        "product_recipe.quantity AS quantity "+
        "FROM product JOIN product_recipe ON (product.product_id=product_recipe.subject_product_id)"+
        "JOIN product as sub_prod ON (product_recipe.ingredient_product_id=sub_prod.product_id) WHERE product.product_id=$1",
        [req.params.id],
        function(err,result){
		      //raise internal error if query failed
			    if(err)
			    	return raiseInternalError(err,client,pg_done,next);

			    //release client and render webpage
		      pg_done();
			    res.render('product',{title: "Cooking genie - "+product.name,user: req.user,
	          	  product: product,recipe: result.rows});
        });
    });
  });
}


router.get('/products/:id',product_get_route);
router.get(/\/products\.([\w]+)/,products_get_route);
router.post('/search',search_route);

module.exports = router;