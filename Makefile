.PHONY: test watch run-server

build:
	mkdir -p test/www/js
	./node_modules/.bin/browserify -r ./index.js:reconnecting-websocket --outfile test/www/js/reconn.js

watch:
	DEBUG=true ./node_modules/.bin/supervisor -i test/www -e ".litcoffee|.coffee|.js" --exec make run-server

run-server: build
	test/server/server.js
