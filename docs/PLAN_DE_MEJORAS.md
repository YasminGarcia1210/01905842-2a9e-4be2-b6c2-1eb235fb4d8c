# Plan de Mejoras - Login OTIC CCHC V4

**Fecha**: Enero 2026  
**Versión**: 1.0  
**Madurez Actual del Proyecto**: 68%  
**Madurez Objetivo**: 85%

---

## 📋 Índice de Mejoras

- [Sprint 1: Crítico (1 semana)](#sprint-1-crítico)
- [Sprint 2: Alta Prioridad (1 semana)](#sprint-2-alta-prioridad)
- [Sprint 3: Media Prioridad (2 semanas)](#sprint-3-media-prioridad)
- [Backlog: Baja Prioridad](#backlog-baja-prioridad)
- [Mejoras de Infraestructura](#mejoras-de-infraestructura)

---

## 🔴 SPRINT 1: CRÍTICO (1 semana)

**Objetivo**: Hacer el sistema seguro para producción  
**Madurez**: 68% → 76%

### 1.1 Implementar RulesManager Completo

**Prioridad**: 🔴 CRÍTICA  
**Esfuerzo**: 4 días  
**Madurez Actual**: 15% → **85%**

**Problema**: RulesManager es un stub que siempre retorna `{allowed: true}`, no protege contra ataques de fuerza bruta.

**Archivo**: `backend/src/services/RulesManager.js`

**Implementación**:

```javascript
const LoginAttempt = require('../models/LoginAttempt');

class RulesManager {
  /**
   * Evalúa reglas de negocio para permitir o bloquear login
   * @param {Object} params - Parámetros de evaluación
   * @returns {Object} {allowed: boolean, reason?: string, retryAfter?: number}
   */
  static async evaluate({ email, ipAddress }) {
    // REGLA 1: Verificar intentos fallidos recientes por email
    const failedAttempts = await LoginAttempt.countRecentFailed(email, 15);
    if (failedAttempts >= 5) {
      return {
        allowed: false,
        reason: 'too_many_attempts',
        retryAfter: 900 // 15 minutos en segundos
      };
    }

    // REGLA 2: Verificar intentos desde IP en última hora
    const ipAttempts = await LoginAttempt.countByIP(ipAddress, 60);
    if (ipAttempts >= 10) {
      return {
        allowed: false,
        reason: 'ip_rate_limit_exceeded',
        retryAfter: 3600
      };
    }

    // REGLA 3: Verificar si IP está en blacklist
    const isBlacklisted = await this.checkIPBlacklist(ipAddress);
    if (isBlacklisted) {
      return {
        allowed: false,
        reason: 'ip_blacklisted'
      };
    }

    // REGLA 4: Verificar horarios permitidos (opcional)
    const currentHour = new Date().getHours();
    if (process.env.ENFORCE_BUSINESS_HOURS === 'true') {
      if (currentHour < 6 || currentHour > 22) {
        return {
          allowed: false,
          reason: 'outside_business_hours',
          businessHours: '06:00 - 22:00'
        };
      }
    }

    // REGLA 5: Verificar bloqueo temporal del usuario
    const isTemporarilyBlocked = await this.checkTemporaryBlock(email);
    if (isTemporarilyBlocked) {
      return {
        allowed: false,
        reason: 'temporarily_blocked',
        retryAfter: isTemporarilyBlocked.retryAfter
      };
    }

    return { allowed: true };
  }

  /**
   * Verifica si una IP está en blacklist
   */
  static async checkIPBlacklist(ipAddress) {
    // Implementar con Redis o tabla en PostgreSQL
    // Por ahora, lista hardcodeada de ejemplo
    const blacklist = process.env.IP_BLACKLIST?.split(',') || [];
    return blacklist.includes(ipAddress);
  }

  /**
   * Verifica bloqueo temporal de usuario
   */
  static async checkTemporaryBlock(email) {
    // Implementar con Redis para expiración automática
    // o tabla temporal_blocks en PostgreSQL
    // Retorna false o {retryAfter: segundos}
    return false;
  }

  /**
   * Bloquea temporalmente un usuario tras múltiples fallos
   */
  static async temporarilyBlockUser(email, durationMinutes = 30) {
    // Implementar con Redis
    // await redis.set(`block:${email}`, 'blocked', 'EX', durationMinutes * 60);
  }
}

module.exports = RulesManager;
```

**Métodos a agregar en LoginAttempt.js**:

```javascript
// backend/src/models/LoginAttempt.js

class LoginAttempt {
  // ... método create() existente ...

  /**
   * Cuenta intentos fallidos recientes por email
   */
  static async countRecentFailed(email, minutesAgo = 15) {
    const result = await db.query(
      `SELECT COUNT(*) 
       FROM login_attempts la
       JOIN users u ON la.user_id = u.id
       WHERE u.email = $1 
         AND la.success = false 
         AND la.created_at > NOW() - INTERVAL '${minutesAgo} minutes'`,
      [email]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Cuenta intentos desde una IP en los últimos N minutos
   */
  static async countByIP(ipAddress, minutesAgo = 60) {
    const result = await db.query(
      `SELECT COUNT(*) 
       FROM login_attempts 
       WHERE ip_address = $1 
         AND created_at > NOW() - INTERVAL '${minutesAgo} minutes'`,
      [ipAddress]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Obtiene intentos recientes de un usuario
   */
  static async findRecentByEmail(email, limit = 10) {
    const result = await db.query(
      `SELECT la.* 
       FROM login_attempts la
       JOIN users u ON la.user_id = u.id
       WHERE u.email = $1
       ORDER BY la.created_at DESC
       LIMIT $2`,
      [email, limit]
    );
    return result.rows;
  }

  /**
   * Limpia intentos antiguos (ejecutar periódicamente)
   */
  static async cleanOldAttempts(daysOld = 30) {
    const result = await db.query(
      `DELETE FROM login_attempts 
       WHERE created_at < NOW() - INTERVAL '${daysOld} days'`
    );
    return result.rowCount;
  }
}
```

**Variables de entorno a agregar**:

```env
# backend/.env
ENFORCE_BUSINESS_HOURS=false
IP_BLACKLIST=192.168.1.100,10.0.0.50
```

---

### 1.2 Implementar Rate Limiting Global

**Prioridad**: 🔴 CRÍTICA  
**Esfuerzo**: 1 día  
**Madurez Actual**: 0% → **90%**

**Instalación**:

```bash
cd backend
npm install express-rate-limit
```

**Implementación**:

```javascript
// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Rate limiter para login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: {
    error: 'too_many_login_attempts',
    message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
    retryAfter: 900
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Función para generar key personalizada (por IP)
  keyGenerator: (req) => req.ip,
  // Handler personalizado
  handler: (req, res) => {
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Demasiados intentos. Intenta más tarde.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter para API general
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests por IP en 15 min
  message: { error: 'rate_limit_exceeded' }
});

// Rate limiter estricto para validación de tokens
const tokenValidationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 validaciones por minuto
  message: { error: 'token_validation_rate_exceeded' }
});

module.exports = {
  loginLimiter,
  apiLimiter,
  tokenValidationLimiter
};
```

**Aplicar en rutas**:

```javascript
// backend/src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { validateLogin } = require('../middleware/validationMiddleware');
const { loginLimiter, tokenValidationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/validate-token', tokenValidationLimiter, authController.validateToken);
router.get('/health', authController.health);

module.exports = router;
```

**Aplicar rate limiter global**:

```javascript
// backend/src/app.js
const express = require('express');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter); // Aplicar a todas las rutas /api/*

app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

module.exports = app;
```

---

### 1.3 Validación de JWT_SECRET Obligatoria

**Prioridad**: 🔴 CRÍTICA  
**Esfuerzo**: 0.5 días  
**Madurez Actual**: 40% → **80%**

**Problema**: JWT_SECRET tiene fallback hardcodeado "change_me", riesgo de seguridad en producción.

**Archivo**: `backend/src/utils/jwt.js`

```javascript
// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');

// VALIDACIÓN ESTRICTA DEL SECRET
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'change_me') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: JWT_SECRET must be set to a secure value in production. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  } else {
    console.warn('⚠️  WARNING: Using default JWT_SECRET. This is INSECURE for production!');
  }
}

const signToken = (payload) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn,
    algorithm: 'HS256' // Especificar algoritmo explícitamente
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'] // Solo aceptar HS256
  });
};

module.exports = {
  signToken,
  verifyToken,
};
```

**Script para generar secret**:

```javascript
// scripts/generate-jwt-secret.js
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');
console.log('\n=== JWT SECRET GENERADO ===');
console.log(secret);
console.log('\nAgrega esto a tu .env:');
console.log(`JWT_SECRET=${secret}`);
console.log('\n⚠️  NUNCA compartas este secret ni lo subas a git!\n');
```

**Ejecutar**:

```bash
node scripts/generate-jwt-secret.js
```

---

### 1.4 Error Handling Centralizado

**Prioridad**: 🔴 CRÍTICA  
**Esfuerzo**: 2 días  
**Madurez Actual**: 40% → **85%**

**Crear middleware de error handling**:

```javascript
// backend/src/middleware/errorHandler.js

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler centralizado
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401);
  }

  // Errores de validación
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(message, 400);
  }

  // Errores de PostgreSQL
  if (err.code === '23505') { // Unique violation
    error = new AppError('Registro duplicado', 409);
  }
  if (err.code === '23503') { // Foreign key violation
    error = new AppError('Violación de integridad referencial', 400);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';

  // No exponer detalles en producción
  const response = {
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: error
    })
  };

  res.status(statusCode).json(response);
};

// Handler para rutas no encontradas
const notFound = (req, res, next) => {
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};

// Wrapper para async functions
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler
};
```

**Actualizar app.js**:

```javascript
// backend/src/app.js
const express = require('express');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

// Error handlers (deben ir al final)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

**Actualizar controllers con asyncHandler**:

```javascript
// backend/src/controllers/authController.js
const AuthOrchestrator = require('../services/AuthOrchestrator');
const { verifyToken } = require('../utils/jwt');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await AuthOrchestrator.login({
    email,
    password,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
  });

  if (!result.success) {
    throw new AppError(result.reason, 401);
  }

  return res.status(200).json({ 
    token: result.token, 
    user: result.user 
  });
});

const validateToken = asyncHandler(async (req, res) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Token requerido en header Authorization', 401);
  }

  const payload = verifyToken(token);
  return res.status(200).json({ valid: true, payload });
});

const health = (req, res) => res.status(200).json({ status: 'ok' });

module.exports = {
  login,
  validateToken,
  health,
};
```

---

## 🟡 SPRINT 2: ALTA PRIORIDAD (1 semana)

**Objetivo**: Hardening de seguridad y observabilidad  
**Madurez**: 76% → 82%

### 2.1 Implementar Helmet.js para Headers de Seguridad

**Prioridad**: 🟡 Alta  
**Esfuerzo**: 0.5 días  
**Madurez Actual**: 0% → **90%**

**Instalación**:

```bash
cd backend
npm install helmet
```

**Implementación**:

```javascript
// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');

const app = express();

// Helmet debe ir PRIMERO
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

**Variables de entorno**:

```env
# backend/.env
ALLOWED_ORIGINS=http://localhost:3000,https://mi-app-produccion.com
```

---

### 2.2 Validación de Inputs con Joi

**Prioridad**: 🟡 Alta  
**Esfuerzo**: 2 días  
**Madurez Actual**: 50% → **90%**

**Instalación**:

```bash
cd backend
npm install joi
```

**Implementación**:

```javascript
// backend/src/middleware/validationMiddleware.js
const Joi = require('joi');

// Esquemas de validación
const schemas = {
  login: Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2 })
      .required()
      .lowercase()
      .trim()
      .max(255)
      .messages({
        'string.email': 'Email debe ser válido',
        'any.required': 'Email es requerido',
        'string.max': 'Email no puede exceder 255 caracteres'
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password debe tener al menos 8 caracteres',
        'string.max': 'Password no puede exceder 128 caracteres',
        'any.required': 'Password es requerido'
      })
  }),

  createUser: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password debe contener mayúsculas, minúsculas y números'
      })
  })
};

// Middleware factory para validar body
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({ 
        error: 'validation_schema_not_found',
        schema: schemaName 
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retornar todos los errores
      stripUnknown: true // Eliminar campos no definidos
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'validation_error',
        details: errors
      });
    }

    // Reemplazar req.body con valores validados y sanitizados
    req.body = value;
    next();
  };
};

// Mantener compatibilidad con código existente
const validateLogin = validate('login');

module.exports = {
  validate,
  validateLogin,
  schemas
};
```

**Actualizar rutas**:

```javascript
// backend/src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validationMiddleware');
const { loginLimiter, tokenValidationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, validate('login'), authController.login);
router.post('/validate-token', tokenValidationLimiter, authController.validateToken);
router.get('/health', authController.health);

module.exports = router;
```

---

### 2.3 Logging Estructurado con Winston

**Prioridad**: 🟡 Alta  
**Esfuerzo**: 2 días  
**Madurez Actual**: 0% → **85%**

**Instalación**:

```bash
cd backend
npm install winston winston-daily-rotate-file
```

**Implementación**:

```javascript
// backend/src/config/logger.js
const winston = require('winston');
const path = require('path');

// Formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'otic-login-backend' },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Console en desarrollo
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

**Morgan para HTTP logging**:

```bash
npm install morgan
```

```javascript
// backend/src/middleware/httpLogger.js
const morgan = require('morgan');
const logger = require('../config/logger');

// Stream para winston
const stream = {
  write: (message) => logger.http(message.trim())
};

// Formato personalizado
const format = ':remote-addr :method :url :status :res[content-length] - :response-time ms';

const httpLogger = morgan(format, { stream });

module.exports = httpLogger;
```

**Uso en controllers**:

```javascript
// backend/src/controllers/authController.js
const AuthOrchestrator = require('../services/AuthOrchestrator');
const { verifyToken } = require('../utils/jwt');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { ip } = req;

  logger.info('Login attempt', { email, ip });

  const result = await AuthOrchestrator.login({
    email,
    password,
    ipAddress: ip,
    userAgent: req.headers['user-agent'] || '',
  });

  if (!result.success) {
    logger.warn('Login failed', { email, ip, reason: result.reason });
    throw new AppError(result.reason, 401);
  }

  logger.info('Login successful', { email, ip, userId: result.user.id });
  
  return res.status(200).json({ 
    token: result.token, 
    user: result.user 
  });
});

