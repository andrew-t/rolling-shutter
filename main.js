/*
	References:
		http://www.html5rocks.com/en/tutorials/getusermedia/intro/
		https://simpl.info/getusermedia/sources/
		https://davidwalsh.name/browser-camera
*/

var canvas,
	context,
	video,
	dropdown,
	base64,
	form,
	period = 2,
	lineGroup = 1,
	interval,
	intervalHandle;

if (window.location.hash)
	window.location.hash
		.substr(1)
		.split(';')
		.forEach(part => {
			if (/fps$/i.test(part))
				period = 1 / parseFloat(part);
			else if (/spf$/i.test(part))
				period = parseFloat(part);
			else if (/lpf$/i.test(part))
				lineGroup = parseFloat(part);
		});

window.addEventListener("DOMContentLoaded", function() {
	canvas = document.getElementById("canvas");
	video = document.getElementById("video");
	dropdown = document.getElementById('camera-select');
	base64 = document.getElementById('base64');
	form = document.getElementById('form');

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
});

var y = 0;
function nextFrame() {
	context.drawImage(video,
		0, y, video.videoWidth, lineGroup,
		0, y, video.videoWidth, lineGroup);
	if ((y += lineGroup) >= video.videoHeight)
		y = 0;
	context.beginPath();
	context.moveTo(0, y + lineGroup / 2);
	context.lineTo(video.videoWidth, y + lineGroup / 2);
	context.stroke();
}

function startCapture(source) {
	var opts = { video: source
			? { optional: [{ sourceId: source }] }
			: true
		};
	// Put video listeners into place
	if(navigator.getUserMedia) // Standard
		navigator.getUserMedia(opts, applyStream, errBack);
	else if(navigator.webkitGetUserMedia) // WebKit-prefixed
		navigator.webkitGetUserMedia(opts, applyStream, errBack);
	else if(navigator.mozGetUserMedia) // Firefox-prefixed
		navigator.mozGetUserMedia(opts, applyStream, errBack);
	function applyStream(stream) {
		if ('srcObject' in video)
			video.srcObject = stream;
		else if (window.URL)
			video.src = window.URL.createObjectURL(stream);
		else
			video.src = window.webkitURL.createObjectURL(stream);
		then();
	};

	video.onloadedmetadata = sizeThings;

	function then() {
		try {
			var p = video.play();
			if (p && p.then)
				p.then(doPlay, catchIt);
			else
				doPlay();
		} catch (e) {
			catchIt();
		}
	}

	function catchIt() {
		var cta = document.getElementById('click-to-play');
		cta.classList.remove('hidden');
		cta.addEventListener('click', function(e) {
			cta.classList.add('hidden');
			video.play();
			doPlay();
			e.preventDefault();
		});
	}

	function doPlay() {
		sizeThings();
		setTimeout(() => {
			if (!lineGroup)
				lineGroup = 1;
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			context = canvas.getContext("2d");
			context.lineWidth = lineGroup;
			context.strokeStyle = '#00ff00';
			interval = 1000 * (period || 2) / video.videoHeight;
			intervalHandle = setInterval(nextFrame, interval);
		}, 150);
	}
}

function sizeThings() {
	var vw = video.videoWidth,
		vh = video.videoHeight,
		vr = vw / vh,
		ww = window.innerWidth,
		wh = window.innerHeight,
		wr = ww / wh;

	if (wr > 2 * vr) {
		video.style.width = canvas.style.width = (wh * vr) + 'px';
		video.style.height = canvas.style.height = wh + 'px';
	} else if (wr > vr) {
		video.style.width = canvas.style.width = (ww / 2) + 'px';
		video.style.height = canvas.style.height = ((ww / 2) / vr) + 'px';
	} else if (wr > vr / 2) {
		video.style.width = canvas.style.width = (wh * vr / 2) + 'px';
		video.style.height = canvas.style.height = (wh / 2) + 'px';
	} else {
		video.style.width = canvas.style.width = ww + 'px';
		video.style.height = canvas.style.height = (ww / vr) + 'px';
	}
}

function errBack(error) {
	console.log("Video capture error: ", error); 
};
