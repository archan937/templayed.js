if (typeof(templayed) == "undefined") {

// *
// * templayed.js {version} (Uncompressed)
// * The fastest and smallest Mustache compliant Javascript templating library written in 1806 bytes (uncompressed)
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
    var js = ['vars[vars.length - ', i, ']'], keys = (path == "." ? [] : path.split(".")), j = 0, p = "";
    for (j; j < keys.length; j++) { p += "." + keys[j]; js.push(' && vars[vars.length - ', i, ']' + p); };
    return js.join('');
  }, tag = function(template) {
    return template.replace(/((^|(\\r)?\\n)\s*)?\{\{(!|&|\{|>)?\s*(.*?)\s*}?}}(\s*(\\r)?\\n)?/g, function(match, b, s, r, operator, context, e) {
      if (operator == "!") return b && e ? s : [s, e].join('');
      if (operator == ">") return [s, '" + (pars["', context, '"] ? templayed(pars["', context, '"])(vars[vars.length - 1], pars) : "") + "', b && e ? '' : e].join('');
      var i = inc++;
      return [b, '"; var o', i, ' = ', get(context), ', s', i, ' = (((typeof(o', i, ') == "function" ? o', i, '.call(vars[vars.length - 1]) : o', i, ') || "") + ""); s += ',
        (operator ? ('s' + i) : '(/[&"><]/.test(s' + i + ') ? s' + i + '.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/>/g,"&gt;").replace(/</g,"&lt;") : s' + i + ')'), ' + "', e
      ].join('');
    });
  }, block = function(template) {
    return tag(template.replace(/((^|(\\r)?\\n)\s*)?\{\{(\^|#)(.*?)}}(\s*(\\r)?\\n)?(.*?)((^|(\\r)?\\n)\s*)?\{\{\/\5}}(\s*(\\r)?\\n)?/g, function(match, b1, s1, r1, operator, key, e1, er1, context, b2, s2, r2, e2) {
      var i = inc++;
      return [(b1 && e1 ? s1 : [s1, e1].join('')), '"; var o', i, ' = ', get(key), '; ',
        (operator == "^" ?
          ['if ((o', i, ' instanceof Array) ? !o', i, '.length : !o', i, ') { s += "', block(context), '"; } '] :
          ['if (typeof(o', i, ') == "boolean" && o', i, ') { s += "', block(context), '"; }',
           'else if (typeof(o', i, ') == "function") { s += o', i, '("', context.replace(/\{\{(\{?)/g, function(m, a) { return '\\{\\{' + (a ? '\\{' : ''); }), '"); }',
           'else if (o', i, ') { if (!(o', i, ' instanceof Array)) o', i, ' = [o', i, ']; for (var i', i, ' = 0; i', i, ' < o', i, '.length; i', i, '++) {',
            'vars.push(o', i, '[i', i, ']); s += "', block(context), '"; vars.pop(); }}']
        ).join(''), '; s += "', (b2 && e2 ? s2 : [s2, e2].join(''))].join('');
    })).replace(/\\\{{2}(\\\{?)/g, function(m, a) { return '{{' + (a ? '{' : ''); });
  }, inc = 0;

  return new Function("vars", "pars", 'vars = [vars], s = "' + block(template.replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n')) + '"; return s;');
};

templayed.version = "{version}";

}