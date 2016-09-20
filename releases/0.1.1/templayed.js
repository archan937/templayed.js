if (typeof(templayed) == "undefined") {

// *
// * templayed.js 0.1.1 (Uncompressed)
// * A micro (Mustache.js compliant) Javascript templating library written in 1751 bytes (uncompressed)
// *
// * (c) 2012 Paul Engel
// * templayed.js is licensed under MIT license
// *
// * $Date: 2012-03-28 21:13:11 +0100 (Wed, 28 March 2012) $
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

  return template.replace(/\n/g, " ").replace(/{{(\^|#)(.*?)}}(.*?){{\/\2}}/g, function(match, operator, key, context) {
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

templayed.version = "0.1.1";

}
