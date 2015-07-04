var router = require('express').Router();
var pg = require('./postgres');
var conString = pg.conString;
var raiseInternalError = require('./auxiliary');

/** Renders /manage GET route 
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
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
			    		user: req.user,message: req.flash('success'),page: "manage",panel_error: req.flash('panel-error'),
			    		field: req.flash('error-field'),panel: req.flash('panel')});
				    });
			    });

	    });
	  })
 
};

/** Redirects to the /manage with information about invalid fields
@param req - HTTP request
@param res - server response
@param panel {string} - name of the panel with invalid data
@param field {string} - name of the field with invalid data
@param field {string} - error message
*/
var validation_failed = function(req,res,panel,field,msg){
	req.flash("panel",panel);
	req.flash("error-field",field);
	req.flash("panel-error",msg);
	res.redirect('/manage');
};

/** Renders /products POST route 
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var products_post_route = function(req,res,next){
	if(!req.body.name)
		return validation_failed(req,res,"product","name","Name should not be empty");
	if(!req.body.calories)
		return validation_failed(req,res,"product","calories","Calories should not be empty");
	if(!req.body.quantity)
		return validation_failed(req,res,"product","quantity","Quantity should not be empty");
	if(!req.body.quantity_magnitude)
		return validation_failed(req,res,"product","quantity_magnitude","Magnitude should not be empty");
	if(!req.body.img_url)
		return validation_failed(req,res,"product","img_url","Image url should not be empty");

	//connect to the database to insert a new product
	pg.connect(conString,function(err,client,pg_done){
		//raise internal error if connection failed
	    if(err)
	    	return raiseInternalError(err,client,pg_done,next);

  	//insert product to the product table
    client.query("INSERT INTO Product(name,is_a_meal,calories,quantity,quantity_magnitude,img_url,description) VALUES ($1,$2,$3,$4,$5,$6,$7)",
	    [req.body.name,req.body.is_a_meal || false,req.body.calories,req.body.quantity,
      req.body.quantity_magnitude,req.body.img_url,req.body.description],
      function(err,result){
      	//raise internal error if query failed
		if(err)
			return raiseInternalError(err,client,pg_done,next);

      	/*in order to get the new product id we are using currval 
      	of product_product_id_seq sequence(default sequence from product table) */
      	client.query("SELECT currval(\'product_product_id_seq\') AS product_id",function(err,result){

      		req.flash('success','Succesfully created new product!');
		    //redirect to the product page
		    res.redirect('/products/'+result.rows[0].product_id);
      	});
      });
  });
};

router.get('/manage',manage_get_route);
router.post('/products',products_post_route);
router.get('/products/:id',function(req,res,next){
	res.send("Not yet implemented!");
});

module.exports = router;