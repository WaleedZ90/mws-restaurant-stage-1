var gulp = require('gulp');
var concat = require('gulp-concat');

// gulp version should be
// CLI version 3.9.1
// Local version 3.9.1

gulp.task('copy-html', function (done) {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'));
    done();
})


gulp.task('scripts', function (done) {
    gulp.src('js/**/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist/js'));
    done();
})