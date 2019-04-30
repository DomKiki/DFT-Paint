/****************** Global variables *****************/

// States
const STT_IDLE   = 0;
const STT_DRAW   = 1;
const STT_RENDER = 2;
var   state      = STT_DRAW;
var   looping    = false;

// Sorting
const SORT_FREQ  = 0;
const SORT_AMP   = 1;
const SORT_PHS   = 2;
const SORT_RE    = 3;
const SORT_IM    = 4;
const SORT_ASC   = 0;
const SORT_DSC   = 1;
var   sortLabels = ["Freq", "Amp", "Phase", "Re", "Im"];
var   sortIndex  = SORT_AMP;
var   sortOrders = ["Asc", "Desc"];
var   sortOrder  = SORT_ASC;

// Canvas
var canvas;
var img;

// Values
var time         = 0;
var signalX		 = [];
var signalY		 = [];
var values       = [];
var userValues   = [];
var maxValues    = [];

// HTML / CSS related
var btnSize      = 50;
var btnSpace     = 5;
var btnStyle     = "width: " + btnSize + "px; height: "+ btnSize + "px;";
var kSliderText, kSlider,
    radSort, btnSort, btnLooping, btnOrder;
var tutoVisible  = true;
var divTuto;

/********************* p5 Methods ********************/

function setup() {
	
	canvas = createCanvas(1200, 800);
	canvas.parent("canvasDiv");
	
	divTuto = select("#infosDiv");

	var btn = 1;
	
	// Looping button
	btnLooping = select('#btnLooping');
	btnLooping.position(width - btn * (btnSize + btnSpace), height + (btnSize + btnSpace), btnSize, btnSize);
	btn += 2;
	
	// Order button
	btnOrder = select('#btnOrder');
	btnOrder.position(width - btn++ * (btnSize + btnSpace), height + (btnSize + btnSpace), btnSize, btnSize);
	
	// Sort button and radios
	btnSort = select('#btnSort');
	btnSort.position(width - btn * (btnSize + btnSpace), height + (btnSize + btnSpace), btnSize, btnSize)
	       .html(sortLabels[sortIndex]);
	var radSpan = select('#radioSort');
	radSort = selectAll('input', radSpan);
	radSpan.position(width - btn * (btnSize + btnSpace) + ((2 * btnSize + btnSpace) / 2) - (radSpan.width / 2), height + (btnSize + btnSpace) + 70, btnSize, btnSize);
	btn += 2;
	
	// Replay button
	var btnReplay = select('#btnReplay');
	btnReplay.position(width - btn++ * (btnSize + btnSpace), height + (btnSize + btnSpace), btnSize, btnSize);
	
	// Clear button
	var btnClear = select('#btnClear');
	btnClear.position(width - btn++ * (btnSize + btnSpace), height + (btnSize + btnSpace), btnSize, btnSize);
	
	// Orbits slider and text
	kSlider = select('#kSlider');
	var w = kSlider.width;
	kSlider.position(width  - btn * (btnSize + btnSpace) - w, height + 2 * btnSize - 20);
	
	kSliderText = select('#kSliderText');
	kSliderText.position(width  - btn * (btnSize + btnSpace) - w, height + 2 * btnSize - 60);
	
	// Drag & Drop background image
	for (e of [canvas, divTuto])
		e.dragOver(highlight)
		 .dragLeave(unhighlight)
		 .drop(backgroundImg);
	
	// Tutorial
	makeInstructions();
	
}

function draw() {

	initCanvas();
	
	// Rendering / Done
	if (!isDrawing()) {

		// Epicycles
		var x = cycles(width/2, 100, signalX, 0);
		var y = cycles(100, height/2, signalY, HALF_PI);
		
		// Values
		stroke(0);
		beginShape();
		for (var i = 0; i < values.length; i++)
			vertex(values[i].x, values[i].y);
		endShape();
		
		// Connecting
		var p = createVector(x.x, y.y);
		values.unshift(p);
		line(x.x, x.y, p.x, p.y);
		line(y.x, y.y, p.x, p.y);
		
		// Time incrementation (dt)
		if (isRendering()) {
			time += (TWO_PI / signalY.length);
			if (time >= TWO_PI)
				if (looping) {
					time = 0;
					values = [];
				}
				else 
					state = STT_IDLE;
		}
		
	}
	// Drawing
	else {
			
		// Save user values 
		if ((mouseIsPressed) && (mouseInbounds())) {
			userValues.push(createVector(mouseX, mouseY));
			// Tutorial flag
			if (tutoVisible) {
				tutoVisible = false;
				showInstructions(false);
			}
		}
			
		// Draw
		stroke(50);
		beginShape();
		for (var v of userValues)
			vertex(v.x, v.y);
		endShape();
					
	}

}

/********************* Initialize ********************/

