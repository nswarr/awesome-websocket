.PHONY: test watch run-server

build:
	mkdir -p test/www/js
	browserify -r ./index.js:reconnecting-websocket --outfile test/www/js/reconn.js

watch:
	DEBUG=true supervisor -i test/www -e ".litcoffee|.coffee|.js" --exec make run-server

run-server: build
	test/server/server.js
