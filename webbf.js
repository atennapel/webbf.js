var webbf = (function() {
	// setZeroTimeout shim
	(function() {
		var timeouts = [];
		var messageName = 'zero-timeout-message';
		function setZeroTimeout(fn) {
			timeouts.push(fn);
			window.postMessage(messageName, '*');
		}
		function handleMessage(event) {
			if (event.source == window && event.data == messageName) {
				event.stopPropagation();
				if (timeouts.length > 0) {
					var fn = timeouts.shift();
					fn();
				}
			}
		}
		window.addEventListener('message', handleMessage, true);
		window.setZeroTimeout = setZeroTimeout;
	})();

	var SUB = -1, ADD = 1, LEFT = 2, RIGHT = 3;
	var OPEN = 4, CLOSE = 5, OUT = 6, IN = 7;
	var SELECT = 8, NOOP = 9, MATH = 10;
	var OUT_NUM = 11, IN_NUM = 12;

	function webbfSync(scr) {
		var a = optimize(scr), l = a.length;
		var state = {
			code: a,
			i: 0,
			tape: [],
			ptr: 0,
			element: typeof document !== 'undefined' && document.getElementById('id0')
		};
		for(;state.i < l; state.i++) step(state);
		return state.tape;
	};

	function webbfAsync(scr, cb) {
		var a = optimize(scr), l = a.length;
		var state = {
			code: a,
			i: 0,
			tape: [],
			ptr: 0,
			element: typeof document !== 'undefined' && document.getElementById('id0')
		};
		setZeroTimeout(function _to() {
			step(state);
			state.i++;
			if(state.i < l) setZeroTimeout(_to);
			else if(typeof cb === 'function') cb(state.tape);
		});
	};

	function _eval(scr, cb) {
		return cb? webbfAsync(scr, cb): webbfSync(scr);
	}

	function step(state) {
		var tape = state.tape;
		var t = state.code[state.i], c = t[0], n = t[1], p = t[2];
		if(p && c !== OPEN && c !== CLOSE) {
			state.ptr += p;
			if(state.ptr < 0) state.ptr = 0;
		}
		var ptr = state.ptr;
		tape[ptr] = tape[ptr] || 0;
		switch(c) {
			case MATH: tape[ptr] += n; break;
			case OPEN: if(tape[ptr] === 0) state.i = p; break;
			case CLOSE: if(tape[ptr] !== 0) state.i = p; break;

			case IN:
				if(state.element) tape[ptr] = getFromElement(state.element).charCodeAt(0);
				break;
			case OUT:
				if(state.element) addToElement(state.element, String.fromCharCode(tape[ptr]));
				break;
			case IN_NUM:
				if(state.element) tape[ptr] = (+getFromElement(state.element)) || 0;
				break;
			case OUT_NUM:
				if(state.element) addToElement(state.element, ''+tape[ptr]);
				break;
			case SELECT:
				state.element = typeof document !== 'undefined' && document.getElementById('id' + tape[ptr]);
				break;
		}
	};

	var elementProps = {INPUT: 'value', SELECT: 'value'};
	function getFromElement(element) {
		var prop = elementProps[element.tagName] || 'innerHTML';
		var t = (element[prop] || '').split('');
		var v = t.shift() || '';
		element[prop] = t.join('');
		return v;
	};

	function addToElement(element, v) {
		var prop = elementProps[element.tagName] || 'innerHTML';
		element[prop] += v;
	};

	function optimize(s) {
		var sw = {
			'+': ADD, '-': SUB,
			'<': LEFT, '>': RIGHT,
			'[': OPEN, ']': CLOSE,
			'.': OUT, ',': IN,
			':': OUT_NUM, ';': IN_NUM,
			'#': SELECT
		};
		for(var i = 0, l = s.length, r = []; i < l; i++) {
			var c = sw[s[i]];
			if(c) r.push(c);
		}
		r.push(NOOP);
		var ST_START = 0, ST_MATH = 1; 
		var st = ST_START, acc = 0, pacc = 0;
		for(var i = 0, l = r.length, rr = []; i < l; i++) {
			var c = r[i];
			if(st === ST_START) {
				if(c === LEFT) pacc--;
				else if(c === RIGHT) pacc++;
				else if(c === ADD || c === SUB) acc = c, st = ST_MATH;
				else if(c === IN ||
								c === OUT ||
								c === IN_NUM ||
								c === OUT_NUM ||
								c === SELECT) rr.push([c, 1, pacc]), pacc = 0;
				else if(c === OPEN) {
					if(pacc !== 0) rr.push([NOOP, 0, pacc]), pacc = 0;
					rr.push([OPEN, 1, -1]);
				}
				else if(c === CLOSE) {
					if(pacc !== 0) rr.push([NOOP, 0, pacc]), pacc = 0;
					rr.push([CLOSE, 1, -1]);
				}
			} else if(st === ST_MATH) {
				if(c !== ADD && c !== SUB)
					rr.push([MATH, acc, pacc]), pacc = 0, i--, st = ST_START;
				else acc += c;
			}
		}
		for(var i = 0, l = rr.length; i < l; i++) {
			var t = rr[i], c = t[0], p = t[2];
			if(c === OPEN) for(var j = i + 1, lv = 1; j < l; j++) {
				var nt = rr[j], nc = nt[0];
				if(nc === OPEN) lv++;
				else if(nc === CLOSE) {
					lv--;
					if(lv === 0) {
						t[2] = j;
						nt[2] = i;
						break;
					}
				}
			}
		}
		return rr;
	};

	if(typeof window !== 'undefined') window.addEventListener('load', function() {
		for(var i = 0, a = document.getElementsByTagName('script'), l = a.length; i < l; i++)
			if(a[i].type.toLowerCase() == 'text/webbf')
				_eval(a[i].innerHTML, true)
	}, false);

	return _eval;
})();
