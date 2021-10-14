import { getPeopleData } from './main-page.js';
import photoResizerMasker from './photo-resizer-masker.js';

let _settings = {
	mask: 'circle',
	size: 800,
	includeManagementChain: false
};

let peopleData = {
	selected: {},
	above: [],
	below: []
};

// What to do every time the popup is opened
document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('infoContent').innerHTML = '<span><i>Getting people pictures...</i></span>';
	
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


chrome.runtime.onMessage.addListener(function(message) {
	console.log(`POPUP.listener - got message`);
	console.log(message);
	peopleData = JSON.parse(message);
	console.log(peopleData);

	redraw();
});


function redraw() {
	console.log(`redraw - START`);

	redrawInfo();
	redrawControls();
	redrawPeoplePicturesList();

	console.log(`redraw - END`);
}


/*
		Picture List
*/
function redrawPeoplePicturesList() {
	console.log(`redrawPeoplePicturesList - START`);
	
	let total = 1 + peopleData.below.length;
	if(_settings.includeManagementChain) total += peopleData.above.length;

	let listContent = `
	<span>
		<h2>People Pictures</h2>
		<i>found ${total} people</i>
	</span>`;
	
	// listContent += `<span>${JSON.stringify(_settings)}</span>`;

	// ABOVE
	if(_settings.includeManagementChain){
		if(peopleData.above.length) {
			peopleData.above.forEach(person => {
				// Add the picture as a row in the main content
				listContent += makeOnePersonRow(person);
			});
		}
	}
	
	// SELECTED
	listContent += makeOnePersonRow(peopleData.selected, true);

	// BELOW
	if(peopleData.below.length) {
		peopleData.below.forEach(person => {
			// Add the picture as a row in the main content
			listContent += makeOnePersonRow(person);
		});
	}
	
	listContent += '<span><i>End of people list</i></span><br><br>';
	document.getElementById('listContent').innerHTML = listContent;
	
	console.log(`redrawPeoplePicturesList - END`);
}


function makeOnePersonRow(person) {
	// console.log(`\n makeOnePersonRow - START`);
	let row = `<div class="rowWrapper">`;

	// Cache the image data for mask+size combinations
	let dataKey = _settings.mask + _settings.size;

	if(person.imgData){
		if (!person[dataKey]) person[dataKey] = photoResizerMasker({'image': person.imgData, 'mask': _settings.mask, 'size': _settings.size, });
		row += `<img class="photo" src="${person[dataKey].result}" alt="Photo picture of ${person.fullName}" />`;
	} else {
			row += `<div class="initials" style="background-color: ${person.bgColor};" alt="Initials of ${person.fullName}">${person.initials}</div>`;
	}

	row += `
			<div><b>${person.fullName}</b> (${person.alias})</div>
		</div>
	`;

	return row;
}


/*
		Controls & Header
*/
function redrawControls() {
	let controlsContent = `<h2>Picture options</h2>`;

	controlsContent += `
		<label for="maskInput">Shape mask</label>
		<select onChange="updateSettings();" id="maskInput">
			<option ${_settings.mask === 'square' ? 'selected="selected" ' : ''}value="square">Square</option>
			<option ${_settings.mask === 'circle' ? 'selected="selected" ' : ''}value="circle">Circle</option>
			<option ${_settings.mask === 'none' ? 'selected="selected" ' : ''}value="none">None</option>
		</select>
	`;

	controlsContent += `
		<label>Resize (px)</label>
		<input onChange="updateSettings();" type="number" id="sizeInput" value="${_settings.size}">
	`;

	controlsContent += `
		<label for="includeManagementChainInput">Include management chain</label>
		<input onChange="updateSettings();" type="checkbox" ${_settings.includeManagementChain? 'checked ' : ''}id="includeManagementChainInput">
	`;

	document.getElementById('controlsContent').innerHTML = controlsContent;
	
	document.getElementById('maskInput').onchange = updateSettings;
	document.getElementById('sizeInput').onchange = updateSettings;
	document.getElementById('includeManagementChainInput').onchange = updateSettings;
}


function updateSettings() {
	let maskSetting = document.getElementById('maskInput').value;
	let sizeSetting = parseInt(document.getElementById('sizeInput').value);
	let includeManagementChainSetting = document.getElementById('includeManagementChainInput').checked;

	console.log(`updateSettings - setting to ${maskSetting} ${sizeSetting} ${includeManagementChainSetting}`);
	_settings = {
		mask: maskSetting,
		size: sizeSetting,
		includeManagementChain: includeManagementChainSetting
	};

	redrawPeoplePicturesList();
}


function redrawInfo() {
	
	document.getElementById('infoContent').innerHTML = `
		<div class="headerRow">
			<button id="downloadButton">
				<span>
					<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px"
						height="14px" viewBox="0 0 14 14" style="enable-background:new 0 0 14 14;" xml:space="preserve">
						<polygon points="6,0 8,0 8,12 13,7 14,8 7,14 0,8 1,7 6,12"/>
					</svg>&nbsp;Download&nbsp;people&nbsp;pictures&nbsp;
				</span>
			</button>
			<button id="openInfo">
				<span>
					<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
						x="0px" y="0px" width="14px" height="14px" 
						viewBox="0 0 14 14" style="enable-background:new 0 0 14 14;" xml:space="preserve">
					<path d="
						M7,0C3.1,0,0,3.1,0,7c0,3.9,3.1,7,7,7s7-3.1,7-7C14,3.1,10.9,0,7,0z
						M8,12H6V6h2V12z
						M7,4.5c-0.8,0-1.3-0.6-1.3-1.3 S6.4,2,7,2c0.6,0,1.3,0.6,1.3,1.3S7.8,4.5,7,4.5z
					"/>
					</svg>
				</span>
			</button>
		</div>
	`;

	document.getElementById('openInfo').onclick = () => document.getElementById('infoDialog').style.display = 'block';
	document.getElementById('closeInfo').onclick = () => document.getElementById('infoDialog').style.display = 'none';
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
