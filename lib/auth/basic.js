/**
 * Default setup module.
 */
var defaults = require('../defaults');

/**
 * htpasswd module.
 */
var htpasswd = require('htpasswd');

/**
 * Utility module.
 */
var utils = require('../utils');

/**
 * Exporting module.
 */
module.exports = Basic;

/**
 * Basic Access Authentication.
 *
 * @param {String} authRealm authentication realm.
 * @param {Array} authUsers array of users.
 */
function Basic(authRealm, authUsers) {
	// Realm.
	this.realm = authRealm;
	// Users.
	this.users = authUsers;
	
	// Used for async callback.
	var self = this;
	
	/**
	 * Applies basic authentication and calls next after user is authenticated.
	 *
	 * @param {Request} request HTTP request object.
	 * @param {Response} response HTTP response object.
	 * @param {Function} next function that will be called after user is authenticated.
	 */
	this.apply = function(request, response, next) {
		var authenticated = self.isAuthenticated(request);
		if(!authenticated) {
			self.ask(response);
		} else {
			next();
		}
	}
};

/**
 * Checks authorization header in request.
 *
 * @param {Request} request HTTP request object.
 * @return {Boolean} true if is authenticated, else false.
 */
Basic.prototype.isAuthenticated = function(request) {
	var authenticated = false;

	// If header exists.
	if("authorization" in request.headers) {
		var header = request.headers.authorization;
		var user = header.split(" ")[1];

		// Searching for user in user list.
		if(user) {			
			for(var i = 0; i < this.users.length; ++i) {
				var passwordHash = this.users[i].split(":")[1];
				var password = utils.decodeBase64(user).split(":")[1];				

                if(passwordHash && typeof passwordHash === 'string')  {
                    if(htpasswd.validate(passwordHash, password)) {
                        authenticated = true;
                        break;
                    }
                }
			}			
		}
	}

	return authenticated;
};
/**
 * Asks client for authentication.
 *
 * @param {Response} response HTTP response object.
 */
Basic.prototype.ask = function(response) {
	var header = "Basic realm=\"" + this.realm + "\"";

	response.setHeader("WWW-Authenticate", header);
	response.writeHead(401);
	response.end(defaults.HTML_401);
};