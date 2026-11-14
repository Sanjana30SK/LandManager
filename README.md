# Land Parcel Manager

A map-based web app to **add, view, edit and delete land parcels** around
Bengaluru. Each parcel is a point on an OpenStreetMap map with details attached
(title, owner, area, status, land use). All data is dummy data.

**Features**

- View all parcels as markers on the map and in a side list
- Add a parcel by clicking the map (drag the pin to fine-tune the location)
- Edit a parcel's details and move its location
- Delete a parcel (with confirmation)
- Search parcels by title
- Filter by status and land use (bonus)

## Contents

1. [Tech stack](#tech-stack)
2. [Setup](#setup)
3. [Data model](#data-model)
4. [API endpoints](#api-endpoints)
5. [Assumptions](#assumptions)
6. [Using the app](#using-the-app)
7. [Project structure](#project-structure)
8. [Troubleshooting](#troubleshooting)

## Tech stack

| Layer      | Choice                                            |
|------------|---------------------------------------------------|
| Frontend   | React 19 (Vite)                                   |
| Map        | Leaflet + OpenStreetMap tiles (react-leaflet)     |
| Backend    | Node.js + Express 5                               |
| Database   | MongoDB Atlas (Mongoose ODM)                      |
| Validation | Zod (request validation) + Mongoose schema        |

## Setup

### Prerequisites

- Node.js 20 or newer
- A MongoDB database: a free [MongoDB Atlas](https://www.mongodb.com/atlas)
  cluster (used here) or a local MongoDB

### 1. Database (MongoDB Atlas)

1. Create a free cluster in Atlas.
2. **Database Access**: add a database user with a username and password.
3. **Network Access**: add your current IP address (or `0.0.0.0/0` for development only).
4. **Connect → Drivers**: copy the connection string.

### 2. Backend

```bash
cd server
npm install
```

Create a file named `.env` inside the `server` folder with these values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/?retryWrites=true&w=majority
MONGODB_DB_NAME=land_parcel_manager
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

| Variable          | Example                                   | Meaning                          |
|-------------------|-------------------------------------------|----------------------------------|
| `MONGODB_URI`     | `mongodb+srv://user:password@cluster.../` | Your Atlas connection string (no `< >` around the password) |
| `MONGODB_DB_NAME` | `land_parcel_manager`                     | Database name                    |
| `PORT`            | `5000`                                    | Port the API listens on          |
| `CLIENT_ORIGIN`   | `http://localhost:5173`                   | Frontend address allowed by CORS |

Load the dummy data and start the API:

```bash
npm run seed              # creates indexes and inserts 15 dummy parcels
npm run dev               # starts the API and restarts it on file changes
```

> `npm run seed` deletes all existing parcels before inserting the dummy data.

The API runs at `http://localhost:5000/api`. Check it by opening
`http://localhost:5000/api/health` in a browser.

| Script          | What it does                                  |
|-----------------|-----------------------------------------------|
| `npm run dev`   | Start the API with nodemon (restarts on save) |
| `npm start`     | Start the API                                 |
| `npm run seed`  | Reset the database to the 15 dummy parcels    |

### 3. Frontend

Open a **second** terminal (keep the API running in the first one):

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. The app expects the API at
`http://localhost:5000/api`; to use a different address, create `client/.env`
with `VITE_API_URL=<your API URL>`.

| Script            | What it does                              |
|-------------------|-------------------------------------------|
| `npm run dev`     | Start the app with hot reload (port 5173) |
| `npm run build`   | Production build into `client/dist`       |
| `npm run preview` | Serve the production build locally        |

## Data model

One MongoDB collection, `parcels` (Mongoose model `Parcel`).

| Field         | Type              | Required | Rules / default                                         |
|---------------|-------------------|----------|---------------------------------------------------------|
| `_id`         | ObjectId          | auto     | Created by MongoDB. Returned to clients as `id`.        |
| `title`       | String            | yes      | Trimmed, 3–100 characters. Used for search.             |
| `description` | String            | no       | Up to 1000 characters. Default `""`.                    |
| `ownerName`   | String            | no       | Up to 100 characters.                                   |
| `areaSqm`     | Number            | no       | Greater than 0. Area in square metres.                  |
| `status`      | String (enum)     | yes      | `available` \| `sold` \| `reserved` \| `under_dispute`. Default `available`. |
| `landUse`     | String (enum)     | yes      | `residential` \| `commercial` \| `agricultural` \| `industrial` \| `institutional` |
| `location`    | GeoJSON `Point`   | yes      | `{ type: "Point", coordinates: [lng, lat] }`            |
| `boundary`    | GeoJSON `Polygon` | no       | Reserved for a future parcel outline. Not used by the app yet. |
| `createdAt`   | Date              | auto     | Mongoose `timestamps`                                   |
| `updatedAt`   | Date              | auto     | Mongoose `timestamps`                                   |

Example document as stored in MongoDB:

```json
{
  "_id": "6735a1f2c9e77b0012ab34cd",
  "title": "Plot 42, Whitefield",
  "description": "Corner plot near the metro station",
  "ownerName": "Ravi Kumar",
  "areaSqm": 1200,
  "status": "available",
  "landUse": "residential",
  "location": { "type": "Point", "coordinates": [77.7499, 12.9698] },
  "createdAt": "2026-11-13T10:00:00.000Z",
  "updatedAt": "2026-11-13T10:00:00.000Z"
}
```

**Indexes**

| Index                       | Why                                                   |
|-----------------------------|-------------------------------------------------------|
| `location: "2dsphere"`      | Stores the point as geography, enabling geo queries   |
| `{ status: 1, landUse: 1 }` | Speeds up the status / land-use filters               |
| `{ createdAt: -1 }`         | Lists the newest parcels first                        |

**Design decisions**

- **GeoJSON for the location.** It's the format MongoDB's geo features use.
  GeoJSON stores longitude first (`[lng, lat]`) while Leaflet uses `[lat, lng]`,
  so the API converts the point to `{ lat, lng }` in one place (the model's
  `toJSON`), and the frontend never sees the GeoJSON order.
- **One source for allowed values.** Statuses, land uses and length limits live
  in `server/src/constants/parcel.js`. The schema, the validator, the seed script
  and the `/api/meta` endpoint (which feeds the form dropdowns) all read from it.

More detail: [docs/data-model.md](docs/data-model.md).

## API endpoints

Base URL: `http://localhost:5000/api`. All requests and responses are JSON.

| Method | Path            | Purpose                                         | Success          |
|--------|-----------------|-------------------------------------------------|------------------|
| GET    | `/parcels`      | List parcels; optional `search`, `status`, `landUse` | `200 OK`    |
| GET    | `/parcels/:id`  | Get one parcel                                  | `200 OK`         |
| POST   | `/parcels`      | Create a parcel                                 | `201 Created`    |
| PUT    | `/parcels/:id`  | Update a parcel                                 | `200 OK`         |
| DELETE | `/parcels/:id`  | Delete a parcel                                 | `204 No Content` |
| GET    | `/meta`         | Allowed statuses, land uses and field limits    | `200 OK`         |
| GET    | `/health`       | API and database status (`503` if the DB is down) | `200 OK`       |

### Parcel as returned by the API

```json
{
  "id": "6735a1f2c9e77b0012ab34cd",
  "title": "Plot 42, Whitefield",
  "description": "Corner plot near the metro station",
  "ownerName": "Ravi Kumar",
  "areaSqm": 1200,
  "status": "available",
  "landUse": "residential",
  "location": { "lat": 12.9698, "lng": 77.7499 },
  "boundary": null,
  "createdAt": "2026-11-13T10:00:00.000Z",
  "updatedAt": "2026-11-13T10:00:00.000Z"
}
```

### List and search: `GET /parcels`

```
GET /api/parcels?search=whit&status=available&landUse=residential
```

All query parameters are optional and can be combined. `search` is a
case-insensitive partial match on the title.

```json
{ "count": 1, "total": 15, "data": [ { "id": "...", "title": "Plot 42, Whitefield" } ] }
```

`count` is the number of matching parcels; `total` is the number of parcels in
the database (the app shows "1 of 15"). The newest parcels come first.

### Create: `POST /parcels` (PUT uses the same body)

```json
{
  "title": "Plot 42, Whitefield",
  "description": "Corner plot near the metro station",
  "ownerName": "Ravi Kumar",
  "areaSqm": 1200,
  "status": "available",
  "landUse": "residential",
  "location": { "lat": 12.9698, "lng": 77.7499 }
}
```

Only `title`, `landUse` and `location` are required. The response is
`{ "data": <parcel> }`, plus a `Location` header on create.

### Errors

Every error has the same shape:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [{ "field": "title", "message": "Title must be at least 3 characters" }]
  }
}
```

| Status | When                                                      |
|--------|-----------------------------------------------------------|
| `400`  | Invalid body or query value, malformed JSON, invalid id   |
| `404`  | Parcel not found, or unknown route                        |
| `413`  | Request body larger than 100 KB                           |
| `500`  | Unexpected server error (details are logged, not sent)    |

Full request/response examples and validation rules:
[docs/api-spec.md](docs/api-spec.md).

## Assumptions

1. A parcel is a single **point** on the map, not a drawn boundary.
2. `areaSqm` is entered by hand; it isn't calculated from the map.
3. Status values are `available`, `sold`, `reserved` and `under_dispute`.
   Land-use values are `residential`, `commercial`, `agricultural`,
   `industrial` and `institutional`.
4. No login or user accounts, since the assignment doesn't ask for them.
5. No pagination, because the dataset is small dummy data.
6. Search is a case-insensitive partial match on the title only.
7. All data (names, owners, areas) is dummy data.
8. A parcel can be placed at any valid latitude/longitude; the map just starts
   centred on Bengaluru.
9. The form checks input in the browser for instant feedback, but the server
   always validates again, and its messages appear under each field.
10. Search and filters run on the server, so they would keep working with many
    more parcels. Search waits 300 ms after the last key press before asking the
    server.
11. If a parcel you just saved doesn't match the active search or filters, the
    filters are cleared so the parcel stays visible (a notification says so).

## Using the app

- **View**: every parcel is a marker; click one for its details. Click an item
  in the list to fly the map to it.
- **Add**: click an empty spot on the map. A form opens with the location filled
  in and a red pin on the map. Click elsewhere or drag the pin to adjust it,
  fill in the details and press **Save parcel**. **Esc** or **Cancel** discards it.
- **Edit**: open a parcel's popup and press **Edit**. The marker becomes the red
  pin, so you can drag it to move the parcel. Press **Save changes**.
- **Delete**: open a parcel's popup, press **Delete** and confirm.
- **Search**: type in the box above the list (press **/** to jump there).
  **Esc** or **×** clears it.
- **Filter**: pick a status and/or land use. The list and map show only matching
  parcels and the map zooms to them. **Clear search and filters** resets everything.
- **Reset view**: the house button under the zoom buttons returns to Bengaluru.

## Project structure

```
land-parcel-manager/
├── client/                 React + Vite frontend
│   └── src/
│       ├── api/            fetch wrapper + parcel API calls
│       ├── hooks/          useParcels, useMeta, useToasts, useDebouncedValue
│       ├── components/     ParcelMap, DraftMarker, ParcelForm, ParcelList, FilterBar,
│       │                   ParcelDetails, StatusBadge, ConfirmDialog, Toasts
│       └── utils/          formatting, form + filter helpers, Leaflet icon setup
├── server/                 Express REST API
│   ├── scripts/            seed script and dummy data
│   └── src/
│       ├── config/         environment variables and DB connection
│       ├── constants/      allowed status / land-use values and limits
│       ├── models/         Mongoose schema
│       ├── validators/     Zod request schemas
│       ├── controllers/    request handlers
│       ├── routes/         URL → controller mapping
│       ├── middleware/     validation, 404 and error handlers
│       └── utils/          small helpers (location conversion, ApiError)
└── docs/
    ├── data-model.md       parcel schema, indexes, design decisions
    └── api-spec.md         endpoints, examples, validation, errors
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API prints *Could not reach the cluster*, or `/api/health` says `disconnected` | Your IP address changed. In Atlas → **Network Access**, add your current IP, then restart the API |
| API prints *Wrong username or password* | Reset the database user's password in Atlas → **Database Access** and update `server/.env` |
| The app says *Cannot reach the server* | Start the API: `cd server` → `npm run dev` |
| `npm run dev` in `client` fails with *Port 5173 is in use* | Another copy of the app is already running; close it or use that one |
