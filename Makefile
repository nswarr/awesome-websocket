.PHONY: test watch

test:
	mkdir -p test/www/js
	browserify index.js --outfile test/www/js/reconn.js

watch:
	DEBUG=true supervisor --ignore "./test"  -e ".litcoffee|.coffee|.js" test/server/server.js
	
