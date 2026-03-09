require 'sinatra/base'

# Unicorn self-process killer
require 'unicorn/worker_killer'
# ワーカプロセスが16回リクエストを処理する度に、
# 自身のメモリ使用量をチェックし192M~256Mのいずれかの
# 使用量をオーバーしていた場合に再起動
use Unicorn::WorkerKiller::Oom, (192*(1024**2)), (256*(1024**2)), 16
# I18n.enforce_available_locales = false
class Paradocs < Sinatra::Base
end

require './paradocs.rb'

# on nginx+unicorn
map '/paradocs' do
  run Paradocs
end

# on apaceh2 + passenger
# run Sinatra::Application
