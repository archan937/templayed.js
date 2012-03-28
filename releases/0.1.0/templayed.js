if (typeof(templayed) == "undefined") {

// *
// * templayed.js 0.1.0 (Uncompressed)
// * A micro (Mustache.js compliant) Javascript templating library written in 1751 bytes (uncompressed)
// *
// * (c) 2012 Paul Engel (Internetbureau Holder B.V.)
// * Except otherwise noted, templayed.js is licensed under
// * http://creativecommons.org/licenses/by-sa/3.0
// *
// * $Date: 2012-03-03 01:41:29 +0100 (Sat, 03 March 2012) $
// *

templayed = function(template, vars) {
  (vars instanceof Array) || (vars = [vars]);

  var fetch = function(path, vars) {
    if (path.match(/\./)) {
      var keys = path.split(".");
      return fetch(keys.slice(1).join("."), [fetch(keys[0], vars)]);
    } else {
      return vars.length ? (vars[0].hasOwnProperty(path) ? vars[0][path] : fetch(path, vars.slice(1))) : "";
    }
  };

  return template.replace(/{{(\^|#)(.*?)}}(.*?){{\/\2}}/g, function(match, operator, key, context) {
    var string = "", entry = fetch(key, vars), dup, i;
    if (operator == "^" || typeof(entry) == "boolean") {
      return ((entry instanceof Array) && entry.length) || entry === false ? string : templayed(context, vars);
    }
    for (i in entry) {
      dup = vars.slice();
      dup.unshift(entry[i]);
      string += templayed(context, dup);
    }
    return string;
  }).replace(/{{(!|#|&)?\s*(.*?)\s*}}+/g, function(match, operator, context) {
    switch (operator) {
    case "!":
      return "";
    case "#":
      return fetch(context, vars).apply(vars[0]);
    case "&":
      return templayed("{{" + context + "}}", vars).
             replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    default:
      return context == "." ? vars[0] : fetch(context, vars);
    }
  });

};

templayed.version = "0.1.0";

}
