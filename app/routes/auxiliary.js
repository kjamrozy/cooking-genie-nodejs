/**Auxiliary function that raises internal error and passes it forward to the next nodejs middleware.
@param err - error info provided by node-postgres query/connection
@param client - instance of postgres client
@param pg_done - callback to return postgres client to the pool
@param next - nodejs middleware callback, to pass request next 
*/
var raiseInternalError = function(err,client,pg_done,next){
	pg_done();
	var error = new Error("Server internal error "+err);
	error.status = 500;
	next(error);
};

module.exports = raiseInternalError;