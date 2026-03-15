.PHONY: help lint build test dev local-deploy deploy-gh-pages

help:
	@echo "Available targets:"
	@echo "  make local-deploy  # lint -> build -> test -> start local dev server"
	@echo "  make deploy-gh-pages [COMMIT_MSG='...'] [PAGES_MSG='...']"
	@echo "  make lint"
	@echo "  make build"
	@echo "  make test"
	@echo "  make dev"

lint:
	npm run lint

build:
	npm run build

test:
	npm run test:run

dev:
	npm run dev

local-deploy:
	npm run lint
	npm run build
	npm run test:run
	npm run dev

COMMIT_MSG ?= chore: update app before gh-pages deploy
PAGES_MSG ?= deploy: publish latest dist to gh-pages

deploy-gh-pages:
	npm run lint
	npm run build
	npm run test:run
	git add .
	git commit -m "$(COMMIT_MSG)" || echo "No changes to commit."
	git push origin HEAD
	npm run deploy:gh-pages -- -m "$(PAGES_MSG)"
