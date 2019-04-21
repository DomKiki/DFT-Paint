const STT_RENDER = 0;
const STT_DRAW   = 1;
const STT_DONE   = 2;

const SORT_FREQ  = 0;
const SORT_AMP   = 1;
const SORT_PHS   = 2;
const SORT_RE    = 3;
const SORT_IM    = 4;

var canvasDim    = [900, 600];

var time         = 0;
var signalX		 = [];
var signalY		 = [];

var values       = [];
var userValues   = [];
var maxValues    = [];

var looping      = false;

var btnSize      = 50;
var btnSpace     = 5;
var btnStyle     = "width: " + btnSize + "px; height: "+ btnSize + "px;";
var sortLabels   = ["Freq", "Amp", "Phase", "Re", "Im"];
var sortIndex    = 0;
var state        = STT_DRAW;

function setup() {
	
	createCanvas(canvasDim[0], canvasDim[1]);	

	var btn = 1;
	
	// Looping button
	var btnLooping = createButton("Loop");
	btnLooping.position(canvasDim[0] - btn++ * (btnSize + btnSpace), canvasDim[1] + (btnSize + btnSpace), btnSize, btnSize);
	btnLooping.attribute('style', btnLooping.attribute('style') + btnStyle);
	btnLooping.mousePressed(pressLoop);
	
	// Sort button
	var btnSort = createButton(sortLabels[sortIndex]);
	var p = btnLooping.position;
	btnSort.position(canvasDim[0] - btn++ * (btnSize + btnSpace), canvasDim[1] + (btnSize + btnSpace), btnSize, btnSize);
	btnSort.attribute('style', btnSort.attribute('style') + btnStyle);
	btnSort.mousePressed(pressSort);
	btn++;
	
	// Replay button
	var btnReplay = createButton("" + '\u25B6');
	btnReplay.position(canvasDim[0] - btn++ * (btnSize + btnSpace), canvasDim[1] + (btnSize + btnSpace), btnSize, btnSize);
	btnReplay.attribute('style', btnReplay.attribute('style') + btnStyle + " font-size: 30px;");
	btnReplay.mousePressed(pressReplay);
	
	// Clear button
	var btnClear = createButton("" + '\u2327');
	btnClear.position(canvasDim[0] - btn++ * (btnSize + btnSpace), canvasDim[1] + (btnSize + btnSpace), btnSize, btnSize);
	btnClear.attribute('style', btnClear.attribute('style') + btnStyle + " font-size: 20px;");
	btnClear.mousePressed(pressClear);
	
}

function draw() {

	initCanvas();
	
	// Rendering
	if (state == STT_RENDER) {

		// Epicycles
		var x = cycles(canvasDim[0]/2, 100, signalX, 0);
		var y = cycles(100, canvasDim[1]/2, signalY, HALF_PI);
		
		// Values
		stroke(0);
		var p = createVector(x.x, y.y);
		values.unshift(p);
		line(x.x, x.y, p.x, p.y);
		line(y.x, y.y, p.x, p.y);
		beginShape();
		for (var i = 0; i < values.length; i++)
			vertex(values[i].x, values[i].y);
		endShape();
		
		// Time incrementation (dt)
		time += (TWO_PI / signalY.length);
		if (time >= TWO_PI) {
			values = [];
			if (looping)
				time = 0;
			else {
				time = TWO_PI;
				state = STT_DONE;
			}
		}
	
	}
	// Drawing / Done
	else {
		
		// Save user values 
		if ((mouseIsPressed) && (state == STT_DRAW) && (mouseInbounds()))
			userValues.push(createVector(mouseX, mouseY));
			
		// Draw
		stroke(50);
		beginShape();
		for (var v of userValues)
			vertex(v.x, v.y);
		endShape();
		
	}

}

function initCanvas() {
	
	background(255);
	noFill();
	stroke(0);
	rect(0,0,canvasDim[0],canvasDim[1]);
	
}

