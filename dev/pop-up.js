import { getPeopleData } from './main-page.js';
import photoResizerMasker from './photo-resizer-masker.js';
export { updateOnePersonRow };

let _settings = {
	mask: 'circle',
	size: 200,
	includeManagementChain: false
};

let _peopleData = {
	selected: {},
	above: [],
	below: []
};

let _cachedPeoplePhotos = {}


/*
		Starting the extension
*/
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
	_peopleData = JSON.parse(message);
	console.log(_peopleData);

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
	
	let total = 1 + _peopleData.below.length;
	if(_settings.includeManagementChain) total += _peopleData.above.length;

	let listContent = `
	<span>
		<h2>People Pictures</h2>
		<i id="statusMessage">found ${total} people</i>
	</span>`;
	
	// listContent += `<span>${JSON.stringify(_settings)}</span>`;

	iterateOverPeopleList(person => listContent += makeOnePersonRow(person));
	
	listContent += '<span><i>End of people list</i></span><br><br>';
	document.getElementById('listContent').innerHTML = listContent;
	
	// iterateOverPeopleList(person => updateOnePersonRow(person));

	console.log(`redrawPeoplePicturesList - END`);
}


function iterateOverPeopleList(fun) {
	// ABOVE
	if(_settings.includeManagementChain) {
		if(_peopleData.above.length) {
			_peopleData.above.forEach(person => {
				fun(person);
			});
		}
	}
	
	// SELECTED
	fun(_peopleData.selected);

	// BELOW
	if(_peopleData.below.length) {
		_peopleData.below.forEach(person => {
			fun(person);
		});
	}
}

function updateOnePersonRow(person) {
	let dataKey = _settings.mask + _settings.size;
	let imgData = _cachedPeoplePhotos[dataKey][person.alias];
	let personToUpdate = document.getElementById(`alias-${person.alias}`);
	if(personToUpdate) {
		personToUpdate.innerHTML = `<img class="photo" src="${imgData}" alt="Photo picture of ${person.fullName}" />`;
	}
}


function makeOnePersonRow(person) {
	console.log(`\n makeOnePersonRow - START`);
	console.log(`\t ${person.alias} - ${person.fullName}`);

	let rowStart = `
		<div class="rowWrapper">
			<div class="thumbnail" id="alias-${person.alias}">
	`;

	let rowEnd = `
			</div>
			<div class="name"><b>${person.fullName}</b> (${person.alias})</div>
		</div>
	`;

	let row = rowStart;
	if(person.alias === _peopleData.selected.alias && _settings.includeManagementChain) {
		row = '<span class="separator"></span>' + row;
	}

	// Check the cache for mask+size iteration
	let dataKey = _settings.mask + _settings.size;
	if (_cachedPeoplePhotos[dataKey]) {
		if(_cachedPeoplePhotos[dataKey][person.alias]) {
			row += `<img class="photo" src="${_cachedPeoplePhotos[dataKey][person.alias]}" alt="Photo picture of ${person.fullName}" />`;
			return row + rowEnd;
		}
	} else {
		_cachedPeoplePhotos[dataKey] = {};
	}
	
	// If the person has no photo, make an Initials Circle
	if(!person.imgData) {
		row += `<div class="initials" style="background-color: ${person.bgColor};" alt="Initials of ${person.fullName}">${person.initials}</div>`;
		makeInitialsPhoto(person.initials, person.bgColor, (_settings.mask === 'none'? 800 : _settings.size), makeImageCallback);
		return row + rowEnd;
	}

	// The person has a photo, but not one cached, make one
	if(_settings.mask !== 'none') {
		// Circle or Square masking
		row += `<img class="photo placeholder" src="${person.imgData}" alt="Photo picture of ${person.fullName}" />`;
		photoResizerMasker({'image': person.imgData, 'mask': _settings.mask, 'size': _settings.size, 'name': person.alias}, makeImageCallback);

	} else {
		// No masking or resizing
		row += `<img class="photo" src="${person.imgData}" alt="Photo picture of ${person.fullName}" />`;
	}

	function makeImageCallback(data) {
		_cachedPeoplePhotos[dataKey][person.alias] = data.result;
		let personToUpdate = document.getElementById(`alias-${person.alias}`);
		if(personToUpdate) {
			personToUpdate.innerHTML = `<img class="photo" src="${data.result}" alt="Photo picture of ${person.fullName}" />`;
		}
	}

	console.log(`RETURNING\n${row + rowEnd}`);
	return row + rowEnd;
}


