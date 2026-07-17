# AUTHCORE - Full-Stack Authentication System

A production-ready, full-stack authentication system built with Spring Boot (backend) and React/Vite (frontend), featuring comprehensive role-based access control (RBAC), multi-factor authentication, and a modern admin dashboard.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Backend (API)](#-backend-api)
- [Frontend (UI)](#-frontend-ui)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Key Concepts](#-key-concepts)
- [Contributing](#-contributing)

## ✨ Features

### Authentication

- **Email/Password Authentication** - Secure user registration and login
- **Email Verification** - Verify user emails before granting access
- **Multi-Factor Authentication (MFA)** - Enhanced security with MFA setup and verification
- **WebAuthn Support** - Modern passwordless authentication
- **OAuth Integration** - Social login capabilities
- **Password Reset** - Forgot password flow with secure token management
- **Session Management** - Comprehensive session handling and device tracking

### Authorization

- **Role-Based Access Control (RBAC)** - User and Admin roles with granular permissions
- **Route Guards** - Protect routes based on authentication and roles
- **API Guards** - Secure API endpoints with role requirements
- **Access Denial Handling** - Graceful handling of unauthorized access

### Admin Dashboard

- **Dashboard Statistics** - User counts, verification status, and analytics
- **User Management** - View, edit, and delete users
- **Role Management** - Assign and modify user roles
- **Search & Filter** - Find users by name, email, or role
- **Threat Detection** - Monitor and detect suspicious activities
- **Analytics Tracking** - Comprehensive usage analytics

### User Experience

- **Dark/Light Theme** - System-aware theme switching
- **Responsive Design** - Mobile-first, responsive layouts
- **SPA Navigation** - Fast, client-side routing
- **Modern UI** - Built with Tailwind CSS and custom UI components
- **Profile Management** - User profile updates and settings

## 🛠 Tech Stack

### Backend (/backend)

| Technology | Version | Purpose |
|---|---|---|
| Spring Boot | 3.x | Java framework |
| Spring Security | 6.x | Authentication & authorization |
| Spring Data JPA | 3.x | Database ORM |
| PostgreSQL | 16.x | Database |
| Lombok | 1.18.x | Code generation |
| Swagger/Springdoc | 2.x | API documentation |
| Java | 21+ | Programming language |

### Frontend (/frontend)

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| React Router | 6.x | Client-side routing |
| TanStack Query | 5.x | Data fetching |
| Custom UI Components | - | UI components |
| Lucide React | - | Icons |

## 📁 Project Structure

```
AUTHCORE/
├── backend/                          # Backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/authcore/
│   │   │   │       ├── AuthcoreApplication.java    # Main application entry
│   │   │   │       ├── config/                     # Configuration classes
│   │   │   │       ├── controller/                 # REST controllers
│   │   │   │       ├── dto/                        # Data Transfer Objects
│   │   │   │       ├── entity/                     # JPA entities
│   │   │   │       ├── repository/                 # Data access layer
│   │   │   │       ├── security/                   # Security configuration
│   │   │   │       └── service/                    # Business logic
│   │   │   └── resources/
│   │   │       └── application.properties          # Configuration
│   │   └── test/                                   # Test suite
│   ├── Dockerfile
│   ├── pom.xml
│   └── start-backend.ps1
│
├── frontend/                         # Frontend (React)
│   ├── src/
│   │   ├── main.tsx                  # Application entry
│   │   ├── App.tsx                   # Root component
│   │   ├── components/               # React components
│   │   │   ├── Analytics.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ThreatDetection.tsx
│   │   │   └── ui/                   # shadcn-style UI components
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── select.tsx
│   │   │       ├── table.tsx
│   │   │       └── tabs.tsx
│   │   ├── config/
│   │   │   └── env.ts                # Environment configuration
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Auth context provider
│   │   ├── lib/
│   │   │   └── utils.ts              # Utility functions
│   │   ├── pages/                    # Page components
│   │   │   ├── AccessDenied.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── ManagerDashboard.tsx
│   │   │   ├── MFASetup.tsx
│   │   │   ├── OAuthCallback.tsx
│   │   │   ├── ProfileManagement.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── VerifyEmail.tsx
│   │   │   └── WebAuthnSetup.tsx
│   │   ├── services/
│   │   │   └── api.ts                # API client
│   │   └── index.css                 # Global styles
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── package.json
│   └── pnpm-lock.yaml
│
├── docker-compose.yml                # Docker Compose for PostgreSQL
├── pom.xml                           # Root Maven configuration
├── start.frontend                    # Frontend startup script
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+ (or npm/yarn)
- Java 21+
- Maven 3.8+
- Docker (for PostgreSQL)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd AUTHCORE

# Install backend dependencies
cd backend
mvn clean install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### 2. Start the Database

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL on port 5432 with:
- **Database**: authcore_db
- **Username**: postgres
- **Password**: postgres

### 3. Configure Environment Variables

Both projects include `.env.example` files as templates. Copy them to create your local environment files:

**Backend (backend/application.properties):**

```properties
# Server
server.port=8080
server.servlet.context-path=/api

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/authcore_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update

# CORS
app.cors.allowedOrigins=http://localhost:5173

# JWT
app.jwt.secret=your-secret-key-here
app.jwt.expiration=86400000

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

**Frontend (.env.local):**

```
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=AUTHCORE
```

### 4. Start Development Servers

**Terminal 1 - Backend:**

The backend requires proper database configuration. Use one of these methods:

**Method A: Using Development Profile (Recommended)**

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'
```

**Method B: With Environment Variables**

```bash
cd backend
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/authcore_db"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="postgres"
mvn spring-boot:run
```

**Method C: Edit application.properties (Not Recommended)**

- Copy `backend/src/main/resources/application-dev.properties` values to `application.properties`
- Run: `mvn spring-boot:run`

Backend runs on http://localhost:8080

**Terminal 2 - Frontend:**

```bash
cd frontend
pnpm dev
```

Frontend runs on http://localhost:5173

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8080/api/swagger-ui.html
- **API JSON**: http://localhost:8080/api/v3/api-docs

## 🔧 Backend (API)

### API Configuration

The Spring Boot application is configured in `AuthcoreApplication.java`:

```java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors()
            .and()
            .csrf().disable()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS);
        return http.build();
    }
}
```

### Database Setup

The application uses PostgreSQL with Spring Data JPA. Core entities include:

| Entity | Table | Description |
|---|---|---|
| User | users | User accounts with roles |
| Role | roles | Available user roles |
| Account | accounts | OAuth/credential accounts |
| Session | sessions | User sessions |
| Verification | verifications | Email/password tokens |
| Audit | audit_logs | Security audit logs |

**User Entity with Roles:**

```java
public enum UserRole {
    USER("user"),
    ADMIN("admin"),
    MANAGER("manager");
    
