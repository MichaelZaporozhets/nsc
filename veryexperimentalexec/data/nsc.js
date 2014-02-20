var Q = require('q')
,  sc = require('./lib/snapchat')
,  client = new sc.Client()
,  fs = require('fs')
,util = require('util'),
express = require('express'),
request = require('request'),
nodecr = require('nodecr');



// Make sure the images folder exists
if(!fs.existsSync('./images')) {
    fs.mkdirSync('./images');
}


var constants = {
	username: 'edelman_aus',
	password: 'Edelman00'
};

var isVideo = false;

var busy = 0;
var download = function(callback) {
	client.login(constants.username,constants.password).then(function(data) {
		console.log('successfully logged in with username: ' + constants.username);
		// Handle any problems, such as wrong password
		if (typeof data.snaps === 'undefined') {
			console.log(data);
			return;
		}
		var i = 0;
		max = data.snaps.length;
		if(max == 0) {
			console.log('no snaps to download.');
			busy = 0;
		} else {
			var last = false;
			// Loop through the latest snaps
			data.snaps.forEach(function(snap) {
				i++;
				// Make sure the snap item is unopened and sent to you (not sent by you)
				if (typeof snap.sn !== 'undefined' && typeof snap.t !== 'undefined' && snap.st == 1) {
					console.log('Saving snap from ' + snap.sn + '...');
					console.log(i + '/' + max)
					if(i == max) {
						last = true;
					}
					// Save the image to ./images/{SENDER USERNAME}_{SNAP ID}.jpg
					var stream = fs.createWriteStream('./images/' + snap.sn + '_' + snap.id + '.jpg', { flags: 'w', encoding: null, mode: 0666 });
					client.getBlob(snap.id).then(function(blob) {
						blob.pipe(stream);

						if(last == true) {
							client.clear();
							callback();
						}
						blob.resume();
					});
				} else {
					if(i == max) {
						client.clear();
						callback();
					}
				}
			});
		}
	});
}
downloader = function() {
	setInterval(function() {
		if(busy == 0) {
			busy = 1;
			download(function() {
				busy = 0;
				console.log('downloaded all snaps..');
			});
		}
	},5000);
};

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
			if(req.body.username !== '' && req.body.password !== '' && req.files.upload.name !== '') {
				//carry on chap
				var file = fs.createReadStream(req.files.upload.path);
				file.on('open', function () {
					var username = req.body.username;
					upload('5',req.files.upload.name,file,[username],function() {
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


app.get("/download",function() {
	download(function() {
		res.send('success');
	});
});

app.use("/login",function(req,res) {
	if(typeof req.body.username !== 'undefined' && typeof req.body.password !== 'undefined') {
		client.login(req.body.username,req.body.password).then(function() {
			res.send('success');
		}, function(err) {
			res.send('fail');
		});
	} else {
		res.send('fail');
	}
});

app.listen(port);
console.log('Started node snapchat-server');
// downloader();