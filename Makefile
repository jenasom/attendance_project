# Biometric Attendance System Makefile
# This file contains commands to set up and run the biometric attendance system

# Default shell
SHELL := /bin/bash

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Print colored output
define print_color
	@printf "$(2)%s$(NC)\n" "$(1)"
endef

.PHONY: help
help: ## Show this help message
	@echo "Biometric Attendance System - Available Commands:"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Client (React) commands
.PHONY: client-deps
client-deps: ## Install client dependencies
	$(call print_color,"Installing client dependencies...",$(BLUE))
	cd client && npm install

.PHONY: client-server
client-server: ## Start React development server
	$(call print_color,"Starting React client on port 5000...",$(GREEN))
	cd client && REACT_APP_API_URL=http://localhost:8000/api PORT=5000 npm start

.PHONY: client-build
client-build: ## Build React app for production
	$(call print_color,"Building React app...",$(BLUE))
	cd client && npm run build

.PHONY: client-test
client-test: ## Run client tests
	$(call print_color,"Running client tests...",$(BLUE))
	cd client && npm test

# Server (Node.js) commands
.PHONY: server-deps
server-deps: ## Install server dependencies
	$(call print_color,"Installing server dependencies...",$(BLUE))
	cd server && npm install

.PHONY: core-server
core-server: ## Start Node.js server
	$(call print_color,"Starting Node.js server on port 8000...",$(GREEN))
	cd server && npm run dev

.PHONY: core-server-env
core-server-env: ## Create server .env file from example
	$(call print_color,"Creating server .env file...",$(BLUE))
	cd server && cp .env.example .env
	$(call print_color,"Please update server/.env with your database credentials",$(YELLOW))

.PHONY: server-build
server-build: ## Build server for production
	$(call print_color,"Building server...",$(BLUE))
	cd server && npm run build

.PHONY: server-test
server-test: ## Run server tests
	$(call print_color,"Running server tests...",$(BLUE))
	cd server && npm test

# Database commands
.PHONY: dev-migrate
dev-migrate: ## Run database migrations
	$(call print_color,"Running database migrations...",$(BLUE))
	cd server && npx prisma migrate dev

.PHONY: dev-reset
dev-reset: ## Reset database and run migrations
	$(call print_color,"Resetting database...",$(YELLOW))
	cd server && npx prisma migrate reset

.PHONY: dev-seed
dev-seed: ## Seed database with sample data
	$(call print_color,"Seeding database...",$(BLUE))
	cd server && npx prisma db seed

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	$(call print_color,"Opening Prisma Studio...",$(BLUE))
	cd server && npx prisma studio

.PHONY: db-generate
db-generate: ## Generate Prisma client
	$(call print_color,"Generating Prisma client...",$(BLUE))
	cd server && npx prisma generate

# Python server commands
.PHONY: conda-env
conda-env: ## Create conda environment
	$(call print_color,"Creating conda environment...",$(BLUE))
	conda env create -f server-py/environment.yml
	$(call print_color,"Environment created. Activate with: conda activate bas_env",$(GREEN))

.PHONY: conda-update
conda-update: ## Update conda environment
	$(call print_color,"Updating conda environment...",$(BLUE))
	conda env update -f server-py/environment.yml --prune

.PHONY: conda-remove
conda-remove: ## Remove conda environment
	$(call print_color,"Removing conda environment...",$(YELLOW))
	conda env remove -n bas_env

.PHONY: match-server-deps
match-server-deps: ## Install Python server dependencies (run in conda env)
	$(call print_color,"Installing Python dependencies...",$(BLUE))
	cd server-py && pip install -r requirements.txt || echo "requirements.txt not found, using environment.yml"

.PHONY: match-server
match-server: ## Start Python matching server (run in conda env)
	$(call print_color,"Starting Python matching server on port 5000...",$(GREEN))
	cd server-py && python app.py

# Development commands
.PHONY: dev-setup
dev-setup: client-deps server-deps conda-env core-server-env ## Complete development setup
	$(call print_color,"Development setup complete!",$(GREEN))
	$(call print_color,"Next steps:",$(BLUE))
	$(call print_color,"1. Update server/.env with your database credentials",$(YELLOW))
	$(call print_color,"2. Run 'make dev-migrate' to set up the database",$(YELLOW))
	$(call print_color,"3. Activate conda environment: conda activate bas_env",$(YELLOW))
	$(call print_color,"4. Run 'make dev-all' to start all services",$(YELLOW))

