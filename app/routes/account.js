var router = require('express').Router();
var pg = require('./postgres');
var conString = pg.conString;
var raiseInternalError = require('./auxiliary');

/** Renders /account GET route 
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var account_get_route = function(req,res,next){
//connect to the database to fetch the products
  pg.connect(conString,function(err,client,pg_done){
    //raise internal error if connection failed
      if(err)
        return raiseInternalError(err,client,pg_done,next);

      //query for all products in database
      client.query("SELECT * FROM Diet ORDER BY name ASC",function(err,result){
        //raise internal error if query failed
        if(err)
          return raiseInternalError(err,client,pg_done,next);
        
        var diets = result.rows;
        client.query("SELECT * FROM Person_diet JOIN Diet ON(person_diet.diet_id=diet.diet_id) WHERE person_id=$1 ORDER BY diet.name ASC",[req.user.person_id],
          function(err,result){
              //raise internal error if query failed
              if(err)
                return raiseInternalError(err,client,pg_done,next);

              pg_done();
              res.render('account',{title: "Cooking genie - Account",user: req.user,
                person_diets: result.rows,diets: diets,message: req.flash('success')});
          })
      });
  })
};

router.get('/account',account_get_route);

module.exports = router;