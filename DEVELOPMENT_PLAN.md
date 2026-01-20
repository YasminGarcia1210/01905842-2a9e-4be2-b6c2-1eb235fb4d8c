# DEVELOPMENT PLAN: Login_OTIC_CCHC_V4

## 1. ARCHITECTURE OVERVIEW

**Components:**
1. **Login Interface (Frontend)**: React SPA with login form
2. **Authentication Orchestrator (Backend)**: Express.js routes that coordinate authentication flow
3. **Functional Rules Manager (Backend)**: Business logic for authentication rules
4. **External Credential Validation Service (Backend)**: Service layer for credential verification

**Models:**
- User: id, email, password_hash, created_at, updated_at
- LoginAttempt: id, user_id, success, ip_address, user_agent, created_at

**APIs:**
- POST /api/auth/login - Main authentication endpoint
- POST /api/auth/validate-token - Token validation endpoint
- GET /api/auth/health - Health check

**File Structure:**
```
login-otic-cchc-v4/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── app.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── database/
│   └── init.sql
├── docker-compose.yml
├── run.sh
├── run.bat
└── README.md
```

## 2. MVP ACCEPTANCE CRITERIA
1. User can submit login form with email/password and receive JWT token on success
2. Invalid credentials return appropriate error response (401)
3. Protected endpoint requires valid JWT token in Authorization header
4. Passwords are hashed with bcrypt before storage
5. Login attempts are logged in database

## 3. EXECUTABLE ITEMS

### ITEM 1: Backend Foundation
**Goal:** Set up Express.js server with basic structure and dependencies
**Files to create/modify:**
- backend/package.json (create) - Node.js dependencies
- backend/src/app.js (create) - Express app configuration
- backend/src/server.js (create) - Server entry point
- backend/.env.example (create) - Environment variables template
**Dependencies:** None
**Validation:** Server starts on port 3001 with health endpoint

### ITEM 2: Database Schema
**Goal:** Create PostgreSQL database schema and models
**Files to create/modify:**
- database/init.sql (create) - Database initialization script
- backend/src/models/User.js (create) - User model/ORM
- backend/src/models/LoginAttempt.js (create) - Login attempt model
- backend/src/config/database.js (create) - Database connection config
**Dependencies:** Item 1
**Validation:** Database tables created successfully with sample data

### ITEM 3: Authentication Services
**Goal:** Implement authentication orchestrator, rules manager, and credential validation
**Files to create/modify:**
- backend/src/services/AuthOrchestrator.js (create) - Main authentication flow coordinator
- backend/src/services/RulesManager.js (create) - Business rules for authentication
- backend/src/services/CredentialValidator.js (create) - Credential validation logic
- backend/src/utils/jwt.js (create) - JWT token generation/validation
- backend/src/utils/bcrypt.js (create) - Password hashing utilities
**Dependencies:** Items 1-2
**Validation:** Services can validate credentials and generate tokens

### ITEM 4: API Routes & Controllers
**Goal:** Create REST API endpoints for authentication
**Files to create/modify:**
- backend/src/controllers/authController.js (create) - Authentication controller
- backend/src/routes/authRoutes.js (create) - Authentication routes
- backend/src/middleware/authMiddleware.js (create) - JWT validation middleware
- backend/src/middleware/validationMiddleware.js (create) - Request validation
**Dependencies:** Items 1-3
**Validation:** API endpoints respond correctly to login requests

### ITEM 5: Frontend Foundation
**Goal:** Create React application with login interface
**Files to create/modify:**
- frontend/package.json (create) - React dependencies
- frontend/src/App.js (create) - Main React component
- frontend/src/index.js (create) - React entry point
- frontend/.env.example (create) - Frontend environment variables
**Dependencies:** None
**Validation:** React app starts on port 3000

### ITEM 6: Login Interface Components
**Goal:** Build login form and authentication logic
**Files to create/modify:**
- frontend/src/components/LoginForm.js (create) - Login form component
- frontend/src/components/ProtectedRoute.js (create) - Route protection
- frontend/src/services/authService.js (create) - API communication
- frontend/src/utils/constants.js (create) - Application constants
- frontend/src/styles/App.css (create) - Basic styling
**Dependencies:** Items 1-5
**Validation:** Login form submits credentials and handles responses

### ITEM 7: Testing
**Goal:** Create unit and integration tests
**Files to create/modify:**
- backend/tests/auth.test.js (create) - Backend authentication tests
- backend/tests/services.test.js (create) - Service layer tests
- frontend/tests/LoginForm.test.js (create) - Frontend component tests
- jest.config.js (create) - Jest configuration
**Dependencies:** Items 1-6
**Validation:** All tests pass with npm test

### ITEM 8: Infrastructure
**Goal:** Create Docker configuration and deployment scripts
**Files to create/modify:**
- backend/Dockerfile (create) - Backend container definition
- frontend/Dockerfile (create) - Frontend container definition
- docker-compose.yml (create) - Multi-container orchestration
- run.sh (create) - Linux/Mac startup script
- run.bat (create) - Windows startup script
- README.md (create) - Project documentation
**Dependencies:** All previous
**Validation:** docker compose up works, all services start correctly