    private final String value;
}

@Entity
@Table(name = "users")
public class User {
    @Id
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private boolean emailVerified;
    
    @Column(nullable = true)
    private String image;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

### Authentication System

Spring Security with JWT is configured to handle:

- Email/password authentication
- JWT token generation and validation
- Multi-factor authentication (MFA)
- WebAuthn passwordless authentication
- OAuth provider integration
- Session management

### API Endpoints

**Authentication (/api/auth)**

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /auth/register | User registration | ❌ |
| POST | /auth/login | User login | ❌ |
| POST | /auth/logout | User logout | ✅ |
| GET | /auth/me | Get current user | ✅ |
| POST | /auth/refresh | Refresh token | ✅ |

**Email Verification (/api/auth/verify)**

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /verify/send-email | Send verification email | ❌ |
| POST | /verify/confirm | Confirm email verification | ❌ |

**Password Reset (/api/auth/password)**

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /password/forgot | Request password reset | ❌ |
| POST | /password/reset | Reset password with token | ❌ |
| POST | /password/change | Change password | ✅ |

**User Management (/api/user)**

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /user/profile | Get user profile | ✅ |
| PUT | /user/profile | Update user profile | ✅ |
| GET | /user/sessions | List active sessions | ✅ |
| POST | /user/sessions/revoke | Revoke session | ✅ |

**MFA (/api/mfa)**

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /mfa/setup | Initialize MFA setup | ✅ |
| POST | /mfa/verify | Verify MFA code | ✅ |
| POST | /mfa/disable | Disable MFA | ✅ |

**WebAuthn (/api/webauthn)**

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /webauthn/register/options | Get registration options | ✅ |
| POST | /webauthn/register/verify | Verify registration | ✅ |
| POST | /webauthn/authenticate/options | Get auth options | ❌ |
| POST | /webauthn/authenticate/verify | Verify authentication | ❌ |

**Admin (/api/admin) - Admin Role Required**

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /admin/stats | Get dashboard statistics | ✅ Admin |
| GET | /admin/users | List all users (paginated) | ✅ Admin |
| GET | /admin/users/:id | Get user by ID | ✅ Admin |
| PUT | /admin/users/:id | Update user | ✅ Admin |
| PATCH | /admin/users/:id/role | Update user role | ✅ Admin |
| DELETE | /admin/users/:id | Delete user | ✅ Admin |
| GET | /admin/audit-logs | View audit logs | ✅ Admin |
| GET | /admin/threats | View detected threats | ✅ Admin |

### RBAC Authorization

The RBAC system uses Spring Security annotations:

```java
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    @GetMapping("/stats")
    public ResponseEntity<AdminStats> getStats() {
        // Admin only endpoint
    }
}
```

### Swagger Documentation

Access Swagger UI at: http://localhost:8080/api/swagger-ui.html

Features:
- Interactive API testing
- Request/response schemas
- Authentication support
- Grouped endpoints by tags

## 🎨 Frontend (UI)

### UI Configuration

The frontend uses Vite with React. Configuration is in `vite.config.ts`:

```typescript
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    }
})
```

### Routing System

React Router with component-based routing. Key routes:

| Route | Component | Description |
|---|---|---|
| / | Dashboard | Home/dashboard page |
| /login | Login | Login page |
| /register | Register | Registration page |
| /forgot-password | ForgotPassword | Password recovery |
| /reset-password | ResetPassword | Password reset |
| /verify-email | VerifyEmail | Email verification |
| /mfa-setup | MFASetup | MFA configuration |
| /webauthn-setup | WebAuthnSetup | WebAuthn registration |
| /oauth-callback | OAuthCallback | OAuth callback handler |
| /dashboard | Dashboard | User dashboard |
| /profile | ProfileManagement | User profile settings |
| /admin | AdminDashboard | Admin dashboard |
| /access-denied | AccessDenied | Access denied page |

**Route Protection:**

```typescript
// Protected route with auth check
<Route
    path="/dashboard"
    element={
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    }
/>

// Admin-only route
<Route
    path="/admin"
    element={
        <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
        </ProtectedRoute>
    }
/>
```

### Authentication Client

The API client is configured in `services/api.ts`:

```typescript
export const authApi = {
    // User authentication
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    
    register: (name: string, email: string, password: string) =>
        api.post('/auth/register', { name, email, password }),
    
    logout: () => api.post('/auth/logout'),
    
    // Get current user
    getCurrentUser: () => api.get('/auth/me'),
    
    // Token refresh
    refreshToken: () => api.post('/auth/refresh'),
}
```

### Context API & State Management

Auth context provides authentication state:

```typescript
// src/contexts/AuthContext.tsx
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

### Theme System

The app supports light and dark themes:

```typescript
// Theme context
interface ThemeContextType {
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Usage
const { theme, setTheme } = useTheme();
```

### Components

**UI Components:**

- Button - Customizable button variants
- Input - Form input fields
- Label - Form labels
- Select - Dropdown selection
- Card - Container components
- Dialog - Modal dialogs
- Badge - Status indicators
- Table - Data tables
- Tabs - Tab navigation

**Custom Components:**

- ProtectedRoute - Route protection wrapper
- Analytics - Analytics display component
- ThreatDetection - Threat monitoring component

## 🔐 Environment Variables

### Backend (backend/application.properties)

| Variable | Description | Default |
|---|---|---|
| server.port | Server port | 8080 |
| spring.datasource.url | PostgreSQL connection string | jdbc:postgresql://localhost:5432/authcore_db |
| spring.datasource.username | Database username | postgres |
| spring.datasource.password | Database password | postgres |
| app.jwt.secret | JWT signing secret | - |
| app.jwt.expiration | JWT expiration time (ms) | 86400000 |
| app.cors.allowedOrigins | CORS allowed origins | http://localhost:5173 |
| spring.mail.host | SMTP host | smtp.gmail.com |
| spring.mail.port | SMTP port | 587 |
| spring.mail.username | Email account | - |
| spring.mail.password | Email password/token | - |

### Frontend (frontend/.env.local)

| Variable | Description | Default |
|---|---|---|
| VITE_API_URL | Backend API URL | http://localhost:8080/api |
| VITE_APP_NAME | Application name | AUTHCORE |

**Note:** Never commit `.env` or `.env.local` files to version control.

## 🧪 Development

### Backend Commands

```bash
cd backend

# Development with hot reload
mvn spring-boot:run

# Build for production
mvn clean package -DskipTests

# Run tests
mvn test

# Run specific test
mvn test -Dtest=ClassName

# Lint/Check code
mvn checkstyle:check
```

### Frontend Commands

```bash
cd frontend

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Database Commands

```bash
cd backend

# Start PostgreSQL container
docker compose up -d

# Stop PostgreSQL container
docker compose down

# View logs
docker compose logs -f postgres

# Reset database (delete volume)
docker compose down -v
docker compose up -d

# Connect to database
docker exec -it authcore-db psql -U postgres -d authcore_db
```

### Creating an Admin User

1. Register a new user through the UI
2. Connect to the database:
   ```bash
   docker exec -it authcore-db psql -U postgres -d authcore_db
   ```
3. Update the user role:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

## 🚢 Deployment

### Backend Deployment

Build the application:

```bash
cd backend
mvn clean package -DskipTests
```

Set production environment variables in `application-prod.properties`:

```properties
server.port=8080
spring.datasource.url=jdbc:postgresql://prod-db-host:5432/authcore_db
spring.datasource.username=prod-username
spring.datasource.password=prod-password
app.jwt.secret=your-production-secret-key
app.cors.allowedOrigins=https://your-frontend-domain.com
spring.mail.host=your-smtp-host
spring.mail.username=your-email@domain.com
spring.mail.password=your-app-password
```

Run the application:

```bash
java -jar target/authcore-1.0.0.jar --spring.profiles.active=prod
```

### Frontend Deployment

Build the application:

```bash
cd frontend
pnpm build
```

Set production environment variables:

```
VITE_API_URL=https://your-api-domain.com/api
```

Deploy the `dist/` folder to your static hosting provider:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

### Docker Deployment

**Backend Dockerfile:**

```dockerfile
FROM openjdk:21-slim
WORKDIR /app
COPY target/authcore-1.0.0.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

**Frontend Dockerfile:**

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/authcore_db
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=authcore_db
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 📚 API Reference

### Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│  User   │────▶│ Frontend │────▶│ Backend │────▶│ Database │
└─────────┘     └──────────┘     └─────────┘     └──────────┘
     │               │                │                │
     │ Click Login   │                │                │
     │───────────────▶                │                │
     │               │ POST /auth/login
     │               │───────────────▶│                │
     │               │                │ Validate Creds │
     │               │                │───────────────▶│
     │               │                │◀───────────────│
     │               │    JWT Token   │                │
     │               │◀───────────────│                │
     │  Dashboard    │                │                │
     │◀──────────────│                │                │
```

### Session Management

Sessions are managed via JWT tokens stored in HTTP-only cookies:

- **Cookie Name**: authcore_token
- **HTTP Only**: Yes
- **Secure**: Yes (in production)
- **SameSite**: Strict
- **Expiration**: 24 hours (configurable)
- **Refresh**: Available via /auth/refresh endpoint

### Error Handling

API errors follow this format:

```json
{
    "timestamp": "2024-01-15T10:30:00Z",
    "status": 400,
    "error": "BAD_REQUEST",
    "message": "Email already exists",
    "path": "/api/auth/register"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🧩 Key Concepts

### Spring Security Integration

Spring Security handles:
- Authentication and authorization
- JWT token generation and validation
- CORS configuration
- CSRF protection
- Session management

### RBAC Pattern

The Role-Based Access Control follows this pattern:

1. Define Roles in `UserRole` enum
2. Annotate Controllers with `@PreAuthorize("hasRole('ROLE_NAME')")`
3. Spring Security checks user roles automatically

### JWT Token Flow

1. User logs in with credentials
2. Backend validates and generates JWT
3. JWT stored in HTTP-only cookie
4. Frontend includes token in Authorization header
5. Backend validates token on each request
6. Token refreshed before expiration

### Component-Based Routing

React Router provides:
- Type-safe routing with TypeScript
- Protected routes with role checking
- Nested layouts
- Query parameter handling
- Dynamic routing

### Context API State Management

- `AuthContext` - Global authentication state
- Component-level state for UI interactions
- TanStack Query for server state

## 🔧 Troubleshooting

### Backend Startup Issues

#### Error: "Driver org.postgresql.Driver claims to not accept jdbcUrl, ${SPRING_DATASOURCE_URL}"

**Cause:** Environment variables are not set or Spring properties are not being resolved.

**Solutions:**

**Solution 1: Use Development Profile (Recommended)**

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'
```

This uses `application-dev.properties` which has hardcoded local values.

**Solution 2: Set Environment Variables (PowerShell)**

```powershell
# PowerShell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/authcore_db"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="postgres"
mvn spring-boot:run
```

**Solution 3: Set Environment Variables (CMD)**

```cmd
REM Command Prompt
set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/authcore_db
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=postgres
mvn spring-boot:run
```

**Solution 4: Set Environment Variables (Linux/Mac)**

```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/authcore_db"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="postgres"
mvn spring-boot:run
```

---

#### Error: "connection refused" or "could not connect to server"

**Cause:** PostgreSQL container is not running.

**Solution:**

```bash
# Start PostgreSQL
cd backend
docker compose up -d

# Verify it's running
docker compose ps

# View logs if there's an issue
docker compose logs postgres
```

---

#### Error: "HHH000342: Could not obtain connection to query metadata"

**Cause:** Database connection pool cannot establish a connection.

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   docker compose ps
   ```

2. **Verify connection string:**
   - Should be: `jdbc:postgresql://localhost:5432/authcore_db`
   - NOT: `${SPRING_DATASOURCE_URL}` (literal placeholder)

3. **Check credentials:**
   - Username: `postgres`
   - Password: `postgres`
   - Database: `authcore_db`

4. **Test connection manually:**
   ```bash
   docker exec -it <container-id> psql -U postgres -d authcore_db
   ```

---

#### Error: "Unsatisfied dependency expressed through method 'jwtAuthenticationFilter'"

**Cause:** Spring cannot create beans due to database connection failure (cascading error).

**Solution:** Fix the database connection first (see above errors), then restart.

---

### Database Issues

#### Error: "database authcore_db does not exist"

**Solution:**

PostgreSQL should automatically create the database via `docker-compose.yml`. If not:

```bash
# Connect to PostgreSQL
docker exec -it authcore-db psql -U postgres

# Create database
CREATE DATABASE authcore_db;

# Exit
\q
```

---

#### Cannot connect to Docker container

**Diagnosis:**

```bash
# List running containers
docker ps

# Check if authcore-db is listed
# If not, run:
cd backend
docker compose up -d
```

---

### Port Already in Use

#### Error: "port 8080 already in use" or "Port 5432 is already allocated"

**Solution 1: Kill process on port**

**PowerShell:**
```powershell
# Find process on port 8080
Get-NetTCPConnection -LocalPort 8080 | Select-Object -ExpandProperty OwningProcess

# Kill it (replace 12345 with actual PID)
Stop-Process -Id 12345 -Force
```

**Command Prompt:**
```cmd
netstat -ano | findstr :8080
taskkill /PID 12345 /F
```

**Linux/Mac:**
```bash
lsof -i :8080
kill -9 <PID>
```

**Solution 2: Use different port**

Edit `application-dev.properties`:
```properties
server.port=8081
```

Then access API at `http://localhost:8081`

---

### Frontend Issues

#### Error: "Cannot find module 'react'" or dependency errors

**Solution:**

```bash
cd frontend
# Clear cache
rm -r node_modules pnpm-lock.yaml

# Reinstall
pnpm install
```

---

#### Frontend cannot connect to backend

**Cause:** `VITE_API_URL` is incorrect or backend is not running.

**Solution:**

1. Verify backend is running:
   ```bash
   curl http://localhost:8080/api/auth/me
   ```

2. Check `frontend/.env.local`:
   ```
   VITE_API_URL=http://localhost:8080/api
   ```

3. Restart frontend:
   ```bash
   cd frontend
   pnpm dev
   ```

---

### Maven Build Issues

#### Error: "Could not find or load main class"

**Solution:**

```bash
cd backend

# Clean and rebuild
mvn clean install

# If using Java 21+, you may need to add JVM args:
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-XX:+EnablePreview"
```

---

#### Error: "BUILD FAILURE" during compilation

**Solution:**

```bash
# Update Maven
mvn -v

# Verify Java version (should be 21+)
java -version

# Clean rebuild
mvn clean compile
```

---

### Development Workflow Issues

#### Files not being watched/reloaded

**Backend:**

Spring Boot with DevTools should auto-reload. If not:

```bash
# Kill existing process
mvn spring-boot:stop

# Add DevTools to pom.xml and restart
mvn spring-boot:run
```

**Frontend:**

Vite has hot module replacement (HMR). If not working:

```bash
cd frontend

# Kill process
Ctrl+C

# Restart
pnpm dev
```

---

### Getting Help

If you encounter issues not listed above:

1. **Check logs:**
   ```bash
   # Backend
   tail -f target/application.log
   
   # Frontend
   # Check browser console (F12)
   ```

2. **Verify setup:**
   ```bash
   # Database running?
   docker compose ps
   
   # Correct port?
   netstat -ano | findstr :8080
   
   # Environment variables set?
   echo $env:SPRING_DATASOURCE_URL
   ```

3. **Full debug mode:**
   ```bash
   cd backend
   mvn -X spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev --debug'
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Code Style

- Backend: Follow Google Java Style Guide
- Frontend: Follow Airbnb JavaScript/TypeScript Style Guide
- Use appropriate linting and formatting tools

### Commit Message Convention

```
type(scope): subject

body

footer
```

Types: feat, fix, docs, style, refactor, test, chore

## 📝 License

[Add your license here]

## 📧 Support

For support, email support@authcore.dev or open an issue on GitHub.
