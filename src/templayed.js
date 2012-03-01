if (typeof(Templayed) == "undefined") {

// *
// * templayed.js {version} (Uncompressed)
// * A micro (Mustache syntax-like) Javascript templating library
// *
// * (c) {year} Paul Engel (Internetbureau Holder B.V.)
// * Except otherwise noted, templayed.js is licensed under
// * http://creativecommons.org/licenses/by-sa/3.0
// *
// * $Date: {date} $
// *

Templayed = (function(undefined) {
  var self = this;

  var render = function(template, variables) {
    return template.replace(/{{#(.*?)}}(.*?){{\/\1}}/g, function(match, key, context) {
      var array = variables[key];
      var string = "";
      for (var i = 0; i < array.length; i++) {
        string += templayed(context, array[i]);
      }
      return string;
    }).replace(/{{(!)?(.*?)}}+/g, function(match, operator, context) {
      switch (operator) {
      case "!":
        return "";
      default:
        return variables[context];
      }
    });
  };

  return {
    version: "{version}",
    render: render
  };
}());

templayed = function() {
  return Templayed.render.apply(null, arguments);
};

}