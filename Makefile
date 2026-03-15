.PHONY: help lint build test dev local-deploy deploy-gh-pages

help:
	@echo "Available targets:"
	@echo "  make local-deploy  # lint -> build -> test -> start local dev server"
	@echo "  make deploy-gh-pages [PAGES_MSG='...']"
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

PAGES_MSG ?= deploy: publish latest dist to gh-pages

deploy-gh-pages:
	npm run lint
	npm run build
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
