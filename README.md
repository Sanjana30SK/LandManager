# Land Parcel Manager

A web app to manage land parcels around Bengaluru on a map. Parcels can be
added, viewed, edited, deleted and searched. All data is dummy data.

## Tech stack

- Frontend: React (Vite), Leaflet with OpenStreetMap tiles (react-leaflet)
- Backend: Node.js, Express
- Database: MongoDB Atlas with Mongoose
- Validation: Zod

## Features

- Parcels shown as markers on the map and in a list
- Click the map to add a parcel; drag the pin to adjust the location
- Edit a parcel's details or move it
- Delete a parcel (with confirmation)
- Search by title
- Filter by status and land use

## Setup

Requires Node.js 20+ and a MongoDB Atlas cluster (or local MongoDB).

**Backend**

```bash
cd server
npm install
```

Create `server/.env`:

```env
MONGODB_URI=<your MongoDB connection string>
MONGODB_DB_NAME=land_parcel_manager
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

```bash
npm run seed   # loads 15 dummy parcels (clears existing ones)
npm run dev    # API at http://localhost:5000/api
```

**Frontend** (in a second terminal)

```bash
cd client
npm install
npm run dev    # app at http://localhost:5173
```

The frontend uses `http://localhost:5000/api` by default. To change it, set
`VITE_API_URL` in `client/.env`.

## API

Base URL: `/api`

| Method | Endpoint       | Description                                      |
|--------|----------------|--------------------------------------------------|
| GET    | `/parcels`     | List parcels. Optional: `search`, `status`, `landUse` |
| GET    | `/parcels/:id` | Get a parcel                                     |
| POST   | `/parcels`     | Create a parcel                                  |
| PUT    | `/parcels/:id` | Update a parcel                                  |
| DELETE | `/parcels/:id` | Delete a parcel                                  |
| GET    | `/meta`        | Allowed status and land-use values               |
| GET    | `/health`      | API and database status                          |

Request body for POST / PUT:

```json
{
  "title": "Plot 42, Whitefield",
  "description": "Corner plot near the metro",
  "ownerName": "Ravi Kumar",
  "areaSqm": 1200,
  "status": "available",
  "landUse": "residential",
  "location": { "lat": 12.9698, "lng": 77.7499 }
}
```

`title`, `landUse` and `location` are required. Errors return
`{ "error": { "message", "details": [{ "field", "message" }] } }` with status
400, 404 or 500.

More detail in [docs/api-spec.md](docs/api-spec.md).

## Data model

Collection: `parcels`

| Field         | Type            | Notes                                               |
|---------------|-----------------|-----------------------------------------------------|
| `title`       | String          | Required, 3–100 characters                          |
| `description` | String          | Optional, max 1000 characters                       |
| `ownerName`   | String          | Optional, max 100 characters                        |
| `areaSqm`     | Number          | Optional, greater than 0                            |
| `status`      | String          | `available`, `sold`, `reserved`, `under_dispute` (default `available`) |
| `landUse`     | String          | `residential`, `commercial`, `agricultural`, `industrial`, `institutional` |
| `location`    | GeoJSON Point   | Required, stored as `[lng, lat]`                    |
| `createdAt`, `updatedAt` | Date | Added automatically                              |

The API returns `location` as `{ lat, lng }`. Indexes: `2dsphere` on
`location` and `{ status, landUse }` for filtering.

More detail in [docs/data-model.md](docs/data-model.md).

## Assumptions

- A parcel is a single point, not a boundary polygon.
- Area is entered manually.
- No authentication, since it wasn't required.
- No pagination, since the dataset is small.
- Search is a case-insensitive partial match on the title.
