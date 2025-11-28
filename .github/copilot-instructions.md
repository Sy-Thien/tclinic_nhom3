# TClinic - AI Coding Agent Instructions

## Project Overview
Full-stack clinic management system with role-based access (Admin, Doctor, Patient). MySQL + Sequelize backend with React + Vite frontend.

## Architecture

### Tech Stack
- **Backend**: Node.js + Express + Sequelize ORM + MySQL
- **Frontend**: React 18 + Vite + React Router v7
- **Auth**: JWT tokens (7-day expiry) with role-based middleware
- **Database**: MySQL with Sequelize migrations

### Monorepo Structure
```
/server   - Backend API (port 5000)
/client   - React SPA (port 5173)
/         - Root contains markdown docs + shared package.json
```

### Three-Role System
**Critical**: All routes/APIs enforce role separation:
- `admin` - Full system access via `/admin/*` routes (AdminLayout)
- `doctor` - Medical staff via `/doctor-portal/*` routes (DoctorLayout)  
- `patient` - Customers via `/` routes (CustomerLayout)
- Guests can access public pages but not protected resources

## Development Workflow

### Starting the Application
```powershell
# Backend (always start first)
cd b:\tclinic_nhom3\server
npm start  # or npm run dev for nodemon

# Frontend (separate terminal)
cd b:\tclinic_nhom3\client
npm run dev

# Access at http://localhost:5173
# API at http://localhost:5000
```

### Database Migrations
```powershell
cd b:\tclinic_nhom3\server
npx sequelize-cli db:migrate        # Run pending migrations
npx sequelize-cli db:migrate:undo   # Rollback last migration
```

**Important**: Migration files use timestamps (e.g., `202511220001-create-time-slots-table.js`). Always check existing migrations before creating new ones.

## Key Conventions

### Authentication Flow
1. **Login endpoint** (`POST /api/auth/login`) checks 3 tables in order: `tn_admins` → `tn_doctors` → `tn_patients`
2. **Token payload** includes: `{ id, email, role, doctor_id?, iat, exp }`
3. **Frontend storage**: `localStorage.token` + `localStorage.user` (JSON)
4. **ProtectedRoute component** (`client/src/components/ProtectedRoute.jsx`) enforces role-based redirects:
   - Wrong role → auto-redirect to correct dashboard
   - No token → redirect to `/login`

### Backend Patterns

#### Model Relationships (server/models/index.js)
- All Sequelize models use **factory functions** (e.g., `DoctorSchedule`, `TimeSlot`)
- Relationships defined in `index.js` after model initialization
- **Critical associations**:
  - `Booking` → `TimeSlot`, `Doctor`, `Patient`, `Specialty`, `Service`
  - `TimeSlot` → `Doctor`, `Room` (manages appointment slots)
  - `Prescription` → `PrescriptionDetail` → `Drug`

#### API Route Structure
```javascript
// Standard pattern in all route files
const { verifyToken, isAdmin, isDoctor } = require('../middleware/authMiddleware');

router.get('/endpoint', verifyToken, isAdmin, controller.method);
```

**Middleware order matters**: `verifyToken` → role check → controller

#### Table Naming Convention
All tables use `tn_` prefix (e.g., `tn_booking`, `tn_doctors`, `tn_time_slots`)

### Frontend Patterns

#### API Client (client/src/utils/api.js)
- Centralized axios instance with auto-retry and token injection
- **Interceptors handle**:
  - 401 → auto-logout + redirect `/login`
  - 403 → alert "no permission"
  - Network errors → connection alert
- **Always import**: `import api from '../utils/api'` (NOT raw axios)

#### Component Structure by Role
```
client/src/
  pages/
    admin/      - Admin-only pages
    doctor/     - Doctor-only pages  
    customer/   - Patient/guest pages
    public/     - Truly public (no auth) pages
  components/
    admin/      - AdminLayout, admin-specific components
    doctor/     - DoctorLayout, doctor-specific components
    customer/   - CustomerLayout, customer-specific components
```

#### Routing Pattern (App.jsx)
```jsx
// Each role has isolated route tree
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminLayout />
  </ProtectedRoute>
}>
  {/* Admin routes */}
</Route>
```

## Critical Business Logic

### Booking/Appointment System (READ BEFORE MODIFYING)
See `BOOKING_LOGIC_EXPLANATION.md` for complete flow. Key points:

1. **Guest bookings allowed**: `patient_id` can be NULL
2. **Optional fields**: `doctor_id`, `appointment_time` (admin assigns if empty)
3. **Status workflow**: `pending` → `confirmed` → `completed` or `cancelled`
4. **TimeSlot system**: 
   - `tn_time_slots` tracks doctor availability (30-min slots)
   - `max_patients` vs `current_patients` enforces capacity
   - Booking references `time_slot_id` (nullable for legacy bookings)

### Doctor Schedule Management
- `DoctorSchedule` = weekly recurring patterns (e.g., "Monday 8am-5pm")
- `TimeSlot` = specific date/time instances (e.g., "2025-11-22 10:00-10:30")
- Admin creates schedules via `/admin/doctors` → generates TimeSlots
- Doctors view in `/doctor-portal/schedule` (read-only)

### Prescription/Drug System
- `Prescription` (header) → `PrescriptionDetail` (line items) → `Drug` (inventory)
- Created during examination (`/doctor-portal/examination`)
- PDF generation via `pdfmake` (see `client/src/utils/generatePrescriptionPDF.js`)
- Drug stock tracked with low-stock warnings in admin panel

