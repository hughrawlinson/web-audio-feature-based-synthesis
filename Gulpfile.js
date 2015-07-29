var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var browserify = require('browserify');
var debowerify = require('debowerify');
var through2 = require('through2');
var babelify = require('babelify');

gulp.task('js', function () {
    return gulp.src('./src/js/index.js')
		.pipe(through2.obj(function(file,enc,next){
			browserify(file.path,{debug: process.env.NODE_ENV === 'development'})
				.transform(babelify)
				.transform(debowerify)
				.bundle(function (err, res){
					if(err){
						return next(err);
					}
					file.contents = res;
					next(null,file);
				});
		}))
		.on('error', function(error){
			console.log(error.stack);
			this.emit('end');
		})
		.pipe(gulp.dest('./dist/js'));
});

gulp.task('build',['js','html']);

gulp.task('html',function(){
	return gulp.src('./src/index.html')
		.pipe(gulp.dest('./dist/'));
});

gulp.task('serve', ['build'], function() {

    browserSync.init({
        server: "./dist"
    });

    gulp.watch("src/**/*", ['build']);
    gulp.watch("dist/*").on('change', browserSync.reload);
});
