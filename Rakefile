$LOAD_PATH << File.dirname(__FILE__)

require 'json'
require 'fileutils'
require 'rake/testtask'

Rake::TestTask.new(:test) do |t|
  t.libs << 'test'
  t.libs << 'lib'
  t.test_files = FileList['test/test_*.rb']
end

task default: :test

CONFIG_FILE = File.expand_path(File.dirname(__FILE__) + "/paradocs.conf")
CONFIG_JSON = File.read(CONFIG_FILE).gsub("\n", " ").gsub(/\s+/, " ")
CONFIG = JSON.parse(CONFIG_JSON)
PARA_VERSION = CONFIG["para_version"]

desc "Minify JavaScript files"
task :minify do
  require 'uglifier'
  path = File.dirname(__FILE__) + '/public'
  files = ["/js/paradocs.js", "/js/upload.js", "/css/upload.css"]
  puts "Minifying and renameing JS and CSS . . ."
  files.each do |f|
    base = File.basename(f, ".*")
    ext = File.extname(f)
    subpath = File.expand_path(path + f + '/../') + '/'
    # 古いファイルは削除
    Dir.glob("#{subpath}#{base}.*.min#{ext}").each { |old| FileUtils.rm_f(old) }
    if ext == ".js" || ext == ".css"
      filename = base + "." + PARA_VERSION + ".min" + ext
    end
    newfile = subpath + filename
    puts filename
    File.open(newfile, "wb+") do |g|
      if ext == ".js"
        g.puts Uglifier.new.compile(File.read(path + f))
      else
        g.puts File.read(path + f)
      end
    end
  end
end
