var Q = require('q')
,  sc = require('./lib/snapchat')
,  client = new sc.Client()
,  fs = require('fs')
,util = require('util'),
express = require('express'),
request = require('request'),
storage = require('node-persist');
var mime = require('mime');

storage.initSync();

var constants = {
	username: '',
	password: ''
};

var isVideo = false;
var busy = 0;
var loggedIn = false;

//LIB


var getUserData = function(callback) {
	client.login(constants.username,constants.password).then(function(data) {
		callback(data);
	});
};
var download = function(callback) {
	client.login(constants.username,constants.password).then(function(data) {
		// Handle any problems, such as wrong password
		if (typeof data.snaps === 'undefined') {
			console.log(data);
			return;
		}


		var auth_token = data.auth_token;
		var i = 0;
		var max = data.snaps.length;
		var last = false;
		var updates = {};

		if(max == 0) {
			callback('nosnaps');
		} else {
			var check = function() {
				if(last == true) {
					last = false; // prevent this from firing off 99999 times
					client.sync(
						constants.username, 
						auth_token, 
						JSON.stringify(updates),
						function(data){
							console.log('synced data');
							callback('success');
						}
					); 
				}
			}

			var existingFiles = [];
			fs.readdir(__dirname+'/content/snaps/'+constants.username+'/', function(err,files) {
				files = files.filter(function(file) {
					return file.indexOf('.jpg') !== -1;
				});

				existingFiles = files;

				// Loop through the latest snaps
				data.snaps.forEach(function(snap) {
					if(i+1 == max) last = true;
					else i++;

					var type = snap.id.split('').filter(function(character) { return [0,1,2,3,4,5,6,7,8,9].indexOf(parseInt(character)) == -1;  }).join('');
					// snap.id = snap.id.split('').filter(function(character) { return [0,1,2,3,4,5,6,7,8,9].indexOf(parseInt(character)) !== -1;  }).join('');

					if(type == 'r' && snap.m == 0 && snap.st == 1) {
						if(existingFiles.join('').indexOf(snap.id) == -1) {
							var saveImage = function(name) {
								updates[snap.id] = {
									t: new Date().getTime(),
									c: 2,
									replayed: 0
								}

								var stream = fs.createWriteStream(__dirname+'/content/snaps/'+constants.username+'/'+ name + '.jpg', { flags: 'w', encoding: null, mode: 0666 });
								client.getBlob(snap.id).then(function(blob) {
									blob.pipe(stream);
									blob.resume();
								}).then(function() {
									check();
								});
							}

							if(typeof snap.t !== 'undefined' && typeof snap.sn !== 'undefined') {
								console.log('Saving snap from ' + snap.sn + '...');
								saveImage(snap.sn + '_' + snap.id);
							} else {
								if(snap.rp && snap.st !== 2) {
									console.log('you have a snap that is pending for '+snap.rp);
									saveImage(snap.rp + '_' + snap.id);
								} else {
									check();
								}
							}
						} else {
							check();
						}
					} else {
						check();
					}
				});
			});
		}
	});
}

var upload = function(time,filename,fileData,recipients,callback) {
	client.login(constants.username, constants.password).then(function() {
			console.log('test');
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
					console.log(file);

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
	});
});

app.get("/readImages",function(req,res) {
	if(loggedIn == true) {
		var continueDown = function() {
			fs.readdir(__dirname+'/content/snaps/'+constants.username+'/', function(err,files) {
				if(err) {
					res.send(err);
				} else {
					files = files.filter(function(file) {
						return file.indexOf('.jpg') !== -1;
					});
					res.send({dir:'/snaps/'+constants.username+'/',data:files});
				}
			});
		}
		continueDown();
	} else {
		res.send(false)
	}
});

app.get("/readUserData",function(req,res) {
	if(loggedIn == true) {
		getUserData(function(data) {
			res.send(data);
		});
	} else {
		res.send(false)
	}
});

app.use("/login",function(req,res) {
	if(typeof req.body.username !== 'undefined' && typeof req.body.password !== 'undefined') {
		client.login(req.body.username,req.body.password).then(function(data) {
			res.send('success');
			loggedIn = true;
			constants.username = req.body.username;
			constants.password = req.body.password;
			// Make sure the images folder exists
			if(!fs.existsSync(__dirname+'/content/snaps/'+constants.username)) {
				fs.mkdir(__dirname+'/content/snaps/'+constants.username);
			}

		}, function(err) {
			res.send('fail');
		});

		//refresh snaps as often as possible

		var state = 0;
		setInterval(function() {
			if(state == 0) {
				state = 1;
				download(function() {
					state = 0;
				});
			}
		},5000);

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



app.use(express.static(__dirname + '/content'));

app.listen(port);
console.log('Started node snapchat-server @ port: '+port);