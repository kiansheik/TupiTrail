.PHONY: help lint build test dev local-deploy deploy-gh-pages generate-englishtotupi-map check-required-audio check-required-audio-strict import-lesson export-lesson delete-lesson generate-course

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
	@echo "  make import-lesson ZIP=path/to/lesson.zip  # import a builder-exported lesson zip"
	@echo "  make export-lesson LESSON=unit1-tembi-u [OUT_DIR=./exports]  # export lesson to .zip"
	@echo "  make delete-lesson LESSON=unit1-my-lesson  # remove a lesson and all its assets"
	@echo "  make generate-course  # regenerate course.ts from manifest.json"
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

generate-course:
	node scripts/generate-course.mjs

# ZIP= is required: make import-lesson ZIP=~/Downloads/unit1-lesson2.zip
import-lesson:
ifndef ZIP
	$(error ZIP is required. Usage: make import-lesson ZIP=path/to/lesson.zip)
endif
	node scripts/import-lesson.mjs "$(ZIP)"

OUT_DIR ?= ./exports

# LESSON= is required: make export-lesson LESSON=unit1-tembi-u [OUT_DIR=./exports]
export-lesson:
ifndef LESSON
	$(error LESSON is required. Usage: make export-lesson LESSON=unit1-tembi-u [OUT_DIR=./exports])
endif
	@mkdir -p "$(OUT_DIR)"
	node scripts/export-lesson.mjs "$(LESSON)" --out-dir "$(OUT_DIR)"

# LESSON= is required: make delete-lesson LESSON=unit1-my-lesson
delete-lesson:
ifndef LESSON
	$(error LESSON is required. Usage: make delete-lesson LESSON=unit1-my-lesson)
endif
	node scripts/delete-lesson.mjs "$(LESSON)"

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