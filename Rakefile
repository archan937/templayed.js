require "json"
require "erb"

task :default => :test

desc "Release a new templayed.js version"
task :release, :version do |task, args|
  if (args[:version] || "").strip.empty?
    puts "usage: rake release[version]"
    exit
  end

  timestamp  = Time.now
  javascript = File.open("src/templayed.js").readlines.collect do |line|
    line.gsub(/\{(version|year|date)\}/) do |matched|
      case matched
      when "{version}"
        args[:version]
      when "{year}"
        timestamp.year.to_s
      when "{date}"
        timestamp.strftime("%Y-%m-%d %H:%M:%S +0100 (%a, %d %B %Y)")
      end
    end
  end

  # Define variables
  releases_dir = "releases"
  release_dir  = "#{releases_dir}/#{args[:version]}"
  latest_dir   = "#{releases_dir}/latest"

  # Create directories
  FileUtils.rm_r(release_dir) if File.exists?(release_dir)
  FileUtils.mkdir_p(release_dir)

  # Create files
  FileUtils.cp("README.md", "#{release_dir}/README.md")
  FileUtils.cp("CHANGELOG.rdoc", "#{release_dir}/CHANGELOG.rdoc")
  FileUtils.cp_r("demo", "#{release_dir}/")
  FileUtils.cp_r("test", "#{release_dir}/")
  File.open("#{release_dir}/templayed.js", "w").puts(javascript)
  File.open("VERSION", "w").puts(args[:version])

  # Correct demo/index.html
  javascript = File.open("#{release_dir}/demo/index.html")
                   .read
                   .gsub("src/templayed.js", "templayed.js")
                   .gsub("templayed.js</h1>", "templayed.js<small> v#{args[:version]}</small></h1>")
  File.open("#{release_dir}/demo/index.html", "w").puts(javascript)

  # Correct test/index.html
  javascript = File.open("#{release_dir}/test/index.html")
                   .read
                   .gsub("src/templayed.js", "templayed.js")
                   .gsub("templayed.js</h1>", "templayed.js<small> v#{args[:version]}</small></h1>")
  File.open("#{release_dir}/test/index.html", "w").puts(javascript)

  # Compress release using YUI compressor
  IO.popen "java -jar lib/yuicompressor-2.4.2.jar -v #{release_dir}/templayed.js -o #{release_dir}/templayed.min.js"
end

desc "Compile test/mocha_test.js"
task :compile, :lib do |task, args|
  lib = args[:lib] || "t"
  json = Dir["test/spec/*.json"].inject({}) do |json, filename|
    json.merge! File.basename(filename, ".json").gsub(/^~/, "").capitalize => JSON.parse(File.read(filename))
  end
  erb = ERB.new <<-ERB.gsub(/^ {4}/, "")
    <%=
      case lib
      when "m"
        'var Mustache = require("./ext/mustache.js");'
      when "hb"
        'var Handlebars = require("./ext/handlebars.js");'
      when "h"
        'var Hogan = require("./ext/hogan.js");'
      when "t"
        'require("./../src/templayed.js");'
      end
    %>

    var assert = require("assert");
    <% json.keys.each_with_index do |key, index| %>
    suite(<%= key.inspect %>, function() {
    <% json[key]["tests"].each do |test| %>
      test(<%= (test["desc"].gsub(/\\.?$/, "") + " (" + test["name"].downcase + ")").inspect %>, function() {
        assert.equal(<%= test["expected"].inspect %>, <%=
          template = test["template"].inspect
          variables = (test["data"] || {})["lambda"] ? "{lambda:" + test["data"]["lambda"]["js"] + "}" : test["data"].to_json
          partials = (test["partials"] || {}).to_json
          case lib
          when "m"
            'Mustache.to_html(' + template + ', ' + variables + ', ' + partials + ')'
          when "hb"
            'Handlebars.compile(' + template + ')(' + variables + ', ' + partials + ')'
          when "h"
            'Hogan.compile(' + template + ').render(' + variables + ', ' + partials + ')'
          when "t"
            'templayed(' + template + ')(' + variables + ', ' + partials + ')'
          end
        %>);
      });
    <% end %>
    });<% end %>
  ERB
  File.open("test/mocha_test.js", "w") {|f| f.write erb.result(binding) }
  puts "Compiled #{{"m" => "Mustache.js", "hb" => "Handlebars.js", "h" => "Hogan.js", "t" => "templayed.js"}[args[:lib] || "t"]} tests"
end

desc "Compile and run mocha tests"
task :test, :lib do |task, args|
  exec "rake compile[#{args[:lib]}] && mocha --ui tdd --reporter spec --ignore-leaks"
end

desc "Compile and run mocha tests with Mustache.js"
task :m do
  exec "rake compile[m] && mocha --ui tdd --reporter spec --ignore-leaks"
end

desc "Compile and run mocha tests with Handlebars.js"
task :hb do
  exec "rake compile[hb] && mocha --ui tdd --reporter spec --ignore-leaks"
end

desc "Compile and run mocha tests with Hogan.js"
task :h do
  exec "rake compile[h] && mocha --ui tdd --reporter spec --ignore-leaks"
end