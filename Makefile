.PHONY: watch clean run-server

watch:
	cd test && $(MAKE) watch

run-server: 
	test/server/server.js

clean:
	rm -rf ./node_modules
	rm -rf ./test/node_modules
