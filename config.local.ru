require 'sinatra/base'

class Paradocs < Sinatra::Base
end

require './paradocs.rb'

map '/paradocs' do
  run Paradocs
end
