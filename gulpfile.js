var gulp = require('gulp');
var connect = require('gulp-connect');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var webserver = require('gulp-webserver');

gulp.task('copy', ['html', 'js', 'css', 'service-workers', 'images']);

gulp.task('default', ['webserver', 'watch']);

// ---------------------------- Watch ------------------------------

gulp.task('webserver', function () {
    connect.server({
        root: './dist',
        port: 7000,
        livereload: true
    });
});

gulp.task('html-watch', (done) => {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'))
        .pipe(connect.reload());
    done();
});

gulp.task('js-watch', (done) => {
    // bundling index page
    gulp.src(['js/dbhelper.js', 'js/main.js'])
        .pipe(concat('indexBundle.js'))
        .pipe(gulp.dest('dist/js'));

    // bundling details page
    gulp.src(['js/dbhelper.js', 'js/restaurant_info.js'])
        .pipe(concat('detailsBundle.js'))
        .pipe(gulp.dest('dist/js'));

    //bundling node_modules
    gulp.src('./node_modules/idb/lib/idb.js')
        .pipe(gulp.dest('dist/js'))
        .pipe(connect.reload());
    done();
});

gulp.task('css-watch', (done) => {
    gulp.src('./css/*.css')
        .pipe(gulp.dest('dist/css'))
        .pipe(connect.reload());
    done();
});

gulp.task('service-workers-watch', (done) => {
    var scriptSources = ['./service-worker.js', './service-worker-register.js', './manifest.json'];
    gulp.src(scriptSources)
        .pipe(gulp.dest('./dist'))
        .pipe(connect.reload());
    done();
});

gulp.task('watch', function () {
    gulp.watch(['./*.html', 'js/**/*.js', './service-worker-register.js', './service-worker.js', 'css/*.css'], ['html-watch', 'js-watch', 'css-watch', 'service-workers-watch']);
});

// --------------------------- End Watch ------------------------------

gulp.task('html', function (done) {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'));
    done();
});


gulp.task('js', function (done) {
    // bundling index page
    gulp.src(['js/dbhelper.js', 'js/main.js'])
        .pipe(concat('indexBundle.js'))
        .pipe(gulp.dest('dist/js'));

    // bundling details page
    gulp.src(['js/dbhelper.js', 'js/restaurant_info.js'])
        .pipe(concat('detailsBundle.js'))
        .pipe(gulp.dest('dist/js'));

    //bundling node_modules
    gulp.src('./node_modules/idb/lib/idb.js')
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