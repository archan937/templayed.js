function renderTemplate() {
  document.getElementById("hint").setAttribute("style", "display: none");
  try {
    document.getElementById("output").innerHTML = templayed(document.getElementById("template").value, eval("(" + document.getElementById("variables").value + ")"));
  } catch(e) {
    alert(e);
  }
  return false;
};

function resetOutput() {
  document.getElementById("hint").setAttribute("style", "");
  document.getElementById("output").innerHTML = "";
};

function inspect(object) {
  switch (typeof(object)) {
  case "undefined":
    return "undefined";
  case "string":
    return "\"" + object + "\"";
  case "object":
    if (object == null) {
      return "null";
    }
    var a = [];
    if (object instanceof Array) {
      for (var i in object) {
        a.push(inspect(object[i]));
      };
      return "[" + a.join(", ") + "]";
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          a.push(key + ": " + inspect(object[key]));
        }
      };
      return "{" + a.join(", ") + "}";
    }
  default:
    return object.toString();
  }
};

function escape(html) {
  return html.replace(/&/g,'&amp;').
              replace(/>/g,'&gt;').
              replace(/</g,'&lt;').
              replace(/"/g,'&quot;')
};

function write(spec) {
  document.write("<hr>");
  document.write("<dl>");
  document.write("<dt>Input:</dt>");
  document.write("<dd>");
  document.write("template: " + escape(inspect(spec.template)));
  document.write("<br>");
  document.write("variables: " + escape(inspect(spec.variables)));
  document.write("</dd>");
  document.write("<br>");
  document.write("<dt>Output:</dt>");
  document.write("<dd>");
  document.write(templayed(spec.template, spec.variables));
  document.write("</dd>");
  document.write("</dl>");
};