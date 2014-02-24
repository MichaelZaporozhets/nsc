var error = function(str) {
	$('.error,.success').hide();

	$('.error').empty();
	$('.error').html(str);
	$('.error').show();
};
var success = function(str) {
	$('.error,.success').hide();

	$('.success').empty();
	$('.success').html(str);
	$('.success').show();
}

var Gdata = {};
Gdata.lists = [];

var populateLists = function() {
	var finish = function() {
		$('select').empty();
		for(i in Gdata.lists) {
			$('select').append('<option>'+Gdata.lists[i].name+'</option>');
			if(i == Gdata.lists.length-1) {
				$('.appView#main .parts .section#lists select').trigger('change');
			}
		}
		$('form#sendFile select').append('<option>Username</option>');
	}
	$.get('http://localhost:8888/readUserData',function(data) {
		console.log(data);
		var list = '';
		for(i in data.friends) {
			list = list + data.friends[i].name+','
		};

		var obj = {
			name: 'friends',
			rec_list: list.trim().split(',')
		}
		Gdata.lists.push(obj);
		$.get('../lists/set.txt',function(data) {
			var lists = data.trim().split(',');
			for(i in lists) {
				if(lists[i].length > 0) {
					var name = lists[i];
					$.get('../lists/'+lists[i],function(data) {
						var obj = {
							name: name,
							rec_list: data.trim().split(',')
						}
						Gdata.lists.push(obj);
						if(i == lists.length-1) {
							finish();
						}
					});
				}
			}
		});
	});
}
var populateSnaps = function() {
	$.get( "http://localhost:8888/readImages",function(data) {

		var dir = data.dir;
		var data = data.data;


		$('.appView#main .parts .section#receive ul').empty();
		for(i in data) {
			$('.appView#main .parts .section#receive ul').append('<li><img src="'+dir+data[i]+'" /></li>');
		}

	});
};
var a = '';
$(document).ready(function() {
	$('.logout').click(function() {
		$('.appView').hide();
		$('.appView#login').show();
		$(this).hide();
		Gdata.lists = [];
	});
	$('.error').click(function() { $(this).hide() });
	$('.success').click(function() { $(this).hide() });
	$('.appView#login').show();
	// $('.appView#main').show();
	$('form#loginForm').submit(function(e) {
		e.preventDefault();
		$('.appView').hide();
		$('.appView#loader').show();
		$.post( "http://localhost:8888/login",{ username: $('form#loginForm input[name="username"]').val(), password: $('form#loginForm input[name="password"]').val() },function(data) {
			if(data == 'success') {
				success('logged in successfuly :)');
				$('.appView').hide();
				$('.appView#main').show();
				$('.logout').show();
				populateSnaps();
				populateLists();
			} else {
				error('Those credentials did not work');
				$('.appView').hide();
				$('.appView#login').show();
			}
		});
	});
	$('form#sendFile').submit(function(e) {
		e.preventDefault();
		$('.appView').hide();
		$('.appView#loader').show();
		var formData = new FormData($('form#sendFile')[0]);

		var usernames = $('form#sendFile select').val();
		if(usernames !== 'Username') {
			for(i in Gdata.lists) {
				if(Gdata.lists[i].name == usernames) {
					usernames = Gdata.lists[i].rec_list;
				}
			}
		} else {
			usernames = [$('form#sendFile input.user_spec').val()];
		}

		formData.append("usernames", usernames.join(','));

		$.ajax({
			url: 'http://localhost:8888/sendFile/',  //Server script to process data
			type: 'POST',
			xhr: function() {  // Custom XMLHttpRequest
				var myXhr = $.ajaxSettings.xhr();
				if(myXhr.upload){ // Check if upload property exists
					console.log('upload works')
				}
				return myXhr;
			},
			success: function(data) {
				$('.appView').hide();
				$('.appView#main').show();
				if(data == 'success') {
					success('Sent!');
				} else {
					error('There was an error');
				}
			},
			data: formData,
			//Options to tell jQuery not to process data or worry about content-type.
			cache: false,
			contentType: false,
			processData: false
		});
	});

	$('.appView#main ul.menu li').click(function() {
		$(this).siblings().removeClass('cur');
		$(this).addClass('cur');
		$('.appView#main .parts .section').removeClass('current');
		var where = $(this).text().toLowerCase();
		$('.appView#main .parts .section#'+where).addClass('current');
	});
	$('.appView#main ul.menu li:eq(0)').click();


	$('.appView#main .parts .section#receive button.get').click(function(e) {
		e.preventDefault();
		$('.appView').hide();
		$('.appView#loader').show();
		$.get( "http://localhost:8888/download",function(data) {
			if(data == 'success') {
				success('Downloaded latest snaps successfuly :)');
				populateSnaps();
			} else {
				error('No New Snaps');
				populateSnaps();
			}
			$('.appView').hide();
			$('.appView#main').show();
		});
	});
	$('.appView#main .parts .section#receive button.refresh').click(function(e) {
		populateSnaps();
	});

	$('.appView#main .parts .section#lists select').change(function() {
		var whichList = $('.appView#main .parts .section#lists select').val();
		for(i in Gdata.lists) {
			if(Gdata.lists[i].name == whichList) {
				whichList = Gdata.lists[i].rec_list;
			}
		}
		$('.appView#main .parts .section#lists ul').empty();
		for(i in whichList) {
			$('.appView#main .parts .section#lists ul').append('<li>'+whichList[i]+'</li>');
		}
	});

	$('form#sendFile select').change(function() {
		if($('form#sendFile select').val() == 'Username') {
			$('.user_spec').show();
		} else {
			$('.user_spec').hide();
		}
	});


	campaignRouter = function(action,data) {
		var ajaxObj = {};
		try
		{
			switch(action) {
				case 'new' :
					ajaxObj.action = 'new';
					ajaxObj.data = data;
				break;
				case 'select' :
					ajaxObj.action = 'select';
					ajaxObj.data = data;
				break;
				case 'send':
					ajaxObj.action = 'send';
					ajaxObj.data = data;
				break;
				case 'delete':
					ajaxObj.action = 'delete';
					ajaxObj.data = data;
				break;
				default: // list all
					ajaxObj.action = '';
				break;
			}
			$.post('http://localhost:8888/campaign',ajaxObj,function(data) {
				console.log(data)
			});
		}
		catch(err)
		{
			console.log(err);	
		}
	}

	test = function() {
		campaignRouter('new',{
			name : 'test',
			list : 'someone'
		});
	}
});