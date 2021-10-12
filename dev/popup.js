

let idSuffix = 1;
let ids = [];

// What to do every time the popup is opened
document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('bodyContent').innerHTML = '<i style="grid-column: span 3;">Getting people pictures...</i>';
	
	// So, this tabs.executeScript takes a code string :-\
	// 'getPeoplePictures' is defined below, then use fn.toString and call it in an IIFE
	chrome.tabs.executeScript({
		code: `
			(function () {
				${getPeoplePictures.toString()}
				getPeoplePictures();
			})();
			`
	});

	// document.getElementById('');
});

function getPeoplePictures() {
	let symbols = document.getElementById('FxSymbolContainer');
	let defs = document.getElementById('DefsContainer');
	defs = defs.getElementsByTagName('defs')[0];
	
	// Make the Icon list, and find names
	let returnElements = [];
	let nameMap = {};

	if(symbols) {
		let nameElement;
		let symbol;
		let symbolID;
		let name;
		let query;

		for(let e=0; e<symbols.children.length; e++) {
			/*
			 *	ADD THE ICON TO THE LIST
			*/
			symbol = symbols.children[e];
			returnElements.push(symbol.outerHTML);
		}
	}

	let result = {elements: returnElements, names: nameMap, defs: returnDefs};
	chrome.runtime.sendMessage(JSON.stringify(result));
}

chrome.runtime.onMessage.addListener(function(message) {
	// console.log(`POPUP Got Message`);
	// console.log(message);	
	populatePeoplePicturesList(message);
});

function populatePeoplePicturesList(list) {
	let result = JSON.parse(list);
	let elements = result.elements;
	let nameMap = result.names;
	let defs = result.defs;

	ids = [];

	if(elements.length) {
		// 	let bodyContent = `
		// 		<div class="headerRow">
		// 			<input type="text" id="searchBox" placeholder="Search across ${elements.length} icons"></input>
		// 			<button id="openInfo"><span>
		// 				<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px"
		// 					height="14px" viewBox="0 0 14 14" style="enable-background:new 0 0 14 14;" xml:space="preserve">
		// 				<path d="M7,0C3.1,0,0,3.1,0,7c0,3.9,3.1,7,7,7s7-3.1,7-7C14,3.1,10.9,0,7,0z M8,12H6V6h2V12z M7,4.5c-0.8,0-1.3-0.6-1.3-1.3
		// 					S6.4,2,7,2c0.6,0,1.3,0.6,1.3,1.3S7.8,4.5,7,4.5z"/>
		// 				</svg>
		// 			</span></button>
		// 		</div>
		// 	`;

		// Loop through all the elements
		// Build the list of pictures
		let picture;

		for(let i = elements.length-1; i > -1; i--) {
			picture = elements[i];

			// Add the picture as a row in the main content
			bodyContent += makeOnePersonRow(picture, nameMap);
		}

		bodyContent += '<i style="grid-column: span 3;">End of icon list</i>';
	
		document.getElementById('bodyContent').innerHTML = bodyContent;
	} else {
		document.getElementById('bodyContent').innerHTML = '<i style="grid-column: span 3;">No photos found</i>';
	}

	// document.getElementById('searchBox').onchange = search;
	// document.getElementById('searchBox').onkeyup = search;
	document.getElementById('openInfo').onclick = () => document.getElementById('info').style.display = 'block';
	document.getElementById('closeInfo').onclick = () => document.getElementById('info').style.display = 'none';
}

// function search() {
// 	let term = document.getElementById('searchBox').value;
// 	let rows = document.querySelectorAll('.rowWrapper');
// 	let rowName;

// 	rows.forEach(row => {
// 		rowName = row.getAttribute('data-search-name');
// 		if(rowName.toLocaleLowerCase().includes(term.toLocaleLowerCase()) || term === '') {
// 			row.style.display = 'contents';
// 		} else {
// 			row.style.display = 'none';
// 		}
// 	});
// }


function makeOnePersonRow(iconSVG, nameMap) {
	// console.log(`\n makeOnePersonRow`);
	// console.log(iconSVG);

	let findID = document.createElement('div');
	findID.innerHTML = iconSVG;
	let elemID = findID.getElementsByTagName('svg') || 'name';
	if(elemID[0] && elemID[0].id) elemID = elemID[0].id;

	let name = nameMap[elemID];
	if(!name) name = elemID;

	idSuffix++;
	ids.push(idSuffix);

	let con = `
		<div class="rowWrapper" data-search-name="${name}">
			<div style="grid-column: 1;" class="iconPreview" id="icon${idSuffix}" title="SVG file preview">${iconSVG}</div>
			<div style="grid-column: 2;" class="iconName">
				<input type="text"  id="name${idSuffix}" value="${name}" title="Rename the SVG file"></input>
			</div>
			<button style="grid-column: 3;" class="downloadButton" id="button${idSuffix}" title="Download the SVG file">
				<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"
					x="0px" y="0px" width="14px" height="16px" viewBox="0 0 14 16" style="enable-background:new 0 0 14 16;">
					<polygon points="12,7 8.5,10.5 8.5,0 5.5,0 5.5,10.5 2,7 0,9 7,16 14,9 "/>
				</svg>
			</button>
		</div>
	`;

	return con;
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
