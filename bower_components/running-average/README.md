# running-average [![NPM version][npm-image]][npm-url] ![Bower Version][bower-image] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> Memory-efficient module that tracks the average value of an unlimited quantity of numbers


## Install

```sh
$ npm install --save running-average
```

or

```sh
$ bower install approximate-number
```


## Usage

```js
var RunningAverage = require('running-average'); // or use window.RunningAverage in a browser w/out Require.js or Browserify

// create an instance
var runningAverage = new RunningAverage();

// push a number
runningAverage.push(1);

// or a few numbers
runningAverage.push(2, 3, 4);

// or an array of numbers
runningAverage.push([5, 6, 7]);

// get the current average any time you want
runningAverage.getAverage(); // => 4

// add some more numbers
runningAverage.push(8, 9);

// get an updated average 
runningAverage.getAverage(); // => 5

// oh, and it's chainable too!
runningAverage.push(10).push(11).getAverage(); // => 6

```

Also see version 1.0 for a `windowSize` option to limit the average to the last *n* numbers, but be aware that it uses a less efficient algorithm.

## License

MIT © [Nathan Friedly](http://nfriedly.com/)


[npm-image]: https://badge.fury.io/js/running-average.svg
[npm-url]: https://npmjs.org/package/running-average
[travis-image]: https://travis-ci.org/nfriedly/running-average.svg?branch=master
[travis-url]: https://travis-ci.org/nfriedly/running-average
[daviddm-image]: https://david-dm.org/nfriedly/running-average.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/nfriedly/running-average
[bower-image]: http://badge.fury.io/bo/running-average.svg
