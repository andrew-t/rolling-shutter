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
	screenElement;

window.addEventListener("DOMContentLoaded", function() {
	canvas = document.getElementById("canvas");
	video = document.getElementById("video");
	dropdown = document.getElementById('camera-select');
	base64 = document.getElementById('base64');
	form = document.getElementById('form'),
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
	var xMargin = 100, yMargin = 500,
		xRatio = video.videoWidth / (window.innerWidth - xMargin),
		yRatio = video.videoHeight / (window.innerHeight - yMargin),
		ratio = Math.max(xRatio, yRatio);
	screenElement.style.width = video.videoWidth / ratio + 'px';
	screenElement.style.height = video.videoHeight / ratio + 'px';
}

function errBack(error) {
	console.log("Video capture error: ", error.code); 
};