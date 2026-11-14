# REST API Specification

Base URL (local): `http://localhost:5000/api`
All requests and responses use JSON.

## Parcel shape returned by the API

The database stores `location` as GeoJSON (`[lng, lat]`). The API converts it to
a plain object so clients never deal with the longitude-first order:

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

## Endpoints

| Method | Path                 | Purpose                    | Success          |
|--------|----------------------|----------------------------|------------------|
| GET    | `/health`            | Check the API and database are up (`503` if the DB is disconnected) | `200 OK` |
| GET    | `/meta`              | Allowed `statuses`, `landUses`, `defaultStatus` and text `limits` (for the frontend form) | `200 OK` |
| GET    | `/parcels`           | List parcels (with search/filters) | `200 OK` |
| GET    | `/parcels/:id`       | Get one parcel             | `200 OK`         |
| POST   | `/parcels`           | Create a parcel            | `201 Created`    |
| PUT    | `/parcels/:id`       | Update a parcel            | `200 OK`         |
| DELETE | `/parcels/:id`       | Delete a parcel            | `204 No Content` |

### GET /parcels

Query parameters (all optional, can be combined):

| Param     | Example        | Effect                                        |
|-----------|----------------|-----------------------------------------------|
| `search`  | `?search=whit` | Case-insensitive partial match on `title`     |
| `status`  | `?status=sold` | Only parcels with this status (bonus)         |
| `landUse` | `?landUse=commercial` | Only parcels with this land use (bonus) |

Response `200`:
```json
{ "count": 2, "total": 15, "data": [ { "id": "...", "title": "..." }, { "id": "...", "title": "..." } ] }
```
`count` is the number of parcels returned (after search/filters); `total` is the
number of parcels in the database, so a client can show "2 of 15".
Newest parcels come first. An unknown `status`/`landUse` value returns `400`.

### GET /parcels/:id

`200` with `{ "data": <parcel> }`, `400` if the id is not a valid ObjectId,
`404` if no parcel has that id.

### POST /parcels

Request body:
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
`201` with `{ "data": <created parcel> }` and a `Location: /api/parcels/<id>`
header, or `400` with validation errors. Only `title`, `landUse` and `location`
are required; the rest default to `""`, `null` or `"available"`.

### PUT /parcels/:id

Same body as POST. The form always sends every field, so PUT replaces the
editable fields as a whole (this is also how the location gets moved).
`200` with `{ "data": <updated parcel> }`, `400` for bad input or bad id,
`404` if the parcel doesn't exist.

### DELETE /parcels/:id

`204` with an empty body, `400` for a bad id, `404` if the parcel doesn't exist.

## Validation rules (enforced on the server)

| Field          | Rule                                                        |
|----------------|-------------------------------------------------------------|
| `title`        | Required string, trimmed, 3–100 characters                  |
| `description`  | Optional string, max 1000 characters                        |
| `ownerName`    | Optional string, max 100 characters                         |
| `areaSqm`      | Optional number, must be greater than 0                     |
| `status`       | Optional, one of the allowed statuses (default `available`) |
| `landUse`      | Required, one of the allowed land uses                      |
| `location.lat` | Required number between -90 and 90                          |
| `location.lng` | Required number between -180 and 180                        |
| unknown fields | Ignored (stripped), so clients can't set `_id`, `createdAt` etc. |

Validation happens in two layers: a **Zod** schema checks the request before it
reaches the database, and the **Mongoose** schema acts as a safety net.

## Error format

Every error uses the same shape, so the frontend can handle them in one place:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      { "field": "title", "message": "Title must be at least 3 characters" },
      { "field": "location.lat", "message": "Latitude must be between -90 and 90" }
    ]
  }
}
```

| Status | When                                                        |
|--------|-------------------------------------------------------------|
| `400`  | Invalid body, invalid query value, malformed JSON, bad id   |
| `404`  | Parcel not found, or unknown route                          |
| `413`  | Request body larger than 100 KB                             |
| `503`  | `/health` only: the database is not connected               |
| `500`  | Unexpected server/database error (details are logged, not sent) |
