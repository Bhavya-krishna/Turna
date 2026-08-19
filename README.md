# 🏥 Turna — Your Time. Your Turn.

> **Production-Ready Hospital & Doctor Appointment Booking Platform** with real-time dynamic slot scheduling, database row-level concurrency protection, automated reminders, and glassmorphic UI.

---

## ✨ Key Features

- **Real-Time Hospital & Doctor Discovery**: Search and filter by city, hospital, medical specialty, and doctor consultation fees.
- **30-Day Dynamic Slot Scheduling**: Auto-generates morning, afternoon, and evening appointment slots based on doctors' recurring weekly schedules.
- **Guaranteed Concurrency Safety**: PostgreSQL `select_for_update()` row-level locking ensures zero double-booking race conditions under high traffic.
- **Automated Notifications & Reminders**: Celery background tasks dispatch instant confirmation emails and schedule 30-minute pre-appointment reminders.
- **One-Click Slot Cancellation & Release**: Instant cancellation refunds status and releases the slot back to the hospital schedule immediately.
- **Modern Medical Tech Frontend**: React 19 + TypeScript + Vite with custom Vanilla CSS design tokens, glassmorphism, responsive layouts, and dark/light themes.
- **Cloud-Native & Kubernetes Ready**: Built-in `/healthz` (liveness) and `/readyz` (readiness) probe endpoints, OpenAPI/Swagger documentation, and multi-stage Dockerfiles.

---

## 🏗️ Architecture & Tech Stack

```
turna/
├── backend/                     # Django REST Framework Backend
│   ├── accounts/                # User authentication & JWT tokens
│   ├── hospitals/               # Hospitals & medical departments
│   ├── doctors/                 # Doctors, recurring schedules & slot generation
│   ├── bookings/                # Concurrency-safe appointments & payments
│   ├── notifications/           # Celery automated reminder tasks & email service
│   ├── core/                    # Health probes, seed data & payment providers
│   └── turna/                   # WSGI, ASGI, Celery app & settings
├── frontend/                    # Modern React + TypeScript + Vite Web Application
│   ├── src/components/          # Navbar, Hero, Modals, Cards, AppointmentsList, Footer
│   ├── src/context/             # AuthContext, ToastContext
│   ├── src/services/            # Typed REST API client & interceptors
│   ├── src/types/               # Full TypeScript interface definitions
│   └── src/index.css            # Turna Design System with Dark/Light modes
├── docker-compose.yml           # Unified multi-container orchestration
└── .gitignore                   # Comprehensive repository gitignore
```

- **Backend**: Python 3.12, Django 5.1, Django REST Framework, SimpleJWT, Celery, Redis, PostgreSQL (with SQLite dev fallback), drf-spectacular.
- **Frontend**: React 19, TypeScript, Vite 8, Lucide Icons, Canvas Confetti.
- **DevOps**: Docker, Nginx, Gunicorn, Celery Beat.

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** & **npm**
- *(Optional)* **Docker & Docker Compose**

---

### Option 1: Quick Local Development Setup

#### 1. Setup Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # On Windows: .\.venv\Scripts\activate
pip install -r requirements.txt

# Run migrations & seed realistic test data
python manage.py migrate
python manage.py seed_data

# Start backend server
python manage.py runserver 127.0.0.1:8000
```

#### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

### Option 2: Production Docker Compose Deployment

Run the entire full-stack platform with a single command:

```bash
docker compose up --build
```

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`

---

## 🔑 Default Seeded Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@turna.health` | `Admin@123` |
| **Staff Coordinator** | `staff@turna.health` | `Staff@123` |
| **Patient 1 (Alice)** | `patient1@turna.health` | `Patient@123` |
| **Patient 2 (Robert)** | `patient2@turna.health` | `Patient@123` |

---

## 🧪 Running Automated Tests

Run the complete backend test suite (including concurrency race condition tests):

```bash
cd backend
pytest
```

Build and validate the frontend production bundle:

```bash
cd frontend
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
