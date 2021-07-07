const { src, dest, parallel, series, watch } = require("gulp");
const plumber = require("gulp-plumber");
const gulpif = require("gulp-if");
const del = require("del");
const fileinclude = require("gulp-file-include");
const sourcemaps = require("gulp-sourcemaps");
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require("gulp-autoprefixer");
const cleanCss = require("gulp-clean-css");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const browserSync = require("browser-sync").create();
const webpack = require("webpack-stream");
const concat = require("gulp-concat");

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
      autoprefixer({
        grid: true,
      })
    )
    .pipe(gulpif(isProd, cleanCss()))
    .pipe(gulpif(isDev, sourcemaps.write()))
    .pipe(dest(path.dist + "assets/css"))
    .pipe(browserSync.stream());
}

function scripts() {
  return src([path.src + "scripts/*.js"])
    .pipe(
      webpack({
        mode: isProd ? "production" : "development",
      })
    )
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(gulpif(isProd, uglify()))
    .pipe(concat("app.js"))
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

function meta() {
  return src([path.src + "metadata/*.json"])
    .pipe(dest(path.dist + "assets/metadata"))
    .pipe(browserSync.stream());
}

function build(cb) {
  views();
  styles();
  scripts();
  images();
  fonts();
  meta();
  cb();
}

function handleChanges() {
  watch(path.src + "views/**/*.html", views);
  watch(path.src + "styles/**/*.scss", styles);
  watch(path.src + "scripts/**/*.js", scripts);
  watch(path.src + "images/**/*.+(jpg|jpeg|gif|png)", images);
  watch(path.src + "fonts/*.+(ttf|eot|woff|woff2)", fonts);
  watch(path.src + "metadata/*.json", meta);
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
