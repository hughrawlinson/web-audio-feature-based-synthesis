'use strict';
var assert = require('assert');
var RunningAverage = require('../lib/running-average.js');

describe('running-average', function () {
  it('should return 0 for default settings and no input', function () {
    var avg = new RunningAverage();
    assert.equal(avg.getAverage(), 0);
  });

  it('should return the exact value for a single input', function () {
    var avg = new RunningAverage();
    avg.push(1);
    assert.equal(avg.getAverage(), 1);
  });

  it('should return the average of multiple inputs', function () {
    var avg = new RunningAverage();
    avg.push(10);
    avg.push(20);
    assert.equal(avg.getAverage(), 15);
  });

  it('should accept multiple numbers at once', function () {
    var avg = new RunningAverage();
    avg.push(10, 20);
    assert.equal(avg.getAverage(), 15);
  });

  it('should accept arrays of numbers', function () {
    var avg = new RunningAverage();
    avg.push([10, 20]);
    assert.equal(avg.getAverage(), 15);
  });

  it('should accept multiple arrays of numbers', function () {
    var avg = new RunningAverage();
    avg.push([10, 20], [30, 40]);
    assert.equal(avg.getAverage(), 25);
  });

  it('should have a chainable push method', function () {
    var avg = new RunningAverage();
    assert.equal(avg.push(10, 20).getAverage(), 15);
  });

  it('should not care about input order', function () {
    var nums = [3, 5, 1000, 9999999];
    var avg = new RunningAverage();
    avg.push(nums);

    var revAvg = new RunningAverage();
    revAvg.push(nums.reverse());

    assert.equal(avg.getAverage(), revAvg.getAverage());
  });

  it ('should accept strings that can be converted to numbers', function () {
    var avg = new RunningAverage();
    assert.doesNotThrow(function () {
      avg.push('1');
    });
  });

  it('should refuse anything that cannot be converted to a number', function () {
    var avg = new RunningAverage();
    assert.throws(function () {
      avg.push('one');
    });
  });
});
