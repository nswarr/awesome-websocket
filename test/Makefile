.PHONY: test watch run-server clean

build: ./node_modules ../node_modules
	mkdir -p www/js
	./node_modules/.bin/browserify  ./www/js/browser-client.js -r q --outfile www/js/reconn.js -t coffeeify

watch: build
	PORT=8080 DEBUG=true ./node_modules/.bin/supervisor -V --watch .. --ignore ../node_modules,www,node_modules -e ".litcoffee|.coffee|.js" --exec make run-server

run-server: build
	server/server.js

./node_modules:
	npm install .

../node_modules:
	pushd .. && npm install . && popd

clean:
	rm -rf ./node_modules
	rm -rf ../node_modules
