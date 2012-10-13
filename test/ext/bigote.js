(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';

        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';

        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }

        var n = loadNodeModulesSync(x, y);
        if (n) return n;

        throw new Error("Cannot find module '" + x + "'");

        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }

            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }

        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }

            return loadAsFileSync(x + '/index');
        }

        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }

            var m = loadAsFileSync(x);
            if (m) return m;
        }

        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');

            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }

            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);

    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;

    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }

        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;

        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };

        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/index.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * bigote - main file
 * MIT Licensed.
 */
module.exports = require('./lib/bigote');


});

require.define("/lib/bigote.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = (function(){
  var parser = require('./parser');
  var runtime = require('./runtime');

  var result = {
    /* Load template and partials */
    load: function(tmpl, partials) {
      var _templates = {};
      _templates['main'] = parser.parse(tmpl);
      if(partials) {
        for(var p in partials) {
          _templates[p] = parser.parse(partials[p]);
        }
      }
      return _templates;
    },
    render: runtime.evaluate
  };
  return result;
})();

});

require.define("/lib/parser.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */

  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }

  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "start": parse_start,
        "body": parse_body,
        "part": parse_part,
        "tag": parse_tag,
        "variable": parse_variable,
        "section": parse_section,
        "conditional": parse_conditional,
        "partial": parse_partial,
        "comment": parse_comment,
        "buffer": parse_buffer,
        "hat_start": parse_hat_start,
        "section_start": parse_section_start,
        "section_end": parse_section_end,
        "esc_tag_start": parse_esc_tag_start,
        "esc_tag_end": parse_esc_tag_end,
        "tag_start": parse_tag_start,
        "tag_end": parse_tag_end,
        "varname": parse_varname,
        "ws": parse_ws,
        "EOF": parse_EOF
      };

      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "start";
      }

      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];

      function padLeft(input, padding, length) {
        var result = input;

        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }

        return result;
      }

      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;

        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }

        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }

      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }

        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }

        rightmostFailuresExpected.push(failure);
      }

      function parse_start() {
        var result0;
        var pos0;

        pos0 = pos;
        result0 = parse_body();
        if (result0 !== null) {
          result0 = (function(offset, b) { return {ast:b, source:input}; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }

      function parse_body() {
        var result0, result1;

        result0 = [];
        result1 = parse_part();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_part();
        }
        return result0;
      }

      function parse_part() {
        var result0;

        result0 = parse_tag();
        if (result0 === null) {
          result0 = parse_buffer();
        }
        return result0;
      }

      function parse_tag() {
        var result0;

        result0 = parse_section();
        if (result0 === null) {
          result0 = parse_partial();
          if (result0 === null) {
            result0 = parse_variable();
          }
        }
        return result0;
      }

      function parse_variable() {
        var result0, result1, result2, result3;
        var pos0, pos1;

        pos0 = pos;
        pos1 = pos;
        result0 = parse_tag_start();
        if (result0 !== null) {
          result1 = parse_varname();
          if (result1 !== null) {
            result2 = parse_tag_end();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, v) { return [IDENTIFIER, offset, v]; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_esc_tag_start();
          if (result0 !== null) {
            result1 = parse_varname();
            if (result1 !== null) {
              result2 = parse_esc_tag_end();
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, v1) { return [NOESC, offset, v1]; })(pos0, result0[1]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_tag_start();
            if (result0 !== null) {
              if (input.charCodeAt(pos) === 38) {
                result1 = "&";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"&\"");
                }
              }
              if (result1 !== null) {
                result2 = parse_varname();
                if (result2 !== null) {
                  result3 = parse_tag_end();
                  if (result3 !== null) {
                    result0 = [result0, result1, result2, result3];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, v2) { return [NOESC, offset, v2]; })(pos0, result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              result0 = parse_comment();
            }
          }
        }
        return result0;
      }

      function parse_section() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1;

        pos0 = pos;
        pos1 = pos;
        result0 = parse_conditional();
        if (result0 !== null) {
          result1 = parse_varname();
          if (result1 !== null) {
            result2 = parse_tag_end();
            if (result2 !== null) {
              result3 = parse_body();
              if (result3 !== null) {
                result4 = parse_section_end();
                if (result4 !== null) {
                  result5 = parse_varname();
                  if (result5 !== null) {
                    result6 = parse_tag_end();
                    if (result6 !== null) {
                      result0 = [result0, result1, result2, result3, result4, result5, result6];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, t, v, spos, b, epos, x) {
              // v & v1 has to be the same
              if(v!=x) {
                console.log('section start ('+v+') and end ('+x+') does not match! at:'+offset);
              }
              return [t, offset, spos+2, epos-1, v, b];
            })(pos0, result0[0], result0[1], result0[2], result0[3], result0[4], result0[5]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }

      function parse_conditional() {
        var result0;
        var pos0;

        pos0 = pos;
        result0 = parse_section_start();
        if (result0 !== null) {
          result0 = (function(offset) { return BLOCK; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_hat_start();
          if (result0 !== null) {
            result0 = (function(offset) { return NOT_BLOCK; })(pos0);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }

      function parse_partial() {
        var result0, result1, result2, result3;
        var pos0, pos1;

        pos0 = pos;
        pos1 = pos;
        result0 = parse_tag_start();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 62) {
            result1 = ">";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\">\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_varname();
            if (result2 !== null) {
              result3 = parse_tag_end();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, v) { return [INCLUDE, offset, v]; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }

      function parse_comment() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2, pos3, pos4;

        pos0 = pos;
        pos1 = pos;
        result0 = parse_tag_start();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 33) {
            result1 = "!";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"!\"");
            }
          }
          if (result1 !== null) {
            pos2 = pos;
            pos3 = pos;
            pos4 = pos;
            reportFailures++;
            result3 = parse_tag_end();
            reportFailures--;
            if (result3 === null) {
              result3 = "";
            } else {
              result3 = null;
              pos = pos4;
            }
            if (result3 !== null) {
              if (input.length > pos) {
                result4 = input.charAt(pos);
                pos++;
              } else {
                result4 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result4 !== null) {
                result3 = [result3, result4];
              } else {
                result3 = null;
                pos = pos3;
              }
            } else {
              result3 = null;
              pos = pos3;
            }
            if (result3 !== null) {
              result3 = (function(offset, c) { return c;})(pos2, result3[1]);
            }
            if (result3 === null) {
              pos = pos2;
            }
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                pos2 = pos;
                pos3 = pos;
                pos4 = pos;
                reportFailures++;
                result3 = parse_tag_end();
                reportFailures--;
                if (result3 === null) {
                  result3 = "";
                } else {
                  result3 = null;
                  pos = pos4;
                }
                if (result3 !== null) {
                  if (input.length > pos) {
                    result4 = input.charAt(pos);
                    pos++;
                  } else {
                    result4 = null;
                    if (reportFailures === 0) {
                      matchFailed("any character");
                    }
                  }
                  if (result4 !== null) {
                    result3 = [result3, result4];
                  } else {
                    result3 = null;
                    pos = pos3;
                  }
                } else {
                  result3 = null;
                  pos = pos3;
                }
                if (result3 !== null) {
                  result3 = (function(offset, c) { return c;})(pos2, result3[1]);
                }
                if (result3 === null) {
                  pos = pos2;
                }
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              result3 = parse_tag_end();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, b) {
              return [COMMENT, offset, b.join('')];
            })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }

      function parse_buffer() {
        var result0, result1, result2;
        var pos0, pos1, pos2, pos3;

        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        pos3 = pos;
        reportFailures++;
        result1 = parse_tag_start();
        reportFailures--;
        if (result1 === null) {
          result1 = "";
        } else {
          result1 = null;
          pos = pos3;
        }
        if (result1 !== null) {
          if (input.length > pos) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("any character");
            }
          }
          if (result2 !== null) {
            result1 = [result1, result2];
          } else {
            result1 = null;
            pos = pos2;
          }
        } else {
          result1 = null;
          pos = pos2;
        }
        if (result1 !== null) {
          result1 = (function(offset, c) { return c; })(pos1, result1[1]);
        }
        if (result1 === null) {
          pos = pos1;
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            pos1 = pos;
            pos2 = pos;
            pos3 = pos;
            reportFailures++;
            result1 = parse_tag_start();
            reportFailures--;
            if (result1 === null) {
              result1 = "";
            } else {
              result1 = null;
              pos = pos3;
            }
            if (result1 !== null) {
              if (input.length > pos) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result2 !== null) {
                result1 = [result1, result2];
              } else {
                result1 = null;
                pos = pos2;
              }
            } else {
              result1 = null;
              pos = pos2;
            }
            if (result1 !== null) {
              result1 = (function(offset, c) { return c; })(pos1, result1[1]);
            }
            if (result1 === null) {
              pos = pos1;
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, b) { return [BUFFER, offset, b.join('')]; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }

      function parse_hat_start() {
        var result0, result1;
        var pos0;

        pos0 = pos;
        result0 = parse_tag_start();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 94) {
            result1 = "^";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"^\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }

      function parse_section_start() {
        var result0, result1;
        var pos0;

        pos0 = pos;
        result0 = parse_tag_start();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 35) {
            result1 = "#";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"#\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }

      function parse_section_end() {
        var result0, result1;
        var pos0, pos1;

        pos0 = pos;
        pos1 = pos;
        result0 = parse_tag_start();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 47) {
            result1 = "/";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return offset; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }

      function parse_esc_tag_start() {
        var result0, result1;
        var pos0;

        pos0 = pos;
        result0 = parse_tag_start();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 123) {
            result1 = "{";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"{\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }

      function parse_esc_tag_end() {
        var result0, result1;
        var pos0;

        pos0 = pos;
        result0 = parse_tag_end();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 125) {
            result1 = "}";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"}\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }

      function parse_tag_start() {
        var result0;

        if (input.substr(pos, 2) === "{{") {
          result0 = "{{";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"{{\"");
          }
        }
        return result0;
      }

      function parse_tag_end() {
        var result0;
        var pos0;

        pos0 = pos;
        if (input.substr(pos, 2) === "}}") {
          result0 = "}}";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"}}\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) { return offset; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }

      function parse_varname() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;

        pos0 = pos;
        pos1 = pos;
        result0 = [];
        result1 = parse_ws();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_ws();
        }
        if (result0 !== null) {
          if (/^[a-zA-Z_$?.]/.test(input.charAt(pos))) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z_$?.]");
            }
          }
          if (result1 !== null) {
            result2 = [];
            if (/^[0-9a-zA-Z_$?.]/.test(input.charAt(pos))) {
              result3 = input.charAt(pos);
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9a-zA-Z_$?.]");
              }
            }
            while (result3 !== null) {
              result2.push(result3);
              if (/^[0-9a-zA-Z_$?.]/.test(input.charAt(pos))) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9a-zA-Z_$?.]");
                }
              }
            }
            if (result2 !== null) {
              result3 = [];
              result4 = parse_ws();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_ws();
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, h, t) {
            return (h + t.join('')).trim();
          })(pos0, result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }

      function parse_ws() {
        var result0;

        if (/^[\t\x0B\f \xA0\uFEFF]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\t\\x0B\\f \\xA0\\uFEFF]");
          }
        }
        return result0;
      }

      function parse_EOF() {
        var result0;
        var pos0;

        pos0 = pos;
        reportFailures++;
        if (input.length > pos) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("any character");
          }
        }
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }


      function cleanupExpected(expected) {
        expected.sort();

        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }

      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */

        var line = 1;
        var column = 1;
        var seenCR = false;

        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }

        return { line: line, column: column };
      }


        var IDENTIFIER = 'var';
        var BUFFER     = 'buf';
        var INCLUDE    = 'inc';
        var NOESC      = 'val';
        var BLOCK      = 'blk';
        var NOT_BLOCK  = 'not';
        var COMMENT    = 'rem';


      var result = parseFunctions[startRule]();

      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();

        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }

      return result;
    },

    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };

  /* Thrown when a parser encounters a syntax error. */

  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;

      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }

      foundHumanized = found ? quote(found) : "end of input";

      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }

    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };

  result.SyntaxError.prototype = Error.prototype;

  return result;
})();

});

