const { src, dest, parallel, series, watch } = require("gulp");
const plumber = require("gulp-plumber");
const gulpif = require("gulp-if");
const del = require("del");
const fileinclude = require("gulp-file-include");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cleanCss = require("gulp-clean-css");
const rollup = require("rollup-stream");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const browserSync = require("browser-sync").create();

const isProd = process.env.NODE_ENV === "production";
const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV !== "production";

const path = {
  src: "./src/",
  dist: isDev ? "./dist/" : "./build/",
};

function clean() {
  return del([path.dist]);
}

function views() {
  return src([path.src + "/views/*.html"])
    .pipe(plumber())
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(dest(path.dist))
    .pipe(browserSync.stream());
}

function styles() {
  return src([path.src + "styles/*.scss"])
    .pipe(plumber())
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(sass())
    .pipe(
      gulpif(
        isProd,
        autoprefixer({
          grid: true,
        })
      )
    )
    .pipe(gulpif(isProd, cleanCss()))
    .pipe(gulpif(isDev, sourcemaps.write()))
    .pipe(dest(path.dist + "assets/css"))
    .pipe(browserSync.stream());
}

function scripts() {
  return rollup({
    input: path.src + "scripts/index.js",
    sourcemap: isDev,
    format: "umd",
  })
    .pipe(source("app.js"))
    .pipe(buffer())
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(gulpif(isProd, uglify()))
    .pipe(gulpif(isDev, sourcemaps.write()))
    .pipe(dest(path.dist + "assets/js"))
    .pipe(browserSync.stream());
}

function images() {
  return src([path.src + "images/*.+(jpg|jpeg|gif|png)"])
    .pipe(plumber())
    .pipe(gulpif(isProd, imagemin()))
    .pipe(dest(path.dist + "assets/images"))
    .pipe(browserSync.stream());
}

function fonts() {
  return src([path.src + "fonts/*.+(ttf|eot|woff|woff2)"])
    .pipe(dest(path.dist + "assets/fonts"))
    .pipe(browserSync.stream());
}

function build(cb) {
  views();
  styles();
  scripts();
  images();
  fonts();
  cb();
}

function handleChanges() {
  watch(path.src + "views/**/*.html", views);
  watch(path.src + "styles/**/*.scss", styles);
  watch(path.src + "scripts/**/*.js", scripts);
  watch(path.src + "images/**/*.+(jpg|jpeg|gif|png)", images);
  watch(path.src + "fonts/*.+(ttf|eot|woff|woff2)", fonts);
}

function serve() {
  return browserSync.init({
    server: {
      baseDir: ["dist"],
    },
    port: 3000,
    open: false,
  });
}

exports.dev = series(clean, build, parallel(serve, handleChanges));
exports.default = series(clean, build);
