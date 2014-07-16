.PHONY: watch clean run-server

watch:
	cd test && $(MAKE) watch

clean:
	rm -rf ./node_modules
	rm -rf ./test/node_modules
