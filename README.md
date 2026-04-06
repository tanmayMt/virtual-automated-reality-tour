# Real Estate 360° Virtual Tour — MVP

Full-stack MVP for equirectangular 360° property tours: **Express + MongoDB + Cloudinary** API, **React (Vite) + Tailwind + Pannellum** seller dashboard and public buyer viewer.

---

## Repository structure

```text
virtual-automated-reality-tour/
├── backend/                    # Node.js API
│   ├── config/
│   │   ├── cloudinary.js       # Cloudinary client + Multer (memory) for uploads
│   │   └── db.js               # Mongoose connection
│   ├── controllers/            # Route handlers (listings, rooms, tour, auth, users)
│   ├── middleware/             # asyncHandler, errorHandler, JWT auth, roles
│   ├── models/                 # Listing, Room (embedded hotspots), User
│   ├── routes/                 # Mounted under /api
│   ├── scripts/
│   │   └── provisionStaff.js   # CLI: create admin/manager users (not via public register)
│   ├── utils/                  # AppError, JWT signToken, role helpers
│   ├── app.js                  # Express app (CORS, JSON, routes, errors)
│   ├── server.js               # dotenv, connect DB, listen
│   ├── package.json
│   └── .env.example
├── frontend/                   # React (Vite) SPA
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js       # Axios instance, Bearer token, FormData-safe headers
│   │   ├── components/
│   │   │   ├── HotspotEditor.jsx
│   │   │   ├── PanoramaCanvas.jsx
│   │   │   └── RoomSelectorBar.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SellerDashboard.jsx
│   │   │   ├── CreateListing.jsx
│   │   │   ├── HotspotEditorPage.jsx
│   │   │   └── TourViewer.jsx
│   │   ├── utils/
│   │   │   ├── cloudinaryThumb.js
│   │   │   └── preloadPanoramaImages.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js          # Dev proxy: /api → backend :5000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── .npmrc                  # legacy-peer-deps (pannellum-react + React 18)
│   └── .env.example
├── Document/                   # Optional project docs (if present)
├── Prompt/                     # Prompt notes (if present)
└── README.md                   # This file
```

---

## Environment variables

### Backend (`backend/.env`)

Copy from `backend/.env.example` and fill in real values.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default **5000**). |
| `MONGODB_URI` | **Yes** | MongoDB connection string (local or Atlas). |
| `CLOUDINARY_CLOUD_NAME` | **Yes** for uploads | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | **Yes** for uploads | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | **Yes** for uploads | Cloudinary API secret. |
| `JWT_SECRET` | **Yes** | Secret for signing JWTs (**≥ 16 characters** in production). |
| `JWT_EXPIRES_IN` | No | Token lifetime (default **7d**). |

### Frontend (`frontend/.env`)

Copy from `frontend/.env.example` if you need overrides.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API base URL including `/api`. Default in dev: use Vite proxy and **`/api`** (see `vite.config.js`). For a deployed API, set e.g. `https://your-api.example.com/api`. |

**Ports (local defaults)**

| Service | Port |
|---------|------|
| Backend (`PORT`) | **5000** |
| Frontend (Vite) | **5173** (see `frontend/vite.config.js`) |

---

## Prerequisites

- **Node.js** 18+  
- **MongoDB** running locally or **MongoDB Atlas** URI  
- **Cloudinary** account (for 360° image uploads)  
- **npm** (or compatible client)

---

## Install

From the repository root, install both apps:

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

The frontend uses `legacy-peer-deps` (see `frontend/.npmrc`) because `pannellum-react` declares a React 16 peer range.

---

## Run the backend

1. Create `backend/.env` (see table above).  
2. Start MongoDB (if self-hosted).  
3. Start the server:

```bash
cd backend
npm run dev
```

You should see: `Server listening on http://localhost:5000`.

**Smoke test:** open `http://localhost:5000/health` — expect JSON `{ "success": true, "message": "ok" }`.

**Staff users (admin / manager):** public registration only allows `seller` / `buyer`. Create staff with:

```bash
cd backend
npm run provision-staff -- admin you@example.com YourPassword "Your Name"
```

---

## Run the frontend

1. Optional: create `frontend/.env` with `VITE_API_URL=/api` (or leave unset; default axios base is `/api`).  
2. With the **backend running on port 5000**, start Vite (proxy forwards `/api`):

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**.

---

## Test the full MVP locally

### 1. Seller account

- `POST http://localhost:5000/api/auth/register` with JSON:

  `{ "name": "Seller", "email": "seller@test.com", "password": "password12", "role": "seller" }`

  Or use the UI: open **http://localhost:5173/register** to create a seller or buyer account, then sign in at `/login`.

### 2. Seller dashboard

- After sign-in you land on **`/seller/dashboard`**, which loads **`GET /api/listings`** (your listings as a seller; staff see all).

### 3. Create a listing

- Click **Create new tour** (or **New tour** in the header) → **`/seller/create`** — enter title, address, price → continue to **Rooms**.

### 4. Add a room (360° image)

- Choose a **JPEG / PNG / WebP** equirectangular panorama.  
- **Upload & create room** (uploads to Cloudinary, then creates the room).

### 5. Hotspots

- **Edit hotspots** on a room → **click** the panorama (mouse up after click) → a **modal** opens with captured yaw/pitch → choose **Navigation** (target room) or **Feature** (description) → **Save hotspot**. Saved hotspots appear on the viewer immediately.

### 6. Public buyer tour

- Open: `http://localhost:5173/tour/<LISTING_ID>`  
  (`LISTING_ID` is the MongoDB id returned when the listing was created.)

You should see: full-screen panorama, **navigation arrows** between linked rooms, **feature** tooltips, **bottom room bar**, and **preloaded** panoramas for navigation targets for faster scene changes.

### 7. API quick reference

Most seller actions require `Authorization: Bearer <token>`. Register, login, and public tour do not.

| Action | Method | Path |
|--------|--------|------|
| Register | POST | `/api/auth/register` |
| Login | POST | `/api/auth/login` |
| List listings | GET | `/api/listings` |
| Create listing | POST | `/api/listings` |
| Get listing | GET | `/api/listings/:id` |
| Upload 360 image | POST | `/api/rooms/upload` (multipart field **`image`**) |
| Create room | POST | `/api/rooms` |
| Update hotspots | PUT | `/api/rooms/:id/hotspots` |
| Public tour payload | GET | `/api/tour/:listingId` |

---

## Production notes

- Set strong **`JWT_SECRET`**, restrict CORS if needed, and serve the frontend build (`npm run build` in `frontend/`) behind your CDN or static host.  
- Point **`VITE_API_URL`** at your public API when building the frontend for production.  
- Rotate any credentials that were ever committed or shared.

---

## License

Use and modify per your project policy.
