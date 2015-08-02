
var libs = process.cwd() + '/libs/';
var Social = require('heha-gateway-model')('social');
var User = require('heha-gateway-model')('user');
var crypto = require('crypto');
var social_raw={};
var social_info={};
module.exports = function() {

};
//call by app.js before getting accesstoken
module.exports.registerOrLogin = function(req, res, next) {
	social_raw=JSON.parse(req.body.social_info);
	switch (req.body.social){
		case "weibo":
			extractWeiboProfile(social_raw);
			break;
		case "wechat":
			extractWechatProfile(social_raw);
			break;
	}
	//check whether this weibo id is already registered
	checkSocialInfoExists(function(err,social){
		if(!social){	//create new user and social record
        	createHeHaUser(function(user){
        		createSocialInfo(user.id,function(){
			        req.body.username=user.username;
			        req.body.password=user.username;
			        global.current_user=user; 
        			next();
        		});
        	});
		}else{	//use old user record
			getHeHaUserByUid(social.heha_uid,function(user){
		        req.body.username=user.username;
		        req.body.password=user.username;
			        global.current_user=user; 
				next();
			});
		}
	});


	function extractWeiboProfile(raw){
		social_info.platform="weibo";
		social_info.uid=raw.id;
		social_info.picture=raw.profile_image_url;
		social_info.username=raw.platform;
	}
	function extractWechatProfile(raw){
		social_info.platform="wechat";
		social_info.uid=raw.openid;
		social_info.picture=raw.headimgurl;
		social_info.username=raw.nickname;
	}

    function checkSocialInfoExists(next){
		Social.findOne({
			platform:social_info.platform,
			social_uid:social_info.uid
		},function(err,social){
	        if (err) { 
				next(err);
	        }
			next(null,social);
		});
    }

    function createHeHaUser(next){
        var newUser = new User();
        newUser.username= crypto.randomBytes(32).toString('hex');
        newUser.password= newUser.username;
        var social={};
        social[social_info.platform]=social_info;
        newUser.social=social;
        newUser.save(function(err) {
            if (err){
            	console.log(err);
                return next(err);
            }
	        req.body.username=newUser.username;
	        req.body.password=newUser.password;
            return next(newUser);
        });
    }
    function createSocialInfo(uid, next){
    	var newSocial = new Social();
    	newSocial.heha_uid=uid;
    	newSocial.social_uid=social_info.uid;
    	newSocial.platform=social_info.platform;
    	newSocial.raw=social_raw;
    	newSocial.save(function(err){
            if (err){
            	console.log(err);
                return next(err);
            }
            return next();
    	});
    }
    function getHeHaUserByUid(uid, next){
	    User.findById(uid, function(err, user) {
	        if (err) { 
	        	next(err); 
	        }
	        if (!user) {
	        }else{
	        	next(user);
	        }
	    });
    }
}
//call by oauth2.js after getting accesstoken
module.exports.getSocialByUid = function(uid,next) {	
	User.findById(uid,function(err,user){
		next(user.social);
	});
}

