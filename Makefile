.PHONY: watch clean run-server

watch:
	npm link
	cd test && $(MAKE) watch

run-server: 
	test/server/server.js

clean:
	rm -rf ./node_modules
	rm -rf ./test/node_modules