function initCanvas() {
	
	if ((img) && isDrawing()) {
		colorMode(RGB, 255);
		//tint(255, 126);
		image(img, 0, 0, width, height);
		tint(255,255);
	}
	else
		background(255);
	noFill();
	
	// Max orbits
	var k   = kSlider.value();
	var str = k + " Orbit";
	if (k > 1) str += "s";
	kSliderText.html(str);
	
	
}

function makeInstructions() {
	
	var labelSize = btnSize + 20;
	var offset    = [-10, -100];
	var c = "instructions",
		p = "infosDiv";
	
	var infoSize  = [650, 100];		
	var str = "<span class='bold'>Draw</span> in the canvas with the mouse.<br><br><span class='bold'>Drag & drop</span> an image to trace it.";
	createText(str, "dndInfo", p, [0,0], [0,0], infoSize[0], infoSize[1])
		.position(width / 2 - infoSize[0] / 2, height / 2 - infoSize[1]);
	createText("En/disable Loop", c, p, select('#btnLooping').position(),  offset,     labelSize, labelSize);
	createText("Sorting order",   c, p, select('#btnOrder').position(),    offset,     labelSize, labelSize);
	createText("Sorting param",   c, p, select('#btnSort').position(),     offset,     labelSize, labelSize);
	createText("Replay Cycles",   c, p, select('#btnReplay').position(),   offset,     labelSize, labelSize);
	createText("Clear Screen",    c, p, select('#btnClear').position(),    offset,     labelSize, labelSize);
	createText("Limit Orbits",    c, p, select('#kSliderText').position(), [20, -105], labelSize, labelSize);
	
	showInstructions(true);
		
}

function showInstructions(show) {
	tutoVisible = true;
	var txt = selectAll('p', divTuto);
	for (t of txt)
		if (show)
			t.removeClass('hidden');
		else
			t.addClass('hidden');
	
}

function createText(txt, clas, par, pos, off, w, h) {
	return createP(txt)
		.parent(par)
		.size(w, h)
		.position(pos.x + off[0], pos.y + off[1])
		.class(clas);
}

/*********************** Maths ***********************/

// Draws the epicycles corresponding to the [re, im, freq, amp, phase] array X
// Note  : Theta depends on global variable `time`
// Input : x,y (position) / X (DFT array) / Rotation
function cycles(x, y, X, rotation) {

	var px, py, theta, alpha;
	var alphaRange = [30, 200];

	var limit = kSlider.value();
	if ((limit > X.length) || (limit < 1))
		limit = X.length;
	
	for (var i = 0; i < limit; i++) {
		
		px = x;
		py = y;
		theta = X[i].f * time + X[i].phs + rotation;
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
	// Sort
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
	// Order
	if (sortOrder == SORT_DSC) {
		signalX.reverse();
		signalY.reverse();
	}
}

function compareRe(a,b)    { return b.re  - a.re;  }
function compareIm(a,b)    { return b.im  - a.im;  }
function compareAmp(a,b)   { return b.amp - a.amp; }
function compareFreq(a,b)  { return b.f   - a.f;   }
function comparePhase(a,b) { return b.phs - a.phs; }

/****************** Mouse methods ********************/

function mouseInbounds() { return ((mouseX >= 0) && (mouseX < width) && (mouseY >= 0) && (mouseY < height)); }

function mouseReleased() {
	
	if (isDrawing() && (userValues.length > 0)) {
		
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
		
		// Max orbits
		kSlider.attribute('max', signalX.length);
		kSlider.value(signalX.length);
		
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
		btnLooping.style("border-style", "inset");
		if (isIdle())
			state = STT_RENDER;
	}
	else
		btnLooping.style("border-style", "outset");
}

function pressSort() {
	
	switchRadio(sortIndex, 0);
	
	// Actual sort
	sortIndex = (sortIndex + 1) % sortLabels.length;
	sortSignal();
	// Button text
	btnSort.html(sortLabels[sortIndex]);
	
	switchRadio(sortIndex, 1);
	
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
	img        = null;
	showInstructions(true);
}

function pressOrder() {
	sortOrder = (sortOrder + 1) % sortOrders.length;
	// Actual sort
	sortSignal();
	// Button text
	btnOrder.html(sortOrders[sortOrder]);
}

function switchRadio(index, state) {
	// Check / enable next
	if (state) {
		radSort[index].removeAttribute('disabled');
		radSort[index].attribute('checked', 'true');
	}
	// Uncheck / disable previous
	else {
		radSort[index].removeAttribute('checked');
		radSort[index].attribute('disabled', 'true');
	}
}

/******************** Drag & Drop ********************/

function highlight(event)    { 
	event.preventDefault(); 
	canvas.addClass('highlight');
}
function unhighlight() { 
	canvas.removeClass('highlight'); 
}
function backgroundImg(file) { 
	img = createImg(file.data).hide(); 
	unhighlight();
}

/********************** State ***********************/

function isIdle()      { return (state == STT_IDLE)   };
function isDrawing()   { return (state == STT_DRAW)   };
function isRendering() { return (state == STT_RENDER) };