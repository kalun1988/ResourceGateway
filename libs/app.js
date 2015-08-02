var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var methodOverride = require('method-override');
var restful = require('node-restful');
var flash    = require('connect-flash');
var session      = require('express-session');
var libs = process.cwd() + '/libs/';
require(libs + 'auth/auth');
var authUser  = require(libs + 'auth/user');
var config = require('./config');
var log = require('./log')(module);
var oauth2 = require('./auth/oauth2');
var api = require('./routes/api');
var httpProxy = require('http-proxy');
var apiProxy = new httpProxy.createProxyServer();
var app = express();



var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(cookieParser());
app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// app.use('/', api);
// app.use('/api', api);
//API PROXY
var checkAuth=function(req, res, next) {
  passport.authenticate('bearer', function(err, user, info) {
    if(!user){
        res.json({
            error:"invalid token"
        });
        return;
    }
    if(!user.error){
        req.query.uid=user.id;
        next();
    }else{
        res.json({
            error:user.error
        });
    }
  })(req, res, next);
}
app.get('/api/v1/members',checkAuth, function (req, res, next) { 
  apiProxy.web(req, res, { target: 'http://localhost:3000' });
});
app.get('/api/v1/me',checkAuth, function (req, res, next) { 
    res.redirect('http://localhost:3000/api/v1/members?_id='+req.query.uid);
});

module.exports = app;


