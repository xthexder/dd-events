install:
	npm install

dev:
	supervisor -n error dd-events.js

run:
	node dd-events.js
