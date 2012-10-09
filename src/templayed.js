if (typeof(templayed) == "undefined") {

// *
// * templayed.js {version} (Uncompressed)
// * The fastest and smallest Mustache compliant Javascript templating library written in 2559 bytes (uncompressed)
// *
// * (c) {year} Paul Engel (Internetbureau Holder B.V.)
// * Except otherwise noted, templayed.js is licensed under
// * http://creativecommons.org/licenses/by-sa/3.0
// *
// * $Date: {date} $
// *

templayed = function(template, vars) {

  var get = function(path, i) {
    i = 1; path = path.replace(/\.\.\//g, function() { i++; return ''; });
    var js = ['vars[vars.length - ', i, ']'], keys = (path == "." ? [] : path.split(".")), j = 0;
    for (j; j < keys.length; j++) { js.push('.' + keys[j]); };
    return js.join('');
  }, tag = function(template) {
    return template.replace(/\{\{(!|&|\{)?\s*(.*?)\s*}}+/g, function(match, operator, context) {
      if (operator == '!') return '';
      var h = templayed.helpers[context], i;
      return ['"; ', (h ? [' s += (templayed.helpers.', context, '.call(vars[vars.length - 1])'] :
        ['var o', (i = inc++), ' = ', get(context), '; s += (typeof(o', i, ') == "function" ? o', i, '.call(vars[vars.length - 1]) : o', i]
        ).join(''), ' || "")', (!operator ? '' : '.replace(/&/g,"&amp;").replace(/>/g,"&gt;").replace(/</g,"&lt;").replace(/"/g,"&quot;")'), ' + "'
      ].join('');
    });
  }, block = function(template) {
    return tag(template.replace(/\{\{(\^|#)([^\s]*?)\s*(.*?)}}(.*?)\{\{\/\2}}/g, function(match, operator, key, params, context) {
      var i, args, blocks;
      if (templayed.helpers[key]) {
        params = params.split(/\s+/), blocks = context.split('{{else}}'), args = [];
        for (i = 0; i < params.length; i++) args.push(params[i].match(/^\\".+\\"$/) ? params[i].replace(/(^\\"|\\"$)/g, '"') : get(params[i]));
        return ['"; if (templayed.helpers["', key, '"](', args.join(', '), ')) { s += "', block(blocks.shift()), '"; } else { s += "',
          block(blocks.join('{{else}}')), '"; } s += "'].join('');
      }
      return ['"; var o', (i = inc++), ' = ', get(key), '; ',
        (operator == '^' ?
          ['if (!(((o', i, ' instanceof Array) && o', i, '.length) || !o', i, ')) { s += "', block(context), '"; } '] :
          ['if (typeof(o', i, ') == "boolean" && o', i, ') { s += "', block(context), '"; } else if (o', i, ') { for (var i', i, ' = 0; i', i, ' < o',
            i, '.length; i', i, '++) { vars.push(o', i, '[i', i, ']); s += "', block(context), '"; vars.pop(); }}']
        ).join(''), '; s += "'].join('');
    }));
  }, inc = 0;

  return new Function("vars", 'vars = [vars], s = "' + block(template.replace(/"/g, '\\"').replace(/\n/g, '\\n')) + '"; return s;');
};

templayed.helpers = {
  "if": function(val) { return !!val; },
  "unless": function(val) { return !val; }
};
templayed.helper = function(name, f) { templayed.helpers[name] = f; };
templayed.version = "{version}";

}