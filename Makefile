# Single entry point for CI logic. Providers (GitHub Actions, GitLab CI) only call these targets.
# Contract: REGISTRY (e.g. ghcr.io/owner), APP (default flower), TAG (sha-<7..40 hex>).
# See ci/README.md.

SHELL := /bin/sh
.DEFAULT_GOAL := help
.PHONY: help lint test build scan push deploy

include ci/versions.env
export SHELLCHECK_IMAGE ACTIONLINT_IMAGE GITLEAKS_IMAGE

APP ?= flower
export APP REGISTRY TAG DEPLOY_DIR REGISTRY_USER REGISTRY_TOKEN

help: ## List available targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sed -E 's/:[^#]*## /\t/' | awk -F'\t' '{printf "  %-8s %s\n", $$1, $$2}'

lint: ## shellcheck on ci/ and scripts/, actionlint on workflows
	@sh ci/lint.sh

test: ## Run backend/frontend tests (none configured yet)
	@sh ci/test.sh

build: ## Build backend and frontend images: REGISTRY, APP, TAG
	@sh ci/build.sh

scan: ## Secret scan with gitleaks over the repository
	@sh ci/scan.sh

push: ## Push built images to REGISTRY: REGISTRY, APP, TAG
	@sh ci/push.sh

deploy: ## Deploy on this host: DEPLOY_DIR, REGISTRY, APP, TAG
	@sh ci/deploy.sh
