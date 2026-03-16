.PHONY: help lint build test dev local-deploy deploy-gh-pages generate-englishtotupi-map check-required-audio check-required-audio-strict

LEXICON_TARGET_LANG ?= en

help:
	@echo "Available targets:"
	@echo "  make local-deploy  # lint -> build -> test -> start local dev server"
	@echo "    with Tupi map: make local-deploy LEXICON_TARGET_LANG=tupi"
	@echo "  make deploy-gh-pages [PAGES_MSG='...']"
	@echo "  make lint"
	@echo "  make build"
	@echo "  make test"
	@echo "  make dev"
	@echo "  make generate-englishtotupi-map  # auto-generate en->tupi map keys from lesson data"
	@echo "  make check-required-audio  # list required audio files and missing ones"
	@echo "  make check-required-audio-strict  # fail if any required audio file is missing"

lint:
	npm run lint

build:
	VITE_LEXICON_TARGET_LANG=$(LEXICON_TARGET_LANG) npm run build

test:
	npm run test:run

dev:
	VITE_LEXICON_TARGET_LANG=$(LEXICON_TARGET_LANG) npm run dev

generate-englishtotupi-map:
	node scripts/generate-en-to-tupi-map.mjs

check-required-audio:
	node scripts/check-required-audio.mjs

check-required-audio-strict:
	node scripts/check-required-audio.mjs --strict

local-deploy:
	npm run lint
	VITE_LEXICON_TARGET_LANG=$(LEXICON_TARGET_LANG) npm run build
	npm run test:run
	VITE_LEXICON_TARGET_LANG=$(LEXICON_TARGET_LANG) npm run dev

PAGES_MSG ?= deploy: publish latest dist to gh-pages

deploy-gh-pages:
	npm run lint
	VITE_LEXICON_TARGET_LANG=$(LEXICON_TARGET_LANG) npm run build
	npm run test:run
	git add .
	@if git diff --cached --quiet; then \
		echo "No changes to commit."; \
	else \
		printf "Write commit message: "; \
		read -r COMMIT_MSG; \
		if [ -z "$$COMMIT_MSG" ]; then \
			echo "Commit message is required."; \
			exit 1; \
		fi; \
		git commit -m "$$COMMIT_MSG"; \
	fi
	git push origin HEAD
	npm run deploy:gh-pages -- -m "$(PAGES_MSG)"

push:
	git add .
	git commit
	git push origin HEAD