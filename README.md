# ENECTRON – Full-Stack Enquiry Management System

A robust, enterprise-grade, reusable full-stack enquiry management system built with **Node.js, Express, MongoDB (Mongoose), and Nodemailer**, preserving 100% of the original **ENECTRON** website design, branding, and user experience.

---

## 🏗️ Architecture Overview

```
ENECTRON/
├── frontend/                     # Pure HTML5 / CSS3 / Vanilla JS (No build step required)
│   ├── index.html                # Exact original layout, typography, components & toast
│   ├── style.css                 # Exact original styles, responsive rules & animations
│   ├── script.js                 # Form handling, phone formatting & backend API client
│   ├── config.js                 # Configurable API URL for production deployment
│   └── assets/                   # Images and branding assets
│
├── backend/                      # Production-ready Node.js & Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # MongoDB connection manager (Mongoose)
│   │   │   └── smtp.js           # Authenticated SMTP transporter setup
│   │   ├── models/
│   │   │   └── Enquiry.js        # Mongoose Enquiry schema with validation & indexes
│   │   ├── controllers/
│   │   │   └── enquiryController.js # Validation, DB persistence & email orchestration
│   │   ├── routes/
│   │   │   └── enquiryRoutes.js  # Rate-limited API routes (/api/enquiries, /api/health)
│   │   ├── services/
│   │   │   └── emailService.js   # Branded HTML email generation & dispatch
│   │   ├── middleware/
│   │   │   └── errorHandler.js   # Centralized error handler & 404 handler
│   │   └── app.js                # Express app setup (Helmet, CORS, body parsers)
│   ├── test/
│   │   └── api.test.js           # Automated test suite (native Node.js test runner)
│   ├── server.js                 # Server entry point & graceful shutdown
│   ├── package.json              # Backend dependencies and scripts
│   └── .env.example              # Documented environment variables template
│
├── .gitignore                    # Prevents credentials & node_modules leaks
├── render.yaml                   # Infrastructure-as-code Blueprint for Render
└── README.md                     # Comprehensive documentation & deployment guide
```

---

## ✨ Features

- **Website Preservation**: Preserves the exact original layout, color palette (Berry Magenta `#9a2579`, Midnight Navy `#0b214f`), typography (`Plus Jakarta Sans`), input focus rings, button gradients, and responsive mobile styling.
- **Smart Mobile Input**: Enforces exact 10 digits for default `+91 ` (India), blocking extra numbers, symbols, and non-digits at both keystroke and paste levels.
- **Top Pop-up Notification**: Displays the animated toast from the top with progress countdown bar, pause on hover, close button, and audio chime upon verified database save.
- **Database-First Reliability**: Enquiries are saved to MongoDB with validated schemas **before** email dispatch. If email delivery fails, the enquiry is never lost (`email_status = 'FAILED'`), and can be retried at any time.
- **Transactional SMTP Email**: Sends detailed branded HTML notification to the website owner, an optional monitoring copy to the site builder, and an acknowledgement email to the customer.
- **Production Security**:
  - Helmet for HTTP security headers
  - CORS allowlist checking with credentials support
  - Rate limiting (15 submissions per 15 minutes per IP)
  - Request body size limits (10kb) to prevent DoS
  - XSS sanitization and input validation
  - Zero exposed secrets (all credentials loaded via `.env`)
  - No database or server stack traces leaked in production

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18, v20, v22, or v24)
- **MongoDB** (Already running locally on port 27017, or free cloud MongoDB Atlas)
- **SMTP Account** (e.g. Gmail with App Password, Brevo, SendGrid, Outlook)

### 2. Configure Backend Environment
1. In `backend/.env`, your local MongoDB is already configured with zero password required:
   ```ini
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000,http://127.0.0.1:5500,http://localhost:5000

   # MongoDB (Zero configuration locally!)
   MONGODB_URI=mongodb://127.0.0.1:27017/enectron_db

   # SMTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_letter_app_password
   SMTP_FROM="ENECTRON Enquiries" <your_email@gmail.com>

   # Recipients
   OWNER_EMAIL=owner@yourdomain.com
   BUILDER_EMAIL=builder@yourdomain.com
   SEND_CUSTOMER_ACK=true
   ```
   ```ini
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000,http://127.0.0.1:5500,http://localhost:5000

   # MySQL
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=enectron_db
   DB_SSL=false

   # SMTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_letter_app_password
   SMTP_FROM="ENECTRON Enquiries" <your_email@gmail.com>

   # Recipients
   OWNER_EMAIL=owner@yourdomain.com
   BUILDER_EMAIL=builder@yourdomain.com
   SEND_CUSTOMER_ACK=true
   ```

