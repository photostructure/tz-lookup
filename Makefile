# Every PhotoStructure repo exposes `make preflight`: run everything that should
# pass before cutting a release -- update dependencies, format, lint, compile,
# and test. The steps themselves are defined in package.json.
.PHONY: preflight

preflight:
	npm run preflight
