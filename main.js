/*
	References:
		http://www.html5rocks.com/en/tutorials/getusermedia/intro/
		https://simpl.info/getusermedia/sources/
		https://davidwalsh.name/browser-camera
*/

var canvas,
	video,
	dropdown,
	base64,
	form,
	overlay,
	screenElement;

window.addEventListener("DOMContentLoaded", function() {
	canvas = document.getElementById("canvas");
	video = document.getElementById("video");
	dropdown = document.getElementById('camera-select');
	base64 = document.getElementById('base64');
	form = document.getElementById('form');
	overlay = document.getElementById('overlay');
	screenElement = document.getElementById('screen');

	window.addEventListener('resize', sizeThings);

	if (MediaStreamTrack && MediaStreamTrack.getSources)
		MediaStreamTrack.getSources(function(sources) {
			console.log(sources);
			var first = true;
			for (var i = 0; i !== sources.length; ++i) {
				var sourceInfo = sources[i];
				var option = document.createElement('option');
				option.value = sourceInfo.id;
				if (sourceInfo.kind === 'video') {
					option.text = sourceInfo.label || 'camera ' + (dropdown.length + 1);
					dropdown.appendChild(option);
					if (first) {
						startCapture(dropdown.value);
						first = false;
					}
				} else
					console.log('Don\'t care about this: ', sourceInfo);
			}
			dropdown.addEventListener('change', function(e) {
				console.log(dropdown.value);
				startCapture(dropdown.value);
				e.preventDefault();
			});
		});
	else {
		dropdown.classList.add('hidden');
		startCapture();
	}

	document.getElementById("snap").addEventListener("click", function() {
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		var context = canvas.getContext("2d");
		context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
		base64.value = canvas.toDataURL('image/jpeg')
		                     .substr('data:image/jpeg;base64,'.length);
		canvas.classList.remove('hidden');
		form.classList.remove('hidden');
		snap.classList.add('hidden');
		cancel.classList.remove('hidden');
	});

	document.getElementById("cancel").addEventListener("click", function() {
		canvas.classList.add('hidden');
		snap.classList.remove('hidden');
		form.classList.add('hidden');
		cancel.classList.add('hidden');
	});
});

function startCapture(source) {
	var opts = { video: source
			? { optional: [{ sourceId: source }] }
			: true
		};
	// Put video listeners into place
	if(navigator.getUserMedia) { // Standard
		navigator.getUserMedia(opts, function(stream) {
			video.src = stream;
			video.play();
		}, errBack);
	} else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
		navigator.webkitGetUserMedia(opts, function(stream){
			video.src = window.webkitURL.createObjectURL(stream);
			video.play();
		}, errBack);
	}
	else if(navigator.mozGetUserMedia) { // Firefox-prefixed
		navigator.mozGetUserMedia(opts, function(stream){
			video.src = window.URL.createObjectURL(stream);
			video.play();
		}, errBack);
	}

	video.onloadedmetadata = sizeThings;
}

function sizeThings() {
	var xMargin = 100, yMargin = 200,
		xRatio = video.videoWidth / (window.innerWidth - xMargin),
		yRatio = video.videoHeight / (window.innerHeight - yMargin),
		ratio = Math.max(xRatio, yRatio),
		videoAspect = video.videoWidth / video.videoHeight,
		screenWidth = video.videoWidth / ratio,
		screenHeight = video.videoHeight / ratio,
		overlayAspect = 1,
		overlayXMargin = 0.1,
		overlayYMargin = overlayXMargin,
		overlayMaxWidth = screenWidth * (1 - 2 * overlayXMargin),
		overlayMaxHeight = screenHeight * (1 - 2 * overlayYMargin),
		overlayMaxRatio = overlayMaxWidth / overlayMaxHeight;
	screenElement.style.width = screenWidth + 'px';
	screenElement.style.height = screenHeight + 'px';
	if (overlayMaxRatio > overlayAspect) {
		overlay.style.height = overlayMaxHeight + 'px';
		overlay.style.top = (overlayYMargin * screenHeight) + 'px';
		var overlayWidth = overlayAspect * overlayMaxHeight;
		overlay.style.width = overlayWidth + 'px';
		overlay.style.left = ((screenWidth - overlayWidth) / 2) + 'px';
	} else {
		overlay.style.width = overlayMaxWidth + 'px';
		overlay.style.left = (overlayXMargin * screenWidth) + 'px';
		var overlayHeight = overlayMaxWidth / overlayAspect;
		overlay.style.height = overlayHeight + 'px';
		overlay.style.top = ((screenHeight - overlayHeight) / 2) + 'px';
	}
	'top,left,width,height'.split(',').forEach(function(key) {
		document.getElementById('overlay-' + key).value =
			Math.round(parseInt(overlay.style[key]) * ratio);
	});
}

function errBack(error) {
	console.log("Video capture error: ", error.code); 
};