'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var crypto = _interopDefault(require('crypto'));
var del = _interopDefault(require('del'));
var _fs = _interopDefault(require('fs-extra'));
var glob = _interopDefault(require('glob'));
var path = _interopDefault(require('path'));
var _Spritesmith = _interopDefault(require('spritesmith'));
var imagemin = _interopDefault(require('imagemin'));
var pngquant = _interopDefault(require('imagemin-pngquant'));
var os = _interopDefault(require('os'));

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var defaults = {
  project_path: process.cwd(),
  base_uri: '',
  http_path: '/',
  sass_dir: 'sass',
  css_dir: 'stylesheets',
  images_dir: 'images',
  retina_mark: /@(\d)x$/,
  use_cache: true,
  cache_dir: path.resolve(os.tmpdir(), 'sprite-magic-importer'),
  spritesmith: {},
  pngquant: {}
};
var createOptions = (function (options) {
  var self = Object.assign({}, defaults, options);

  if (typeof self.generated_images_dir === 'undefined') {
    self.generated_images_dir = self.images_dir;
  }

  return Object.assign({
    sass_path: path.resolve(self.project_path, self.sass_dir),
    images_path: path.resolve(self.project_path, self.images_dir),
    generated_images_path: path.resolve(self.project_path, self.generated_images_dir),
    http_generated_images_path: path.join(self.http_path, self.generated_images_dir),
    http_stylesheets_path: path.join(self.http_path, self.css_dir)
  }, self);
});

var _create = function create(thisArg, fn) {
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise(function (resolve, reject) {
      args.push(function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
      fn.apply(thisArg, args);
    });
  };
};

var get = function get(target, property, receiver) {
  var name = property;

  if (/Async$/.test(name) && !Reflect.has(target, name, receiver)) {
    name = name.replace(/Async$/, '');

    if (Reflect.has(target, name, receiver)) {
      return _create(target, Reflect.get(target, name, receiver));
    }
  }

  return Reflect.get(target, name, receiver);
};

var Promisable = {
  attach: function attach(obj) {
    return new Proxy(obj, {
      get: get
    });
  },
  create: function create(fn, thisArg) {
    return _create(thisArg, fn);
  }
};

var fs = Promisable.attach(_fs);
var globAsync = Promisable.create(glob);
var Spritesmith = Promisable.attach(_Spritesmith);
var stateClasses = ['hover', 'target', 'active', 'focus'];
var imageProps = ['x', 'y', 'width', 'height'];

function px(value) {
  return value === 0 ? '0' : "".concat(value, "px");
}

