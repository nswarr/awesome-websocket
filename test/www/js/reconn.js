require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
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

function noop() {}

process.on = noop;
process.once = noop;
process.off = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("/Users/iangroff/.nvm/v0.10.26/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"/Users/iangroff/.nvm/v0.10.26/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":2,"inherits":1}],"Focm2+":[function(require,module,exports){
module.exports = require("./src/reconnecting-websocket.js");

},{"./src/reconnecting-websocket.js":9}],"reconnecting-websocket":[function(require,module,exports){
module.exports=require('Focm2+');
},{}],7:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var log, util, write,
    __slice = [].slice;

  util = require('util');

  write = function(level, message, formatParams) {
    if (formatParams) {
      formatParams.unshift(message);
      if (process.env.NOLOGPID) {
        return util.log("[" + level + "] " + (util.format.apply(util.format, formatParams)));
      } else {
        return util.log("[" + process.pid + "] [" + level + "] " + (util.format.apply(util.format, formatParams)));
      }
    } else {
      if (process.env.NOLOGPID) {
        return util.log("[" + level + "] " + message);
      } else {
        return util.log("[" + process.pid + "] [" + level + "] " + message);
      }
    }
  };

  log = {
    error: function() {
      var message, others;
      message = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return write("ERROR", message, others);
    },
    info: function() {
      var message, others;
      message = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return write("INFO", message, others);
    },
    warn: function() {
      var message, others;
      message = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return write("WARN", message, others);
    },
    debug: function() {
      var message, others;
      message = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (process.env.DEBUG) {
        return write("DEBUG", message, others);
      }
    },
    event: function() {
      var message, others;
      message = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (process.env.DEBUG) {
        return write("EVENT", message, others);
      }
    }
  };

  module.exports = log;

}).call(this);

}).call(this,require("/Users/iangroff/.nvm/v0.10.26/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/Users/iangroff/.nvm/v0.10.26/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":2,"util":4}],8:[function(require,module,exports){

/**
 * Module dependencies.
 */

var global = (function() { return this; })();

/**
 * WebSocket constructor.
 */

var WebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Module exports.
 */

module.exports = WebSocket ? ws : null;

/**
 * WebSocket constructor.
 *
 * The third `opts` options object gets ignored in web browsers, since it's
 * non-standard, and throws a TypeError if passed to the constructor.
 * See: https://github.com/einaros/ws/issues/227
 *
 * @param {String} uri
 * @param {Array} protocols (optional)
 * @param {Object) opts (optional)
 * @api public
 */

function ws(uri, protocols, opts) {
  var instance;
  if (protocols) {
    instance = new WebSocket(uri, protocols);
  } else {
    instance = new WebSocket(uri);
  }
  return instance;
}

if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],9:[function(require,module,exports){
(function (global){
log = require('simplog');

var OriginalWebSocket = null;
if ( typeof(WebSocket) === "undefined" ){
  OriginalWebSocket = require("ws");
} else {
  OriginalWebSocket = WebSocket;
}

function sender(data){
  // if the socket isn't open, we'll just reconnect and let the
  // caller try again cause we know this raises an uncatchable
  // error
  if (this.underlyingWs.readyState != OriginalWebSocket.OPEN){
    log.info("this.underlyingWs not open, reconnecting");
    this.reconnect();
    this.ondatanotsent(data);
  } else {
    // otherwise we try to send, and if we have a failure
    // we'll go ahead and reconnect, telling our caller
    // all about how we failed via onsendfailed
    try {
      log.info("sending: ", data);
      this.underlyingWs.send(data);
    } catch (error) {
      log.error("error during send on this.underlyingWs", e);
      this.reconnect();
      this.ondatanotsent(data);
    }
  }
}

function ReconnectingWebSocket(url, protocols){
  RECONNECTING = 99;
  ERRORED = 100;
  // WS Events
  this.onopen    = function () {};
  this.onerror   = function () {};
  this.onclose   = function () {};
  this.onmessage = function () {};

  this.underlyingWs        = null;
  var reconnectOnClose    = true;
  var reconnectAttempts   = 0;
  var readyState         = -1;

  this.ondatanotsent = function() {};
  this.onreconnect = function () {};

  this.reconnect = function() {
    log.info("reconnecting");
    if ( readyState === OriginalWebSocket.CONNECTING ||
         readyState === RECONNECTING || 
         this.underlyingWs.readyState === OriginalWebSocket.CONNECTING )
    {
      return;
    }
    // exponential backoff on delay, capped at a wait of 1024 ms
    var delay = reconnectAttempts++ > 9 ? 1024 : Math.pow(2, reconnectAttempts);
    readyState = RECONNECTING;
    setTimeout(connect, delay);
  }.bind(this);

  var connect = function() {
    readyState = OriginalWebSocket.CONNECTING;
    // an attempt to avoid get extraneous events
    // and allow the old socket to be GCd
    if ( this.underlyingWs !== null ){
      this.underlyingWs.onerror = null;
      this.underlyingWs.onmessage = null;
      this.underlyingWs.onclose = null;
      // we don't need to do anything with onopen because it wouldn't
      // fire again anyway, and shouldn't keep the socket from getting
      // GCd
    }

    this.underlyingWs = new OriginalWebSocket(url, protocols || []);
    this.underlyingWs.onopen  = function(evt){
      readyState = OriginalWebSocket.OPEN;
      if ( reconnectAttempts === 0 ) {
        this.onopen(evt);
      } else {
        this.onreconnect();
      }
      reconnectAttempts = 0; // reset
    }.bind(this); 

    this.underlyingWs.onclose = function(evt){
      // onclose, unless told to close by having our close() method called
      // we'll ignore the close, and reconnect
      readyState = OriginalWebSocket.CLOSED;
      if (reconnectOnClose){
        this.reconnect();
      } else {
        this.onclose(evt);
      }
    }.bind(this);

    this.underlyingWs.onerror = function(evt) {
      readyState = ERRORED;
      this.onerror(evt);
    }.bind(this);

    this.underlyingWs.onmessage = function(evt) {
      this.onmessage(evt);
    }.bind(this);
  }.bind(this);

  this.send = sender.bind(this);

  this.close = function () {
    reconnectOnClose = false;
    this.underlyingWs.close();
  }.bind(this);

  setTimeout(connect, 0);
}

/* A handy extension of our reconnecting web socket that will queue up messages
 * and send them if the original attempt is unsuccessful.
 *
 * This one looks a bit like the ReconnectingWebSocket from which it inherits
 * the majority of its functionality with a couple differences.
 *
 * Here we use the ondatanotsent and the onreconnect methods to implement the
 * resend functionality.  This means that those events are not available to the
 * caller, as such we try and detect this error condition and warn about it when
 * sending
 */
function ReconnectingResendingWebSocket(url){
  ReconnectingWebSocket.apply(this, arguments);
  var unsentMessages = [];
  // we're making 'local' versions of these event handlers because we want
  // to remember them for later comparison during send.  This is so we can be nice
  // and catch people who do things that may break our resending
  var ondatanotsent = function(data) {
    log.info("queueing message for resend");
    unsentMessages.push(data);
  }.bind(this);
  var onreconnect = function() { 
    while (unsentMessages.length != 0){
      var message = unsentMessages.shift();
      this.send(message);
    }
  }.bind(this);

  // keep track of our originals
  this.originalondatanotsent = ondatanotsent;
  this.originalonreconnect = onreconnect;
  // 'register' our event handlers
  this.ondatanotsent = ondatanotsent;
  this.onreconnect = onreconnect

  // overriding the send method so we can check and see that our required event 
  // handlers are still in place, otherwise we'll let them know but still try 
  // and send as normal ( maybe the change is intentional )
  this.send = function()  {
    if ( onreconnect != this.onreconnect || ondatanotsent != this.ondatanotsent ){
      log.error("onreconnect or ondatanotsent have been reassigned, this could break resending!");
    }
    sender.apply(this, arguments);
  }.bind(this);
}
ReconnectingResendingWebSocket.prototype = Object.create(ReconnectingWebSocket.prototype);
ReconnectingResendingWebSocket.constructor = ReconnectingResendingWebSocket;

// WS Constants at the 'class' Level.  Adding these since we can replace the
// native WebSocket and we still want people to be able to access them
ReconnectingResendingWebSocket.CONNECTING = ReconnectingWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
ReconnectingResendingWebSocket.OPEN = ReconnectingWebSocket.OPEN = OriginalWebSocket.OPEN;
ReconnectingResendingWebSocket.CLOSING = ReconnectingWebSocket.CLOSING = OriginalWebSocket.CLOSING;
ReconnectingResendingWebSocket.CLOSED = ReconnectingWebSocket.CLOSED = OriginalWebSocket.CLOSED;

function MakeWebSocketReconnecting(){
  WebSocket = ReconnectingWebSocket; 
  global.UnMakeWebSocketReconnecting = function(){
    WebSocket = OriginalWebSocket;
    UnMakeWebSocketReconnecting = null;
  };
}

function MakeWebSocketReconnectingAndResending(){
  WebSocket = ReconnectingResendingWebSocket; 
  global.UnMakeWebSocketReconnectingAndResending = function(){
    WebSocket = OriginalWebSocket;
    UnMakeWebSocketReconnectingAndResending = null;
  };
}

module.exports.MakeWebSocketReconnecting = MakeWebSocketReconnecting;
module.exports.ReconnectingWebSocket = ReconnectingWebSocket;
module.exports.ReconnectingResendingWebSocket = ReconnectingResendingWebSocket;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"simplog":7,"ws":8}]},{},[])