require("./../src/templayed.js");

var assert = require("assert");

suite("Comments", function() {

  test("Comment blocks should be removed from the template (inline)", function() {
    assert.equal("1234567890", templayed("12345{{! Comment Block! }}67890")({}, {}));
  });

  test("Multiline comments should be permitted (multiline)", function() {
    assert.equal("1234567890\n", templayed("12345{{!\n  This is a\n  multi-line comment...\n}}67890\n")({}, {}));
  });

  test("All standalone comment lines should be removed (standalone)", function() {
    assert.equal("Begin.\nEnd.\n", templayed("Begin.\n{{! Comment Block! }}\nEnd.\n")({}, {}));
  });

  test("All standalone comment lines should be removed (indented standalone)", function() {
    assert.equal("Begin.\nEnd.\n", templayed("Begin.\n  {{! Indented Comment Block! }}\nEnd.\n")({}, {}));
  });

  test("\"\\r\\n\" should be considered a newline for standalone tags (standalone line endings)", function() {
    assert.equal("|\r\n|", templayed("|\r\n{{! Standalone Comment }}\r\n|")({}, {}));
  });

  test("Standalone tags should not require a newline to precede them (standalone without previous line)", function() {
    assert.equal("!", templayed("  {{! I'm Still Standalone }}\n!")({}, {}));
  });

  test("Standalone tags should not require a newline to follow them (standalone without newline)", function() {
    assert.equal("!\n", templayed("!\n  {{! I'm Still Standalone }}")({}, {}));
  });

  test("All standalone comment lines should be removed (multiline standalone)", function() {
    assert.equal("Begin.\nEnd.\n", templayed("Begin.\n{{!\nSomething's going on here...\n}}\nEnd.\n")({}, {}));
  });

  test("All standalone comment lines should be removed (indented multiline standalone)", function() {
    assert.equal("Begin.\nEnd.\n", templayed("Begin.\n  {{!\n    Something's going on here...\n  }}\nEnd.\n")({}, {}));
  });

  test("Inline comments should not strip whitespace (indented inline)", function() {
    assert.equal("  12 \n", templayed("  12 {{! 34 }}\n")({}, {}));
  });

  test("Comment removal should preserve surrounding whitespace (surrounding whitespace)", function() {
    assert.equal("12345  67890", templayed("12345 {{! Comment Block! }} 67890")({}, {}));
  });

});
suite("Interpolation", function() {

  test("Mustache-free templates should render as-is (no interpolation)", function() {
    assert.equal("Hello from {Mustache}!\n", templayed("Hello from {Mustache}!\n")({}, {}));
  });

  test("Unadorned tags should interpolate content into the template (basic interpolation)", function() {
    assert.equal("Hello, world!\n", templayed("Hello, {{subject}}!\n")({"subject":"world"}, {}));
  });

  test("Basic interpolation should be HTML escaped (html escaping)", function() {
    assert.equal("These characters should be HTML escaped: &amp; &quot; &lt; &gt;\n", templayed("These characters should be HTML escaped: {{forbidden}}\n")({"forbidden":"& \" < >"}, {}));
  });

  test("Triple mustaches should interpolate without HTML escaping (triple mustache)", function() {
    assert.equal("These characters should not be HTML escaped: & \" < >\n", templayed("These characters should not be HTML escaped: {{{forbidden}}}\n")({"forbidden":"& \" < >"}, {}));
  });

  test("Ampersand should interpolate without HTML escaping (ampersand)", function() {
    assert.equal("These characters should not be HTML escaped: & \" < >\n", templayed("These characters should not be HTML escaped: {{&forbidden}}\n")({"forbidden":"& \" < >"}, {}));
  });

  test("Integers should interpolate seamlessly (basic integer interpolation)", function() {
    assert.equal("\"85 miles an hour!\"", templayed("\"{{mph}} miles an hour!\"")({"mph":85}, {}));
  });

  test("Integers should interpolate seamlessly (triple mustache integer interpolation)", function() {
    assert.equal("\"85 miles an hour!\"", templayed("\"{{{mph}}} miles an hour!\"")({"mph":85}, {}));
  });

  test("Integers should interpolate seamlessly (ampersand integer interpolation)", function() {
    assert.equal("\"85 miles an hour!\"", templayed("\"{{&mph}} miles an hour!\"")({"mph":85}, {}));
  });

  test("Decimals should interpolate seamlessly with proper significance (basic decimal interpolation)", function() {
    assert.equal("\"1.21 jiggawatts!\"", templayed("\"{{power}} jiggawatts!\"")({"power":1.21}, {}));
  });

  test("Decimals should interpolate seamlessly with proper significance (triple mustache decimal interpolation)", function() {
    assert.equal("\"1.21 jiggawatts!\"", templayed("\"{{{power}}} jiggawatts!\"")({"power":1.21}, {}));
  });

  test("Decimals should interpolate seamlessly with proper significance (ampersand decimal interpolation)", function() {
    assert.equal("\"1.21 jiggawatts!\"", templayed("\"{{&power}} jiggawatts!\"")({"power":1.21}, {}));
  });

  test("Failed context lookups should default to empty strings (basic context miss interpolation)", function() {
    assert.equal("I () be seen!", templayed("I ({{cannot}}) be seen!")({}, {}));
  });

  test("Failed context lookups should default to empty strings (triple mustache context miss interpolation)", function() {
    assert.equal("I () be seen!", templayed("I ({{{cannot}}}) be seen!")({}, {}));
  });

  test("Failed context lookups should default to empty strings (ampersand context miss interpolation)", function() {
    assert.equal("I () be seen!", templayed("I ({{&cannot}}) be seen!")({}, {}));
  });

  test("Dotted names should be considered a form of shorthand for sections (dotted names - basic interpolation)", function() {
    assert.equal("\"Joe\" == \"Joe\"", templayed("\"{{person.name}}\" == \"{{#person}}{{name}}{{/person}}\"")({"person":{"name":"Joe"}}, {}));
  });

  test("Dotted names should be considered a form of shorthand for sections (dotted names - triple mustache interpolation)", function() {
    assert.equal("\"Joe\" == \"Joe\"", templayed("\"{{{person.name}}}\" == \"{{#person}}{{{name}}}{{/person}}\"")({"person":{"name":"Joe"}}, {}));
  });

  test("Dotted names should be considered a form of shorthand for sections (dotted names - ampersand interpolation)", function() {
    assert.equal("\"Joe\" == \"Joe\"", templayed("\"{{&person.name}}\" == \"{{#person}}{{&name}}{{/person}}\"")({"person":{"name":"Joe"}}, {}));
  });

  test("Dotted names should be functional to any level of nesting (dotted names - arbitrary depth)", function() {
    assert.equal("\"Phil\" == \"Phil\"", templayed("\"{{a.b.c.d.e.name}}\" == \"Phil\"")({"a":{"b":{"c":{"d":{"e":{"name":"Phil"}}}}}}, {}));
  });

  test("Any falsey value prior to the last part of the name should yield '' (dotted names - broken chains)", function() {
    assert.equal("\"\" == \"\"", templayed("\"{{a.b.c}}\" == \"\"")({"a":{}}, {}));
  });

  test("Each part of a dotted name should resolve only against its parent (dotted names - broken chain resolution)", function() {
    assert.equal("\"\" == \"\"", templayed("\"{{a.b.c.name}}\" == \"\"")({"a":{"b":{}},"c":{"name":"Jim"}}, {}));
  });

  test("The first part of a dotted name should resolve as any other name (dotted names - initial resolution)", function() {
    assert.equal("\"Phil\" == \"Phil\"", templayed("\"{{#a}}{{b.c.d.e.name}}{{/a}}\" == \"Phil\"")({"a":{"b":{"c":{"d":{"e":{"name":"Phil"}}}}},"b":{"c":{"d":{"e":{"name":"Wrong"}}}}}, {}));
  });

  test("Interpolation should not alter surrounding whitespace (interpolation - surrounding whitespace)", function() {
    assert.equal("| --- |", templayed("| {{string}} |")({"string":"---"}, {}));
  });

  test("Interpolation should not alter surrounding whitespace (triple mustache - surrounding whitespace)", function() {
    assert.equal("| --- |", templayed("| {{{string}}} |")({"string":"---"}, {}));
  });

  test("Interpolation should not alter surrounding whitespace (ampersand - surrounding whitespace)", function() {
    assert.equal("| --- |", templayed("| {{&string}} |")({"string":"---"}, {}));
  });

  test("Standalone interpolation should not alter surrounding whitespace (interpolation - standalone)", function() {
    assert.equal("  ---\n", templayed("  {{string}}\n")({"string":"---"}, {}));
  });

  test("Standalone interpolation should not alter surrounding whitespace (triple mustache - standalone)", function() {
    assert.equal("  ---\n", templayed("  {{{string}}}\n")({"string":"---"}, {}));
  });

  test("Standalone interpolation should not alter surrounding whitespace (ampersand - standalone)", function() {
    assert.equal("  ---\n", templayed("  {{&string}}\n")({"string":"---"}, {}));
  });

  test("Superfluous in-tag whitespace should be ignored (interpolation with padding)", function() {
    assert.equal("|---|", templayed("|{{ string }}|")({"string":"---"}, {}));
  });

  test("Superfluous in-tag whitespace should be ignored (triple mustache with padding)", function() {
    assert.equal("|---|", templayed("|{{{ string }}}|")({"string":"---"}, {}));
  });

  test("Superfluous in-tag whitespace should be ignored (ampersand with padding)", function() {
    assert.equal("|---|", templayed("|{{& string }}|")({"string":"---"}, {}));
  });

});
suite("Inverted", function() {

  test("Falsey sections should have their contents rendered (falsey)", function() {
    assert.equal("\"This should be rendered.\"", templayed("\"{{^boolean}}This should be rendered.{{/boolean}}\"")({"boolean":false}, {}));
  });

  test("Truthy sections should have their contents omitted (truthy)", function() {
    assert.equal("\"\"", templayed("\"{{^boolean}}This should not be rendered.{{/boolean}}\"")({"boolean":true}, {}));
  });

  test("Objects and hashes should behave like truthy values (context)", function() {
    assert.equal("\"\"", templayed("\"{{^context}}Hi {{name}}.{{/context}}\"")({"context":{"name":"Joe"}}, {}));
  });

  test("Lists should behave like truthy values (list)", function() {
    assert.equal("\"\"", templayed("\"{{^list}}{{n}}{{/list}}\"")({"list":[{"n":1},{"n":2},{"n":3}]}, {}));
  });

  test("Empty lists should behave like falsey values (empty list)", function() {
    assert.equal("\"Yay lists!\"", templayed("\"{{^list}}Yay lists!{{/list}}\"")({"list":[]}, {}));
  });

  test("Multiple inverted sections per template should be permitted (doubled)", function() {
    assert.equal("* first\n* second\n* third\n", templayed("{{^bool}}\n* first\n{{/bool}}\n* {{two}}\n{{^bool}}\n* third\n{{/bool}}\n")({"two":"second","bool":false}, {}));
  });

  test("Nested falsey sections should have their contents rendered (nested (falsey))", function() {
    assert.equal("| A B C D E |", templayed("| A {{^bool}}B {{^bool}}C{{/bool}} D{{/bool}} E |")({"bool":false}, {}));
  });

  test("Nested truthy sections should be omitted (nested (truthy))", function() {
    assert.equal("| A  E |", templayed("| A {{^bool}}B {{^bool}}C{{/bool}} D{{/bool}} E |")({"bool":true}, {}));
  });

  test("Failed context lookups should be considered falsey (context misses)", function() {
    assert.equal("[Cannot find key 'missing'!]", templayed("[{{^missing}}Cannot find key 'missing'!{{/missing}}]")({}, {}));
  });

  test("Dotted names should be valid for Inverted Section tags (dotted names - truthy)", function() {
    assert.equal("\"\" == \"\"", templayed("\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"\"")({"a":{"b":{"c":true}}}, {}));
  });

  test("Dotted names should be valid for Inverted Section tags (dotted names - falsey)", function() {
    assert.equal("\"Not Here\" == \"Not Here\"", templayed("\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"Not Here\"")({"a":{"b":{"c":false}}}, {}));
  });

  test("Dotted names that cannot be resolved should be considered falsey (dotted names - broken chains)", function() {
    assert.equal("\"Not Here\" == \"Not Here\"", templayed("\"{{^a.b.c}}Not Here{{/a.b.c}}\" == \"Not Here\"")({"a":{}}, {}));
  });

  test("Inverted sections should not alter surrounding whitespace (surrounding whitespace)", function() {
    assert.equal(" | \t|\t | \n", templayed(" | {{^boolean}}\t|\t{{/boolean}} | \n")({"boolean":false}, {}));
  });

  test("Inverted should not alter internal whitespace (internal whitespace)", function() {
    assert.equal(" |  \n  | \n", templayed(" | {{^boolean}} {{! Important Whitespace }}\n {{/boolean}} | \n")({"boolean":false}, {}));
  });

  test("Single-line sections should not alter surrounding whitespace (indented inline sections)", function() {
    assert.equal(" NO\n WAY\n", templayed(" {{^boolean}}NO{{/boolean}}\n {{^boolean}}WAY{{/boolean}}\n")({"boolean":false}, {}));
  });

  test("Standalone lines should be removed from the template (standalone lines)", function() {
    assert.equal("| This Is\n|\n| A Line\n", templayed("| This Is\n{{^boolean}}\n|\n{{/boolean}}\n| A Line\n")({"boolean":false}, {}));
  });

  test("Standalone indented lines should be removed from the template (standalone indented lines)", function() {
    assert.equal("| This Is\n|\n| A Line\n", templayed("| This Is\n  {{^boolean}}\n|\n  {{/boolean}}\n| A Line\n")({"boolean":false}, {}));
  });

  test("\"\\r\\n\" should be considered a newline for standalone tags (standalone line endings)", function() {
    assert.equal("|\r\n|", templayed("|\r\n{{^boolean}}\r\n{{/boolean}}\r\n|")({"boolean":false}, {}));
  });

  test("Standalone tags should not require a newline to precede them (standalone without previous line)", function() {
    assert.equal("^\n/", templayed("  {{^boolean}}\n^{{/boolean}}\n/")({"boolean":false}, {}));
  });

  test("Standalone tags should not require a newline to follow them (standalone without newline)", function() {
    assert.equal("^\n/\n", templayed("^{{^boolean}}\n/\n  {{/boolean}}")({"boolean":false}, {}));
  });

  test("Superfluous in-tag whitespace should be ignored (padding)", function() {
    assert.equal("|=|", templayed("|{{^ boolean }}={{/ boolean }}|")({"boolean":false}, {}));
  });

});
suite("Lambdas", function() {

  test("A lambda's return value should be interpolated (interpolation)", function() {
    assert.equal("Hello, world!", templayed("Hello, {{lambda}}!")({lambda:function() { return "world" }}, {}));
  });

  test("A lambda's return value should be parsed (interpolation - expansion)", function() {
    assert.equal("Hello, world!", templayed("Hello, {{lambda}}!")({lambda:function() { return "{{planet}}" }}, {}));
  });

  test("A lambda's return value should parse with the default delimiters (interpolation - alternate delimiters)", function() {
    assert.equal("Hello, (|planet| => world)!", templayed("{{= | | =}}\nHello, (|&lambda|)!")({lambda:function() { return "|planet| => {{planet}}" }}, {}));
  });

  test("Interpolated lambdas should not be cached (interpolation - multiple calls)", function() {
    assert.equal("1 == 2 == 3", templayed("{{lambda}} == {{{lambda}}} == {{lambda}}")({lambda:function() { return (g=(function(){return this})()).calls=(g.calls||0)+1 }}, {}));
  });

  test("Lambda results should be appropriately escaped (escaping)", function() {
    assert.equal("<&gt;>", templayed("<{{lambda}}{{{lambda}}}")({lambda:function() { return ">" }}, {}));
  });

  test("Lambdas used for sections should receive the raw section string (section)", function() {
    assert.equal("<yes>", templayed("<{{#lambda}}{{x}}{{/lambda}}>")({lambda:function(txt) { return (txt == "{{x}}" ? "yes" : "no") }}, {}));
  });

  test("Lambdas used for sections should have their results parsed (section - expansion)", function() {
    assert.equal("<-Earth->", templayed("<{{#lambda}}-{{/lambda}}>")({lambda:function(txt) { return txt + "{{planet}}" + txt }}, {}));
  });

  test("Lambdas used for sections should parse with the current delimiters (section - alternate delimiters)", function() {
    assert.equal("<-{{planet}} => Earth->", templayed("{{= | | =}}<|#lambda|-|/lambda|>")({lambda:function(txt) { return txt + "{{planet}} => |planet|" + txt }}, {}));
  });

  test("Lambdas used for sections should not be cached (section - multiple calls)", function() {
    assert.equal("__FILE__ != __LINE__", templayed("{{#lambda}}FILE{{/lambda}} != {{#lambda}}LINE{{/lambda}}")({lambda:function(txt) { return "__" + txt + "__" }}, {}));
  });

  test("Lambdas used for inverted sections should be considered truthy (inverted section)", function() {
    assert.equal("<>", templayed("<{{^lambda}}{{static}}{{/lambda}}>")({lambda:function(txt) { return false }}, {}));
  });

});
suite("Partials", function() {

  test("The greater-than operator should expand to the named partial (basic behavior)", function() {
    assert.equal("\"from partial\"", templayed("\"{{>text}}\"")({}, {"text":"from partial"}));
  });

  test("The empty string should be used when the named partial is not found (failed lookup)", function() {
    assert.equal("\"\"", templayed("\"{{>text}}\"")({}, {}));
  });

  test("The greater-than operator should operate within the current context (context)", function() {
    assert.equal("\"*content*\"", templayed("\"{{>partial}}\"")({"text":"content"}, {"partial":"*{{text}}*"}));
  });

  test("The greater-than operator should properly recurse (recursion)", function() {
    assert.equal("X<Y<>>", templayed("{{>node}}")({"content":"X","nodes":[{"content":"Y","nodes":[]}]}, {"node":"{{content}}<{{#nodes}}{{>node}}{{/nodes}}>"}));
  });

  test("The greater-than operator should not alter surrounding whitespace (surrounding whitespace)", function() {
    assert.equal("| \t|\t |", templayed("| {{>partial}} |")({}, {"partial":"\t|\t"}));
  });

  test("Whitespace should be left untouched (inline indentation)", function() {
    assert.equal("  |  >\n>\n", templayed("  {{data}}  {{> partial}}\n")({"data":"|"}, {"partial":">\n>"}));
  });

  test("\"\\r\\n\" should be considered a newline for standalone tags (standalone line endings)", function() {
    assert.equal("|\r\n>|", templayed("|\r\n{{>partial}}\r\n|")({}, {"partial":">"}));
  });

  test("Standalone tags should not require a newline to precede them (standalone without previous line)", function() {
    assert.equal("  >\n  >>", templayed("  {{>partial}}\n>")({}, {"partial":">\n>"}));
  });

  test("Standalone tags should not require a newline to follow them (standalone without newline)", function() {
    assert.equal(">\n  >\n  >", templayed(">\n  {{>partial}}")({}, {"partial":">\n>"}));
  });

  test("Each line of the partial should be indented before rendering (standalone indentation)", function() {
    assert.equal("\\\n |\n <\n->\n |\n/\n", templayed("\\\n {{>partial}}\n/\n")({"content":"<\n->"}, {"partial":"|\n{{{content}}}\n|\n"}));
  });

  test("Superfluous in-tag whitespace should be ignored (padding whitespace)", function() {
    assert.equal("|[]|", templayed("|{{> partial }}|")({"boolean":true}, {"partial":"[]"}));
  });

});
suite("Sections", function() {

  test("Truthy sections should have their contents rendered (truthy)", function() {
    assert.equal("\"This should be rendered.\"", templayed("\"{{#boolean}}This should be rendered.{{/boolean}}\"")({"boolean":true}, {}));
  });

  test("Falsey sections should have their contents omitted (falsey)", function() {
    assert.equal("\"\"", templayed("\"{{#boolean}}This should not be rendered.{{/boolean}}\"")({"boolean":false}, {}));
  });

  test("Objects and hashes should be pushed onto the context stack (context)", function() {
    assert.equal("\"Hi Joe.\"", templayed("\"{{#context}}Hi {{name}}.{{/context}}\"")({"context":{"name":"Joe"}}, {}));
  });

  test("All elements on the context stack should be accessible (deeply nested contexts)", function() {
    assert.equal("1\n121\n12321\n1234321\n123454321\n1234321\n12321\n121\n1\n", templayed("{{#a}}\n{{one}}\n{{#b}}\n{{one}}{{two}}{{one}}\n{{#c}}\n{{one}}{{two}}{{three}}{{two}}{{one}}\n{{#d}}\n{{one}}{{two}}{{three}}{{four}}{{three}}{{two}}{{one}}\n{{#e}}\n{{one}}{{two}}{{three}}{{four}}{{five}}{{four}}{{three}}{{two}}{{one}}\n{{/e}}\n{{one}}{{two}}{{three}}{{four}}{{three}}{{two}}{{one}}\n{{/d}}\n{{one}}{{two}}{{three}}{{two}}{{one}}\n{{/c}}\n{{one}}{{two}}{{one}}\n{{/b}}\n{{one}}\n{{/a}}\n")({"a":{"one":1},"b":{"two":2},"c":{"three":3},"d":{"four":4},"e":{"five":5}}, {}));
  });

  test("Lists should be iterated; list items should visit the context stack (list)", function() {
    assert.equal("\"123\"", templayed("\"{{#list}}{{item}}{{/list}}\"")({"list":[{"item":1},{"item":2},{"item":3}]}, {}));
  });

  test("Empty lists should behave like falsey values (empty list)", function() {
    assert.equal("\"\"", templayed("\"{{#list}}Yay lists!{{/list}}\"")({"list":[]}, {}));
  });

  test("Multiple sections per template should be permitted (doubled)", function() {
    assert.equal("* first\n* second\n* third\n", templayed("{{#bool}}\n* first\n{{/bool}}\n* {{two}}\n{{#bool}}\n* third\n{{/bool}}\n")({"two":"second","bool":true}, {}));
  });

  test("Nested truthy sections should have their contents rendered (nested (truthy))", function() {
    assert.equal("| A B C D E |", templayed("| A {{#bool}}B {{#bool}}C{{/bool}} D{{/bool}} E |")({"bool":true}, {}));
  });

  test("Nested falsey sections should be omitted (nested (falsey))", function() {
    assert.equal("| A  E |", templayed("| A {{#bool}}B {{#bool}}C{{/bool}} D{{/bool}} E |")({"bool":false}, {}));
  });

  test("Failed context lookups should be considered falsey (context misses)", function() {
    assert.equal("[]", templayed("[{{#missing}}Found key 'missing'!{{/missing}}]")({}, {}));
  });

  test("Implicit iterators should directly interpolate strings (implicit iterator - string)", function() {
    assert.equal("\"(a)(b)(c)(d)(e)\"", templayed("\"{{#list}}({{.}}){{/list}}\"")({"list":["a","b","c","d","e"]}, {}));
  });

  test("Implicit iterators should cast integers to strings and interpolate (implicit iterator - integer)", function() {
    assert.equal("\"(1)(2)(3)(4)(5)\"", templayed("\"{{#list}}({{.}}){{/list}}\"")({"list":[1,2,3,4,5]}, {}));
  });

  test("Implicit iterators should cast decimals to strings and interpolate (implicit iterator - decimal)", function() {
    assert.equal("\"(1.1)(2.2)(3.3)(4.4)(5.5)\"", templayed("\"{{#list}}({{.}}){{/list}}\"")({"list":[1.1,2.2,3.3,4.4,5.5]}, {}));
  });

  test("Dotted names should be valid for Section tags (dotted names - truthy)", function() {
    assert.equal("\"Here\" == \"Here\"", templayed("\"{{#a.b.c}}Here{{/a.b.c}}\" == \"Here\"")({"a":{"b":{"c":true}}}, {}));
  });

  test("Dotted names should be valid for Section tags (dotted names - falsey)", function() {
    assert.equal("\"\" == \"\"", templayed("\"{{#a.b.c}}Here{{/a.b.c}}\" == \"\"")({"a":{"b":{"c":false}}}, {}));
  });

  test("Dotted names that cannot be resolved should be considered falsey (dotted names - broken chains)", function() {
    assert.equal("\"\" == \"\"", templayed("\"{{#a.b.c}}Here{{/a.b.c}}\" == \"\"")({"a":{}}, {}));
  });

  test("Sections should not alter surrounding whitespace (surrounding whitespace)", function() {
    assert.equal(" | \t|\t | \n", templayed(" | {{#boolean}}\t|\t{{/boolean}} | \n")({"boolean":true}, {}));
  });

  test("Sections should not alter internal whitespace (internal whitespace)", function() {
    assert.equal(" |  \n  | \n", templayed(" | {{#boolean}} {{! Important Whitespace }}\n {{/boolean}} | \n")({"boolean":true}, {}));
  });

  test("Single-line sections should not alter surrounding whitespace (indented inline sections)", function() {
    assert.equal(" YES\n GOOD\n", templayed(" {{#boolean}}YES{{/boolean}}\n {{#boolean}}GOOD{{/boolean}}\n")({"boolean":true}, {}));
  });

  test("Standalone lines should be removed from the template (standalone lines)", function() {
    assert.equal("| This Is\n|\n| A Line\n", templayed("| This Is\n{{#boolean}}\n|\n{{/boolean}}\n| A Line\n")({"boolean":true}, {}));
  });

  test("Indented standalone lines should be removed from the template (indented standalone lines)", function() {
    assert.equal("| This Is\n|\n| A Line\n", templayed("| This Is\n  {{#boolean}}\n|\n  {{/boolean}}\n| A Line\n")({"boolean":true}, {}));
  });

  test("\"\\r\\n\" should be considered a newline for standalone tags (standalone line endings)", function() {
    assert.equal("|\r\n|", templayed("|\r\n{{#boolean}}\r\n{{/boolean}}\r\n|")({"boolean":true}, {}));
  });

  test("Standalone tags should not require a newline to precede them (standalone without previous line)", function() {
    assert.equal("#\n/", templayed("  {{#boolean}}\n\#{{/boolean}}\n/")({"boolean":true}, {}));
  });

  test("Standalone tags should not require a newline to follow them (standalone without newline)", function() {
    assert.equal("#\n/\n", templayed("\#{{#boolean}}\n/\n  {{/boolean}}")({"boolean":true}, {}));
  });

  test("Superfluous in-tag whitespace should be ignored (padding)", function() {
    assert.equal("|=|", templayed("|{{# boolean }}={{/ boolean }}|")({"boolean":true}, {}));
  });

});