module.exports = { login, validateToken, health };
```

**Aplicar en app.js**:

```javascript
// backend/src/app.js
const httpLogger = require('./middleware/httpLogger');

// ... otras importaciones ...

app.use(httpLogger); // Agregar después de helmet
```

**Crear directorio de logs**:

```bash
mkdir backend/logs
echo "logs/" >> backend/.gitignore
```

---

### 2.4 Índices de Base de Datos

**Prioridad**: 🟡 Alta  
**Esfuerzo**: 1 día  
**Madurez Actual**: 40% → **90%**

**Crear archivo de migración**:

```sql
-- database/migrations/001_add_indexes.sql

-- Índice en login_attempts para queries de RulesManager
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id 
ON login_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at 
ON login_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created 
ON login_attempts(ip_address, created_at DESC);

-- Índice compuesto para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_login_attempts_success_created 
ON login_attempts(success, created_at DESC);

-- Índice en users.email (ya existe UNIQUE, pero verificar)
-- PostgreSQL crea índice automático para UNIQUE, pero especificamos por claridad
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Comentarios para documentación
COMMENT ON INDEX idx_login_attempts_user_id IS 
'Optimiza búsquedas de intentos por usuario';

COMMENT ON INDEX idx_login_attempts_ip_created IS 
'Optimiza rate limiting por IP';
```

**Ejecutar migración**:

```bash
# Conectar a PostgreSQL
docker exec -it <postgres-container> psql -U postgres -d otic_login -f /migrations/001_add_indexes.sql
```

**Agregar ANALYZE para actualizar estadísticas**:

```sql
-- Al final del archivo de migración
ANALYZE login_attempts;
ANALYZE users;
```

---

## 🟢 SPRINT 3: MEDIA PRIORIDAD (2 semanas)

### 3.1 Implementar Frontend State Management

**Prioridad**: 🟢 Media  
**Esfuerzo**: 3 días  
**Madurez Actual**: 50% → **80%**

**Opción 1: Context API + useReducer**

```javascript
// frontend/src/contexts/AuthContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { login as loginAPI } from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Cargar sesión del localStorage al iniciar
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('authUser');
    
    if (token && user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user: JSON.parse(user) }
      });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await loginAPI(email, password);
      
      if (result.error) {
        dispatch({ type: 'LOGIN_ERROR', payload: result.error });
        return false;
      }

      // Guardar en localStorage
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('authUser', JSON.stringify(result.user));

      dispatch({ type: 'LOGIN_SUCCESS', payload: result });
      return true;
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: 'Error de conexión' });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Actualizar App.js**:

