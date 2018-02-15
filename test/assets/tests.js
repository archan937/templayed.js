var inspect = function(object) {
  switch (typeof(object)) {
  case "undefined":
    return "undefined";
  case "string":
    return "\"" + object.replace(/\n/g, "\\n").replace(/\"/g, "\\\"") + "\"";
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

(function run() {

  test("Variables", function() {
    var template  = "<p>This library is called {{name}}!</p>",
        variables = {name: "templayed.js"},
        expected  = "<p>This library is called templayed.js!</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Dot notated variables", function() {
    var template  = "<p>My name is {{person.first_name}} {{person.last_name}}!</p>",
        variables = {person: {first_name: "Paul", last_name: "Engel"}},
        expected  = "<p>My name is Paul Engel!</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Comments", function() {
    var template  = "<p>No comment, {{name}}!{{!comment}}</p>",
        variables = {name: "Chuck", comment: "COMMENT"},
        expected  = "<p>No comment, Chuck!</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Automatically HTML escape content", function() {
    var template  = "<p>{{html}}</p>",
        variables = {html: "<strong>Paul Engel</strong>"},
        expected  = "<p>&lt;strong&gt;Paul Engel&lt;/strong&gt;</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("HTML escaping using {{&html}}", function() {
    var template  = "<p>{{html}} {{&html}}</p>",
        variables = {html: "<strong>Paul Engel</strong>"},
        expected  = "<p>&lt;strong&gt;Paul Engel&lt;/strong&gt; <strong>Paul Engel</strong></p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("HTML escaping using {{{html}}}", function() {
    var template  = "<p>{{html}} {{{html}}}</p>",
        variables = {html: "<strong>Paul Engel</strong>"},
        expected  = "<p>&lt;strong&gt;Paul Engel&lt;/strong&gt; <strong>Paul Engel</strong></p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Conditional sections", function() {
    var template  = "<p>This is shown!{{#show}} Psst, this is never shown{{/show}}</p>",
        variables = {},
        expected  = "<p>This is shown!</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));

    template  = "<p>This is shown!{{#show}} Psst, this is never shown{{/show}}</p>",
    variables = {show: false},
    expected  = "<p>This is shown!</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));

    template  = "<p>This is shown!{{#show}} Psst, this is never shown{{/show}}</p>",
    variables = {show: ''},
    expected  = "<p>This is shown!</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));

    template  = "<p>This is shown!{{#show}} And, this is also shown{{/show}}</p>",
    variables = {show: true},
    expected  = "<p>This is shown! And, this is also shown</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));

    template  = "<p>This is {{show}}!{{#show}} And, this is also {{.}}{{/show}}</p>",
    variables = {show: 'shown'},
    expected  = "<p>This is shown! And, this is also shown</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Empty lists", function() {
    var template  = "{{name}}<ul>{{#names}}<li>{{name}}</li>{{/names}}</ul>{{^names}}Sorry, no people to list!{{/names}}",
        variables = {names: []},
        expected  = "<ul></ul>Sorry, no people to list!";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Non-empty lists", function() {
    var template  = "<p>{{name}}</p><ul>{{#names}}<li>{{name}}</li>{{/names}}</ul>{{^names}}Sorry, no people to list!{{/names}}<p>{{name}}</p>",
        variables = {name: "Chunk Norris", names: [{name: "Paul Engel"}, {name: "Clint Eastwood"}]},
        expected  = "<p>Chunk Norris</p><ul><li>Paul Engel</li><li>Clint Eastwood</li></ul><p>Chunk Norris</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Functions", function() {
    var template  = "<p>{{calc}}</p>",
        variables = {calc: function() { return 2 + 4; }};
        expected  = "<p>6</p>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));

    template  = "<ul>{{#names}}<li>{{../fullName}}</li>{{/names}}</ul>",
    variables = {
      names: [{firstName: "Paul", lastName: "Engel"}, {firstName: "Chunk", lastName: "Norris"}],
      fullName: function() {
        return this.lastName + ", " + this.firstName;
      }
    };
    expected  = "<ul><li>Engel, Paul</li><li>Norris, Chunk</li></ul>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));

    template  = "<ul>{{#names}}<li>{{fullName}}</li>{{/names}}</ul>",
    variables = {
      names: [{
        firstName: "Paul",
        lastName: "Engel",
        fullName: function() { return this.lastName + ", " + this.firstName; }
      }, {
        firstName: "Chunk",
        lastName: "Norris",
        fullName: function() { return this.lastName + ", " + this.firstName; }
      }]
    };
    expected  = "<ul><li>Engel, Paul</li><li>Norris, Chunk</li></ul>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Current item referrals", function() {
    var template  = "<ul>{{#names}}<li>{{.}}{{foo}}</li>{{/names}}</ul>",
        variables = {names: ["Paul", "Engel"]},
        expected  = "<ul><li>Paul</li><li>Engel</li></ul>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));

    template  = "<ul>{{#funcs}}<li>{{.}}</li>{{/funcs}}</ul>",
    variables = {funcs: [function() { return "Paul"; }, function() { return "Engel"; }]},
    expected  = "<ul><li>Paul</li><li>Engel</li></ul>";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Scoping variables", function() {
    var template  = "{{#groups}}<strong>{{category}}</strong>{{#persons}}{{../bullet}} {{../../fullName}}{{/persons}}{{/groups}}",
        variables = {groups: [
          {category: "Developers", bullet: ">", persons: [{firstName: "Paul", lastName: "Engel"}]},
          {category: "Celebraties", bullet: "<", persons: [{firstName: "Chunk", lastName: "Norris"}]}
        ], fullName: function() { return this.lastName + ", " + this.firstName; }},
        expected  = "<strong>Developers</strong>&gt; Engel, Paul<strong>Celebraties</strong>&lt; Norris, Chunk";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));

    template  = "{{#groups}}<strong>{{category}}</strong>{{#persons}}{{{../bullet}}} {{../../fullName}}{{/persons}}{{/groups}}",
    variables = {groups: [
      {category: "Developers", bullet: ">", persons: [{firstName: "Paul", lastName: "Engel"}]},
      {category: "Celebraties", bullet: "<", persons: [{firstName: "Chunk", lastName: "Norris"}]}
    ], fullName: function() { return this.lastName + ", " + this.firstName; }},
    expected  = "<strong>Developers</strong>> Engel, Paul<strong>Celebraties</strong>< Norris, Chunk";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Tackling new lines", function() {
    var template  = "Hi {{name}},\nBye {{name}}",
        variables = {name: "Paul Engel"},
        expected  = "Hi Paul Engel,\nBye Paul Engel";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Tackling numbers", function() {
    var template  = "1, {{two}}, {{three}}!",
        variables = {two: 2, three: 3},
        expected  = "1, 2, 3!";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
    
    template  = "{{zero}}!",
    variables = {zero: 0},
    expected  = "0!";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Quote escaping", function() {
    var template  = "\"Hi, my name is {{name}}\"!",
        variables = {name: "Paul Engel"},
        expected  = "\"Hi, my name is Paul Engel\"!";
    equal(templayed(template)(variables), expected, inspect(template) + ", " + inspect(variables));
  });

  test("Nested sections (http://mustache.github.com/#demo)", function() {
    var template = [
      "<h1>{{header}}</h1>",
      "{{#bug}}",
      "{{/bug}}",
      "{{#items}}",
        "{{#first}}",
          "<li><strong>{{name}}</strong></li>",
        "{{/first}}",
        "{{#link}}",
          "<li><a href=\"{{url}}\">{{name}}</a></li>",
        "{{/link}}",
      "{{/items}}",
      "{{#empty}}",
        "<p>The list is empty.</p>",
      "{{/empty}}"
    ].join("\n"),
    variables = {
      header: "Colors",
      items: [
        {"name": "red", "first": true, "url": "#Red"},
        {"name": "green", "link": true, "url": "#Green"},
        {"name": "blue", "link": true, "url": "#Blue"}
      ],
      empty: false
    },
    expected = [
      "<h1>Colors</h1>",
      "<li><strong>red</strong></li>",
      "<li><a href=\"#Green\">green</a></li>",
      "<li><a href=\"#Blue\">blue</a></li>"
    ].join("\n");
    equal(templayed(template)(variables).replace(/\>\s+\</g, ">\n<").replace(/(^\s+|\s+$)/, ""), expected, inspect(template) + ", " + inspect(variables));
  });

})();