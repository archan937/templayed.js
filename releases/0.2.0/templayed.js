if (typeof(templayed) == "undefined") {

// *
// * templayed.js 0.2.0 (Uncompressed)
// * The fastest and smallest Mustache compliant Javascript templating library written in 1733 bytes (uncompressed)
// *
// * (c) 2012 Paul Engel (Internetbureau Holder B.V.)
// * Except otherwise noted, templayed.js is licensed under
// * http://creativecommons.org/licenses/by-sa/3.0
// *
// * $Date: 2012-10-08 01:50:27 +0100 (Mon, 08 October 2012) $
// *

templayed = function(template, vars) {

  var get = function(path, i) {
    i = 1; path = path.replace(/\.\.\//g, function() { i++; return ''; });
    var js = ['vars[vars.length - ', i, ']'], keys = (path == "." ? [] : path.split(".")), j = 0;
    for (j; j < keys.length; j++) { js.push('.' + keys[j]); };
    return js.join('');
  }, tag = function(template) {
    return template.replace(/\{\{(!|&|\{)?\s*(.*?)\s*}}+/g, function(match, operator, context) {
      if (operator == "!") return '';
      var i = inc++;
      return ['"; var o', i, ' = ', get(context), '; s += ((typeof(o', i, ') == "function" ? o', i, '.call(vars[vars.length - 1]) : o', i, ') || "")',
        (!operator ? '' : '.replace(/&/g,"&amp;").replace(/>/g,"&gt;").replace(/</g,"&lt;").replace(/"/g,"&quot;")'), ' + "'
      ].join('');
    });
  }, block = function(template) {
    return tag(template.replace(/\{\{(\^|#)(.*?)}}(.*?)\{\{\/\2}}/g, function(match, operator, key, context) {
      var i = inc++;
      return ['"; var o', i, ' = ', get(key), '; ',
        (operator == "^" ?
          ['if (!(((o', i, ' instanceof Array) && o', i, '.length) || !o', i, ')) { s += "', block(context), '"; } '] :
          ['if (typeof(o', i, ') == "boolean" && o', i, ') { s += "', block(context), '"; } else if (o', i, ') { for (var i', i, ' = 0; i', i, ' < o',
            i, '.length; i', i, '++) { vars.push(o', i, '[i', i, ']); s += "', block(context), '"; vars.pop(); }}']
        ).join(''), '; s += "'].join('');
    }));
  }, inc = 0;

  return new Function("vars", 'vars = [vars], s = "' + block(template.replace(/"/g, '\\"').replace(/\n/g, '\\n')) + '"; return s;');
};

templayed.version = "0.2.0";

}
