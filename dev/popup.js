// What to do every time the popup is opened
document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('bodyContent').innerHTML = '<i style="grid-column: span 3;">Getting people pictures...</i>';
	
	// So, this tabs.executeScript takes a code string :-\
	// 'getPeopleData' is defined below, then use fn.toString and call it in an IIFE
	chrome.tabs.executeScript({
		code: `
			(function () {
				${getPeopleData.toString()}
				getPeopleData();
			})();
			`
	});
});

function getPeopleData() {
	console.log(`getPeoplePictures - START`);
	let data = document.querySelectorAll('.ms-Image-image');
	let _imgData;
	let _fullName;
	let result = [];
	
	data.forEach(elem => {
		//getAttribute('src') blob:https://whoplus.microsoft.com/b078c6d5-23f7-4a8a-adc5-ff987a14b1a7
		//getAttribute('alt') Profile picture of Satya Nadella
		_imgData = elem.getAttribute('src');
		_fullName = elem.getAttribute('alt');
		console.log(`Full name: ${_fullName} with blob ${_imgData}`);
		if(_imgData && _fullName) {
			result.push({
				'imgData': _imgData,
				'fullName': _fullName.replace('Profile picture of ', '')
			});
		}
	});
	
	chrome.runtime.sendMessage(JSON.stringify(result));
	console.log(`getPeoplePictures - END`);
}

chrome.runtime.onMessage.addListener(function(message) {
	console.log(`POPUP Got Message`);
	console.log(message);	
	populatePeoplePicturesList(message);
});

function populatePeoplePicturesList(list) {
	console.log(`populatePeoplePicturesList - START`);
	let people = JSON.parse(list);
	console.log(people);

	if(people.length) {
		let bodyContent = `
			<div class="headerRow">
				<span id="topTitle">Found ${people.length} people</span>
				<button id="openInfo"><span>
					<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px"
						height="14px" viewBox="0 0 14 14" style="enable-background:new 0 0 14 14;" xml:space="preserve">
					<path d="M7,0C3.1,0,0,3.1,0,7c0,3.9,3.1,7,7,7s7-3.1,7-7C14,3.1,10.9,0,7,0z M8,12H6V6h2V12z M7,4.5c-0.8,0-1.3-0.6-1.3-1.3
						S6.4,2,7,2c0.6,0,1.3,0.6,1.3,1.3S7.8,4.5,7,4.5z"/>
					</svg>
				</span></button>
			</div>
		`;

		people.forEach(person => {
			// Add the picture as a row in the main content
			bodyContent += makeOnePersonRow(person.imgData, person.fullName);
		});

		bodyContent += '<i style="grid-column: span 3;">End of people list</i>';	
		document.getElementById('bodyContent').innerHTML = bodyContent;

	} else {
		document.getElementById('bodyContent').innerHTML = '<i style="grid-column: span 3;">No photos found</i>';
	}

	document.getElementById('openInfo').onclick = () => document.getElementById('info').style.display = 'block';
	document.getElementById('closeInfo').onclick = () => document.getElementById('info').style.display = 'none';
	
	console.log(`populatePeoplePicturesList - END`);
}

function makeOnePersonRow(imgData, fullName) {
	// console.log(`\n makeOnePersonRow`);
	// console.log(iconSVG);

	let row = `
		<div class="rowWrapper">
			<img src="${imgData}" style="grid-column: 1; height:32px;"/>
			<div style="grid-column: span 2;">${fullName}</div>
		</div>
	`;

	// let findID = document.createElement('div');
	// findID.innerHTML = iconSVG;
	// let elemID = findID.getElementsByTagName('svg') || 'name';
	// if(elemID[0] && elemID[0].id) elemID = elemID[0].id;

	// let name = nameMap[elemID];
	// if(!name) name = elemID;

	// idSuffix++;
	// ids.push(idSuffix);

	// let con = `
	// 	<div class="rowWrapper" data-search-name="${name}">
	// 		<div style="grid-column: 1;" class="iconPreview" id="icon${idSuffix}" title="SVG file preview">${iconSVG}</div>
	// 		<div style="grid-column: 2;" class="iconName">
	// 			<input type="text"  id="name${idSuffix}" value="${name}" title="Rename the SVG file"></input>
	// 		</div>
	// 		<button style="grid-column: 3;" class="downloadButton" id="button${idSuffix}" title="Download the SVG file">
	// 			<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"
	// 				x="0px" y="0px" width="14px" height="16px" viewBox="0 0 14 16" style="enable-background:new 0 0 14 16;">
	// 				<polygon points="12,7 8.5,10.5 8.5,0 5.5,0 5.5,10.5 2,7 0,9 7,16 14,9 "/>
	// 			</svg>
	// 		</button>
	// 	</div>
	// `;

	return row;
}

function downloadFile(name = 'icon', fContent = '') {
	let file = new Blob([fContent], {type: 'svg'});
	name += '.svg';

	if (window.navigator.msSaveOrOpenBlob) // IE10+
		window.navigator.msSaveOrOpenBlob(file, name);
	else { // Others
		let a = document.createElement("a");
		let url = URL.createObjectURL(file);
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);  
		}, 0); 
	}
}