function createDigest(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

var SpriteMagic = /*#__PURE__*/function () {
  function SpriteMagic(options) {
    _classCallCheck(this, SpriteMagic);

    this.options = createOptions(options);
  }

  _createClass(SpriteMagic, [{
    key: "debug",
    value: function debug() {
      if (this.options.debug) {
        var _console;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        (_console = console).error.apply(_console, ['[SpriteMagic]'].concat(args));
      }
    }
  }, {
    key: "resolve",
    value: function resolve(_ref) {
      var url = _ref.url,
          prev = _ref.prev;

      if (!SpriteMagic.isPartialFile(prev) && this.rootSassFile !== prev) {
        this.rootSassFile = prev;
        this.debug("Find root: ".concat(prev));
      }

      if (!/\.png$/.test(url)) {
        return Promise.resolve();
      }

      this.debug("@import \"".concat(url, "\""));
      return this.process({
        url: url,
        prev: prev
      });
    }
  }, {
    key: "process",
    value: function process(context) {
      var _this = this;

      this.context = context;
      return Promise.resolve().then(function () {
        return _this.checkPixelRatio();
      }).then(function () {
        return _this.getImagesInfo();
      }).then(function () {
        return _this.createHash();
      }).then(function () {
        return _this.checkCache();
      }).then(function () {
        return _this.context.hasCache || Promise.resolve().then(function () {
          return _this.clearCache();
        }).then(function () {
          return _this.runSpritesmith();
        }).then(function () {
          return _this.outputSpriteImage();
        }).then(function () {
          return _this.createSass();
        }).then(function () {
          return _this.outputSassFile();
        });
      }).then(function () {
        return _this.createResult();
      });
    }
  }, {
    key: "checkPixelRatio",
    value: function checkPixelRatio() {
      this.context.mapName = this.commonName(path.basename(path.dirname(this.context.url)));
      var pathInfo = path.parse(this.context.url);

      if (this.options.retina_mark.test(pathInfo.name)) {
        this.context.pixelRatio = parseFloat(RegExp.$1);
        this.context.suffix = RegExp.lastMatch;
      } else {
        this.context.pixelRatio = 1;
        this.context.suffix = '';
      }
    }
  }, {
    key: "getImagesInfo",
    value: function getImagesInfo() {
      var _this2 = this;

      return Promise.resolve(path.resolve(this.options.images_path, this.context.url)).then(globAsync).then(function (matches) {
        return matches.map(function (filePath) {
          return _this2.createImageInfo(filePath);
        });
      }).then(function (images) {
        if (_this2.context.pixelRatio === 1) {
          _this2.context.images = images.filter(function (image) {
            return image.name === image.basename;
          });
        } else {
          _this2.context.images = images;
        }
      });
    }
  }, {
    key: "createImageInfo",
    value: function createImageInfo(filePath) {
      var basename = path.basename(filePath, '.png');
      var name = this.commonName(basename);
      return {
        filePath: filePath,
        basename: basename,
        name: name
      };
    }
  }, {
    key: "createHash",
    value: function createHash() {
      var _this3 = this;

      return Promise.all(this.context.images.map(function (image) {
        return fs.readFileAsync(image.filePath).then(createDigest).then(function (hash) {
          return [_this3.projectRelPath(image.filePath), hash];
        });
      })).then(function (results) {
        _this3.context.fingerprint = JSON.stringify(results);
        _this3.context.hash = createDigest(_this3.context.fingerprint).substr(0, 7);

        _this3.debug("hash: ".concat(_this3.context.hash));
      });
    }
  }, {
    key: "checkCache",
    value: function checkCache() {
      var _this4 = this;

      // always resolved
      var imageHash;
      return new Promise(function (resolve) {
        Promise.resolve().then(function () {
          return fs.accessAsync(_this4.spriteSassPath());
        }).then(function () {
          return fs.readJsonAsync(_this4.spriteCacheDataPath());
        }).then(function (data) {
          imageHash = data.imageHash;
        }).then(function () {
          return fs.readFileAsync(_this4.spriteImagePath());
        }).then(createDigest).then(function (hash) {
          return hash === imageHash ? Promise.resolve() : Promise.reject();
        }).then(function () {
          _this4.context.hasCache = _this4.options.use_cache;

          _this4.debug("Find cache! (".concat(_this4.context.hasCache, ")"));

          resolve();
        })["catch"](resolve);
      });
    }
  }, {
    key: "clearCache",
    value: function clearCache() {
      var pattern = this.spriteSassPath().replace(/[0-9a-f]+\.scss$/, '*');
      this.debug("delete: ".concat(pattern));
      return del(pattern, {
        force: true
      });
    }
  }, {
    key: "runSpritesmith",
    value: function runSpritesmith() {
      var _this5 = this;

      var options = Object.assign({}, this.options.spritesmith, {
        src: this.context.images.map(function (image) {
          return image.filePath;
        })
      });
      return Promise.resolve().then(function () {
        return Spritesmith.runAsync(options);
      }).then(function (sprite) {
        _this5.context.imageData = sprite.image;
        _this5.context.imageProps = sprite.properties;

        _this5.context.images.forEach(function (image) {
          Object.assign(image, sprite.coordinates[image.filePath]);
        });
      });
    }
  }, {
    key: "outputSpriteImage",
    value: function outputSpriteImage() {
      var _this6 = this;

      return Promise.resolve().then(function () {
        return imagemin.buffer(_this6.context.imageData, {
          use: [pngquant(_this6.options.pngquant)]
        });
      }).then(function (buf) {
        _this6.context.imageHash = createDigest(buf);
        return fs.outputFileAsync(_this6.spriteImagePath(), buf);
      }).then(function () {
        var data = JSON.stringify({
          fingerprint: _this6.context.fingerprint,
          imageHash: _this6.context.imageHash
        });
        return fs.outputFileAsync(_this6.spriteCacheDataPath(), "".concat(data, "\n"));
      });
    }
  }, {
    key: "createSass",
    value: function createSass() {
      var _this$getSelectorInfo = this.getSelectorInfo(),
          selectors = _this$getSelectorInfo.selectors,
          pseudoMap = _this$getSelectorInfo.pseudoMap;

      var _this$context = this.context,
          mapName = _this$context.mapName,
          hash = _this$context.hash;
      var sass = [];
      var placeholder = "%".concat(mapName, "-").concat(hash); // variables
      // core/stylesheets/compass/utilities/sprites/_base.scss
      // compass/sprite_importer/content.erb

      sass.push("\n            $sprite-selectors: ".concat(stateClasses.join(', '), " !default;\n            $disable-magic-sprite-selectors: false !default;\n            $default-sprite-separator: '-' !default;\n            $").concat(mapName, "-sprite-dimensions: false !default;\n            $").concat(mapName, "-class-separator: $default-sprite-separator !default;\n            $").concat(mapName, "-sprite-base-class: '.").concat(mapName, "#{$").concat(mapName, "-class-separator}sprite' !default;\n            $").concat(mapName, "-pixel-ratio: ").concat(this.context.pixelRatio, ";\n            $").concat(mapName, "-image-width: ").concat(px(this.context.imageProps.width), ";\n            $").concat(mapName, "-image-height: ").concat(px(this.context.imageProps.height), ";")); // sprite image class

      sass.push("\n            ".concat(placeholder, " {\n                background-image: url('").concat(this.spriteImageUrl(), "?_=").concat(hash, "');\n                background-repeat: no-repeat;\n                @if $").concat(mapName, "-pixel-ratio != 1 {\n                    background-size: #{$").concat(mapName, "-image-width / $").concat(mapName, "-pixel-ratio} #{$").concat(mapName, "-image-height / $").concat(mapName, "-pixel-ratio};\n                }\n            }\n            #{$").concat(mapName, "-sprite-base-class} {\n                @extend ").concat(placeholder, ";\n            }")); // sprites data

      sass.push("\n            $".concat(mapName, "-sprites: (").concat(selectors.map(function (image) {
        return "\n                ".concat(image.name, ": (\n                    ").concat(imageProps.map(function (prop) {
          return "".concat(prop, ": ").concat(px(image[prop]));
        }).join(', ')).concat(stateClasses.map(function (state) {
          return !pseudoMap[image.name] || !pseudoMap[image.name][state] ? '' : ", ".concat(state, ": (").concat(imageProps.map(function (prop) {
            return "".concat(prop, ": ").concat(px(pseudoMap[image.name][state][prop]));
          }).join(', '), ")");
        }).join(''), "\n                )");
      }).join(','), "\n            );")); // width and height function

      sass.push.apply(sass, _toConsumableArray(['width', 'height'].map(function (prop) {
        return "\n            @function ".concat(mapName, "-sprite-").concat(prop, "($sprite) {\n                @return map-get(map-get($").concat(mapName, "-sprites, $sprite), '").concat(prop, "') / $").concat(mapName, "-pixel-ratio;\n            }");
      }))); // dimensions mixin

      sass.push("\n            @mixin ".concat(mapName, "-sprite-dimensions($sprite) {\n                width: ").concat(mapName, "-sprite-width($sprite);\n                height: ").concat(mapName, "-sprite-height($sprite);\n            }")); // background position mixin

      sass.push("\n            @mixin ".concat(mapName, "-sprite-magic-background-position($sprite-data, $offset-x: 0, $offset-y: 0) {\n                $x: $offset-x - map-get($sprite-data, 'x');\n                $y: $offset-y - map-get($sprite-data, 'y');\n                background-position: #{$x / $").concat(mapName, "-pixel-ratio} #{$y / $").concat(mapName, "-pixel-ratio};\n            }")); // state selector

      sass.push("\n            @mixin ".concat(mapName, "-sprite-selectors(\n                $sprite-name, $full-sprite-name, $offset-x: 0, $offset-y: 0,\n                $unsupported: false, $separator: $").concat(mapName, "-class-separator\n            ) {\n                $sprite-data: map-get($").concat(mapName, "-sprites, $sprite-name);\n                @each $state in $sprite-selectors {\n                    @if map-has-key($sprite-data, $state) {\n                        $sprite-class: \"#{$full-sprite-name}#{$separator}#{$state}\";\n                        &:#{$state}, &.#{$sprite-class} {\n                            @include ").concat(mapName, "-sprite-magic-background-position(map-get($sprite-data, $state), $offset-x, $offset-y);\n                        }\n                    }\n                }\n            }")); // sprite mixin

      sass.push("\n            @mixin ".concat(mapName, "-sprite(\n                $sprite, $dimensions: $").concat(mapName, "-sprite-dimensions, $offset-x: 0, $offset-y: 0, $unsupported: false,\n                $use-magic-selectors: not $disable-magic-sprite-selectors, $separator: $").concat(mapName, "-class-separator\n            ) {\n                $sprite-data: map-get($").concat(mapName, "-sprites, $sprite);\n                @extend ").concat(placeholder, ";\n                @include ").concat(mapName, "-sprite-magic-background-position($sprite-data, $offset-x, $offset-y);\n                @if $dimensions {\n                    @include ").concat(mapName, "-sprite-dimensions($sprite);\n                }\n                @if $use-magic-selectors {\n                    @include ").concat(mapName, "-sprite-selectors(\n                        $sprite, $sprite, $offset-x, $offset-y, $unsupported, $separator\n                    );\n                }\n            }")); // all sprites mixin

      sass.push("\n            @mixin all-".concat(mapName, "-sprites($dimensions: $").concat(mapName, "-sprite-dimensions) {").concat(selectors.map(function (image) {
        return "\n                .".concat(mapName, "-").concat(image.name, " {\n                    @include ").concat(mapName, "-sprite(").concat(image.name, ", $dimensions);\n                }");
      }).join(''), "\n            }"));
      this.context.sass = sass.map(function (_) {
        return "".concat(_, "\n");
      }).join('').replace(/^\x20{12}/mg, '').slice(1);
    }
  }, {
    key: "outputSassFile",
    value: function outputSassFile() {
      return fs.outputFileAsync(this.spriteSassPath(), this.context.sass);
    }
  }, {
    key: "createResult",
    value: function createResult() {
      if (!this.context.hasCache) {
        var spriteFilePath = this.projectRelPath(this.spriteImagePath());
        console.info("Create CSS Sprites: ".concat(spriteFilePath, "#").concat(this.context.hash));
      }

      return {
        file: this.spriteSassPath()
      };
    }
  }, {
    key: "getSelectorInfo",
    value: function getSelectorInfo() {
      var selectors = [],
          pseudoMap = {};
      var regex = new RegExp("^(.*[^-_])[-_](".concat(stateClasses.join('|'), ")$"));
      this.context.images.forEach(function (image) {
        if (regex.test(image.name)) {
          var imageName = RegExp.$1,
              pseudoClass = RegExp.$2;
          (pseudoMap[imageName] || (pseudoMap[imageName] = {}))[pseudoClass] = image;
        }

        selectors.push(image);
      });
      return {
        selectors: selectors,
        pseudoMap: pseudoMap
      };
    }
  }, {
    key: "spriteImageUrl",
    value: function spriteImageUrl() {
      var imagePath = "".concat(path.dirname(path.normalize(path.join(this.options.http_generated_images_path, this.context.url)))).concat(this.context.suffix, ".png"); // absolute path

      if (imagePath[0] === path.sep) {
        return "".concat(this.options.base_uri).concat(imagePath.replace(/\\/g, '/'));
      } // relative path


      var cssDir = path.dirname(path.normalize(path.join(this.options.http_stylesheets_path, path.relative(this.options.sass_dir, this.rootSassFile))));
      return path.relative(cssDir, imagePath).replace(/\\/g, '/');
    }
  }, {
    key: "spriteImagePath",
    value: function spriteImagePath() {
      var imageFileBase = path.dirname(path.resolve(this.options.generated_images_path, this.context.url));
      return "".concat(imageFileBase).concat(this.context.suffix, ".png");
    }
  }, {
    key: "spriteCacheDataPath",
    value: function spriteCacheDataPath() {
      return this.spriteCachePath('json');
    }
  }, {
    key: "spriteSassPath",
    value: function spriteSassPath() {
      return this.spriteCachePath('scss');
    }
  }, {
    key: "spriteCachePath",
    value: function spriteCachePath(ext) {
      var fileName = "".concat(this.context.mapName).concat(this.context.suffix, "-").concat(this.context.hash, ".").concat(ext);
      return path.resolve(this.options.cache_dir, fileName);
    }
  }, {
    key: "projectRelPath",
    value: function projectRelPath(filePath) {
      return path.relative(this.options.project_path, filePath).replace(/\\/g, '/');
    }
  }, {
    key: "commonName",
    value: function commonName(name) {
      return name.replace(this.options.retina_mark, '');
    }
  }], [{
    key: "isPartialFile",
    value: function isPartialFile(prev) {
      return /^_/.test(path.basename(prev));
    }
  }]);

  return SpriteMagic;
}();

var index = Object.assign(function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var spriteMagic = new SpriteMagic(options);
  return function (url, prev, done) {
    spriteMagic.resolve({
      url: url,
      prev: prev
    }).then(done)["catch"](function (err) {
      return setImmediate(function () {
        throw err;
      });
    });
  };
}, {
  SpriteMagic: SpriteMagic
});

module.exports = index;