function makeInitialsPhoto(initials, bgColor, size = 48, callback) {
	let workingCanvas = document.createElement('canvas');
	if(document.getElementById('testCanvas')) workingCanvas = document.getElementById('testCanvas');
	workingCanvas.width = size;
	workingCanvas.height = size;

	let ctx = workingCanvas.getContext('2d');
	let radius = size/2;
	
	ctx.beginPath();
	ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
	ctx.clip();
	ctx.fillStyle = bgColor;
	ctx.fill();
	ctx.font = `600 ${size/3}px Segoe`;
	ctx.fillStyle = 'hsla(0, 0%, 100%, 90%)';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(initials, radius, radius + (radius * 0.1));

	let data = {
		result: workingCanvas.toDataURL('image/png'),
		canvas: workingCanvas
	};

	if(callback) callback(data);

	return data;
}


/*
		Controls & Header
*/
function redrawControls() {
	let controlsContent = `<h2>Picture options</h2>`;

	// controlsContent += '<canvas id="testCanvas"></canvas><br>';

	controlsContent += `
		<label for="maskInput">Shape mask</label>
		<select onChange="updateSettings();" id="maskInput">
			<option ${_settings.mask === 'square' ? 'selected="selected" ' : ''}value="square">Square</option>
			<option ${_settings.mask === 'circle' ? 'selected="selected" ' : ''}value="circle">Circle</option>
			<option ${_settings.mask === 'none' ? 'selected="selected" ' : ''}value="none">None</option>
		</select>
	`;

	if(_settings.mask !== 'none') {
		controlsContent += `
			<label>Resize (px)</label>
			<input onChange="updateSettings();" type="number" id="sizeInput" value="${_settings.size}"/>
		`;
	} else {
		controlsContent += `
			<label>Size (px)</label>
			<input type="text" id="sizeInput" disabled value=""/>
		`;
	}

	controlsContent += `
		<label for="includeManagementChainInput">Include management chain</label>
		<input onChange="updateSettings();" type="checkbox" ${_settings.includeManagementChain? 'checked ' : ''}id="includeManagementChainInput"/>
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

	let sizeElement = document.getElementById('sizeInput');
	if(_settings.mask === 'none') {
		sizeElement.setAttribute('disabled', 'disabled');
		// sizeElement.value = '';
	} else {
		sizeElement.removeAttribute('disabled');
		// sizeElement.value = _settings.size;
	}

	redrawPeoplePicturesList();
}


function redrawInfo() {
	
	document.getElementById('infoContent').innerHTML = `
		<div class="headerRow">
			<button id="downloadButton">
				<span>
					<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px"
						height="14px" viewBox="0 0 14 14" style="enable-background:new 0 0 14 14;" xml:space="preserve">
						<rect x="1" y="12" width="12" height="2"/>
						<polygon points="11.708 4.869 8 7.856 8 0 6 0 6 7.856 2.292 4.869 1 6.418 7 11.295 13 6.418 11.708 4.869"/>
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
	document.getElementById('downloadButton').onclick = downloadAllPeoplePictures;
}


/*
		Download files
*/
function downloadAllPeoplePictures(){
	let downloadList = [];
	if(_settings.includeManagementChain) downloadList = downloadList.concat(_peopleData.above);
	downloadList.push(_peopleData.selected);
	downloadList = downloadList.concat(_peopleData.below);

	console.log(`downloadAllPeoplePictures - doing ${downloadList.length}`);
	// downloadList.forEach((elem) => {
		// 	if(_settings.mask !== 'none') {
			// 		let dataKey = _settings.mask + _settings.size;
			// 		downloadFile(elem.alias, _cachedPeoplePhotos[dataKey][elem.alias]);
			// 	}
			// });
			
	let index = 0;
	let element;
	function downloadOnePersonPicture() {
		if(index < downloadList.length) {
			element = downloadList[index];

			if(_settings.mask !== 'none') {
				let dataKey = _settings.mask + _settings.size;
				downloadFile(element.alias, _cachedPeoplePhotos[dataKey][element.alias]);
			}

			index++;
			window.setTimeout(downloadOnePersonPicture, 100);
		}
	}

	downloadOnePersonPicture();
}

function downloadFile(alias = 'picture', imgData = ''){
	console.log(`\t\t downloading ${alias}`);
	var link = document.createElement('a');
	link.download = `${alias}.png`
	link.href = imgData;
	link.click();
}