```javascript
// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/App.css';

function AppContent() {
  const { isAuthenticated, user, token, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">OTIC CCHC</p>
          <h1>Módulo de Login</h1>
          <p className="app-subtitle">Acceso seguro y registro de intentos.</p>
        </div>
        {isAuthenticated && (
          <div>
            <span>Bienvenido, {user?.email}</span>
            <button onClick={logout}>Cerrar Sesión</button>
          </div>
        )}
      </header>

      <main className="app-main">
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Dashboard token={token} user={user} />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

**Actualizar LoginForm.js**:

```javascript
// frontend/src/components/LoginForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <label className="login-label" htmlFor="email">Correo</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <label className="login-label" htmlFor="password">Contraseña</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
};

export default LoginForm;
```

**Crear Dashboard component**:

```javascript
// frontend/src/components/Dashboard.js
import React from 'react';

const Dashboard = ({ token, user }) => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>¡Bienvenido, {user.email}!</p>
      
      <div className="app-token">
        <h3>Tu Token JWT</h3>
        <code>{token}</code>
      </div>
    </div>
  );
};

export default Dashboard;
```

---

### 3.2 Mejorar Testing Backend

**Prioridad**: 🟢 Media  
**Esfuerzo**: 5 días  
**Madurez Actual**: 35% → **75%**

**Estructura de tests**:

```
backend/tests/
├── setup.js (configuración global)
├── unit/
│   ├── services/
│   │   ├── AuthOrchestrator.test.js
│   │   ├── CredentialValidator.test.js
│   │   └── RulesManager.test.js
│   ├── models/
│   │   ├── User.test.js
│   │   └── LoginAttempt.test.js
│   └── utils/
│       ├── jwt.test.js
│       └── bcrypt.test.js
├── integration/
│   └── auth.integration.test.js
└── helpers/
    └── testData.js
