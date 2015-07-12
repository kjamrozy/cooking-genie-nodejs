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

/** Route which is in charge of adding new content to the user's fridge 
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var content_post_route = function(req,res,next){
	//connect to the database to add food
  pg.connect(conString,function(err,client,pg_done){
  	//if connection failed raise internal error
    if(err)
      return raiseInternalError(err,client,pg_done,next);
    //insert food to the database
    client.query("INSERT INTO Person_product(product_id,person_id,expiration_date,quantity) VALUES ($1,$2,$3,$4)",
      [req.body.product_id,req.user.person_id,String(req.body.expiration_date),req.body.quantity],function(err,result){
      	//if query failed raise internal error
        if(err)
          return raiseInternalError(err,client,pg_done,next);
        //release client and redirect to the main page
        pg_done();
        res.redirect('/');
      });
  });
};

/** Route which is in charge of deleting content from the user's fridge 
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var content_delete_route = function(req,res,next){
	//connect to the database to delete food
  pg.connect(conString,function(err,client,pg_done){
  	//if connection failed raise internal error
    if(err)
      return raiseInternalError(err,client,pg_done,next);
    //delete food from the database
    client.query("DELETE FROM Person_product WHERE Person_product.person_id=$1 AND Person_product.person_product_id=$2",
      [req.user.person_id,req.params.id],
      function(err,result){
      	//if query failed raise internal error
        if(err)
          return raiseInternalError(err,client,pg_done,next);
        //release client and redirect to the main page
        pg_done();
        res.redirect('/');
      });
  });
};

router.get('/', index_route);
router.post('/',content_post_route);
router.delete('/content/:id',content_delete_route);

module.exports = router;
