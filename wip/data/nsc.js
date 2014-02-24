var Q = require('q')
,  sc = require('./lib/snapchat')
,  client = new sc.Client()
,  fs = require('fs')
,util = require('util'),
express = require('express'),
request = require('request'),
storage = require('node-persist');

storage.initSync();

var constants = {
	username: 'edelman_aus',
	password: 'Edelman00'
};

var isVideo = false;
var busy = 0;


//LIB


var getUserData = function(callback) {
	client.login(constants.username,constants.password).then(function(data) {
		callback(data);
	});
};
var download = function(callback) {
	client.login(constants.username,constants.password).then(function(data) {
		console.log('successfully logged in with username: ' + constants.username);
		// Handle any problems, such as wrong password
		if (typeof data.snaps === 'undefined') {
			console.log(data);
			return;
		}
		var i = 0;
		var max = data.snaps.length;

		if(max == 0) {
			callback('nosnaps');
		} else {
			var last = false;
			var check = function() {
				if(last == true) {
					callback('success');
				} else {
					i++;
				}
			}
			// Loop through the latest snaps
			data.snaps.forEach(function(snap) {
				console.log(i+1 + '/' + max)
				if(i+1 == max) {
					last = true;
				}

				if(typeof snap.t !== 'undefined' && typeof snap.sn !== 'undefined') {
					console.log('Saving snap from ' + snap.sn + '...');
					var stream = fs.createWriteStream(__dirname+'/content/snaps/'+constants.username+'/'+ snap.sn+'_'+ snap.id + '.jpg', { flags: 'w', encoding: null, mode: 0666 });
					client.getBlob(snap.id).then(function(blob) {
						blob.pipe(stream);
						check();
						blob.resume();
					});
				} else {
					console.log('you have a snap that is pending for '+snap.rp);
					check();
					var stream = fs.createWriteStream(__dirname+'/content/snaps/'+constants.username+'/'+ snap.rp+'_'+ snap.id + '.png', { flags: 'w', encoding: null, mode: 0666 },function() {
						check();
					});
					client.getBlob(snap.id).then(function(blob) {
						blob.pipe(stream);
						check();
						blob.resume();
					});
				}
			});
		}
	});
}

var upload = function(time,filename,fileData,recipients,callback) {
	client.login(constants.username, constants.password).then(function() {
			console.log('successfully logged in with username: ' + constants.username);
			var blob = fileData;
			return client.upload(blob, isVideo);
		}, function(err) {
			console.error("Failed to login");
			console.error(err)
		})
		.then(function(mediaId) {
			return Q.allSettled(recipients.map(function(recipient) {
				if(isVideo)
					return client.send(mediaId, recipient).then(function(){
						callback();
					}).catch(function(err) {
						console.error("Failed to send snap to", recipient);
						console.error(err);
					});
				else
					return client.send(mediaId, recipient, time).then(function(){
						callback();
					}).catch(function(err) {
						console.error("Failed to send snap to", recipient);
						console.error(err);
					});
			}));
		}, function(error) {
			console.error("Unable to upload file", filename);
			console.error(error);
		})
		.then(function(statuses) {
			console.log("All done");
		}, function(err) {
			console.error("There was an error")
			console.error(err);
		});
};





//NEWLIB
var campaigns = {};
var campaignManager = function() {
	var saveChanges = function() {
		storage.setItem('campaigns',campaigns);
	}
	this.newCampaign = function(name,list,callback) {
		var response = {
			status : 'success',
			data : {}
		}
		console.log('name :' +name)
		if(typeof campaigns[name] == 'undefined') {
			list = '';
			var newCampaign = new Campaign(name,list);
			saveChanges();
			response.data = newCampaign.data();
			callback(response);
		} else {
			response.status = 'fail: that campaign name has already been used.';
			callback(response);
		}
	}
	this.duplicateCampaign = function(callback) {
		saveChanges();
	}
	this.listCampaigns = function(callback) {
		
	}
	this.getCampaign = function() {
		
	}
	this.editCampaign = function() {
		saveChanges();
	}
	this.deleteCampaign = function(callback) {
		var response = {
			status : 'success',
			data : {}
		}
		try {
			if(typeof campaigns[name] !== 'undefined') {
				campaigns[name].delete();
				callback(response);
				saveChanges();
			} else {
				throw "The campaign selected doesn't exist.";
			}
		} catch(err) {
			console.log(err);
			response.status = 'fail:'+err;
			callback(response);
		}
	}
	console.log('initialized campaign manager');
}
campaignManager = new campaignManager();
var Campaign = function(name,list) {
	var $$this = this;
	$$this.name = name;
	$$this.list = list;
	this.data = function() {
		var data = {
			meow : 'meow',
			name : $$this.name,
			list : $$this.list
		}
		return data;
	}
	this.remove = function() {
		campaigns[name];
	};
}