### Reminder System (Background Service)
- Auto-runs on server start (`server.js` calls `reminderService.startScheduler()`)
- Checks for appointments in next 24h every hour
- Sends email reminders via `emailService` (requires nodemailer config)
- Marks bookings with `reminder_sent = true`

## Common Tasks

### Adding a New API Endpoint
1. Create controller in `server/controllers/` (follow existing naming)
2. Define routes in `server/routes/` with proper middleware
3. Add route to `server/server.js`: `app.use('/api/...', require('./routes/...'))`
4. Frontend: call via `api.get('/api/...')` (NOT axios directly)

### Adding a New Database Table
1. Create migration: `npx sequelize-cli migration:generate --name create-table-name`
2. Define table with `tn_` prefix and standard fields: `created_at`, `updated_at`
3. Create model in `server/models/` (use factory function pattern)
4. Add relationships in `server/models/index.js`
5. Export model in `index.js` module.exports
6. Run migration: `npx sequelize-cli db:migrate`

### Adding a New Frontend Page
1. Create page component in appropriate `pages/` subfolder
2. Add route in `App.jsx` under correct role section
3. Wrap with `<ProtectedRoute requiredRole="...">` 
4. Add navigation link in corresponding Layout component
5. API calls use `api` utility, not raw axios

## Testing & Debugging

### Database Inspection
Helper scripts in `server/`:
- `checkDoctor.js`, `checkBooking.js`, etc. - Quick DB queries
- `seedDoctorsWithSchedules.js` - Generate test data
- Run with: `node server/scriptName.js`

### Common Debugging Commands
```powershell
# Check if backend is running
curl http://localhost:5000/health

# View MySQL logs (if using XAMPP)
Get-Content C:\xampp\mysql\data\*.err -Tail 50

# Clear frontend cache
# In browser: Ctrl+Shift+R
localStorage.clear()  # In DevTools console
```

### Login Test Accounts
Refer to `TEST_LOGIN_GUIDE.md` for credentials. Typical setup:
- Admin: username in `tn_admins.username` column
- Doctor: email in `tn_doctors.email` column  
- Patient: email in `tn_patients.email` column
- Passwords hashed with bcrypt (check seed scripts for plaintext)

## Important Files to Check Before Changes

### Documentation Files (root directory)
- `AUTHENTICATION_GUIDE.md` - Complete auth flow + ProtectedRoute logic
- `BOOKING_LOGIC_EXPLANATION.md` - Booking system deep dive
- `DOCTOR_SCHEDULE_COMPLETE.md` - Schedule/TimeSlot system
- `DATABASE_READY.md` - Migration status + table structures
- `API_TEST_GUIDE.md` - Full endpoint reference

### Configuration Files
- `server/config/config.json` - Database credentials
- `server/.env` - JWT secret, email config (not in repo)
- `client/.env` - `VITE_API_URL` override (defaults to localhost:5000)

### Core Backend Files
- `server/models/index.js` - Model relationships (modify carefully)
- `server/server.js` - Route registration order matters
- `server/middleware/authMiddleware.js` - Role enforcement logic

### Core Frontend Files  
- `client/src/App.jsx` - Route structure + role mapping
- `client/src/components/ProtectedRoute.jsx` - Auth guard logic
- `client/src/utils/api.js` - Centralized HTTP client

## Troubleshooting

**"401 Unauthorized" errors**: Check token expiry (7 days). Clear localStorage and re-login.

**"Role mismatch" redirects**: Verify `localStorage.user.role` matches route's `requiredRole`.

**Migration errors**: Check `server/config/config.json` matches MySQL credentials. Ensure MySQL is running (port 3306).

**CORS issues**: Backend uses `cors()` middleware (no config needed for localhost).

**Sequelize model not found**: Ensure model is exported in `server/models/index.js` AND required in controller.

**Frontend 404 on refresh**: Vite dev server handles this. In production, configure server for SPA routing.

## Style & Patterns

- **Async/await** over promises: Use try-catch for error handling
- **Console logs**: Prefix with emoji for visibility (✅ success, ❌ error, 🔐 auth, 📊 data)
- **Vietnamese UI text**: All user-facing messages in Vietnamese (code/comments in English)
- **Error responses**: `{ message: 'Error description' }` format
- **Success responses**: `{ data: {...}, message?: 'Success' }` format
- **Date format**: Store as `DATE` type, format in frontend (`YYYY-MM-DD` for API)
- **Time format**: Store as `TIME` type, 24-hour format (`HH:mm:ss`)

## Environment Variables

### Server (.env)
```
DB_NAME=tn_clinic
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_DIALECT=mysql
PORT=5000
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000
```

## Performance Notes

- **Database queries**: Always include relevant relationships (use `include` with Sequelize)
- **Frontend state**: Prefer React hooks over class components
- **Large lists**: Use pagination in API endpoints (check `adminBookingController.js` for examples)
- **Image uploads**: Currently not implemented - extend `BookingPhoto` model if needed

## Security Considerations

- **Password hashing**: Use bcrypt with salt rounds ≥10 (see `authController.js`)
- **SQL injection**: Sequelize parameterizes queries automatically
- **XSS**: React escapes by default, but sanitize user input in markdown/HTML contexts
- **Token storage**: localStorage (not cookies) - acceptable for this project scope
- **Role escalation**: Backend ALWAYS verifies role via JWT payload (never trust frontend)

---

**Need more context?** Check the comprehensive markdown guides in the root directory. They contain SQL examples, API request/response samples, and detailed workflow diagrams.
