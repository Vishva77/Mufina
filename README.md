# Mufina's Artistry - Secure Owner Dashboard with JWT & Netlify Support

A complete, modern, and elegant Henna & Makeup Artist web application with **JWT Authentication**, **Brute-Force Rate Limiting**, **Helmet Security Headers**, **Cloudinary Image Storage**, **MongoDB Atlas**, and **1-Level Backup/Revert System** built for **Mufina's Artistry**.

---

## 🔒 Owner Portal Security Features

The Owner/Admin Portal is protected by multiple enterprise-grade security layers:

1. **JWT (JSON Web Token) Security Tokens**:
   - Owner authentication generates a signed JWT token on successful login (`POST /api/owner/login`).
   - All mutating API calls (`POST`, `PUT`, `DELETE`, `REVERT`) require a valid `Authorization: Bearer <token>` HTTP header.
   - Tokens expire automatically after 24 hours.

2. **Backend Security Middleware (`authMiddleware.js`)**:
   - Intercepts all REST API mutations (`/api/gallery`, `/api/services`, `/api/pricing`).
   - Rejects unauthenticated requests with `401 Unauthorized` / `403 Forbidden` status codes.

3. **Brute-Force Protection (`express-rate-limit`)**:
   - Restricts login attempts to **max 5 failed attempts per 15 minutes** per IP address to block password guessing attacks.

4. **Helmet Security Headers (`helmet`)**:
   - Sets secure HTTP response headers to protect against XSS, clickjacking, and MIME-sniffing attacks.

5. **Automatic Inactivity Session Expiration**:
   - Owner session automatically logs out after **30 minutes of inactivity** (mouse/keyboard idle) and clears authentication tokens.

6. **Password Security**:
   - Supports `bcryptjs` hashed passwords for secure authentication without storing plain text passwords.

---

## 🔑 Owner Access & Credentials

- **Owner Login Trigger**: Located at the **very bottom of the website** in the footer (`🔑 Owner Portal Login`).
- **User ID**: `mufina`
- **Password**: `Mufina@123`

---

## 🚀 1-Click Netlify Deployment Instructions

Add the following 5 Environment Variables in your Netlify site settings (**Site settings** → **Environment variables**):

| Key | Value |
| :--- | :--- |
| `MONGO_URI` | `mongodb+srv://vikkivishva77_db_user:Vish%40123@webapp.pgdgv0r.mongodb.net/mufina_artistry?retryWrites=true&w=majority&appName=webapp` |
| `CLOUDINARY_CLOUD_NAME` | `mufina` |
| `CLOUDINARY_API_KEY` | `116367496164882` |
| `CLOUDINARY_API_SECRET` | `1TqfhxCkqrZWlTE0Ot3DwE0uD98` |
| `JWT_SECRET` | `mufina_artistry_owner_secure_jwt_secret_key_2026_x89a` |

---

## 🛠️ Local Testing

To run locally:
```bash
npm start
```
Access app on **`http://localhost:8080`**.

© 2026 Mufina's Artistry. All Rights Reserved.