//NETCODE


var fs = require("fs");
var port = 8888;
var express = require("express");

var app = express();
app.use(app.router); //use both root and other routes below
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(__dirname + "/public")); //use static files in ROOT/public folder

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.use("/sendFile/",function(req,res) {
	if(req.method == 'POST') {
		if(req.body.isVideo == 'on') {
			isVideo = true;
		};

		try
		{
			//force catch if no data
			if(req.body.usernames !== '' && req.files.upload.name !== '') {
				//carry on chap
				var file = fs.createReadStream(req.files.upload.path);
				file.on('open', function () {
					var usernames = req.body.usernames;

					if(usernames.split(',').length > 1) {
						usernames = usernames.split(',');
					} else {
						usernames = [usernames];
					}

					upload('5',req.files.upload.name,file,usernames,function() {
						isVideo = false;
						res.send('success');
					});
				});
			} else {
				res.send('fail');
			}
		}
		catch(err)
		{
			res.send('fail');
		}
	} else {
		res.writeHead(200, {'content-type': 'text/html'});
		res.end(
		'<form action="" enctype="multipart/form-data" method="post">'+
		'<label>Recipient</label><br>'+
		'<input type="text" name="username"><br>'+
		'<label>File</label><br>'+
		'<input type="file" name="upload" multiple="multiple"><br>'+
		'<label>Is this a video?</label><br>'+
		'<input type="checkbox" name="isVideo"><br>'+
		'<input type="submit" value="Upload">'+
		'</form>'
		);
	}
});


app.get("/download",function(req,res) {
	download(function(log) {
		if(log == 'nosnaps') { console.log('no snaps to download') };
		res.send(log);
		console.log(log)
	});
});

app.get("/readImages",function(req,res) {
	var continueDown = function() {
		fs.readdir(__dirname+'/content/snaps/'+constants.username+'/', function(err,files) {
			if(err) {
				res.send(err);
			} else {
				res.send({dir:'/snaps/'+constants.username+'/',data:files});
			}
		});
	}
	continueDown();
});

app.get("/readUserData",function(req,res) {
	getUserData(function(data) {
		res.send(data);
	});
});

app.use("/login",function(req,res) {
	if(typeof req.body.username !== 'undefined' && typeof req.body.password !== 'undefined') {
		client.login(req.body.username,req.body.password).then(function() {
			res.send('success');
			constants.username = req.body.username;
			constants.password = req.body.password;
			// Make sure the images folder exists
			if(!fs.existsSync(__dirname+'/content/snaps/'+constants.username)) {
				fs.mkdir(__dirname+'/content/snaps/'+constants.username);
			}
		}, function(err) {
			res.send('fail');
		});
	} else {
		res.send('fail');
	}
});



app.use("/campaign/",function(req,res) {
	var action = req.body.action;
	switch(action) {
		case "new":
			campaignManager.newCampaign(req.body.data.name,req.body.data.list,function(response) {
				if(response.status == 'success') {
					res.send(response.data);
				} else {
					res.send(response);
				}
			});
		break;
		case "delete":
			campaignManager.deleteCampaign(name);
		break;
		default:
			campaignManager.listCampaigns(function(response) {
				if(response.status == 'success') {
					res.send(response.data);
				} else {
					res.send(response);
				}
			});
		break;
	}
});




app.listen(port);
console.log('Started node snapchat-server');
// downloader();