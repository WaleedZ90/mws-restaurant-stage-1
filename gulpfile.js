var gulp = require('gulp');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var webserver = require('gulp-webserver');

gulp.task('copy', ['html', 'js', 'css', 'service-workers', 'images']);

gulp.task('serve', function () {
    return gulp.src('./dist')
        .pipe(webserver({
            port: 8000,
            livereload: true
        }));
});

gulp.task('html', function (done) {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'));
    done();
});


gulp.task('js', function (done) {
    var scriptSources = ['./node_modules/idb/lib/idb.js', 'js/**/*.js'];
    gulp.src(scriptSources)
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist/js'));
    done();
})

gulp.task('css', (done) => {
    gulp.src('./css/*.css')
        .pipe(gulp.dest('dist/css'));
    done();
});

gulp.task('service-workers', (done) => {
    var scriptSources = ['./service-worker.js', './service-worker-register.js', './manifest.json'];
    gulp.src(scriptSources)
        .pipe(gulp.dest('./dist'));
    done();
});

gulp.task('images', (done) => {
    gulp.src('./img/**')
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/img'));
});