(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint node:true, browser:true*/
/*globals define*/

'use strict';

(function () {
  'use strict';

  function RunningAverage() {
    this.denominator = 1;
    this.average = 0;
  }

  RunningAverage.prototype.push = function push(number) {
    var arr;
    if (arguments.length != 1) {
      arr = arguments;
    } else if (Array.isArray(number)) {
      arr = number;
    }
    if (arr) {
      for (var i = 0; i < arr.length; i++) {
        this.push(arr[i]);
      }
    } else {
      var orig = number;
      if (typeof number != 'number') {
        number = parseInt(number, 10);
      }
      if (isNaN(number)) {
        throw new TypeError("RunningAverage.push only accepts numbers, received: " + orig);
      }
      var diff = number - this.average;
      this.average = this.average + diff / this.denominator;
      this.denominator++;
    }
    return this;
  };

  RunningAverage.prototype.getAverage = function getAverage() {
    return this.average;
  };

  if (typeof module === 'object') {
    // node.js/common js
    module.exports = RunningAverage;
  } else if (typeof define === 'function') {
    // require.js/amd
    define([], RunningAverage);
  } else if (typeof window !== "undefined") {
    window.RunningAverage = RunningAverage;
  }
})();

},{}],2:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _subtractive = require('./subtractive');

var _subtractive2 = _interopRequireDefault(_subtractive);

var _runningAverageLibRunningAverageJs = require("./../../bower_components/running-average/lib/running-average.js");

var _runningAverageLibRunningAverageJs2 = _interopRequireDefault(_runningAverageLibRunningAverageJs);

(function () {
	window.addEventListener('load', function () {
		var PRESET_COUNT = 10;
		var SAMP_RATE = 44100;
		window.data = [];

		var _loop = function (i) {
			var ctx = new OfflineAudioContext(1, SAMP_RATE, SAMP_RATE);
			var averageCentroid = new _runningAverageLibRunningAverageJs2['default']();
			var averageRMS = new _runningAverageLibRunningAverageJs2['default']();
			var sub = new _subtractive2['default'](ctx, function (data) {
				averageCentroid.push(data.spectralCentroid / SAMP_RATE / 2);
				averageRMS.push(data.rms);
			});
			var faders = sub.getFaders();
			var outs = [];
			for (var _i = 0; _i < faders.length; _i++) {
				v = Math.random();
				value = v * (faders[_i].max - faders[_i].min) + faders[_i].min;

				faders[_i].handler(value);
				outs.push(v);
			}
			ctx.startRendering().then(function () {
				window.data.push({
					input: [averageCentroid.getAverage(), averageRMS.getAverage()],
					output: outs
				});
				ctx.close();
			});
		};

		for (var i = 0; i < PRESET_COUNT; i++) {
			var v;
			var value;

			_loop(i);
		}
	}, false);
})();

},{"./../../bower_components/running-average/lib/running-average.js":1,"./subtractive":3}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('./meyda.min');

var Subtractive = (function () {
	function Subtractive(context, meydaHandler) {
		_classCallCheck(this, Subtractive);

		this.ctx = context;
		this.nyquist = this.ctx.sampleRate / 2;
		this.osc1 = this.ctx.createOscillator();
		this.osc2 = this.ctx.createOscillator();
		this.lpf = this.ctx.createBiquadFilter();
		this.lpf.frequency.value = this.nyquist;
		this.gain1 = this.ctx.createGain();
		this.gain2 = this.ctx.createGain();
		this.gain3 = this.ctx.createGain();
		this.osc1.connect(this.gain1);
		this.osc2.connect(this.gain2);
		this.gain1.connect(this.lpf);
		this.gain2.connect(this.lpf);
		this.lpf.connect(this.gain3);
		this.gain3.connect(this.ctx.destination);

		this.meyda = new Meyda({
			audioContext: this.ctx,
			source: this.gain3,
			bufferSize: 512,
			callback: meydaHandler,
			featureExtractors: ['rms', 'spectralCentroid'],
			startImmediately: true
		});
		this.osc1.start();
		this.osc2.start();
	}

	_createClass(Subtractive, [{
		key: 'getFaders',
		value: function getFaders() {
			var _this = this;

			var faders = [];
			var oscillatorTypes = ["sine", "square", "sawtooth", "triangle"];

			var oscillators = [this.osc1, this.osc2];
			var gains = [this.gain1, this.gain2];
			for (var i = 0; i < oscillators.length; i++) {
				var oscillator = oscillators[i];
				var gain = gains[i];
				faders.push({
					min: -100,
					max: 100,
					value: oscillator.detune.value,
					handler: function handler(value) {
						oscillator.detune.value = value;
					}
				});
				faders.push({
					key: 'oscillator' + i + 'Type',
					label: 'Oscillator #' + i + ' Type',
					min: 0,
					max: 3,
					value: oscillatorTypes.indexOf(oscillator.type),
					handler: function handler(value) {
						oscillator.type = oscillatorTypes[Math.round(value)];
					}
				});
				faders.push({
					key: 'oscillator' + i + 'Gain',
					label: 'Oscillator #' + i + ' Gain',
					min: 0,
					max: 1,
					value: gain.gain.value,
					handler: function handler(value) {
						gain.gain.value = value;
					}
				});
			}
			// filter params
			faders.push({
				key: 'filterFreq',
				label: 'Filter Frequency',
				min: 50,
				max: this.nyquist,
				value: this.lpf.frequency.value,
				step: 1,
				handler: function handler(value) {
					_this.lpf.frequency.value = value;
				}
			});
			faders.push({
				key: 'filterQ',
				label: 'Filter Resonance',
				min: 0,
				max: 20,
				value: this.lpf.Q.value,
				step: 0.01,
				handler: function handler(value) {
					_this.lpf.Q.value = value;
				}
			});
			faders.push({
				key: 'filterGain',
				label: 'Final Gain',
				min: 0,
				max: 1,
				value: this.gain3.gain.value,
				step: 0.01,
				handler: function handler(value) {
					_this.gain3.gain.value = value;
				}
			});

			return faders;
		}
	}]);

	return Subtractive;
})();

