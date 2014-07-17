.PHONY: watch clean run-server

watch:	
	cd test && $(MAKE) watch

publish:
	npm version patch -m "version up for patch"
	npm publish

clean:
	rm -rf ./node_modules
	rm -rf ./test/node_modules
