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
$(document).ready(function() {
	$('.error').click(function() { $(this).hide() });
	$('.success').click(function() { $(this).hide() });
	$('.appView#login').show();
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
});