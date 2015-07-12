var router = require('express').Router();
var pg = require('./postgres');
var conString = pg.conString;
var raiseInternalError = require('./auxiliary');
var bcrypt = require('bcrypt-node');

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

/** Renders /account POST route used for changing personal data
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var account_post_route = function(req,res,next){
  //check if passwords typed match each other
  if(req.body.new_password!=req.body.password_confirmed){
    req.flash('error',"New password is ambigous!");
    return res.redirect('/account');
  }
	if(req.body.new_password.length<8){
		req.flash("error","New password should be at least 8 characters long");
	  return res.redirect('/account');
	}
  //hash new password
  var hash = bcrypt.hashSync(req.body.new_password);
  //check if old password is valid
  if(!bcrypt.compareSync(req.body.password,req.user.password_digested)){
    req.flash('error',"Actual password is invalid!");
    return res.redirect('/account');
  }
  //connect to the database to change data
  pg.connect(conString,function(err,client,pg_done){
    //raise internal error if connection failed  
    if(err)
      return raiseInternalError(err,client,pg_done,next);

    /*since email should be unique if we try to update person's email to the same one
     our query will fail because of unique constraint*/
    var query,params;
    //if email stays the same
    if(req.body.email==req.user.email){
      query = "UPDATE Person SET password_digested = $1 WHERE person_id=$2";
      params=[hash,req.user.person_id];
    }else{//otherwise
      query = "UPDATE Person SET email = $1, password_digested = $2 WHERE person_id=$3";
      params = [req.body.email,hash,req.user.person_id];
    }
    //update data
    client.query(query,
      params,
      function(err,result){
        //raise internal error if update failed  
        if(err)
          return raiseInternalError(err,client,pg_done,next);

        //release postgres client and redirect back to the /account
        pg_done();
        req.user.password_digested=hash;
        req.flash('success','Succesfully changed your your personal data!');
        res.redirect('/account');
      });
  });
};

/** Renders /account/diets POST rout used for adding personal diets
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var account_diets_route = function(req,res,next){
  pg.connect(conString,function(err,client,pg_done){
      //raise internal error if connection failed
      if(err)
        return raiseInternalError(err,client,pg_done,next);
      //insert diet to the database
      client.query("INSERT INTO Person_diet (person_id,diet_id) VALUES($1,$2)",
        [req.user.person_id,req.body.diet_id],function(err,result){
            //raise internal error if insertion failed
            if(err)
              return raiseInternalError(err,client,pg_done,next);

            //release postgres client and redirect back to /account
            pg_done();
            req.flash('success',"New diet succesfully assigned!");
            res.redirect('/account');
        });
  });
};

/** Deletes diet from one's account
@param req - HTTP request
@param res - server response
@param next - callback for passing request to the next function
*/
var account_delete_diet_route = function(req,res,next){
  pg.connect(conString,function(err,client,pg_done){
      //raise internal error if connection failed
      if(err)
        return raiseInternalError(err,client,pg_done,next);
      //delete person_diet record from database
      client.query("DELETE FROM Person_diet WHERE person_id=$1 AND diet_id=$2",
        [req.user.person_id,req.params.id],function(err,result){
            //raise internal error if query failed
            if(err)
              return raiseInternalError(err,client,pg_done,next);

            //release postgres client and redirect back to /account
            pg_done();
            req.flash('success',"Succesfully deleted diet!");
            res.redirect('/account');
        });
  });
};

router.get('/account',account_get_route);
router.post('/account',account_post_route);
router.post('/account/diets',account_diets_route);
router.get('/account/diets/:id',account_delete_diet_route);

module.exports = router;