```

**Tests de AuthOrchestrator**:

```javascript
// backend/tests/unit/services/AuthOrchestrator.test.js
const AuthOrchestrator = require('../../../src/services/AuthOrchestrator');
const CredentialValidator = require('../../../src/services/CredentialValidator');
const RulesManager = require('../../../src/services/RulesManager');
const LoginAttempt = require('../../../src/models/LoginAttempt');
const { signToken } = require('../../../src/utils/jwt');

jest.mock('../../../src/services/CredentialValidator');
jest.mock('../../../src/services/RulesManager');
jest.mock('../../../src/models/LoginAttempt');
jest.mock('../../../src/utils/jwt');

describe('AuthOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0'
    };

    it('should return blocked when RulesManager denies access', async () => {
      RulesManager.evaluate.mockResolvedValue({ allowed: false });

      const result = await AuthOrchestrator.login(loginData);

      expect(result).toEqual({ success: false, reason: 'blocked' });
      expect(RulesManager.evaluate).toHaveBeenCalled();
      expect(CredentialValidator.validate).not.toHaveBeenCalled();
    });

    it('should return invalid_credentials when user not found', async () => {
      RulesManager.evaluate.mockResolvedValue({ allowed: true });
      CredentialValidator.validate.mockResolvedValue(null);
      LoginAttempt.create.mockResolvedValue({});

      const result = await AuthOrchestrator.login(loginData);

      expect(result).toEqual({ success: false, reason: 'invalid_credentials' });
      expect(LoginAttempt.create).toHaveBeenCalledWith({
        userId: null,
        success: false,
        ipAddress: loginData.ipAddress,
        userAgent: loginData.userAgent
      });
    });

    it('should return token on successful login', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'mock.jwt.token';

      RulesManager.evaluate.mockResolvedValue({ allowed: true });
      CredentialValidator.validate.mockResolvedValue(mockUser);
      LoginAttempt.create.mockResolvedValue({});
      signToken.mockReturnValue(mockToken);

      const result = await AuthOrchestrator.login(loginData);

      expect(result).toEqual({
        success: true,
        token: mockToken,
        user: { id: 1, email: 'test@example.com' }
      });
      expect(LoginAttempt.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        success: true,
        ipAddress: loginData.ipAddress,
        userAgent: loginData.userAgent
      });
    });
  });
});
```

**Tests de integración**:

```javascript
// backend/tests/integration/auth.integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');
const { hashPassword } = require('../../src/utils/bcrypt');

