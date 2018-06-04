var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('copy', (done) => {
    return gulp.src('../index.html')
        .pipe(gulp.dest('dist'));
})

gulp.task('scripts', function (done) {
    gulp.src('js/**/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist/js'));
    done();
})