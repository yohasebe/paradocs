ENV['RACK_ENV'] = 'test'

require 'minitest/autorun'
require 'rack/test'

$LOAD_PATH.unshift File.expand_path('..', __dir__)
$LOAD_PATH.unshift File.expand_path('../lib', __dir__)