exports['default'] = Subtractive;
module.exports = exports['default'];

},{"./meyda.min":4}],4:[function(require,module,exports){
(function (global){
"use strict";

!(function t(e, r, n) {
  function o(i, u) {
    if (!r[i]) {
      if (!e[i]) {
        var s = "function" == typeof require && require;if (!u && s) return s(i, !0);if (a) return a(i, !0);var c = new Error("Cannot find module '" + i + "'");throw (c.code = "MODULE_NOT_FOUND", c);
      }var f = r[i] = { exports: {} };e[i][0].call(f.exports, function (t) {
        var r = e[i][1][t];return o(r ? r : t);
      }, f, f.exports, t, e, r, n);
    }return r[i].exports;
  }for (var a = "function" == typeof require && require, i = 0; i < n.length; i++) o(n[i]);return o;
})({ 1: [function (t, e, r) {
    function n(t, e) {
      return m.isUndefined(e) ? "" + e : m.isNumber(e) && !isFinite(e) ? e.toString() : m.isFunction(e) || m.isRegExp(e) ? e.toString() : e;
    }function o(t, e) {
      return m.isString(t) ? t.length < e ? t : t.slice(0, e) : t;
    }function a(t) {
      return o(JSON.stringify(t.actual, n), 128) + " " + t.operator + " " + o(JSON.stringify(t.expected, n), 128);
    }function i(t, e, r, n, o) {
      throw new d.AssertionError({ message: r, actual: t, expected: e, operator: n, stackStartFunction: o });
    }function u(t, e) {
      t || i(t, !0, e, "==", d.ok);
    }function s(t, e) {
      if (t === e) return !0;if (m.isBuffer(t) && m.isBuffer(e)) {
        if (t.length != e.length) return !1;for (var r = 0; r < t.length; r++) if (t[r] !== e[r]) return !1;return !0;
      }return m.isDate(t) && m.isDate(e) ? t.getTime() === e.getTime() : m.isRegExp(t) && m.isRegExp(e) ? t.source === e.source && t.global === e.global && t.multiline === e.multiline && t.lastIndex === e.lastIndex && t.ignoreCase === e.ignoreCase : m.isObject(t) || m.isObject(e) ? f(t, e) : t == e;
    }function c(t) {
      return "[object Arguments]" == Object.prototype.toString.call(t);
    }function f(t, e) {
      if (m.isNullOrUndefined(t) || m.isNullOrUndefined(e)) return !1;if (t.prototype !== e.prototype) return !1;if (m.isPrimitive(t) || m.isPrimitive(e)) return t === e;var r = c(t),
          n = c(e);if (r && !n || !r && n) return !1;if (r) return (t = y.call(t), e = y.call(e), s(t, e));var o,
          a,
          i = g(t),
          u = g(e);if (i.length != u.length) return !1;for (i.sort(), u.sort(), a = i.length - 1; a >= 0; a--) if (i[a] != u[a]) return !1;for (a = i.length - 1; a >= 0; a--) if ((o = i[a], !s(t[o], e[o]))) return !1;return !0;
    }function l(t, e) {
      return t && e ? "[object RegExp]" == Object.prototype.toString.call(e) ? e.test(t) : t instanceof e ? !0 : e.call({}, t) === !0 ? !0 : !1 : !1;
    }function p(t, e, r, n) {
      var o;m.isString(r) && (n = r, r = null);try {
        e();
      } catch (a) {
        o = a;
      }if ((n = (r && r.name ? " (" + r.name + ")." : ".") + (n ? " " + n : "."), t && !o && i(o, r, "Missing expected exception" + n), !t && l(o, r) && i(o, r, "Got unwanted exception" + n), t && o && r && !l(o, r) || !t && o)) throw o;
    }var m = t("util/"),
        y = Array.prototype.slice,
        h = Object.prototype.hasOwnProperty,
        d = e.exports = u;d.AssertionError = function (t) {
      this.name = "AssertionError", this.actual = t.actual, this.expected = t.expected, this.operator = t.operator, t.message ? (this.message = t.message, this.generatedMessage = !1) : (this.message = a(this), this.generatedMessage = !0);var e = t.stackStartFunction || i;if (Error.captureStackTrace) Error.captureStackTrace(this, e);else {
        var r = new Error();if (r.stack) {
          var n = r.stack,
              o = e.name,
              u = n.indexOf("\n" + o);if (u >= 0) {
            var s = n.indexOf("\n", u + 1);n = n.substring(s + 1);
          }this.stack = n;
        }
      }
    }, m.inherits(d.AssertionError, Error), d.fail = i, d.ok = u, d.equal = function (t, e, r) {
      t != e && i(t, e, r, "==", d.equal);
    }, d.notEqual = function (t, e, r) {
      t == e && i(t, e, r, "!=", d.notEqual);
    }, d.deepEqual = function (t, e, r) {
      s(t, e) || i(t, e, r, "deepEqual", d.deepEqual);
    }, d.notDeepEqual = function (t, e, r) {
      s(t, e) && i(t, e, r, "notDeepEqual", d.notDeepEqual);
    }, d.strictEqual = function (t, e, r) {
      t !== e && i(t, e, r, "===", d.strictEqual);
    }, d.notStrictEqual = function (t, e, r) {
      t === e && i(t, e, r, "!==", d.notStrictEqual);
    }, d["throws"] = function (t, e, r) {
      p.apply(this, [!0].concat(y.call(arguments)));
    }, d.doesNotThrow = function (t, e) {
      p.apply(this, [!1].concat(y.call(arguments)));
    }, d.ifError = function (t) {
      if (t) throw t;
    };var g = Object.keys || function (t) {
      var e = [];for (var r in t) h.call(t, r) && e.push(r);return e;
    };
  }, { "util/": 9 }], 2: [function (t, e, r) {
    e.exports = t("./src/dct.js");
  }, { "./src/dct.js": 3 }], 3: [function (t, e, r) {
    function n(t, e) {
      var r = t.length;e = e || 2, cosMap && cosMap[r] || o(r);var n = t.map(function () {
        return 0;
      });return n.map(function (n, o) {
        return e * t.reduce(function (t, e, n, a) {
          return t + e * cosMap[r][n + o * r];
        }, 0);
      });
    }cosMap = null;var o = function o(t) {
      cosMap = cosMap || {}, cosMap[t] = new Array(t * t);for (var e = Math.PI / t, r = 0; t > r; r++) for (var n = 0; t > n; n++) cosMap[t][n + r * t] = Math.cos(e * (n + .5) * r);
    };e.exports = n;
  }, {}], 4: [function (t, e, r) {
    "function" == typeof Object.create ? e.exports = function (t, e) {
      t.super_ = e, t.prototype = Object.create(e.prototype, { constructor: { value: t, enumerable: !1, writable: !0, configurable: !0 } });
    } : e.exports = function (t, e) {
      t.super_ = e;var r = function r() {};r.prototype = e.prototype, t.prototype = new r(), t.prototype.constructor = t;
    };
  }, {}], 5: [function (t, e, r) {
    "use strict";!(function (t, e) {
      function r(t) {
        return (t.forEach || (t.forEach = function (t) {
          var e,
              r = this.length;for (e = 0; r > e; e++) t(this[e], e, r);
        }), t);
      }var n,
          o,
          a = Float32Array,
          i = Math.sqrt,
          u = function u(t) {
        return Math.pow(t, 2);
      };t.isComplexArray = n = function (t) {
        return t !== e && t.hasOwnProperty !== e && t.hasOwnProperty("real") && t.hasOwnProperty("imag");
      }, t.ComplexArray = o = function (t, e) {
        n(t) ? (this.ArrayType = t.ArrayType, this.real = new this.ArrayType(t.real), this.imag = new this.ArrayType(t.imag)) : (this.ArrayType = e || a, this.real = new this.ArrayType(t), this.imag = new this.ArrayType(this.real.length)), this.length = this.real.length;
      }, o.prototype.toString = function () {
        var t = [];return (this.forEach(function (e, r) {
          t.push("(" + e.real.toFixed(2) + "," + e.imag.toFixed(2) + ")");
        }), "[" + t.join(",") + "]");
      }, o.prototype.map = function (t) {
        var e,
            r = this.length,
            n = {};for (e = 0; r > e; e++) n.real = this.real[e], n.imag = this.imag[e], t(n, e, r), this.real[e] = n.real, this.imag[e] = n.imag;return this;
      }, o.prototype.forEach = function (t) {
        var e,
            r = this.length,
            n = {};for (e = 0; r > e; e++) n.real = this.real[e], n.imag = this.imag[e], t(n, e, r);
      }, o.prototype.conjugate = function () {
        return new o(this).map(function (t) {
          t.imag *= -1;
        });
      }, o.prototype.magnitude = function () {
        var t = new this.ArrayType(this.length);return (this.forEach(function (e, r) {
          t[r] = i(u(e.real) + u(e.imag));
        }), r(t));
      };
    })("undefined" == typeof r && (this.complex_array = {}) || r);
  }, {}], 6: [function (t, e, r) {
    "use strict";!(function (t, e) {
      function r(t) {
        return e.isComplexArray(t) && t || new c(t);
      }function n(t, e) {
        var r = t.length;return r & r - 1 ? o(t, e) : a(t, e);
      }function o(t, e) {
        var r,
            o,
            a,
            i,
            u,
            l,
            h,
            d,
            g,
            b,
            S,
            v,
            w,
            x,
            _ = t.length;if (1 === _) return t;for (a = new c(_, t.ArrayType), d = s(_), g = _ / d, b = 1 / p(d), S = new c(g, t.ArrayType), o = 0; d > o; o++) {
          for (r = 0; g > r; r++) S.real[r] = t.real[r * d + o], S.imag[r] = t.imag[r * d + o];for (g > 1 && (S = n(S, e)), l = m(2 * f * o / _), h = (e ? -1 : 1) * y(2 * f * o / _), i = 1, u = 0, r = 0; _ > r; r++) w = S.real[r % g], x = S.imag[r % g], a.real[r] += i * w - u * x, a.imag[r] += i * x + u * w, v = i * l - u * h, u = i * h + u * l, i = v;
        }for (r = 0; _ > r; r++) t.real[r] = b * a.real[r], t.imag[r] = b * a.imag[r];return t;
      }function a(t, e) {
        var r,
            n,
            o,
            a,
            i,
            s,
            c,
            p,
            h,
            d,
            g,
            b,
            S,
            v,
            w,
            x,
            _,
            M = t.length;for (o = u(t), a = o.real, i = o.imag, _ = 1; M > _;) {
          for (p = m(f / _), h = (e ? -1 : 1) * y(f / _), r = 0; M / (2 * _) > r; r++) for (s = 1, c = 0, n = 0; _ > n; n++) g = 2 * r * _ + n, b = g + _, S = a[g], v = i[g], w = s * a[b] - c * i[b], x = c * a[b] + s * i[b], a[g] = l * (S + w), i[g] = l * (v + x), a[b] = l * (S - w), i[b] = l * (v - x), d = s * p - c * h, c = s * h + c * p, s = d;_ <<= 1;
        }return o;
      }function i(t, e) {
        for (var r = 0; e > 1;) r <<= 1, r += 1 & t, t >>= 1, e >>= 1;return r;
      }function u(t) {
        var e,
            r,
            n = t.length,
            o = {};for (r = 0; n > r; r++) {
          var a = i(r, n);o.hasOwnProperty(r) || o.hasOwnProperty(a) || (e = t.real[a], t.real[a] = t.real[r], t.real[r] = e, e = t.imag[a], t.imag[a] = t.imag[r], t.imag[r] = e, o[r] = o[a] = !0);
        }return t;
      }function s(t) {
        for (var e = 3, r = p(t); r >= e;) {
          if (t % e === 0) return e;e += 2;
        }return t;
      }var c = e.ComplexArray,
          f = Math.PI,
          l = Math.SQRT1_2,
          p = Math.sqrt,
          m = Math.cos,
          y = Math.sin;c.prototype.FFT = function () {
        return n(this, !1);
      }, t.FFT = function (t) {
        return r(t).FFT();
      }, c.prototype.InvFFT = function () {
        return n(this, !0);
      }, t.InvFFT = function (t) {
        return r(t).InvFFT();
      }, c.prototype.frequencyMap = function (t) {
        return this.FFT().map(t).InvFFT();
      }, t.frequencyMap = function (t, e) {
        return r(t).frequencyMap(e);
      };
    })("undefined" == typeof r && (this.fft = {}) || r, "undefined" == typeof t && this.complex_array || t("./complex_array"));
  }, { "./complex_array": 5 }], 7: [function (t, e, r) {
    function n() {
      f = !1, u.length ? c = u.concat(c) : l = -1, c.length && o();
    }function o() {
      if (!f) {
        var t = setTimeout(n);f = !0;for (var e = c.length; e;) {
          for (u = c, c = []; ++l < e;) u && u[l].run();l = -1, e = c.length;
        }u = null, f = !1, clearTimeout(t);
      }
    }function a(t, e) {
      this.fun = t, this.array = e;
    }function i() {}var u,
        s = e.exports = {},
        c = [],
        f = !1,
        l = -1;s.nextTick = function (t) {
      var e = new Array(arguments.length - 1);if (arguments.length > 1) for (var r = 1; r < arguments.length; r++) e[r - 1] = arguments[r];c.push(new a(t, e)), 1 !== c.length || f || setTimeout(o, 0);
    }, a.prototype.run = function () {
      this.fun.apply(null, this.array);
    }, s.title = "browser", s.browser = !0, s.env = {}, s.argv = [], s.version = "", s.versions = {}, s.on = i, s.addListener = i, s.once = i, s.off = i, s.removeListener = i, s.removeAllListeners = i, s.emit = i, s.binding = function (t) {
      throw new Error("process.binding is not supported");
    }, s.cwd = function () {
      return "/";
    }, s.chdir = function (t) {
      throw new Error("process.chdir is not supported");
    }, s.umask = function () {
      return 0;
    };
  }, {}], 8: [function (t, e, r) {
    e.exports = function (t) {
      return t && "object" == typeof t && "function" == typeof t.copy && "function" == typeof t.fill && "function" == typeof t.readUInt8;
    };
  }, {}], 9: [function (t, e, r) {
    (function (e, n) {
      function o(t, e) {
        var n = { seen: [], stylize: i };return (arguments.length >= 3 && (n.depth = arguments[2]), arguments.length >= 4 && (n.colors = arguments[3]), h(e) ? n.showHidden = e : e && r._extend(n, e), w(n.showHidden) && (n.showHidden = !1), w(n.depth) && (n.depth = 2), w(n.colors) && (n.colors = !1), w(n.customInspect) && (n.customInspect = !0), n.colors && (n.stylize = a), s(n, t, n.depth));
      }function a(t, e) {
        var r = o.styles[e];return r ? "[" + o.colors[r][0] + "m" + t + "[" + o.colors[r][1] + "m" : t;
      }function i(t, e) {
        return t;
      }function u(t) {
        var e = {};return (t.forEach(function (t, r) {
          e[t] = !0;
        }), e);
      }function s(t, e, n) {
        if (t.customInspect && e && j(e.inspect) && e.inspect !== r.inspect && (!e.constructor || e.constructor.prototype !== e)) {
          var o = e.inspect(n, t);return (S(o) || (o = s(t, o, n)), o);
        }var a = c(t, e);if (a) return a;var i = Object.keys(e),
            h = u(i);if ((t.showHidden && (i = Object.getOwnPropertyNames(e)), E(e) && (i.indexOf("message") >= 0 || i.indexOf("description") >= 0))) return f(e);if (0 === i.length) {
          if (j(e)) {
            var d = e.name ? ": " + e.name : "";return t.stylize("[Function" + d + "]", "special");
          }if (x(e)) return t.stylize(RegExp.prototype.toString.call(e), "regexp");if (M(e)) return t.stylize(Date.prototype.toString.call(e), "date");if (E(e)) return f(e);
        }var g = "",
            b = !1,
            v = ["{", "}"];if ((y(e) && (b = !0, v = ["[", "]"]), j(e))) {
          var w = e.name ? ": " + e.name : "";g = " [Function" + w + "]";
        }if ((x(e) && (g = " " + RegExp.prototype.toString.call(e)), M(e) && (g = " " + Date.prototype.toUTCString.call(e)), E(e) && (g = " " + f(e)), 0 === i.length && (!b || 0 == e.length))) return v[0] + g + v[1];if (0 > n) return x(e) ? t.stylize(RegExp.prototype.toString.call(e), "regexp") : t.stylize("[Object]", "special");t.seen.push(e);var _;return (_ = b ? l(t, e, n, h, i) : i.map(function (r) {
          return p(t, e, n, h, r, b);
        }), t.seen.pop(), m(_, g, v));
      }function c(t, e) {
        if (w(e)) return t.stylize("undefined", "undefined");if (S(e)) {
          var r = "'" + JSON.stringify(e).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";return t.stylize(r, "string");
        }return b(e) ? t.stylize("" + e, "number") : h(e) ? t.stylize("" + e, "boolean") : d(e) ? t.stylize("null", "null") : void 0;
      }function f(t) {
        return "[" + Error.prototype.toString.call(t) + "]";
      }function l(t, e, r, n, o) {
        for (var a = [], i = 0, u = e.length; u > i; ++i) k(e, String(i)) ? a.push(p(t, e, r, n, String(i), !0)) : a.push("");return (o.forEach(function (o) {
          o.match(/^\d+$/) || a.push(p(t, e, r, n, o, !0));
        }), a);
      }function p(t, e, r, n, o, a) {
        var i, u, c;if ((c = Object.getOwnPropertyDescriptor(e, o) || { value: e[o] }, c.get ? u = c.set ? t.stylize("[Getter/Setter]", "special") : t.stylize("[Getter]", "special") : c.set && (u = t.stylize("[Setter]", "special")), k(n, o) || (i = "[" + o + "]"), u || (t.seen.indexOf(c.value) < 0 ? (u = d(r) ? s(t, c.value, null) : s(t, c.value, r - 1), u.indexOf("\n") > -1 && (u = a ? u.split("\n").map(function (t) {
          return "  " + t;
        }).join("\n").substr(2) : "\n" + u.split("\n").map(function (t) {
          return "   " + t;
        }).join("\n"))) : u = t.stylize("[Circular]", "special")), w(i))) {
          if (a && o.match(/^\d+$/)) return u;i = JSON.stringify("" + o), i.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (i = i.substr(1, i.length - 2), i = t.stylize(i, "name")) : (i = i.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), i = t.stylize(i, "string"));
        }return i + ": " + u;
      }function m(t, e, r) {
        var n = 0,
            o = t.reduce(function (t, e) {
          return (n++, e.indexOf("\n") >= 0 && n++, t + e.replace(/\u001b\[\d\d?m/g, "").length + 1);
        }, 0);return o > 60 ? r[0] + ("" === e ? "" : e + "\n ") + " " + t.join(",\n  ") + " " + r[1] : r[0] + e + " " + t.join(", ") + " " + r[1];
      }function y(t) {
        return Array.isArray(t);
      }function h(t) {
        return "boolean" == typeof t;
      }function d(t) {
        return null === t;
      }function g(t) {
        return null == t;
      }function b(t) {
        return "number" == typeof t;
      }function S(t) {
        return "string" == typeof t;
      }function v(t) {
        return "symbol" == typeof t;
      }function w(t) {
        return void 0 === t;
      }function x(t) {
        return _(t) && "[object RegExp]" === T(t);
      }function _(t) {
        return "object" == typeof t && null !== t;
      }function M(t) {
        return _(t) && "[object Date]" === T(t);
      }function E(t) {
        return _(t) && ("[object Error]" === T(t) || t instanceof Error);
      }function j(t) {
        return "function" == typeof t;
      }function O(t) {
        return null === t || "boolean" == typeof t || "number" == typeof t || "string" == typeof t || "symbol" == typeof t || "undefined" == typeof t;
      }function T(t) {
        return Object.prototype.toString.call(t);
      }function A(t) {
        return 10 > t ? "0" + t.toString(10) : t.toString(10);
      }function F() {
        var t = new Date(),
            e = [A(t.getHours()), A(t.getMinutes()), A(t.getSeconds())].join(":");return [t.getDate(), C[t.getMonth()], e].join(" ");
      }function k(t, e) {
        return Object.prototype.hasOwnProperty.call(t, e);
      }var z = /%[sdj%]/g;r.format = function (t) {
        if (!S(t)) {
          for (var e = [], r = 0; r < arguments.length; r++) e.push(o(arguments[r]));return e.join(" ");
        }for (var r = 1, n = arguments, a = n.length, i = String(t).replace(z, function (t) {
          if ("%%" === t) return "%";if (r >= a) return t;switch (t) {case "%s":
              return String(n[r++]);case "%d":
              return Number(n[r++]);case "%j":
              try {
                return JSON.stringify(n[r++]);
              } catch (e) {
                return "[Circular]";
              }default:
              return t;}
        }), u = n[r]; a > r; u = n[++r]) i += d(u) || !_(u) ? " " + u : " " + o(u);return i;
      }, r.deprecate = function (t, o) {
        function a() {
          if (!i) {
            if (e.throwDeprecation) throw new Error(o);e.traceDeprecation ? console.trace(o) : console.error(o), i = !0;
          }return t.apply(this, arguments);
        }if (w(n.process)) return function () {
          return r.deprecate(t, o).apply(this, arguments);
        };if (e.noDeprecation === !0) return t;var i = !1;return a;
      };var P,
          R = {};r.debuglog = function (t) {
        if ((w(P) && (P = e.env.NODE_DEBUG || ""), t = t.toUpperCase(), !R[t])) if (new RegExp("\\b" + t + "\\b", "i").test(P)) {
          var n = e.pid;R[t] = function () {
            var e = r.format.apply(r, arguments);console.error("%s %d: %s", t, n, e);
          };
        } else R[t] = function () {};return R[t];
      }, r.inspect = o, o.colors = { bold: [1, 22], italic: [3, 23], underline: [4, 24], inverse: [7, 27], white: [37, 39], grey: [90, 39], black: [30, 39], blue: [34, 39], cyan: [36, 39], green: [32, 39], magenta: [35, 39], red: [31, 39], yellow: [33, 39] }, o.styles = { special: "cyan", number: "yellow", "boolean": "yellow", undefined: "grey", "null": "bold", string: "green", date: "magenta", regexp: "red" }, r.isArray = y, r.isBoolean = h, r.isNull = d, r.isNullOrUndefined = g, r.isNumber = b, r.isString = S, r.isSymbol = v, r.isUndefined = w, r.isRegExp = x, r.isObject = _, r.isDate = M, r.isError = E, r.isFunction = j, r.isPrimitive = O, r.isBuffer = t("./support/isBuffer");var C = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];r.log = function () {
        console.log("%s - %s", F(), r.format.apply(r, arguments));
      }, r.inherits = t("inherits"), r._extend = function (t, e) {
        if (!e || !_(e)) return t;for (var r = Object.keys(e), n = r.length; n--;) t[r[n]] = e[r[n]];return t;
      };
    }).call(this, t("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
  }, { "./support/isBuffer": 8, _process: 7, inherits: 4 }], 10: [function (t, e, r) {
    "use strict";function n(t) {
      if (t && t.__esModule) return t;var e = {};if (null != t) for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r]);return (e["default"] = t, e);
    }Object.defineProperty(r, "__esModule", { value: !0 });var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== o(arguments[0].signal)) throw new TypeError();for (var t = 0, e = 0; e < arguments[0].signal.length; e++) t += Math.pow(Math.abs(arguments[0].signal[e]), 2);return t;
    };var a = t("assert");n(a);e.exports = r["default"];
  }, { assert: 1 }], 11: [function (t, e, r) {
    "use strict";function n(t, e) {
      for (var r = 0, n = 0, o = 0; o < e.length; o++) r += Math.pow(o, t) * Math.abs(e[o]), n += e[o];return r / n;
    }Object.defineProperty(r, "__esModule", { value: !0 }), r.mu = n;
  }, {}], 12: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function (t) {
      if ("object" !== n(t.ampSpectrum) || "object" !== n(t.barkScale)) throw new TypeError();var e = 24,
          r = new Float32Array(e),
          o = 0,
          a = t.ampSpectrum,
          i = new Int32Array(e + 1);i[0] = 0;for (var u = t.barkScale[a.length - 1] / e, s = 1, c = 0; c < a.length; c++) for (; t.barkScale[c] > u;) i[s++] = c, u = s * t.barkScale[a.length - 1] / e;i[e] = a.length - 1;for (var c = 0; e > c; c++) {
        for (var f = 0, l = i[c]; l < i[c + 1]; l++) f += a[l];r[c] = Math.pow(f, .23);
      }for (var c = 0; c < r.length; c++) o += r[c];return { specific: r, total: o };
    }, e.exports = r["default"];
  }, {}], 13: [function (t, e, r) {
    "use strict";function n(t) {
      return t && t.__esModule ? t : { "default": t };
    }Object.defineProperty(r, "__esModule", { value: !0 });var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function (t) {
      if ("object" !== o(t.ampSpectrum) || "object" !== o(t.melFilterBank)) throw new TypeError();for (var e = (0, i["default"])(t), r = t.melFilterBank.length, n = Array(r), a = new Float32Array(r), u = 0; u < a.length; u++) {
        n[u] = new Float32Array(t.bufferSize / 2), a[u] = 0;for (var c = 0; c < t.bufferSize / 2; c++) n[u][c] = t.melFilterBank[u][c] * e[c], a[u] += n[u][c];a[u] = a[u] > 1e-5 ? Math.log(a[u]) : 0;
      }var f = Array.prototype.slice.call(a),
          l = s(f),
          p = new Float32Array(l);return p;
    };var a = t("./powerSpectrum"),
        i = n(a),
        u = t("./../utilities"),
        s = (n(u), t("dct"));e.exports = r["default"];
  }, { "./../utilities": 29, "./powerSpectrum": 16, dct: 2 }], 14: [function (t, e, r) {
    "use strict";function n(t) {
      return t && t.__esModule ? t : { "default": t };
    }Object.defineProperty(r, "__esModule", { value: !0 });var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== o(arguments[0].signal)) throw new TypeError();for (var t = (0, i["default"])(arguments[0]), e = t.specific, r = 0, n = 0; n < e.length; n++) r += 15 > n ? (n + 1) * e[n + 1] : .066 * Math.exp(.171 * (n + 1));return r *= .11 / t.total;
    };var a = t("./loudness"),
        i = n(a);e.exports = r["default"];
  }, { "./loudness": 12 }], 15: [function (t, e, r) {
    "use strict";function n(t) {
      return t && t.__esModule ? t : { "default": t };
    }Object.defineProperty(r, "__esModule", { value: !0 });var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== o(arguments[0].signal)) throw new TypeError();for (var t = (0, i["default"])(arguments[0]), e = 0, r = 0; r < t.specific.length; r++) t.specific[r] > e && (e = t.specific[r]);var n = Math.pow((t.total - e) / t.total, 2);return n;
    };var a = t("./loudness"),
        i = n(a);e.exports = r["default"];
  }, { "./loudness": 12 }], 16: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== n(arguments[0].ampSpectrum)) throw new TypeError();for (var t = new Float32Array(arguments[0].ampSpectrum.length), e = 0; e < t.length; e++) t[e] = Math.pow(arguments[0].ampSpectrum[e], 2);return t;
    }, e.exports = r["default"];
  }, {}], 17: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function (t) {
      if ("object" !== n(t.signal)) throw new TypeError();for (var e = 0, r = 0; r < t.signal.length; r++) e += Math.pow(t.signal[r], 2);return (e /= t.signal.length, e = Math.sqrt(e));
    }, e.exports = r["default"];
  }, {}], 18: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== n(arguments[0].ampSpectrum)) throw new TypeError();return (0, o.mu)(1, arguments[0].ampSpectrum);
    };var o = t("./extractorUtilities");e.exports = r["default"];
  }, { "./extractorUtilities": 11 }], 19: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== n(arguments[0].ampSpectrum)) throw new TypeError();for (var t = 0, e = 0, r = 0; r < arguments[0].ampSpectrum.length; r++) t += Math.log(arguments[0].ampSpectrum[r]), e += arguments[0].ampSpectrum[r];return Math.exp(t / arguments[0].ampSpectrum.length) * arguments[0].ampSpectrum.length / e;
    }, e.exports = r["default"];
  }, {}], 20: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== n(arguments[0].ampSpectrum)) throw new TypeError();var t = arguments[0].ampSpectrum,
          e = (0, o.mu)(1, t),
          r = (0, o.mu)(2, t),
          a = (0, o.mu)(3, t),
          i = (0, o.mu)(4, t),
          u = -3 * Math.pow(e, 4) + 6 * e * r - 4 * e * a + i,
          s = Math.pow(Math.sqrt(r - Math.pow(e, 2)), 4);return u / s;
    };var o = t("./extractorUtilities");e.exports = r["default"];
  }, { "./extractorUtilities": 11 }], 21: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== n(arguments[0].ampSpectrum)) throw new TypeError();for (var t = arguments[0].ampSpectrum, e = arguments[0].sampleRate / (2 * (t.length - 1)), r = 0, o = 0; o < t.length; o++) r += t[o];for (var a = .99 * r, i = t.length - 1; r > a && i >= 0;) r -= t[i], --i;return (i + 1) * e;
    }, e.exports = r["default"];
  }, {}], 22: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function (t) {
      if ("object" !== n(t.ampSpectrum)) throw new TypeError();var e = (0, o.mu)(1, t.ampSpectrum),
          r = (0, o.mu)(2, t.ampSpectrum),
          a = (0, o.mu)(3, t.ampSpectrum),
          i = 2 * Math.pow(e, 3) - 3 * e * r + a,
          u = Math.pow(Math.sqrt(r - Math.pow(e, 2)), 3);return i / u;
    };var o = t("./extractorUtilities");e.exports = r["default"];
  }, { "./extractorUtilities": 11 }], 23: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function (t) {
      if ("object" !== n(t.ampSpectrum)) throw new TypeError();for (var e = 0, r = 0, o = new Float32Array(t.ampSpectrum.length), a = 0, i = 0, u = 0; u < t.ampSpectrum.length; u++) {
        e += t.ampSpectrum[u];var s = u * t.sampleRate / t.bufferSize;o[u] = s, a += s * s, r += s, i += s * t.ampSpectrum[u];
      }return (t.ampSpectrum.length * i - r * e) / (e * (a - Math.pow(r, 2)));
    }, e.exports = r["default"];
  }, {}], 24: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function (t) {
      if ("object" !== n(t.ampSpectrum)) throw new TypeError();return Math.sqrt((0, o.mu)(2, t.ampSpectrum) - Math.pow((0, o.mu)(1, t.ampSpectrum), 2));
    };var o = t("./extractorUtilities");e.exports = r["default"];
  }, { "./extractorUtilities": 11 }], 25: [function (t, e, r) {
    "use strict";Object.defineProperty(r, "__esModule", { value: !0 });var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    };r["default"] = function () {
      if ("object" !== n(arguments[0].signal)) throw new TypeError();for (var t = 0, e = 0; e < arguments[0].signal.length; e++) (arguments[0].signal[e] >= 0 && arguments[0].signal[e + 1] < 0 || arguments[0].signal[e] < 0 && arguments[0].signal[e + 1] >= 0) && t++;return t;
    }, e.exports = r["default"];
  }, {}], 26: [function (t, e, r) {
    "use strict";function n(t) {
      return t && t.__esModule ? t : { "default": t };
    }Object.defineProperty(r, "__esModule", { value: !0 });var o = t("./extractors/rms"),
        a = n(o),
        i = t("./extractors/energy"),
        u = n(i),
        s = t("./extractors/spectralSlope"),
        c = n(s),
        f = t("./extractors/spectralCentroid"),
        l = n(f),
        p = t("./extractors/spectralRolloff"),
        m = n(p),
        y = t("./extractors/spectralFlatness"),
        h = n(y),
        d = t("./extractors/spectralSpread"),
        g = n(d),
        b = t("./extractors/spectralSkewness"),
        S = n(b),
        v = t("./extractors/spectralKurtosis"),
        w = n(v),
        x = t("./extractors/zcr"),
        _ = n(x),
        M = t("./extractors/loudness"),
        E = n(M),
        j = t("./extractors/perceptualSpread"),
        O = n(j),
        T = t("./extractors/perceptualSharpness"),
        A = n(T),
        F = t("./extractors/mfcc"),
        k = n(F),
        z = t("./extractors/powerSpectrum"),
        P = n(z);r["default"] = { buffer: function buffer(t) {
        return t.signal;
      }, rms: a["default"], energy: u["default"], complexSpectrum: function complexSpectrum(t) {
        return t.complexSpectrum;
      }, spectralSlope: c["default"], spectralCentroid: l["default"], spectralRolloff: m["default"], spectralFlatness: h["default"], spectralSpread: g["default"], spectralSkewness: S["default"], spectralKurtosis: w["default"], amplitudeSpectrum: function amplitudeSpectrum(t) {
        return t.ampSpectrum;
      }, zcr: _["default"], loudness: E["default"], perceptualSpread: O["default"], perceptualSharpness: A["default"], powerSpectrum: P["default"], mfcc: k["default"] }, e.exports = r["default"];
  }, { "./extractors/energy": 10, "./extractors/loudness": 12, "./extractors/mfcc": 13, "./extractors/perceptualSharpness": 14, "./extractors/perceptualSpread": 15, "./extractors/powerSpectrum": 16, "./extractors/rms": 17, "./extractors/spectralCentroid": 18, "./extractors/spectralFlatness": 19, "./extractors/spectralKurtosis": 20, "./extractors/spectralRolloff": 21, "./extractors/spectralSkewness": 22, "./extractors/spectralSlope": 23, "./extractors/spectralSpread": 24, "./extractors/zcr": 25 }], 27: [function (t, e, r) {
    "use strict";function n(t) {
      if (t && t.__esModule) return t;var e = {};if (null != t) for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r]);return (e["default"] = t, e);
    }Object.defineProperty(r, "__esModule", { value: !0 });var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
      return typeof t;
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t;
    },
        a = t("./utilities"),
        i = n(a),
        u = t("./featureExtractors"),
        s = n(u),
        c = t("jsfft"),
        f = (n(c), t("jsfft/lib/complex_array")),
        l = n(f),
        p = t("./meyda-wa"),
        m = { audioContext: null, spn: null, bufferSize: 512, sampleRate: 44100, melBands: 26, callback: null, windowingFunction: "hanning", featureExtractors: s, EXTRACTION_STARTED: !1, _featuresToExtract: [], _errors: { notPow2: new Error("Meyda: Input data length/buffer size needs to be a power of 2, e.g. 64 or 512"), featureUndef: new Error("Meyda: No features defined."), invalidFeatureFmt: new Error("Meyda: Invalid feature format"), invalidInput: new Error("Meyda: Invalid input."), noAC: new Error("Meyda: No AudioContext specified."), noSource: new Error("Meyda: No source node specified.") }, createMeydaAnalyzer: function createMeydaAnalyzer(t) {
        return new p.MeydaAnalyzer(t, this);
      }, extract: function extract(t, e) {
        if (!e) throw this._errors.invalidInput;if ("object" != ("undefined" == typeof e ? "undefined" : o(e))) throw this._errors.invalidInput;if (!t) throw this._errors.featureUndef;if (!i.isPowerOfTwo(e.length)) throw this._errors.notPow2;("undefined" == typeof this.barkScale || this.barkScale.length != this.bufferSize) && (this.barkScale = i.createBarkScale(this.bufferSize, this.sampleRate, this.bufferSize)), ("undefined" == typeof this.melFilterBank || this.barkScale.length != this.bufferSize || this.melFilterBank.length != this.melBands) && (this.melFilterBank = i.createMelFilterBank(this.melBands, this.sampleRate, this.bufferSize)), "undefined" == typeof e.buffer ? this.signal = i.arrayToTyped(e) : this.signal = e;var r = i.applyWindow(this.signal, this.windowingFunction),
            n = new l.ComplexArray(this.bufferSize);n.map(function (t, e, n) {
          t.real = r[e];
        });var a = n.FFT();this.complexSpectrum = a, this.ampSpectrum = new Float32Array(this.bufferSize / 2);for (var u = 0; u < this.bufferSize / 2; u++) this.ampSpectrum[u] = Math.sqrt(Math.pow(a.real[u], 2) + Math.pow(a.imag[u], 2));if ("object" === ("undefined" == typeof t ? "undefined" : o(t))) {
          for (var s = {}, c = 0; c < t.length; c++) s[t[c]] = this.featureExtractors[t[c]]({ ampSpectrum: this.ampSpectrum, complexSpectrum: this.complexSpectrum, signal: this.signal, bufferSize: this.bufferSize, sampleRate: this.sampleRate, barkScale: this.barkScale, melFilterBank: this.melFilterBank });return s;
        }if ("string" == typeof t) return this.featureExtractors[t]({ ampSpectrum: this.ampSpectrum, complexSpectrum: this.complexSpectrum, signal: this.signal, bufferSize: this.bufferSize, sampleRate: this.sampleRate, barkScale: this.barkScale, melFilterBank: this.melFilterBank });throw this._errors.invalidFeatureFmt;
      } };r["default"] = m, "undefined" != typeof window && (window.Meyda = m), e.exports = r["default"];
  }, { "./featureExtractors": 26, "./meyda-wa": 28, "./utilities": 29, jsfft: 6, "jsfft/lib/complex_array": 5 }], 28: [function (t, e, r) {
    "use strict";function n(t) {
      if (t && t.__esModule) return t;var e = {};if (null != t) for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r]);return (e["default"] = t, e);
    }function o(t, e) {
      if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
    }Object.defineProperty(r, "__esModule", { value: !0 }), r.MeydaAnalyzer = void 0;var a = (function () {
      function t(t, e) {
        for (var r = 0; r < e.length; r++) {
          var n = e[r];n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n);
        }
      }return function (e, r, n) {
        return (r && t(e.prototype, r), n && t(e, n), e);
      };
    })(),
        i = t("./utilities"),
        u = n(i),
        s = t("./featureExtractors"),
        c = n(s);r.MeydaAnalyzer = (function () {
      function t(e, r) {
        if ((o(this, t), this._m = r, !e.audioContext)) throw this._m._errors.noAC;if (e.bufferSize && !u.isPowerOfTwo(e.bufferSize)) throw this._m._errors.notPow2;if (!e.source) throw this._m._errors.noSource;this._m.audioContext = e.audioContext, this._m.bufferSize = e.bufferSize || r.bufferSize || 256, this._m.sampleRate = e.sampleRate || this._m.audioContext.sampleRate || 44100, this._m.callback = e.callback, this._m.windowingFunction = e.windowingFunction || "hanning", this._m.featureExtractors = c, this._m.EXTRACTION_STARTED = e.startImmediately || !1, this._m.spn = this._m.audioContext.createScriptProcessor(this._m.bufferSize, 1, 1), this._m.spn.connect(this._m.audioContext.destination), this._m._featuresToExtract = e.featureExtractors || [], this._m.barkScale = u.createBarkScale(this._m.bufferSize, this._m.sampleRate, this._m.bufferSize), this._m.melFilterBank = u.createMelFilterBank(this._m.melBands, this._m.sampleRate, this._m.bufferSize), this._m.inputData = null, r = this, this.setSource(e.source), this._m.spn.onaudioprocess = function (t) {
          r._m.inputData = t.inputBuffer.getChannelData(0);var e = r._m.extract(r._m._featuresToExtract, r._m.inputData);"function" == typeof r._m.callback && r._m.EXTRACTION_STARTED && r._m.callback(e);
        };
      }return (a(t, [{ key: "start", value: function value(t) {
          this._m._featuresToExtract = t, this._m.EXTRACTION_STARTED = !0;
        } }, { key: "stop", value: function value() {
          this._m.EXTRACTION_STARTED = !1;
        } }, { key: "setSource", value: function value(t) {
          t.connect(this._m.spn);
        } }, { key: "get", value: function value(t) {
          return null !== this._m.inputData ? this._m.extract(t || this._m._featuresToExtract, this._m.inputData) : null;
        } }]), t);
    })();
  }, { "./featureExtractors": 26, "./utilities": 29 }], 29: [function (t, e, r) {
    "use strict";function n(t) {
      if (t && t.__esModule) return t;var e = {};if (null != t) for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r]);return (e["default"] = t, e);
    }function o(t) {
      for (; t % 2 === 0 && t > 1;) t /= 2;return 1 === t;
    }function a(t) {
      throw new Error("Meyda: " + t);
    }function i(t, e) {
      for (var r = [], n = 0; n < Math.min(t.length, e.length); n++) r[n] = t[n] * e[n];return r;
    }function u(t, e) {
      if ("rect" !== e) {
        if (("" !== e && e || (e = "hanning"), x[e] || (x[e] = {}), !x[e][t.length])) try {
          x[e][t.length] = w[e](t.length);
        } catch (r) {
          throw new Error("Invalid windowing function");
        }t = i(t, x[e][t.length]);
      }return t;
    }function s(t, e, r) {
      for (var n = new Float32Array(t), o = 0; o < n.length; o++) n[o] = o * e / r, n[o] = 13 * Math.atan(n[o] / 1315.8) + 3.5 * Math.atan(Math.pow(n[o] / 7518, 2));
      return n;
    }function c(t) {
      return Array.prototype.slice.call(t);
    }function f(t) {
      return Float32Array.from(t);
    }function l(t, e) {
      return t / e;
    }function p(t, e) {
      return t.map(function (t) {
        return t / e;
      });
    }function m(t) {
      var e = 0;return (t.forEach(function (t, r, n) {
        t > e && (e = t);
      }), t.map(function (t) {
        return t / e;
      }));
    }function y(t) {
      return t.reduce(function (t, e) {
        return t + e;
      }) / t.length;
    }function h(t) {
      var e = 700 * (Math.exp(t / 1125) - 1);return e;
    }function d(t) {
      var e = 1125 * Math.log(1 + t / 700);return e;
    }function g(t) {
      return h(t);
    }function b(t) {
      return d(t);
    }function S(t, e, r) {
      for (var n = new Float32Array(t + 2), o = new Float32Array(t + 2), a = 0, i = e / 2, u = d(a), s = d(i), c = s - u, f = c / (t + 1), l = Array(t + 2), p = 0; p < n.length; p++) n[p] = p * f, o[p] = h(n[p]), l[p] = Math.floor((r + 1) * o[p] / e);for (var m = Array(t), y = 0; y < m.length; y++) {
        m[y] = Array.apply(null, new Array(r / 2 + 1)).map(Number.prototype.valueOf, 0);for (var p = l[y]; p < l[y + 1]; p++) m[y][p] = (p - l[y]) / (l[y + 1] - l[y]);for (var p = l[y + 1]; p < l[y + 2]; p++) m[y][p] = (l[y + 2] - p) / (l[y + 2] - l[y + 1]);
      }return m;
    }Object.defineProperty(r, "__esModule", { value: !0 }), r.isPowerOfTwo = o, r.error = a, r.pointwiseBufferMult = i, r.applyWindow = u, r.createBarkScale = s, r.typedToArray = c, r.arrayToTyped = f, r.normalize = l, r.normalize_a = p, r.normalize_a_to_1 = m, r.mean = y, r.melToFreq = g, r.freqToMel = b, r.createMelFilterBank = S;var v = t("./windowing"),
        w = n(v),
        x = {};
  }, { "./windowing": 30 }], 30: [function (t, e, r) {
    "use strict";function n(t) {
      for (var e = new Float32Array(t), r = 2 * Math.PI / (t - 1), n = 2 * r, o = 0; t / 2 > o; o++) e[o] = .42 - .5 * Math.cos(o * r) + .08 * Math.cos(o * n);for (var o = t / 2; o > 0; o--) e[t - o] = e[o - 1];return e;
    }function o(t) {
      for (var e = Math.PI / (t - 1), r = new Float32Array(t), n = 0; t > n; n++) r[n] = Math.sin(e * n);return r;
    }function a(t) {
      for (var e = new Float32Array(t), r = 0; t > r; r++) e[r] = .5 - .5 * Math.cos(2 * Math.PI * r / (t - 1));return e;
    }function i(t) {
      for (var e = new Float32Array(t), r = 0; t > r; r++) e[r] = .54 - .46 * Math.cos(2 * Math.PI * (r / t - 1));return e;
    }Object.defineProperty(r, "__esModule", { value: !0 }), r.blackman = n, r.sine = o, r.hanning = a, r.hamming = i;
  }, {}] }, {}, [27]);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[2]);
