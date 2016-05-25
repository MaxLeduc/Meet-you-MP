var mpInfo = {

};

// apis (RCI = Represent Civic Information; OP = Open Parliament)
mpInfo.rciApiUrl = 'https://represent.opennorth.ca';
mpInfo.opApiUrl = 'http://api.openparliament.ca';

//variable for the postal code

mpInfo.postalCodeUser = [];

mpInfo.voteUrl = [];
mpInfo.ballots = [];
mpInfo.description = [];
mpInfo.counterBillObject = 0;
mpInfo.counter = 0;

//init - needs to listen to form submit, retrieve the information(postal code), them activates the getData function
mpInfo.init = function(){
	$('form').on('submit',function(e){
		e.preventDefault();
		//store the input from the user into a variable
		var postalCode = $("input[name=postalCode]").val();
		//postal code in uppercase for the query
		var postalCodeUser = postalCode.toUpperCase();
		console.log(postalCodeUser);
		$('.formWrapper form').css('display', 'none');
		$('.formWrapper').append("<img src='assets/images/ajax-loader.gif' alt='Loading...'>");
		mpInfo.checkPostalCode(postalCodeUser);
		mpInfo.voteUrl = [];
		mpInfo.ballotCasted = [];
		mpInfo.ballots = [];
		mpInfo.ballotDescription = [];
		mpInfo.counterBillObject = 0;
		mpInfo.counter = 0;
	});
};

mpInfo.checkPostalCode = function(postalCodeUser){
		var re = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i;
	    var confirmationPostal = re.exec(postalCodeUser);
	    if (confirmationPostal !== null){
	        mpInfo.getData(postalCodeUser);
	    }
	    else {
	    	alert('Not a valid postal code');
	    	$('.formWrapper form').css('display', 'flex');
	    	$('.formWrapper img').css('display', 'none');
	    }
	}

//with the form information the getData function finds the riding of the user, then runs the findMP function
//call argument postalCodeUser in function and replace in ajax request
mpInfo.getData = function(postalCodeUser){
	$.ajax({
		url:mpInfo.rciApiUrl + '/postcodes/' + postalCodeUser + '/?sets=federal-electoral-districts',
		method:'GET',
		dataType:'jsonp'
	})
	.then(function(location){
		// console.log(location);
		var mpDistrictName = location.boundaries_centroid[0].name;
		// console.log(mpDistrictName);
		mpInfo.findMP(mpDistrictName);
	});
};

//with the riding information, this function gets the MP object from RCI api and defines a variable for the mpLastName
//this variable will be used for the OP api
mpInfo.findMP = function(mpDistrict){
	$.ajax({
		url:mpInfo.rciApiUrl + '/representatives/house-of-commons/?district_name=' + mpDistrict,
		method:'GET',
		dataType:'jsonp'
	})
	.then(function(mpObject){
		// console.log(mpObject);
		var mpRCI = mpObject.objects[0];
		var mpLastName = mpObject.objects[0].last_name;
		// console.log(mpLastName);
		mpInfo.runRCI(mpRCI);
		mpInfo.getDataOP(mpLastName);
	})
};