### 3. Initialize MySQL Database
Run the schema in your MySQL client, or let the backend auto-create it:
```bash
mysql -u root -p < schema.sql
```
*(The backend's `initDatabase()` will automatically create the `enquiries` table if it doesn't already exist).*

### 4. Install Dependencies & Start Backend
```bash
npm install
npm start
```
You will see:
```
========================================================
🚀 Starting ENECTRON Enquiry Management Backend...
[Environment] NODE_ENV=development
========================================================
[Database] Connected successfully to MySQL
[Database] Enquiries table verified / initialized.
[SMTP] Connected successfully to smtp.gmail.com:587
✅ Server is listening on http://0.0.0.0:5000
   Health check endpoint: http://localhost:5000/api/health
   Enquiries endpoint:    POST http://localhost:5000/api/enquiries
========================================================
```

### 5. Launch Frontend
Simply open `frontend/index.html` in your browser, or serve it using VS Code Live Server / Python:
```bash
# In another terminal:
cd ../frontend
python -m http.server 3000
```
Visit `http://localhost:3000` to interact with the live form.

---

## 🧪 Running Automated Tests

The backend includes a native test suite covering validation, health checks, rate limiting, and security:
```bash
cd backend
npm test
```
Outputs:
```
✔ 1. Health Check Endpoint - GET /api/health returns health status
✔ 2. Root Info Endpoint - GET / returns system info
✔ 3. Validation - Missing Name rejected with 400
✔ 4. Validation - Missing Mobile Number rejected with 400
✔ 5. Validation - Too short mobile number rejected with 400
✔ 6. Validation - Invalid Email Address rejected with 400
✔ 7. 404 Handler - Unknown route returns 404 JSON
✔ 8. Email Service - HTML template generates correct customer details
✔ 9. Security - XSS characters are escaped in email template
✔ 10. Rate Limiting - Excessive submissions trigger 429 Too Many Requests
ℹ pass 10
ℹ fail 0
```

---

## 🗄️ MySQL Database Setup (Cloud Providers)

Render Web Services do not provide a built-in free MySQL database. You can use any of these free managed cloud MySQL providers:

| Provider | Free Tier | SSL Required (`DB_SSL`) | Connection Guide |
|---|---|---|---|
| **Aiven for MySQL** | Free cloud trial | `true` | Copy Host, Port, User, Password from Aiven dashboard |
| **TiDB Cloud** | 5 GB Serverless Free | `true` | Provides standard MySQL 8.0 connection string |
| **Clever Cloud** | Free MySQL addon | `false` or `true` | Select MySQL database from console |
| **Railway / PlanetScale** | Developer tier | `true` | Copy connection variables |

> **Note on Cloud SSL**: When connecting to managed cloud databases (such as Aiven or TiDB), set `DB_SSL=true` in your `.env`. The backend automatically sets `{ rejectUnauthorized: false }` for seamless cloud TLS connectivity.

---

## 📧 SMTP Email Setup (Compatible with Render)

Because Render Free tier can restrict certain outbound ports, use these standard configurations:

### Option A: Gmail (Recommended for testing & small volume)
1. Go to your **Google Account > Security > 2-Step Verification**.
2. At the bottom, click **App Passwords**.
3. Generate a password for "Mail" / "ENECTRON". Google gives you a 16-character code (e.g., `abcd efgh ijkl mnop`).
4. In your `.env`:
   ```ini
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   SMTP_FROM="ENECTRON Enquiries" <your_email@gmail.com>
   ```

