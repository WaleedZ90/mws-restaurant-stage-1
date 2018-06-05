var gulp = require('gulp');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

gulp.task('copy-html', function (done) {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'));
    done();
})


gulp.task('scripts', function (done) {
    gulp.src(['js/**/*.js', './node_modules/idb/lib/idb.js'])
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist/js'));
    done();
})

gulp.task('compress-images', (done) => {
    gulp.src('./img/*')
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/img'));
})