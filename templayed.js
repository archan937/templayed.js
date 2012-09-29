if (typeof(templayed) == "undefined") {

// *
// * templayed.js 0.2.0 (Uncompressed)
// * A micro (Mustache.js compliant) Javascript templating library written in 1751 bytes (uncompressed)
// *
// * (c) 2012 Paul Engel (Internetbureau Holder B.V.)
// * Except otherwise noted, templayed.js is licensed under
// * http://creativecommons.org/licenses/by-sa/3.0
// *
// * $Date: 2012-09-29 13:02:26 +0100 (Sat, 29 September 2012) $
// *

templayed = function(template, vars) {
  (vars instanceof Array) || (vars = [vars]);

  var fetch = function(path, vars) {
    if (path.match(/\./)) {
      var keys = path.split(".");
      return fetch(keys.slice(1).join("."), [fetch(keys[0], vars)]);
    } else {
      return ((vars instanceof Array) ? vars[0] : vars)[path] || "";
    }
  }, compile = function(template, vars) {
    vars || (vars = "vars");
    return '"' + template.replace(/{{(!|#|&|{)?\s*(.*?)\s*}}+/g, function(match, operator, context) {
      var parse = context == "." ? vars + "[0]" : 'fetch(' + JSON.stringify(context) + ', ' + vars + ')';
      switch (operator) {
      case "!":
        return '';
      case "#":
        return '" + fetch(' + JSON.stringify(context) + ', vars).apply(' + vars + '[0]) + "';
      case "&": case "{":
        return '" + ' + parse + '.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;") + "';
      default:
        return '" + ' + parse + ' + "';
      }
    }) + '"';
  };

  return eval('(function(vars) { return ' +
    compile(template.replace(/\"/g, '\\"').replace(/\n/g, '\\n').replace(/{{(\^|#)(.*?)}}(.*?){{\/\2}}/g, function(match, operator, key, context) {
      return ['" + (function() {',
        'var o = fetch(' + JSON.stringify(key) + ', vars);',
        (operator == "^" ?
        'return (((o instanceof Array) && o.length) || o === false) ? "" : ' + compile(context) + ';' : (
       ['if (typeof(o) == "boolean") {',
          'return (o === false ? "" : ' + compile(context) + ');',
        '} else {',
          'var s = "", i; for (i in o) { s += ' + compile(context, "[o[i]]") + '; }; return s;',
        '}'].join(" "))), '})() + "'
       ].join(" ");
    })
  ) + '; })');
};

templayed.version = "0.2.0";

}