describe('Auth Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Crear usuario de prueba
    const passwordHash = await hashPassword('test123');
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
      ['integration@test.com', passwordHash]
    );
    testUser = result.rows[0];
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.query('DELETE FROM login_attempts WHERE user_id = $1', [testUser.id]);
    await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await db.end();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'test123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'integration@test.com');
    });

    it('should return 401 with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeTruthy();
    });

    it('should return 400 with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/validate-token', () => {
    let validToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'test123'
        });
      validToken = loginResponse.body.token;
    });

    it('should validate a valid token', async () => {
      const response = await request(app)
        .post('/api/auth/validate-token')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/validate-token')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });
  });
});
```

**Configurar Jest para coverage**:

```json
// backend/package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 75,
        "lines": 75,
        "statements": 75
      }
    }
  }
}
```

---

### 3.3 Implementar Caching con Redis

**Prioridad**: 🟢 Media  
**Esfuerzo**: 4 días  
**Madurez Actual**: 0% → **75%**

**Agregar Redis a docker-compose.yml**:

```yaml
# docker-compose.yml
version: "3.8"

services:
  db:
    # ... configuración existente ...

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    # ... configuración existente ...
    depends_on:
      - db
      - redis
    environment:
      # ... vars existentes ...
      REDIS_HOST: redis
      REDIS_PORT: 6379