require.define("/lib/runtime.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = (function(){

  var _templates = {};

  var result = {
    /* Execute a given JSON AST
     *
     * format would be
     *   {'main': {'ast': ... ast ... , 'source': ... source text ... }, partials ... }
     */
    evaluate: function (ast, context) {
      if(ast) {
        _templates = ast;
        // get the main to start
        return evalContext(ast['main']['ast'], context, 'main');
      }
      return '<empty or null template>';
    }
  };

  // for now, there is no compilation on
  // modified sources
  // -- assumed that the text was the block
  //    that was forwarded to function
  function render(text)  {
    return evalContext(this.ast, this.context, this.module);
  }

  /*
   * Function to evaulate a context
   *  ast - [ array of ops ]
   *  - each ops
   *    - buf (data buffer)
   *    - var (variable from context - needs HTML escaping)
   *    - val (variable from context - no escaping)
   *    - inc (include another template)
   *    - blk (block of template)
   */
  function evalContext(ast, context, module) {
    var buf='';
    if(!ast) return buf;
    for(var i=0,astlen=ast.length;i<astlen;i++) {
      var node = ast[i];
      if(node && node.length>=3) {
        // array element with type, offset, value
        if(node[0]=='buf') {
          // [ 'buf', 14, '! You have ' ]
          buf += node[2];
        } else if(node[0]=='var' || node[0]=='val') {
          // --- loop and find out associative elements
          var tmp;
          if(node[2].indexOf('.')==-1) {
            tmp=context[node[2]];
          } else {
            var kpath = node[2].split('.');
            tmp=context;
            for(var kidx=0;kidx<kpath.length;kidx++) {
              tmp=(kpath[kidx]==''?tmp:tmp[kpath[kidx]]);
              if(!tmp) break;
            }
          }
          tmp = tmp || '';
          if(typeof(tmp)=='function') {
            tmp=context[node[2]]();
          }
          buf+=(node[0]=='var'?escapeHtml(tmp):tmp);
        } else if(node[0]=='inc') {
          // ---- partials
          // included partial to be loaded
          // [ 'inc', 23, 'replace' ]
          buf += evalContext(_templates[node[2]]['ast'], context, node[2]);
         } else if(node[0]=='blk' || node[0]=='not') {
           // ---- sections
           // [ 'blk', 0, pos1, pos2, 'secname', [Object] ]
           // pos1 - start offset pos in the source
           // pos2 - end offset pos in the source
           // node[5] is the ast
           // node[4] should be the section name

           // check if the context value is false or empty
           var section = context[node[4]];
           var presence = section || false;
           // check if its an array, if so, length of the array would
           // determine context
           presence = presence instanceof Array ? presence.length>0 : presence;
           // if presence is a function, check if the function
           // returns true/false
           if(typeof(presence)=='function') {
             presence=section=context[node[4]]();
           }
           if(presence && node[0]=='blk') {
             section = section instanceof Array?section:[section];
             for(var cidx=0;cidx<section.length;cidx++) {
               var ctxt = section[cidx];
               if(typeof(ctxt)=='function') {
                 // setup the render function
                 this.render = render;
                 this.context = context;
                 this.source = _templates[module]['source'].substr(node[2], (node[3]-node[2]));
                 this.ast = node[5];
                 buf += ctxt(this.source, this.render);
               } else {
                 buf += evalContext(node[5], typeof(ctxt)=='boolean'?context:ctxt, module);
               }
             }
           } else if(node[0]=='not' && !presence) {
             buf += evalContext(node[5], context, module);
           }
         } else if(node[0]=='rem') {
           // just ignore comments
         } else {
           console.log('*** unknown tag **** ' + node[0]);
         }
      }
    }
    return buf;
  };

  /* Utility functions */
  // following copied from dust.js & underscore.js
  // List of HTML entities for escaping.
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };

  // Regex containing the keys listed immediately above.
  var htmlEscaper = /[&<>"]/mg;
  function escapeHtml(s)
  {
    if(typeof s === 'string') {
      if(!htmlEscaper.test(s)) {
        return s;
      }
      return s.replace(htmlEscaper, function(match) {
        return htmlEscapes[match];
      });
    }
    return s;
  }

  return result;
})();

});

require.define("/entry.js",function(require,module,exports,__dirname,__filename,process,global){bigote = require('..');


});
require("/entry.js");
})();

module.exports = bigote;