# Login OTIC CCHC V4

Sistema de autenticación segura con arquitectura modular basado en React y Express.js. Proporciona un módulo de login completo con validación de credenciales, generación de tokens JWT, y registro de intentos de acceso.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-20.x-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3-61dafb.svg)

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Seguridad](#-seguridad)
- [Contribución](#-contribución)

---

## 🎯 Descripción General

Este proyecto implementa un sistema de autenticación modular siguiendo los principios de arquitectura limpia:

### Características Principales

- ✅ **Autenticación JWT**: Sistema de tokens seguros con expiración configurable
- ✅ **Validación de Credenciales**: Verificación segura con bcrypt
- ✅ **Registro de Intentos**: Auditoría completa de accesos (exitosos y fallidos)
- ✅ **Sistema de Reglas**: Manager de reglas de negocio extensible
- ✅ **Orquestador**: Coordinación centralizada del flujo de autenticación
- ✅ **Frontend React**: Interfaz de usuario moderna y responsiva
- ✅ **Dockerizado**: Despliegue simple con Docker Compose
- ✅ **Base de Datos PostgreSQL**: Persistencia robusta y confiable

---

## 🏗️ Arquitectura

### Diagrama de Componentes

```mermaid
graph TB
    subgraph "Frontend - React SPA"
        UI[Login Form UI]
        AuthService[Auth Service]
    end
    
    subgraph "Backend - Express.js"
        API[API Routes]
        Controller[Auth Controller]
        Orchestrator[Auth Orchestrator]
        Rules[Rules Manager]
        Validator[Credential Validator]
        Middleware[Auth Middleware]
    end
    
    subgraph "Data Layer"
        UserModel[User Model]
        LoginModel[Login Attempt Model]
        DB[(PostgreSQL)]
    end
    
    subgraph "Utilities"
        JWT[JWT Utils]
        Bcrypt[Bcrypt Utils]
    end
    
    UI --> AuthService
    AuthService -->|POST /api/auth/login| API
    API --> Controller
    Controller --> Orchestrator
    Orchestrator --> Rules
    Orchestrator --> Validator
    Orchestrator --> LoginModel
    Validator --> UserModel
    UserModel --> DB
    LoginModel --> DB
    Orchestrator --> JWT
    Validator --> Bcrypt
    Middleware --> JWT
```

### Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant C as Controller
    participant O as Orchestrator
    participant R as Rules Manager
    participant V as Validator
    participant D as Database
    participant J as JWT Utils

    U->>F: Ingresa credenciales
    F->>C: POST /api/auth/login
    C->>O: login(email, password, ip, ua)
    O->>R: evaluate()
    R-->>O: {allowed: true}
    O->>V: validate(email, password)
    V->>D: findByEmail(email)
    D-->>V: user data
    V->>V: comparePassword()
    V-->>O: user | null
    O->>D: create login_attempt
    alt Credenciales válidas
        O->>J: signToken(payload)
        J-->>O: JWT token
        O-->>C: {success, token, user}
        C-->>F: 200 {token, user}
        F-->>U: Muestra token
    else Credenciales inválidas
        O-->>C: {success: false, reason}
        C-->>F: 401 {error}
        F-->>U: Muestra error
    end
```

### Capas de la Arquitectura

| Capa | Responsabilidad | Componentes |
|------|----------------|-------------|
| **Presentation** | Interfaz de usuario | React Components, Auth Service |
| **API** | Endpoints REST | Express Routes, Controllers |
| **Business Logic** | Lógica de negocio | Orchestrator, Rules Manager, Validator |
| **Data Access** | Acceso a datos | Models (User, LoginAttempt) |
| **Infrastructure** | Utilidades y config | JWT, Bcrypt, Database Config |

---

## 🛠️ Tecnologías

### Backend
- **Node.js** 20.x - Runtime de JavaScript
- **Express.js** 4.19 - Framework web minimalista
- **PostgreSQL** 15 - Base de datos relacional
- **jsonwebtoken** 9.0 - Generación y validación de JWT
- **bcryptjs** 2.4 - Hashing de contraseñas
- **pg** 8.12 - Cliente PostgreSQL para Node.js
- **dotenv** 16.4 - Manejo de variables de entorno
- **cors** 2.8 - Middleware de CORS

### Frontend
- **React** 18.3 - Librería de UI
- **React Router DOM** 6.24 - Enrutamiento
- **react-scripts** 5.0 - Configuración de Create React App

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación de contenedores
- **Jest** 29.7 - Framework de testing
- **Supertest** 6.3 - Testing de APIs HTTP
- **Nodemon** 3.1 - Auto-reload en desarrollo

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 20.x ([Descargar](https://nodejs.org/))
- **npm** >= 9.x (incluido con Node.js)
- **Docker** >= 24.x ([Descargar](https://www.docker.com/))
- **Docker Compose** >= 2.x (incluido con Docker Desktop)
- **Git** ([Descargar](https://git-scm.com/))

Verificar instalaciones:
```bash
node --version   # debe ser >= 20.x
npm --version    # debe ser >= 9.x
docker --version # debe ser >= 24.x
docker compose version
```

---

## 📦 Instalación

### Opción 1: Docker Compose (Recomendado)

Esta es la forma más rápida de ejecutar el proyecto completo.

```bash
# 1. Clonar el repositorio
git clone https://github.com/aifactory-api-ux/01905842-2a9e-4be2-b6c2-1eb235fb4d8c.git
cd 01905842-2a9e-4be2-b6c2-1eb235fb4d8c

# 2. Iniciar todos los servicios
docker compose up --build

# Los servicios estarán disponibles en:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - PostgreSQL: localhost:5432
```

### Opción 2: Instalación Manual

Para desarrollo local sin Docker:

```bash
# 1. Clonar el repositorio
git clone https://github.com/aifactory-api-ux/01905842-2a9e-4be2-b6c2-1eb235fb4d8c.git
cd 01905842-2a9e-4be2-b6c2-1eb235fb4d8c

# 2. Instalar PostgreSQL localmente y crear la base de datos
createdb otic_login
psql -d otic_login -f database/init.sql

# 3. Backend - Instalar dependencias
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Frontend - Instalar dependencias
cd ../frontend
npm install

# 5. Ejecutar el proyecto
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Opción 3: Scripts de Inicio Rápido

El proyecto incluye scripts para iniciar con Docker Compose:

**Linux / macOS:**
```bash
bash run.sh
```

**Windows:**
```cmd
run.bat
```

---

## ⚙️ Configuración

### Variables de Entorno - Backend

Crea un archivo `.env` en el directorio `backend/` basándote en `.env.example`:

```env
# Server Configuration
PORT=5000

# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/otic_login
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=otic_login

# Security
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h
```

> ⚠️ **IMPORTANTE**: En producción, **NUNCA** uses valores por defecto. Genera secretos seguros:
> ```bash
> # Generar JWT_SECRET seguro
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Variables de Entorno - Frontend

Crea un archivo `.env` en el directorio `frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000
```

Para producción, cambia la URL a tu API desplegada.

### Configuración de Docker Compose

El archivo `docker-compose.yml` está preconfigurado, pero puedes ajustarlo:

```yaml
# Cambiar puertos si hay conflictos
services:
  frontend:
    ports:
      - "3001:3000"  # Mapea al puerto 3001 local
  
  backend:
    ports:
      - "5001:5000"  # Mapea al puerto 5001 local
```

---

## 🚀 Uso

### Iniciar la Aplicación

Con Docker Compose:
```bash
docker compose up
```

Sin Docker (requiere 3 terminales):
```bash
# Terminal 1 - Base de datos (si usas Docker solo para PostgreSQL)
docker run --name postgres-otic \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=otic_login \
  -p 5432:5432 \
  postgres:15

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend
npm start
```

### Acceder a la Aplicación

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/healthz](http://localhost:5000/healthz)

### Ejemplo de Uso

1. Abre el navegador en `http://localhost:3000`
2. Crea un usuario en la base de datos:
   ```sql
   -- Conectarse a PostgreSQL
   docker exec -it <container-id> psql -U postgres -d otic_login
   
   -- Crear usuario de prueba (password: "test123")
   INSERT INTO users (email, password_hash) 
   VALUES ('test@example.com', '$2a$10$X3zBqKZ5kI.nK6rH3xqWXOqHvVHZqvnQJ1z4d3KqFvHnZQxGR1K6K');
   ```
   
3. Inicia sesión con:
   - Email: `test@example.com`
   - Password: `test123`

4. Al autenticarse exitosamente, verás el token JWT generado

### Detener la Aplicación

```bash
# Con Docker Compose
docker compose down

# Eliminar también los volúmenes (⚠️ borra los datos)
docker compose down -v
```

---

## 📁 Estructura del Proyecto

```
01905842-2a9e-4be2-b6c2-1eb235fb4d8c/
│
├── backend/                          # Aplicación backend (Express.js)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # Configuración PostgreSQL
│   │   ├── controllers/
│   │   │   └── authController.js     # Controlador de autenticación
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # Validación JWT
│   │   │   └── validationMiddleware.js # Validación de requests
│   │   ├── models/
│   │   │   ├── User.js               # Modelo de usuario
│   │   │   └── LoginAttempt.js       # Modelo de intentos de login
│   │   ├── routes/
│   │   │   └── authRoutes.js         # Rutas de autenticación
│   │   ├── services/
│   │   │   ├── AuthOrchestrator.js   # Orquestador de autenticación
│   │   │   ├── CredentialValidator.js # Validador de credenciales
│   │   │   └── RulesManager.js       # Manager de reglas de negocio
│   │   ├── utils/
│   │   │   ├── bcrypt.js             # Utilidades de hashing
│   │   │   └── jwt.js                # Utilidades JWT
│   │   ├── app.js                    # Configuración de Express
│   │   └── server.js                 # Punto de entrada
│   ├── tests/
│   │   ├── auth.test.js              # Tests de autenticación
│   │   └── services.test.js          # Tests de servicios
│   ├── .env.example                  # Plantilla de variables de entorno
│   ├── Dockerfile                    # Configuración Docker del backend
│   └── package.json                  # Dependencias Node.js
│
├── frontend/                         # Aplicación frontend (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.js          # Formulario de login
│   │   │   └── ProtectedRoute.js     # Componente de ruta protegida
│   │   ├── services/
│   │   │   └── authService.js        # Cliente API de autenticación
│   │   ├── styles/
│   │   │   └── App.css               # Estilos de la aplicación
│   │   ├── utils/
│   │   │   └── constants.js          # Constantes de la aplicación
│   │   ├── App.js                    # Componente principal
│   │   └── index.js                  # Punto de entrada React
│   ├── public/                       # Archivos estáticos
│   ├── Dockerfile                    # Configuración Docker del frontend
│   └── package.json                  # Dependencias React
│
├── database/
│   └── init.sql                      # Script de inicialización de BD
│
├── docs/                             # Documentación adicional
│   ├── CODE_REFERENCE.md
│   ├── DEVELOPMENT_PLAN.md
│   └── PROJECT_OVERVIEW.md
│
├── docker-compose.yml                # Orquestación de contenedores
├── jest.config.js                    # Configuración de Jest
├── run.sh                            # Script de inicio (Linux/Mac)
├── run.bat                           # Script de inicio (Windows)
├── DEVELOPMENT_PLAN.md               # Plan de desarrollo
└── README.md                         # Este archivo
```

### Descripción de Componentes Clave

#### Backend

- **`AuthOrchestrator`**: Coordina el flujo completo de autenticación
- **`RulesManager`**: Evalúa reglas de negocio (extensible para rate limiting, IP blocking, etc.)
- **`CredentialValidator`**: Valida credenciales contra la base de datos
- **`Models`**: Capa de acceso a datos con métodos específicos
- **`Utils`**: Funciones reutilizables para JWT y bcrypt

#### Frontend

- **`LoginForm`**: Componente del formulario con validación
- **`authService`**: Cliente HTTP para comunicación con la API
- **`ProtectedRoute`**: HOC para proteger rutas (extensible)

---

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/auth
```

### Endpoints

#### 1. Login

Autentica un usuario y devuelve un token JWT.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "invalid_credentials"
}
```

**Posibles errores:**
- `invalid_credentials`: Email o password incorrectos
- `blocked`: Usuario bloqueado por reglas de negocio

---

#### 2. Validate Token

Valida un token JWT.

**Request:**
```http
POST /api/auth/validate-token
Authorization: Bearer <jwt-token>
```

**Success Response (200 OK):**
```json
{
  "valid": true,
  "payload": {
    "id": 1,
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1234571490
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "invalid_token"
}
```

---

#### 3. Health Check

Verifica el estado del servicio de autenticación.

**Request:**
```http
GET /api/auth/health
```

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

### Ejemplos con cURL

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Validate Token:**
```bash
curl -X POST http://localhost:5000/api/auth/validate-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Health Check:**
```bash
curl http://localhost:5000/api/auth/health
```

---

## 🧪 Testing

### Ejecutar Tests

**Todos los tests:**
```bash
cd backend
npm test
```

**Tests específicos:**
```bash
npm test auth.test.js
npm test services.test.js
```

**Con cobertura:**
```bash
npm test -- --coverage
```

### Estructura de Tests

```
backend/tests/
├── auth.test.js       # Tests de endpoints de autenticación
└── services.test.js   # Tests de servicios de negocio
```

### Ejemplo de Test

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/login', () => {
  it('should return token on valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'test123' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

---

## 🚢 Deployment

### Deployment con Docker (Producción)

1. **Configurar variables de entorno de producción:**

```bash
# backend/.env
PORT=5000
DATABASE_URL=postgresql://user:pass@production-db:5432/otic_login
JWT_SECRET=<tu-secreto-super-seguro-generado>
JWT_EXPIRES_IN=1h
```

2. **Build y deploy:**

```bash
# Build de imágenes
docker compose -f docker-compose.yml build

# Push a registry (opcional)
docker tag backend:latest your-registry/backend:latest
docker push your-registry/backend:latest

# Deploy en servidor
docker compose up -d
```

### Deployment en Cloud Platforms

#### Heroku

```bash
# Backend
heroku create otic-backend
heroku addons:create heroku-postgresql:mini
git subtree push --prefix backend heroku main

# Frontend
heroku create otic-frontend
heroku buildpacks:set mars/create-react-app
git subtree push --prefix frontend heroku main
```

#### AWS (EC2 + RDS)

1. Crear instancia RDS PostgreSQL
2. Crear instancia EC2
3. Instalar Docker y Docker Compose
4. Clonar repositorio y configurar `.env`
5. Ejecutar `docker compose up -d`

#### DigitalOcean App Platform

1. Conectar repositorio
2. Configurar 3 componentes: frontend, backend, database
3. Agregar variables de entorno
4. Deploy automático

---

## 🔒 Seguridad

### Mejores Prácticas Implementadas

✅ **Passwords hasheados**: Uso de bcrypt con salt rounds
✅ **JWT con expiración**: Tokens con tiempo de vida limitado
✅ **CORS configurado**: Control de orígenes permitidos
✅ **Validación de inputs**: Middleware de validación
✅ **Registro de auditoría**: Log de todos los intentos de login

### Recomendaciones Adicionales para Producción

- [ ] **Rate Limiting**: Implementar límite de intentos de login
- [ ] **HTTPS**: Usar certificados SSL/TLS
- [ ] **Helmet.js**: Agregar headers de seguridad HTTP
- [ ] **SQL Injection Prevention**: Validación mejorada (ya usa prepared statements)
- [ ] **Secrets Management**: Usar servicios como AWS Secrets Manager
- [ ] **Database Encryption**: Encriptar datos sensibles en reposo
- [ ] **Multi-Factor Authentication**: Agregar 2FA
- [ ] **Session Management**: Implementar blacklist de tokens

### Ejemplo: Agregar Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos, intenta más tarde'
});

module.exports = { loginLimiter };
```

---

## 🤝 Contribución

### Workflow de Contribución

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

### Estándares de Código

- **Linting**: Usar ESLint (configuración incluida)
- **Formato**: Prettier para formateo consistente
- **Commits**: Mensajes descriptivos en español
- **Tests**: Escribir tests para nuevas funcionalidades

### Ejecutar Linter

```bash
cd backend
npm run lint  # Si está configurado
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 📞 Soporte

Para preguntas o problemas:

- **Issues**: [GitHub Issues](https://github.com/aifactory-api-ux/01905842-2a9e-4be2-b6c2-1eb235fb4d8c/issues)
- **Documentación**: Ver carpeta `/docs`
- **Email**: soporte@otic-cchc.cl

---

## 🎉 Agradecimientos

Desarrollado por el equipo de OTIC CCHC.

---

**Última actualización**: Enero 2026
