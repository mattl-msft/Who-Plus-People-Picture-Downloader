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
	let aboveSelectedPerson = document.querySelectorAll('div[aria-label*="Manager"]');

	// everyone should have upstream management chain, except Satya
	if(aboveSelectedPerson.length){
		aboveSelectedPerson = aboveSelectedPerson[0];
		aboveSelectedPerson = aboveSelectedPerson.querySelectorAll('a[href*="/Org/"]');
		console.log(aboveSelectedPerson);
		
		aboveSelectedPerson.forEach(elem => {
			result.above.push(getDataFromPeopleNode(elem));
		});
	}


	/*
		Get the currently selected person's team cards
	*/
	let belowSelectedPerson = document.querySelectorAll('div[class*="personDirectsView"]');

	// All ICs will be missing this section
	if(belowSelectedPerson.length){
		belowSelectedPerson = belowSelectedPerson[0];
		belowSelectedPerson = belowSelectedPerson.querySelectorAll('a[href*="/Org/"]');
		console.log(belowSelectedPerson);
		
		belowSelectedPerson.forEach(elem => {
			result.below.push(getDataFromPeopleNode(elem));
		});
	}


	// Given a single person's card, get name, alias, and picture data from it
	function getDataFromPeopleNode(node){
		console.log(node);
		let subNode;
		let personData = {
			'alias': '',
			'fullName': ''
		};

		// get Full Name
		subNode = node.querySelector('.ms-Persona-primaryText');
		personData.fullName = subNode.firstElementChild.textContent;

		// get Alias
		personData.alias = node.getAttribute('href').split('/Org/')[1].toLowerCase();;

		// get Photo or Initials
		subNode = node.querySelector('.ms-Image-image');
		if(subNode && subNode.getAttribute('src')){
			// has photo
			personData.imgData = subNode.getAttribute('src');
		} else {
			// only initials
			subNode = node.querySelector('.ms-Persona-initials');
			personData.initials = subNode.firstElementChild.textContent;
			personData.bgColor = window.getComputedStyle(subNode).backgroundColor;
		}

	
		console.log(`${personData.fullName} | ${personData.alias} | ${personData.imgData? personData.imgData : `${personData.initials} | ${personData.bgColor}`}`);
		
		return personData
	}

	console.log(`getPeoplePictures - END`);
	chrome.runtime.sendMessage(JSON.stringify(result));
}