var error = function(str) {
	$('.error').empty();
	$('.error').html(str);
	$('.error').show();
};
var success = function(str) {
	$('.success').empty();
	$('.success').html(str);
	$('.success').show();
}

var Gdata = {};
Gdata.lists = [];

var populateLists = function() {
	var finish = function() {
		for(i in Gdata.lists) {
			$('form#sendFile select').append('<option>'+Gdata.lists[i].name+'</option>');
		}
	}
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
}
$(document).ready(function() {
	populateLists();

	$('.error').click(function() { $(this).hide() });
	$('.success').click(function() { $(this).hide() });
	// $('.appView#login').show();
	$('.appView#main').show();
	$('form#loginForm').submit(function(e) {
		e.preventDefault();
		$('.appView').hide();
		$('.appView#loader').show();
		$.post( "http://localhost:8888/login",{ username: $('form#loginForm input[name="username"]').val(), password: $('form#loginForm input[name="password"]').val() },function(data) {
			if(data == 'success') {
				$('.appView').hide();
				$('.appView#main').show();
			} else {
				error('Those credentials did not work');
			}
		});
	});
	$('form#sendFile').submit(function(e) {
		e.preventDefault();
		$('.appView').hide();
		$('.appView#loader').show();
		var formData = new FormData($('form#sendFile')[0]);

		var usernames = $('form#sendFile select').val();
		for(i in Gdata.lists) {
			if(Gdata.lists[i].name == usernames) {
				usernames = Gdata.lists[i].rec_list;
			}
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
});