.PHONY: dev-all
dev-all: ## Start all development servers (requires 3 terminals)
	$(call print_color,"This will start all servers. You need 3 separate terminals:",$(BLUE))
	$(call print_color,"Terminal 1: make core-server",$(YELLOW))
	$(call print_color,"Terminal 2: conda activate bas_env && make match-server",$(YELLOW))
	$(call print_color,"Terminal 3: make client-server",$(YELLOW))

.PHONY: dev-check
dev-check: ## Check if all services are ready
	$(call print_color,"Checking services...",$(BLUE))
	@curl -s http://localhost:8000/api/health > /dev/null && echo "✓ Node.js server (port 8000)" || echo "✗ Node.js server (port 8000)"
	@curl -s http://localhost:5000/health > /dev/null && echo "✓ Python server (port 5000)" || echo "✗ Python server (port 5000)"
	@curl -s http://localhost:3000 > /dev/null && echo "✓ React client (port 3000)" || echo "✗ React client (port 3000)"

# Production commands
.PHONY: prod-build
prod-build: client-build server-build ## Build for production
	$(call print_color,"Production build complete",$(GREEN))

.PHONY: prod-start
prod-start: ## Start production servers
	$(call print_color,"Starting production servers...",$(GREEN))
	cd server && npm start &
	cd server-py && python app.py &

# Cleanup commands
.PHONY: clean
clean: ## Clean all build artifacts and dependencies
	$(call print_color,"Cleaning build artifacts...",$(YELLOW))
	cd client && rm -rf node_modules build
	cd server && rm -rf node_modules dist
	cd server-py && find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

.PHONY: clean-db
clean-db: ## Clean database (WARNING: This will delete all data)
	$(call print_color,"WARNING: This will delete all database data!",$(RED))
	@read -p "Are you sure? [y/N] " -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		make dev-reset; \
	else \
		echo "Cancelled."; \
	fi

# Docker commands (optional)
.PHONY: docker-build
docker-build: ## Build Docker containers
	$(call print_color,"Building Docker containers...",$(BLUE))
	docker-compose build

.PHONY: docker-up
docker-up: ## Start Docker containers
	$(call print_color,"Starting Docker containers...",$(GREEN))
	docker-compose up -d

.PHONY: docker-down
docker-down: ## Stop Docker containers
	$(call print_color,"Stopping Docker containers...",$(YELLOW))
	docker-compose down

.PHONY: docker-logs
docker-logs: ## View Docker logs
	docker-compose logs -f

# Utility commands
.PHONY: install-digitalpersona
install-digitalpersona: ## Download DigitalPersona client installer
	$(call print_color,"DigitalPersona client download info:",$(BLUE))
	$(call print_color,"Download from: https://drive.google.com/file/d/12QCh311WQ-_PIkMHeXqNRfTkbIWnnSdY/view?usp=sharing",$(YELLOW))
	$(call print_color,"This is required for fingerprint scanner functionality on Windows",$(YELLOW))

.PHONY: test-all
test-all: client-test server-test ## Run all tests
	$(call print_color,"All tests completed",$(GREEN))

.PHONY: format
format: ## Format code (client and server)
	$(call print_color,"Formatting code...",$(BLUE))
	cd client && npm run format || echo "No format script found"
	cd server && npm run format || echo "No format script found"
	cd server-py && black . || echo "Black not installed"

.PHONY: lint
lint: ## Lint code (client and server)
	$(call print_color,"Linting code...",$(BLUE))
	cd client && npm run lint || echo "No lint script found"
	cd server && npm run lint || echo "No lint script found"

# Status check
.PHONY: status
status: ## Show system status and requirements
	$(call print_color,"System Status Check:",$(BLUE))
	@echo "Node.js version:" && node --version 2>/dev/null || echo "Node.js not installed"
	@echo "npm version:" && npm --version 2>/dev/null || echo "npm not installed"
	@echo "Python version:" && python --version 2>/dev/null || echo "Python not installed"
	@echo "Conda version:" && conda --version 2>/dev/null || echo "Conda not installed"
	@echo "Git version:" && git --version 2>/dev/null || echo "Git not installed"
	@echo
	$(call print_color,"Required for full functionality:",$(YELLOW))
	@echo "- Node.js 16+ and npm"
	@echo "- Python 3.9+ and Conda"
	@echo "- MySQL 8.0+"
	@echo "- DigitalPersona U.are.U 4500 scanner (Windows only)"
	@echo "- DigitalPersona client software"

# Default target
.DEFAULT_GOAL := help
