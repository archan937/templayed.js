# templayed.js

The **fastest** and **smallest** Mustache compliant Javascript templating library written in **2167 bytes** (uncompressed)

## Introduction

[Mustache.js](https://github.com/janl/mustache.js) is one of the best known Javascript templating libraries out there. I am also using it within several projects. The only downside you could imagine is its size:

- uncompressed: 15050 bytes
- YUI compressed: 5053 bytes
- YUI compressed and gzipped: 2271 bytes

So out of pure curiosity, I have written `templayed.js` to see whether it can be written more compact with the following as result:

- uncompressed: 2167 bytes
- YUI compressed: 1324 bytes
- YUI compressed and gzipped: 655 bytes

It does not have dependencies and it supports the following Mustache.js features:

- variables
- variables accessed through properties of objects using the dot notation
- HTML escaping of variables
- shown / hidden sections
- lists
- current item referrals
- functions
- inverted sections
- comments

This leaves out partials and streaming.

## Benchmarks with Mustache.js, Handlebars.js and Hogan.js

[Handlebars.js](http://handlebarsjs.com) is also a well-known Mustache compliant Javascript templating library (uncompressed 49699 bytes) written by Yehuda Katz ([@wycats](https://github.com/wycats)) and it is a bit more extensive than Mustache.js. [Hogan.js](http://twitter.github.com/hogan.js) is the Mustache templating library (uncompressed 15187 bytes) developed by Twitter.

As of version `0.2.0`, templayed.js compiles templates to cached functions for major performance improvements. I have benchmarked Mustache.js, Handlebars.js, Hogan.js and templayed.js.

You can view the results at [Mustache JS engine rumble: Mustache.js vs Handlebars.js vs Hogan.js vs templayed.js](http://jsperf.com/mustache-compliant-libraries/7) in which **templayed.js is pointed out as the fastest library in ALL browsers**!

Open the [benchmark link](http://jsperf.com/mustache-compliant-libraries/7) so you can run the benchmark in your browser yourself.

![JSPerf benchmark results](https://raw.github.com/archan937/templayed.js/master/demo/assets/jsperf-benchmarks.png)

## Testing templayed.js with QUnit

The `templayed.js` library is tested with [QUnit](http://qunitjs.com). Check out the test results at [http://archan937.github.com/templayed.js/test](http://archan937.github.com/templayed.js/test).

## Installation

Just include templayed.js:

    <script src="path/to/templayed.js" type="text/javascript"></script>

**Note**: include `templayed.min.js` for the minified templayed.js library

## Usage

### Writing templates

If you are familiar with the `Mustache.js` syntax then you are able to write `templayed.js` templates. Read the [Mustache.js documentation](https://github.com/janl/mustache.js) if you are not.

### Variable scoping

As of version `0.2.0`, the variable scope handling is altered. You have to use `../` which will evaluate the path against a parent context:

    template  = "<ul>{{#names}}<li>{{../fullName}}</li>{{/names}}</ul>",
    variables = {
      names: [{firstName: "Paul", lastName: "Engel"}, {firstName: "Chunk", lastName: "Norris"}],
      fullName: function() {
        return this.lastName + ", " + this.firstName;
      }
    };
    templayed(template)(variables); //=> "<ul><li>Engel, Paul</li><li>Norris, Chunk</li></ul>";

### Rendering templates

Rendering those templates can be done using `templayed()`.

    templayed("<p>My name is {{name}}!</p>")({name: "Paul Engel"});

### Check current version

You can obtain the library version with the following:

    templayed.version;

## Using templayed.js in node.js

[Helder Santana](https://github.com/heldr) has ported templayed.js for [node.js](http://nodejs.org). Install templayed.js for node.js as follows:

    npm install templayed

See [npmjs/package/templayed](https://npmjs.org/package/templayed) for more information.

## Handlebars.js-ish helpers

The [edge branch](https://github.com/archan937/templayed.js/tree/edge) contains a templayed.js version in which Handlebars.js-ish helpers are implemented.

## Try out templayed.js online yourself

Please visit [http://archan937.github.com/templayed.js](http://archan937.github.com/templayed.js) to try out templayed.js yourself and to check out a series of live examples.

## TODO

- Automatically cache compiled template functions
- Support custom delimiters (e.g. <% %>)

## Contact me

For support, remarks and requests, please mail me at [paul.engel@holder.nl](mailto:paul.engel@holder.nl).

## License

Copyright (c) 2023 Paul Engel, released under the MIT license

[http://github.com/archan937](http://github.com/archan937) - [http://twitter.com/archan937](http://twitter.com/archan937) - [pm_engel@icloud.com](mailto:pm_engel@icloud.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