//with the mpObject selected, we retrieve a bunch of information about the MP from the RCI
mpInfo.runRCI = function(selectedMP){
	var image = $('<img>').attr('src', selectedMP.photo_url);
	// console.log(image);

	//image in a figure
	var imageFigure = $('<figure>').append(image);

	var name = $('<li>').append('<span>Name: </span>' + selectedMP.name);
	// console.log(name);

	//for the favorite word
	$('#mpNameWord').html('Is the word <span class="orange">' + selectedMP.name + '</span> says most often when addressing the House')

	var email = $('<li>').append('<span>Email: </span>' + selectedMP.email);
	// console.log(email);

	var riding = $('<li>').append('<span> Riding: </span>' + selectedMP.district_name)
							.attr('id', 'riding');
	// console.log(riding);

	//putting mp info in a ul
	var mpInfo = $('<ul>').append(name, riding, email)
							.addClass('listInfo');

	//empty mpPersonnalInfo
	//adding everything in the mpPersonnalInfo div
	$('.mpPersonnalInfo').empty();
	$(".mpPersonnalInfo").append(imageFigure, mpInfo);

	var hillOffice = selectedMP.offices[0];
	// console.log(hillOffice);

	//organizing the offices adresses in li that we will then
	//add to newly created ul, inside a detail tag
	//we will also create a 'summary'
	var hillOfficeFax = $('<li>').append('Fax: ' + hillOffice.fax);
	// console.log(hillOfficefax);

	var hillOfficeAdress = $('<li>').append('Adress: ' + hillOffice.postal);
	// console.log(hillOfficeAdress);

	var hillOfficeTel = $('<li>').append('Telephone: ' + hillOffice.tel);
	// console.log(hillOfficePhone);

	var hillOfficeList = $('<ul>').append(hillOfficeAdress, hillOfficeTel, hillOfficeFax);

	var hillOfficeSummary = $('<h5>').append('Hill Office');

	var hillOfficeDetail = $('<div>').append(hillOfficeSummary, hillOfficeList);
	// console.log(hillOfficeDetail);

	var constituencyOffice = selectedMP.offices[1];
	// console.log(constituencyOffice);

	var constituencyOfficeFax = $('<li>').text('Fax: ' + constituencyOffice.fax);
	// console.log(constituencyOfficeFax);

	var constituencyOfficeAdress = $('<li>').text('Adress: ' + constituencyOffice.postal);
	// console.log(constituencyOfficeAdress);

	var constituencyOfficeTel = $('<li>').text('Telephone: ' + constituencyOffice.tel);
	// console.log(constituencyOfficeTel);

	var constituencyOfficeList = $('<ul>').append(constituencyOfficeAdress, constituencyOfficeTel, constituencyOfficeFax);

	var constituencyOfficeSummary = $('<h5>').text('Constituency Office');

	var constituencyOfficeDetail = $('<div>').append(constituencyOfficeSummary, constituencyOfficeList);
	// console.log(hillOfficeDetail);

	//empty contact info and add currentMp info
	$('.mpContactInfo').empty();
	$('.mpContactInfo').append(constituencyOfficeDetail, hillOfficeDetail);
}

// with the last name from the RCI api, we get the full name of the MP (without accents) from the OP api
//we then get access to the mpObject in the OP API
mpInfo.getDataOP = function(mpName){
	$.ajax({
		url:mpInfo.opApiUrl + '/politicians/?family_name=' + mpName + '&format=json',
		method:'GET',
		dataType:'json'
	})
	.then(function(mpUrl){
		// console.log(mpUrl);
		var opMPUrl = mpUrl.objects[0].url;
		$.ajax({
			url:mpInfo.opApiUrl + opMPUrl,
			method:'GET',
			dataType:'json'
		})
		.then(function(mpObject){
			// console.log(mpObject);
			mpInfo.runOP(mpObject);
		});
	});
};

//we set a bunch of variables with the information we need from the OP api
mpInfo.runOP = function(mpObject){
	var memberships = mpObject.memberships[0];

	var party = $('<li>').append('<span>Political affiliation: </span>' + memberships.party.name.en);
	console.log(memberships.party.name.en);
	// adds party information to the ul (in the second place - so after 0)
	$('.listInfo li:eq(0)').after(party);

	var province = memberships.riding.province;
	console.log(province);
	//add the province to the riding li
	$('#riding').append(' (' + province + ")");

	var favoriteWord = $('<h2>').text(mpObject.other_info.favourite_word[0].toUpperCase());
	// console.log(favoriteWord);
	//add favorite word
	$('.word').empty();
	$('.word').append(favoriteWord);

	var twitter = mpObject.other_info.twitter[0];
	// console.log(twitter);

	//add the twitter handle to the twitter widget
	// $('.twitterFeed').empty();

	$('.twitterFeed').empty();
	mpInfo.twitterWidget(twitter);

	//gets the Url for mp vote ballot
	var ballotsUrl = mpObject.related.ballots_url;
	// console.log(ballotsUrl);

	mpInfo.mpBallots(ballotsUrl);
	console.log(ballotsUrl);

	//gets url for the mp speeches
	var speechesUrl = mpObject.related.speeches_url;
	// console.log(speechesUrl);
	$('.mpProfile').css('display', 'block');
	$('.favoriteWord').css('display', 'flex');
};

//twitter

mpInfo.twitterWidget = function(twitter){

	var twitterTimeline = $('<a>').attr('href', 'https://twitter.com/')
								.attr('height', '550')
								.attr('data-widget-id', '733036787203858432')
								.addClass('twitter-timeline')
								.attr('data-screen-name', twitter);

	$('.twitterFeed').append(twitterTimeline);

	// console.log(twitterTimeline);
	mpInfo.Twitter(twitter);
	
}

