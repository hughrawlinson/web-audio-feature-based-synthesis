# Web Audio Feature Based Synthesis
Feature based audio synthesis is a technique for developing synthesisers whose parameters map to percieved audio characteristics, rather than physical synth parameters. Typically, they use some form of machine learning to learn the relationship between parameters on a traditional synth and the perceptual audio features that they affect, and use knowledge of this relationship to create a reverse mapping to the original parameters. They can be used with all different paradigms of synthesizer, including subtractive, additive, and frequency modulation based synths.

This code base is an attempt to implement feature based synthesis in the Web Audio API. All learning will be done in-browser, and a variety of different synthesizer types will be used.

## Running the code
Currently this project is in 'developer mode', in that I haven't yet decided a final way to distribute the site. To run the code and use this project, clone the repository, install dependencies with `bower install` and `npm install`, and serve the project with `gulp-serve`.

## Dependencies
This project uses [brain](https://github.com/harthur/brain) for the neural networks that power the learning, and [meyda](https://github.com/hughrawlinson/meyda) for feature extraction. It uses [babel](https://babeljs.io) for ES6 => ES5 transpilation, [browserify](https://browserify.org) for dependency management, and [gulp](http://gulpjs.com/) for managing builds. Thanks to the developers of all those cool things.

## License
MIT. TL:DR; Do whatever you want, just don't blame me if anything goes wrong.