### Option B: Brevo (Formerly Sendinblue) / SendGrid (Best for Production)
1. Create a free account at [Brevo.com](https://www.brevo.com/) or [SendGrid.com](https://sendgrid.com/).
2. Grab your SMTP credentials under **Transactional > Settings**.
3. In your `.env`:
   ```ini
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_brevo_login
   SMTP_PASS=your_brevo_smtp_key
   SMTP_FROM="ENECTRON Enquiries" <verified_sender@yourdomain.com>
   ```

---

## 🌐 Complete Deployment Guide on Render

### Step 1: Push Repository to GitHub
Ensure your repository has `frontend/`, `backend/`, and `render.yaml`:
```bash
git add .
git commit -m "Full-stack ENECTRON Enquiry Management System"
git push origin main
```

---

### Step 2: Deploy the Backend Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`Assignment_pradeep` or your repo).
4. Configure the Web Service:
   - **Name**: `enectron-backend`
   - **Region**: Choose the region closest to your database (e.g., Singapore, Frankfurt, Oregon)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Click **Advanced** > **Add Environment Variable** and enter your production variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DB_HOST`: `<Your Cloud MySQL Host>`
   - `DB_PORT`: `3306` (or cloud port)
   - `DB_USER`: `<Your DB User>`
   - `DB_PASSWORD`: `<Your DB Password>`
   - `DB_NAME`: `enectron_db`
   - `DB_SSL`: `true`
   - `SMTP_HOST`: `smtp.gmail.com` (or Brevo/SendGrid)
   - `SMTP_PORT`: `587`
   - `SMTP_SECURE`: `false`
   - `SMTP_USER`: `<Your SMTP User>`
   - `SMTP_PASS`: `<Your SMTP Password>`
   - `SMTP_FROM`: `"ENECTRON Enquiries" <your_email@gmail.com>`
   - `OWNER_EMAIL`: `owner@enectron.com`
   - `BUILDER_EMAIL`: `builder@enectron.com`
   - `SEND_CUSTOMER_ACK`: `true`
   - `FRONTEND_URL`: `https://enectron-frontend.onrender.com` *(Update this after Step 3)*
6. Click **Create Web Service**.
7. Once deployed, copy your backend URL:
   `https://enectron-backend.onrender.com`

---

### Step 3: Deploy the Frontend Static Site on Render
1. In Render Dashboard, click **New +** > **Static Site**.
2. Connect the same GitHub repository.
3. Configure the Static Site:
   - **Name**: `enectron-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: *(Leave empty)*
   - **Publish Directory**: `.`
4. Click **Create Static Site**.
5. Copy your frontend URL:
   `https://enectron-frontend.onrender.com`

---

### Step 4: Link Frontend and Backend
1. In `frontend/config.js`, set your Render backend URL:
   ```javascript
   window.ENV_API_URL = "https://enectron-backend.onrender.com";
   ```
   Commit and push to GitHub:
   ```bash
   git add frontend/config.js
   git commit -m "Set production backend API URL"
   git push origin main
   ```
2. In your Render Dashboard for `enectron-backend`, edit the `FRONTEND_URL` environment variable to match your frontend URL (`https://enectron-frontend.onrender.com`). Render will automatically restart the backend with the new CORS configuration.

---

### Alternative: 1-Click Blueprint Deployment via `render.yaml`
1. Go to **Render Dashboard** > **Blueprints**.
2. Connect this repository. Render will automatically read `render.yaml` and configure both the Web Service and Static Site!
3. Fill in your database and SMTP secret values when prompted.

---

## 📡 API Specification

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns live database connectivity, uptime, and system status.
- **Response** (`200 OK`):
  ```json
  {
    "status": "healthy",
    "service": "ENECTRON Enquiry Management API",
    "timestamp": "2026-11-16T14:00:00.000Z",
    "uptimeSeconds": 360,
    "database": {
      "connected": true
    },
    "smtp": {
      "configured": true,
      "host": "smtp.gmail.com"
    }
  }
  ```

---

### 2. Submit Enquiry
- **Endpoint**: `POST /api/enquiries`
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "name": "Alex Morgan",
    "mobile_number": "+91 98765 43210",
    "email": "alex@company.com",
    "company_name": "SolarTech Infrastructure",
    "application_use_case": "Showrooms",
    "requirement": "Requirement for high-efficiency showroom power management systems."
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Thank you! Your enquiry has been received and saved successfully.",
    "data": {
      "enquiryId": 42,
      "emailStatus": "SENT",
      "customerName": "Alex Morgan"
    }
  }
  ```
- **Validation Failure** (`400 Bad Request`):
  ```json
  {
    "success": false,
    "message": "Validation failed. Please correct the highlighted errors.",
    "errors": [
      "Please provide a valid email address.",
      "Full name must be between 2 and 150 characters."
    ]
  }
  ```

---

### 3. Retry Failed Email Dispatch
- **Endpoint**: `POST /api/enquiries/:id/retry-email`
- **Description**: Re-triggers SMTP notification for an enquiry previously saved with `email_status = 'FAILED'`.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Email retry sent successfully.",
    "status": "SENT"
  }
  ```

---

## 🔁 Reusability for Future Projects

This backend was engineered to be completely white-label and reusable:
- **Brand Name**: Configured through `SMTP_FROM`.
- **Target Company / Owner**: Configured through `OWNER_EMAIL`.
- **Auditor / Builder**: Configured through `BUILDER_EMAIL`.
- **Database & Origins**: 100% environment-driven.
- Simply clone this folder, update `.env`, and connect any company frontend!