// Draws the epicycles corresponding to the [re, im, freq, amp, phase] array X
// Note : Theta depends on global variable `time`
function cycles(x, y, X, phase) {

	var px, py, theta, alpha;
	var alphaRange = [30, 200];

	for (var i = 0; i < X.length; i++) {
		
		px = x;
		py = y;
		theta = X[i].f * time + X[i].phs + phase;
		alpha = map(i, 0, X.length - 1, alphaRange[1], alphaRange[0]);
		
		// Circle
		stroke(92, 92, 92, alpha);
		x += X[i].amp * cos(theta);
		y += X[i].amp * sin(theta);
		ellipse(px, py, X[i].amp * 2);
		
		// Connecting
		stroke(42, 42, 42, alpha);
		line(px, py, x, y);
		
	}
	return createVector(x,y);

}

// Transforms an arbitrary number sequence `s` and returns its DFT
// Note : Output format is hand-crafted as an array of elements [re, im, freq, amp, phase]
function discreteFourierTransform(s) {
	
	var X = [];
	var N = s.length;
	var re, im, theta;
	
	for (var k = 0; k < N; k++) {
		
		re = 0;
		im = 0;
		for (var i = 0; i < N; i++) {
			theta = (TWO_PI * k * i) / N;
			re += s[i] * cos(theta);
			im -= s[i] * sin(theta);
		}
		
		re /= N;
		im /= N;
		X[k] = { r   : re, 
				 im  : im, 
				 f   : k, 
				 amp : sqrt(pow(re,2) + pow(im,2)), 
				 phs : atan2(im,re) 
		};
		
	}
	
	return X;	
	
}

/****************** Sorting methods ******************/

function sortSignal() {
	var compare;
	switch (sortIndex) {
		case SORT_RE:
			compare = compareRe;
			break;
		case SORT_IM:
			compare = compareIm;
			break;
		case SORT_FREQ:
			compare = compareFreq;
			break;
		case SORT_AMP:
			compare = compareAmp;
			break;
		case SORT_PHS:
			compare = comparePhase;
			break;
	}	
	signalX.sort(compare);	
	signalY.sort(compare);
}

function compareRe(a,b)    { return b.re  - a.re;  }
function compareIm(a,b)    { return b.im  - a.im;  }
function compareAmp(a,b)   { return b.amp - a.amp; }
function compareFreq(a,b)  { return b.f   - a.f;   }
function comparePhase(a,b) { return b.phs - a.phs; }

/****************** Mouse methods ********************/

function mouseInbounds() { return ((mouseX >= 0) && (mouseX < canvasDim[0]) && (mouseY >= 0) && (mouseY < canvasDim[1])); }

function mouseReleased() {
	
	if ((state == STT_DRAW) && (userValues.length > 0)) {
		
		// Push values
		for (var i = 0; i < userValues.length; i++) {
			signalX.push(userValues[i].x);
			signalY.push(userValues[i].y);
		}
		
		// Map values to desired domain
		var domain = 200;
		maxValues = [max(signalX), max(signalY)];
		for (var i = 0; i < signalX.length; i++) {
			signalX[i] = map(signalX[i], 0, maxValues[0], -domain, domain);
			signalY[i] = map(signalY[i], 0, maxValues[1], -domain, domain);
		}
		
		// DFT 
		signalX = discreteFourierTransform(signalX);
		signalY = discreteFourierTransform(signalY);
		
		// Sort
		sortSignal();
		
		// Start rendering
		state = STT_RENDER;
		
	}
}

/****************** Button Callbacks *****************/

function pressLoop() {
	looping = !looping;
	if (looping) {
		this.style("border-style", "inset");
		if (state == STT_DONE)
			state = STT_RENDER;
	}
	else
		this.style("border-style", "outset");
}

function pressSort() {
	sortIndex = (sortIndex + 1) % sortLabels.length;
	sortSignal();
	this.html(sortLabels[sortIndex]);
}

function pressReplay() {
	time   = 0;
	values = [];
	state  = STT_RENDER;
	loop();
}

function pressClear() {
	pressReplay();
	userValues = [];
	signalX    = [];
	signalY    = [];
	state      = STT_DRAW;
}