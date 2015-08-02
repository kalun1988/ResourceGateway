





////////////////////////////////////
////USED for web 3rd party login////
////////////////////////////////////
////NOT USE IT in MVP1//////////////







var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var SinaStrategy = require('passport-sina').Strategy;

var libs = process.cwd() + '/libs/';

var config = require(libs + 'config');


var Social = require('heha-gateway-model')('social');
var User = require('heha-gateway-model')('user');
var Client = require('heha-gateway-model')('client');
var AccessToken = require('heha-gateway-model')('accessToken');
var RefreshToken = require('heha-gateway-model')('refreshToken');

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


passport.use(new BasicStrategy(
    function(username, password, done) {
        Client.findOne({ clientId: username }, function(err, client) {
            if (err) { 
            	return done(err); 
            }

            if (!client) { 
            	return done(null, false); 
            }

            if (client.clientSecret !== password) { 
            	return done(null, false); 
            }

            return done(null, client);
        });
    }
));

passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
        Client.findOne({ clientId: clientId }, function(err, client) {
            if (err) { 
            	return done(err); 
            }

            if (!client) { 
            	return done(null, false); 
            }

            if (client.clientSecret !== clientSecret) { 
            	return done(null, false); 
            }

            return done(null, client);
        });
    }
));

passport.use(new BearerStrategy(
    function(accessToken, done) {
        AccessToken.findOne({ token: accessToken }, function(err, token) {

            if (err) { 
            	return done(err); 
            }

            if (!token) { 
            	return done(null, { error: 'invaild_or_expiried_accesstoken' }); 
            }
            //ttl changed to handle by MongoDB, by adding index expireAfterSeconds in accessToken model
            // if( Math.round((Date.now()-token.created)/1000) > config.get('security:tokenLife') ) {

            //     AccessToken.remove({ token: accessToken }, function (err) {
            //         if (err) {
            //         	return done(err);
            //         } 
            //     });

            //     return done(null, false, { message: 'Token expired' });
            // }

            User.findById(token.userId, function(err, user) {
            
                if (err) { 
                	return done(err); 
                }

                if (!user) { 
                	return done(null,{ error: 'unknown_user' }); 
                }

                var info = { scope: '*' };
                done(null, user, info);
            });
        });
    }
));

//start of register heha

//end of register heha


  passport.use(new SinaStrategy({

        clientID        : config.get('social:weibo:clientId'),
        clientSecret    : config.get('social:weibo:clientSecret'),
        callbackURL     : config.get('social:weibo:callbackURL'),
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function() {
            // check if the user is already logged in
            User.findOne({ 'social.weibo.id' : profile.id }, function(err, user) {
                if (err)
                    return done(err);
                if (user) {
                        saveUser(user, profile, token, done);
                        //handle login with / connect
                    // if there is a user id already but no token (user was linked at one point and then removed)
                    // if (!user.weibo.token) {
                    //     saveUser(user, profile, token, done);
                    // }else{
                    //     updateUser(user, profile, token, done);
                    // }

                    // return done(null, user);
                } else {
                    var newUser          = new User();
                    saveUser(newUser, profile, token, done);
                }
            });
            createAndSaveRaw(profile, token);
        });

    }));
    function createAndSaveRaw(profile, token){
        Social.findOne({ 'profile.id' : profile.id }, function(err, social) {
            // if (err)
            //     return done(err);
            if (social) {
                social.profile = profile;
                social.save(function(err) {
                    // if (err)
                    //     return done(err);
                    // done(profile, token, done)
                });
            } else {
                var newSocial          = new Social();
                newSocial.type = "weibo";
                newSocial.profile = profile;
                newSocial.save(function(err) {
                    // if (err)
                    //     return done(err);
                    // done(profile, token, done)
                });
            }
        });
    }

    //follow scheme in user model
    function saveUser(user, profile, token, done){
        user.username="weibo"+profile.id;
        user.password="weibo"+profile.id;
        var social={};
        social.weibo={
                id:profile.id,
                token:token,
                name:profile.name,
                picture:profile.profile_image_url
            };
        user.social=social;
        user.save(function(err) {
            if (err)
                return done(err);
            return done(null, user);
        });
    }