/*jshint node:true, browser:true*/
/*globals define*/

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
}());
