var express = require('express');
var router = express.Router();
var pg = require('./postgres');
var conString = pg.conString;
var raiseInternalError = require('./auxiliary');

/** Route for getting cookable products via ajax */
var advise_route = function(req,res,next){
  pg.connect(conString,function(err,client,pg_done){
      /* Yeah, I know it's a mess with that nesting. Only postgres-nodejs don't provide
      synchronous call to the db. 
      */

      //raise internal error if connection failed
      if(err)
        return raiseInternalError(err,client,pg_done,next);

      //we need to get product_id,quantity and its magnitude,calories,desc and img 
      //for each product that has recipe and is a meal
      var query = client.query(
        "SELECT Product.product_id AS product,Product.quantity_magnitude,"+
        "Product.calories,Product.quantity,Product.description,Product.img_url"+
        " FROM Product JOIN"+
        " Product_recipe ON (product.product_id=product_recipe.subject_product_id)"+
        " WHERE product.is_a_meal"),
      products={},//all products which we will pass as the result
      recipes = {};//ingredient products for each product

      query.on('row',function(row){
        //save that product info in products and preset recipe with []
        products[row.product]= row;
        recipes[row.product] = [];
      });

      query.on('end',function(){
        //get all records from product_recipe table 
        var query = client.query("SELECT subject_product_id AS product,ingredient_product_id AS ingredient,quantity FROM Product_recipe");

        query.on('row',function(row){
          //check if recipes[row.product] exists cause [] evaluates to true
          if(recipes[row.product])
            recipes[row.product].push(row);//if so add that ingredient product to the recipe
        });

        query.on('end',function(){
          //get all user's diet ids
          client.query("SELECT diet_id FROM Person_diet WHERE person_id=$1",
            [req.user.person_id],
            function(err,result){
              //if error occured raise internal server error
              if(err)
                return raiseInternalError(err,client,pg_done,next);

              var diets = result.rows;//user's diet ids

              //this function recursively removes products that are restricted by each diet and proceeds to the next step
              var curr_diet=diets.length-1;//global counter for syncQuery, stores number of diets left to process
              var syncQuery = function(){
                //if now we should process diet with index < 0, then proceed to the next step
                if(curr_diet<0){
                  var content = {};//all products that are currently in fridge with respect to the sum of quantities

                  //get all products 
                  var query = client.query(" SELECT product_id,SUM(quantity) AS sum FROM (SELECT person_id,product_id,quantity,expiration_date FROM Person JOIN Person_product USING (person_id) GROUP BY person_id,product_id,quantity,expiration_date HAVING expiration_date>now() AND person_id=$1 )"+
                    " AS foo GROUP BY foo.person_id,foo.product_id",[req.user.person_id],function(err,result){
                        //if error occured raise internal server error
                        if(err)
                          return raiseInternalError(err,client,pg_done,next);

                        //store each sum in content var
                        for(var i=0;i<result.rows.length; i++)
                          content[result.rows[i].product_id]=result.rows[i].sum;

                        var ans = [];//final answer

                        //for each product check if we have enough ingredients
                        for(x in products){
                          var recipe = recipes[products[x].product];//current product recipe
                          var cookable=true;//we can cook that product unless...

                          //..unless there exists ingredient that we haven't that much
                          for(var i=0;i<recipe.length && cookable;++i)
                            if(!content[recipe[i].ingredient] || content[recipe[i].ingredient]<recipe[i].quantity)
                              cookable=false;

                          //if cookable is still true, then this product is a part of the answer
                          if(cookable){
                            var data = products[x];
                            data.recipe = recipe; 
                            ans.push(data);
                          }
                        }

                        //return json with ans and release pg client
                        res.json(ans);
                        pg_done();
                    });
                    return;
                }
                //this query check current day of the week and returns all products 
                //that are restricted by current diet(of course today)
                var query = client.query("SELECT product_id FROM restricted_products($1) GROUP BY product_id HAVING CAST( 2^(CAST((EXTRACT(DOW FROM NOW())+6) AS int)%7) AS smallint) & bit_or(days)>0;",
                  [diets[curr_diet].diet_id]);

                //delete each such product
                query.on('row',function(row){
                  delete products[row.product_id];
                });

                query.on('end',function(){
                  curr_diet--;
                  syncQuery();
                });
            };

            //run auxiliary function to process each diet
            syncQuery();
          });
        });
      });
  });
};

router.get('/advise',advise_route);

module.exports = router;