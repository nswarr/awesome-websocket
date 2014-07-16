.PHONY: test watch run-server clean

build: ./node_modules ../node_modules
	mkdir -p test/www/js
	./node_modules/.bin/browserify -r q -r ws-additions --outfile www/js/reconn.js

watch: build
	cd .. && PORT=8080 DEBUG=true ./test/node_modules/.bin/supervisor -i test/www -e ".litcoffee|.coffee|.js" --exec make run-server


run-server: build
	server/server.js

./node_modules:
	npm install .

../node_modules:
	pushd .. && npm install . && popd

clean:
	rm -rf ./node_modules
	rm -rf ../node_modules