volumes:
  db_data:
  redis_data:
```

**Instalar dependencia**:

```bash
cd backend
npm install redis
```

**Configurar Redis client**:

```javascript
// backend/src/config/redis.js
const redis = require('redis');
const logger = require('./logger');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis Client Connected'));

// Conectar
(async () => {
  await client.connect();
})();

module.exports = client;
```

**Cachear validaciones de token**:

```javascript
// backend/src/controllers/authController.js
const { verifyToken } = require('../utils/jwt');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const redisClient = require('../config/redis');

const validateTokenWithCache = asyncHandler(async (req, res) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Token requerido', 401);
  }

  // Buscar en cache
  const cacheKey = `token:${token}`;
  const cached = await redisClient.get(cacheKey);
  
  if (cached) {
    logger.debug('Token validation from cache');
    return res.status(200).json({ 
      valid: true, 
      payload: JSON.parse(cached),
      cached: true 
    });
  }

  // Verificar token
  const payload = verifyToken(token);
  
  // Guardar en cache (TTL de 5 minutos)
  await redisClient.setEx(cacheKey, 300, JSON.stringify(payload));
  
  return res.status(200).json({ valid: true, payload });
});
```

**Implementar rate limiting con Redis Storage**:

```javascript
// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Usar Redis como store
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:login:'
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Demasiados intentos de login',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = { loginLimiter };
```

---

## 📦 BACKLOG: BAJA PRIORIDAD

### 4.1 Implementar Refresh Tokens

**Esfuerzo**: 3-4 días

```javascript
// Implementar tabla refresh_tokens
// Endpoint /api/auth/refresh
// Auto-renovación en frontend
```

### 4.2 Two-Factor Authentication (2FA)

**Esfuerzo**: 1-2 semanas

```bash
npm install speakeasy qrcode
# Implementar generación de secrets
# QR codes para apps de autenticación
# Verificación de códigos TOTP
```

### 4.3 Recuperación de Contraseña

**Esfuerzo**: 1 semana

```javascript
// Endpoint /api/auth/forgot-password
// Envío de email con token temporal
// Endpoint /api/auth/reset-password
```

### 4.4 OAuth / Social Login

**Esfuerzo**: 2 semanas

```bash
npm install passport passport-google-oauth20 passport-facebook
# Implementar OAuth flows
# Vincular cuentas sociales
```

### 4.5 Migrara Frontend a Vite

**Esfuerzo**: 2-3 días

```bash
npm create vite@latest frontend -- --template react
# Migrar componentes
# Configurar environment variables (VITE_)
```

---

## 🐳 MEJORAS DE INFRAESTRUCTURA

### 5.1 Multi-stage Docker Builds

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### 5.2 Health Checks Mejorados

```javascript
// backend/src/routes/healthRoutes.js
const express = require('express');
const db = require('../config/database');
const redisClient = require('../config/redis');

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    services: {}
  };

  // Check database
  try {
    await db.query('SELECT 1');
    health.services.database = 'up';
  } catch (error) {
    health.services.database = 'down';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redisClient.ping();
    health.services.redis = 'up';
  } catch (error) {
    health.services.redis = 'down';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

### 5.3 CI/CD con GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: otic_login_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Backend Dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run Backend Tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/otic_login_test
          REDIS_HOST: localhost
          JWT_SECRET: test_secret_key
        run: |
          cd backend
          npm test -- --coverage
      
      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm test -- --coverage

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: |
          cd backend
          npm ci
          npm run lint
```

---

## 📊 RESUMEN DE IMPACTO

### Por Sprint

| Sprint | Duración | Madurez Inicial | Madurez Final | Incremento |
|--------|----------|-----------------|---------------|------------|
| Sprint 1 | 1 semana | 68% | 76% | +8% |
| Sprint 2 | 1 semana | 76% | 82% | +6% |
| Sprint 3 | 2 semanas | 82% | 88% | +6% |

### Por Categoría

| Categoría | Actual | Post-Sprint 1 | Post-Sprint 2 | Post-Sprint 3 |
|-----------|--------|---------------|---------------|---------------|
| Seguridad | 60% | 75% | 85% | 90% |
| Code Quality | 72% | 78% | 82% | 85% |
| Testing | 35% | 40% | 45% | 75% |
| Performance | 65% | 68% | 72% | 80% |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Sprint 1
- [ ] Implementar RulesManager completo
  - [ ] Crear métodos en LoginAttempt model
  - [ ] Implementar reglas de negocio
  - [ ] Escribir tests
- [ ] Agregar rate limiting
  - [ ] Instalar express-rate-limit
  - [ ] Configurar limiters
  - [ ] Aplicar en rutas
- [ ] Validar JWT_SECRET
  - [ ] Modificar jwt.js
  - [ ] Crear script de generación
  - [ ] Documentar
- [ ] Error handling centralizado
  - [ ] Crear middleware
  - [ ] Actualizar controllers
  - [ ] Agregar logging

### Sprint 2
- [ ] Implementar Helmet.js
- [ ] Validación con Joi
- [ ] Logging con Winston
- [ ] Crear índices de BD
- [ ] Configurar Morgan

### Sprint 3
- [ ] Context API en frontend
- [ ] Actualizar componentes
- [ ] Tests unitarios backend
- [ ] Tests de integración
- [ ] Setup Redis
- [ ] Implementar caching

---

**Documento generado**: Enero 2026  
**Versión**: 1.0  
**Próxima revisión**: Post-Sprint 1
