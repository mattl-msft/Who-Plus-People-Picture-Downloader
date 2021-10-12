/**
 * photoResizerMasker
 * @param {object} options - collection of key: value pairs to set as options
 * @param {string} options.image - image data to resize or mask
 * @param {string} options.mask - optional, either 'square' or 'circle'
 * @param {number} options.size - optional, for square or circle, resize the image
 * @param {string} options.name - optional, name for this image
 * @returns {string} - Base64 PNG src data
 */
export default function photoResizerMasker(options = {}, callback){
	options.name = options.name || '';
	log(`\n\n===============\n${options.name}\nphotoResizerMasker - start`);
	log(options);

	// create working images
	// let workingCanvas = document.getElementById('testCanvas');
	let workingCanvas = document.createElement('canvas');
	let workingContext = workingCanvas.getContext('2d');
	let srcImage = new Image();
	srcImage.setAttribute('id', 'sourceImage');
	srcImage.src = options.image;
	srcImage.onload = processImage;
	let scale = 1;

	// validate options
	if(!options.image) return '';
	if(!options.size && !options.mask) finalizeImage();

	function processImage() {
		// const resultImage = new Image();
		let minDimension = Math.min(srcImage.width, srcImage.height);
		
		/*   Scaling   */
		if(options.size){
			scale = options.size / minDimension;
			log(`\n${options.name}\n\t>>>SCALING ${scale}`);
		}

		/*   Masking   */
		if(options.mask){
			workingCanvas.width = minDimension * scale;
			workingCanvas.height = minDimension * scale;

			if(options.mask === 'circle'){
				// Circle
				log(`\n${options.name}\n\t>>>MASK - circle`);
				let radius = minDimension/2*scale;
				workingContext.beginPath();
				workingContext.arc(radius, radius, radius, 0, Math.PI * 2, false);
				workingContext.clip();
				if(srcImage.width > srcImage.height){
					workingContext.drawImage(
						srcImage, 
						(-1*scale*(srcImage.width/4)), 0,
						srcImage.width*scale, srcImage.height*scale
					);
				} else {
					workingContext.drawImage(
						srcImage, 
						0, (-1*scale*(srcImage.height/4)),
						srcImage.width*scale, srcImage.height*scale
					);
				}

			} else if (options.mask === 'square'){
				// Square
				log(`\n${options.name}\n\t>>>MASK - square`);
				if(srcImage.width > srcImage.height){
					workingContext.drawImage(
						srcImage, 
						(-1*scale*(srcImage.width/4)), 0,
						srcImage.width*scale, srcImage.height*scale
					);
				} else {
					workingContext.drawImage(
						srcImage, 
						0, (-1*scale*(srcImage.height/4)),
						srcImage.width*scale, srcImage.height*scale
					);
				}
			} else {
				console.warn(`Unhandled mask value: ${options.mask}`);
			}
		}

		finalizeImage();
	}
	
	function finalizeImage(){
		let data = {
			source: srcImage.src,
			result: workingCanvas.toDataURL('image/png'),
			canvas: workingCanvas
		};
		if(options.name) data.name = options.name;
		log(`${options.name}\nphotoResizerMasker - end\n===============\n\n`);
		// log(data);
		if(callback) callback(data);
	}
}

function log(msg){
	// a single place to turn off console logging
	console.log(msg);
}