mpInfo.Twitter = function(){
// console.log('creating embed')

	window.twttr = (function(d, s, id) {
	  var js, fjs = d.getElementsByTagName(s)[0],
	    t = window.twttr || {};
	  js = d.createElement(s);
	  js.id = id;
	  js.src = "https://platform.twitter.com/widgets.js";
	  fjs.parentNode.insertBefore(js, fjs);
	 
	  t._e = [];
	  t.ready = function(f) {
	    t._e.push(f);
	  };
	 
	  return t;
	}(document, "script", "twitter-wjs"));
}

//next button to get ballots and speeches

mpInfo.mpBallots = function(ballotsUrl){
	console.log(ballotsUrl);
	//emptying all arrays and the vote articles before running the calls.
	$('.vote0').empty();
	$('.vote1').empty();
	$('.vote2').empty();
	mpInfo.counter = 0;

	$.ajax({
		url:mpInfo.opApiUrl + ballotsUrl,
		method:'GET',
		dataType:'json',
		async:false
	}).then(function(ballotsObject){
		// console.log(ballotsObject);
		var ballotsArray = ballotsObject.objects;
		console.log(ballotsObject.objects);
		// console.log(ballotsArray);
		//for loops is looping the first three objects of the array and retrieves the
		//mp ballot and the url to access the details of the bill
		for (i = 0; i < 3; i++) {
			var billUrl = ballotsArray[i].vote_url;
			console.log(billUrl);
			var ballotCasted = ballotsArray[i].ballot;
			mpInfo.ballots.push(ballotCasted);
			// console.log(mpInfo.ballots);
			mpInfo.voteUrl.push(billUrl);
			console.log(mpInfo.voteUrl[0], mpInfo.voteUrl[1], mpInfo.voteUrl[2]);
			mpInfo.getBillData();
		};
	});
};

mpInfo.getBillData = function(){
	//use the urls in the array to pass three calls to get the 'bill' object in which the description
	//and the outcome of the vote are located in
		if (mpInfo.counterBillObject < 2) {
		mpInfo.counterBillObject++;
		// console.log(mpInfo.counterBillObject);
		// console.log(mpInfo.voteUrl[0], mpInfo.voteUrl[1], mpInfo.voteUrl[2]);
	} else {
		for (i=0; i < 3; i++){
			console.log(i);
			console.log(mpInfo.voteUrl[i])
		$.ajax({
			url:mpInfo.opApiUrl + mpInfo.voteUrl[i],
			method:'GET',
			dataType:'json',
			async:false
		}).then(function(billObject){
			console.log(billObject);
			console.log(mpInfo.voteUrl[0], mpInfo.voteUrl[1], mpInfo.voteUrl[2]);
			//storing the 3 different objects in the description thing
			mpInfo.description.push(billObject);
			// console.log(mpInfo.description);
			//calling the displayVote function
			// console.log(billObject);
			mpInfo.displayVote();
			});
		};
	};
};

//the counter is there to deny the display vote function to be called too soon
//before the objects are actually in the array

mpInfo.displayVote = function(){
	if (mpInfo.counter < 2) {
		mpInfo.counter++;
		// console.log(mpInfo.counter);
	} else {
		for(i = 0; i < 3; i++){
			var ballotCasted = $('<h4>').append('<span class="voteSpan">Vote casted:</span> ' + mpInfo.ballots[i]);
			var ballotD = $('<h3>').append('Issue');
			var ballotDescription = $('<p>').append(mpInfo.description[i].description.en);
			var ballotResult = $('<h4>').append('<span class="voteSpan">Result:</span> ' + mpInfo.description[i].result);
			var ballotDate = $('<h4>').append('<span class="voteSpan">Date:</span> ' + mpInfo.description[i].date);
			// console.log(mpInfo.description[i]);
			var articleClass = ".vote" + [i];
			var articleIssue = $('<div>').append(ballotD, ballotDescription)
											.addClass('description');
			var articleAside = $('<aside>').append(ballotDate, ballotCasted, ballotResult);
			// console.log(articleClass);
			$(articleClass).append(articleIssue, articleAside);
			$('section.votes').css('display', 'block');
			$('.formWrapper form').css('display', 'flex');
			$('.formWrapper img').css('display', 'none');
			$('html, body').animate({
				scrollTop: $('#mpProfile').offset().top
			}, 1000);
		}
	}
}

$(document).ready(function(){
	mpInfo.init();
});