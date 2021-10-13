export { getPeopleData };

// Looks through the whole page for all the people pictures and data
function getPeopleData() {
	console.log(`getPeoplePictures - START`);
	let result = {
		'selected': {
			'fullName': '',
			'alias': '',
			'imgData': ''
		},
		'above': [],
		'below': []
	};

	/*
		Get data from the currently selected person's card
	*/
	let selectedPerson = document.querySelectorAll('div[aria-label^="Information about"]')[0];
	result.selected.fullName = selectedPerson.getAttribute('aria-label').split('Information about ')[1];
	result.selected.alias = selectedPerson.querySelectorAll('div[class^="emailAlias"]')[0].innerHTML;
	result.selected.alias = result.selected.alias.substr(1,result.selected.alias.length-2);
	result.selected.imgData = selectedPerson.querySelector('.ms-Image-image').getAttribute('src');
	console.log(result.selected);


	/*
		Get the upstream management chain cards
	*/
	let aboveSelectedPerson = document.querySelectorAll('div[aria-label*="Manager"]')[0];
	aboveSelectedPerson = aboveSelectedPerson.querySelectorAll('a[href*="/Org/"]');
	console.log(aboveSelectedPerson);

	aboveSelectedPerson.forEach(elem => {
		result.above.push(getDataFromPeopleNode(elem));
	});


	/*
		Get the currently selected person's team cards
	*/
	let belowSelectedPerson = document.querySelectorAll('div[class*="personDirectsView"]')[0];
	belowSelectedPerson = belowSelectedPerson.querySelectorAll('a[href*="/Org/"]');
	console.log(belowSelectedPerson);

	belowSelectedPerson.forEach(elem => {
		result.below.push(getDataFromPeopleNode(elem));
	});


	// Given a single person's card, get name, alias, and picture data from it
	function getDataFromPeopleNode(node){
		let alias = node.getAttribute('href').split('/Org/')[1];
		let data = node.querySelector('.ms-Image-image');
		let imgData = data.getAttribute('src');
		let fullName = data.getAttribute('alt').split('Profile picture of ')[1];
	
		console.log(`Full name: ${fullName} alias: ${alias} imgData: ${imgData}`);
		
		return {
			'alias': alias,
			'fullName': fullName,
			'imgData': imgData
		};
	}

	console.log(`getPeoplePictures - END`);
	chrome.runtime.sendMessage(JSON.stringify(result));
}



