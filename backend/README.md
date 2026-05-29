# 🏋️ Smart Gym Coaching System — REST API

A production-ready Node.js/Express/MongoDB backend for a smart gym platform connecting **Users**, **Trainers**, and **Admins**.

---

## 🗂 Project Structure

```
src/
├── app.js                    # Express app (middleware, routes, error handler)
├── server.js                 # Entry point (DB connect, server listen)
├── config/
│   ├── db.js                 # Mongoose connection
│   ├── cloudinary.js         # Cloudinary SDK config
│   └── paymob.js             # Paymob config values
├── middlewares/
│   ├── auth.middleware.js    # JWT verification
│   ├── role.middleware.js    # Role-based access control
│   ├── error.middleware.js   # Global error handler
│   └── validate.middleware.js# Joi body validation factory
├── utils/
│   ├── ApiError.js           # Operational error class
│   ├── ApiResponse.js        # Standardised response shape
│   ├── catchAsync.js         # Async error forwarder
│   ├── generateToken.js      # JWT factory
│   ├── logger.js             # Winston logger
│   └── upload.js             # Multer + Cloudinary storage
├── integrations/
│   └── paymob.js             # Paymob 3-step flow + HMAC verifier
├── routes/
│   └── index.js              # Central route aggregator
└── modules/
    ├── auth/
    ├── user/
    ├── trainer/
    ├── exercise/
    ├── machine/
    ├── workoutPlan/
    ├── progress/
    ├── subscription/
    ├── payment/
    └── attendance/
        Each module has: model · service · controller · routes · validation
```

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Run in development
```bash
npm run dev
```

### 4. Run in production
```bash
npm start
```

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `PAYMOB_API_KEY` | Paymob API key |
| `PAYMOB_INTEGRATION_ID` | Paymob integration ID |
| `PAYMOB_IFRAME_ID` | Paymob iframe ID |
| `PAYMOB_HMAC_SECRET` | Paymob HMAC secret for webhook verification |

---

## 📡 API Reference

All routes are prefixed with `/api/v1`.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login & receive JWT |
| GET | `/auth/me` | Protected | Get current user |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users/profile` | User | Get own profile |
| PATCH | `/users/profile` | User | Update profile |
| PATCH | `/users/avatar` | User | Upload avatar |
| PATCH | `/users/change-password` | User | Change password |
| POST | `/users/favorites/:exerciseId` | User | Add favourite exercise |
| DELETE | `/users/favorites/:exerciseId` | User | Remove favourite exercise |
| GET | `/users` | Admin | List all users |
| PATCH | `/users/:id/deactivate` | Admin | Deactivate user |

### Trainers
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/trainers` | Public | List all trainers |
| GET | `/trainers/:id` | Public | Get trainer by ID |
| POST | `/trainers` | Admin/Trainer | Create trainer profile |
| PATCH | `/trainers/:id` | Admin/Trainer | Update trainer |
| PATCH | `/trainers/:id/assign/:userId` | Admin/Trainer | Assign user to trainer |
| DELETE | `/trainers/:id` | Admin | Delete trainer |

### Exercises
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/exercises` | Public | List exercises (filterable by `muscle`, `level`, `category`, `search`) |
| GET | `/exercises/:id` | Public | Get exercise details |
| POST | `/exercises` | Admin/Trainer | Create exercise (multipart: `video`, `image`) |
| PATCH | `/exercises/:id` | Admin/Trainer | Update exercise |
| DELETE | `/exercises/:id` | Admin | Delete exercise |

### Machines
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/machines` | Public | List machines |
| GET | `/machines/:id` | Public | Get machine |
| POST | `/machines` | Admin | Create machine |
| PATCH | `/machines/:id` | Admin | Update machine |
| DELETE | `/machines/:id` | Admin | Delete machine |

### Workout Plans
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/workout-plans/generate` | User | Auto-generate plan by goal & level |
| GET | `/workout-plans` | User | Get my plans |
| GET | `/workout-plans/:id` | User | Get plan by ID |
| PATCH | `/workout-plans/:id` | User | Update plan |
| DELETE | `/workout-plans/:id` | User | Delete plan |

### Progress
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/progress` | User | Log a workout session |
| GET | `/progress` | User | Get my progress logs |
| GET | `/progress/stats` | User | Get aggregated statistics |
| DELETE | `/progress/:id` | User | Delete a log |

### Subscriptions
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/subscriptions` | User | Create a subscription (pending payment) |
| GET | `/subscriptions/my` | User | Get my active subscription |
| PATCH | `/subscriptions/:id/cancel` | User | Cancel subscription |
| GET | `/subscriptions` | Admin | List all subscriptions |

### Payments (Paymob)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payments/initiate` | User | Initiate payment → returns iframe URL |
| GET | `/payments/my` | User | My payment history |
| GET | `/payments` | Admin | All payments |
| POST | `/payments/webhook` | Public (HMAC) | Paymob webhook callback |

### Attendance
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/attendance/check-in` | User | Check in |
| PATCH | `/attendance/check-out` | User | Check out |
| GET | `/attendance/my` | User | My attendance logs |
| GET | `/attendance/stats` | User | My 30-day stats |
| GET | `/attendance` | Admin | All attendance logs |

---

## 💳 Payment Flow

```
1. User creates a Subscription  →  POST /subscriptions
2. User initiates payment       →  POST /payments/initiate  { subscriptionId }
   ← Returns { iframeUrl, paymentId }
3. Frontend renders the iframe URL from Paymob
4. User pays
5. Paymob calls webhook         →  POST /payments/webhook?hmac=<value>
   ← Server verifies HMAC, marks payment success, activates subscription
```

---

## ☁️ File Uploads (Cloudinary)

All uploads go through `multer-storage-cloudinary`. Supported fields:

| Route | Field | Type |
|---|---|---|
| `PATCH /users/avatar` | `avatar` | image |
| `POST/PATCH /exercises` | `video` | video |
| `POST/PATCH /exercises` | `image` | image |
| `POST/PATCH /machines` | `image` | image |

---

## 🏗 Architecture Principles

- **Feature-based modules** — each domain is self-contained
- **Service layer** — all business logic lives in `*.service.js`
- **Controllers** — thin; only call services and send responses
- **Joi validation** — all request bodies are validated before reaching controllers
- **Global error handler** — normalises Mongoose, JWT, and operational errors
- **Winston logging** — structured logs to console + files
- **Graceful shutdown** — handles SIGTERM/SIGINT cleanly
