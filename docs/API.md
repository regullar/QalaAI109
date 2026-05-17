# API Design

All routes use Next.js App Router route handlers under `app/api`. Use standard Node runtime unless a route has a specific reason otherwise. Do not use Edge runtime for the MVP.

All responses are JSON.

## Shared Error Shape

```json
{
  "error": "Human readable message",
  "code": "OPTIONAL_MACHINE_CODE"
}
```

## POST /api/complaints/analyze

Purpose: classify and enrich raw complaint text before submission.

Request:

```json
{
  "text": "Street light is not working near school",
  "district": "Abay district",
  "addressText": "Nursat microdistrict"
}
```

Rules:
- `text` is required.
- `district` and `addressText` are optional.
- If `OPENAI_API_KEY` exists, call AI.
- If key is missing, AI fails, timeout occurs, or JSON is invalid, call fallback classifier.
- Never return markdown.
- Never crash the UI because AI is unavailable.

Response:

```json
{
  "title": "Broken street lighting near school",
  "category": "Street lighting",
  "subcategory": "Lamp outage",
  "district": "Abay district",
  "priority": "high",
  "addressText": "Nursat microdistrict",
  "riskFactors": ["Children nearby", "Dark pedestrian area"],
  "summary": "Resident reports broken street lighting near a school.",
  "responsibleService": "City lighting service",
  "appealText": "Please inspect and restore street lighting at the specified location.",
  "needsEmergencyWarning": false,
  "confidence": 0.87,
  "source": "ai"
}
```

Fallback response uses the same shape with `"source": "fallback"`.

## POST /api/complaints

Purpose: create complaint after user submits the report form.

Request:

```json
{
  "rawText": "Street light is not working near school",
  "district": "Abay district",
  "addressText": "Nursat microdistrict",
  "latitude": 42.3417,
  "longitude": 69.5901,
  "source": "Web",
  "analysis": {
    "title": "Broken street lighting near school",
    "category": "Street lighting",
    "subcategory": "Lamp outage",
    "priority": "high",
    "riskFactors": ["Children nearby"],
    "summary": "Resident reports broken street lighting.",
    "responsibleService": "City lighting service",
    "appealText": "Please inspect and restore street lighting.",
    "needsEmergencyWarning": false,
    "confidence": 0.87
  }
}
```

Implementation:
- Validate `rawText`.
- If `analysis` is missing, run analyze server-side.
- Generate `public_id`, for example `SH-109-20260514-1234`.
- Insert into `complaints`.
- Insert initial `status_logs` row with `new_status = "new"`.
- Return created complaint.

Response:

```json
{
  "complaint": {
    "id": "uuid",
    "public_id": "SH-109-20260514-1234",
    "status": "new"
  }
}
```

## GET /api/complaints

Purpose: list complaints for map, admin, and simple pages.

Query parameters:
- `district`
- `category`
- `priority`
- `status`
- `source`
- `limit`

Behavior:
- Apply only provided filters.
- Default order: `created_at desc`.
- Default limit: `100`.
- Maximum limit: `500`.

Response:

```json
{
  "complaints": []
}
```

## GET /api/complaints/[id]

Purpose: fetch one complaint by UUID or `public_id`.

Path examples:
- `/api/complaints/08bd4d7a-0000-4000-9000-000000000001`
- `/api/complaints/SH-109-20260514-1234`

Behavior:
- Try UUID `id` first when format matches UUID.
- Otherwise query by `public_id`.
- Include status logs ordered by `created_at asc`.

Response:

```json
{
  "complaint": {},
  "statusLogs": []
}
```

## PATCH /api/complaints/[id]/status

Purpose: update operator workflow status.

Request:

```json
{
  "status": "in_progress",
  "comment": "Assigned to city lighting service"
}
```

Valid statuses:
- `new`
- `checking`
- `assigned`
- `in_progress`
- `resolved`
- `rejected`

Implementation:
- Fetch current complaint.
- Validate new status.
- Update `complaints.status` and `updated_at`.
- Insert `status_logs` with old status, new status, and optional comment.
- Return updated complaint.

Response:

```json
{
  "complaint": {}
}
```

## GET /api/analytics

Purpose: provide dashboard metrics.

Query parameters:
- `from`
- `to`
- `district`

MVP behavior:
- Fetch matching complaints.
- Compute analytics in application code.
- Use `groupComplaintsIntoClusters`.

Response:

```json
{
  "total": 40,
  "newCount": 12,
  "criticalCount": 3,
  "resolvedCount": 9,
  "resolvedPercentage": 22.5,
  "clustersCount": 5,
  "mostFrequentCategory": "Street lighting",
  "mostActiveDistrict": "Abay district",
  "topCategories": [
    { "category": "Street lighting", "count": 8 }
  ],
  "topDistricts": [
    { "district": "Abay district", "count": 12 }
  ],
  "priorityDistribution": [
    { "priority": "high", "count": 10 }
  ],
  "statusDistribution": [
    { "status": "new", "count": 12 }
  ],
  "hotClusters": [
    {
      "key": "abay district|street lighting|nursat",
      "district": "Abay district",
      "category": "Street lighting",
      "addressText": "Nursat microdistrict",
      "count": 5,
      "priority": "high",
      "latestCreatedAt": "2026-05-14T10:00:00.000Z"
    }
  ]
}
```

## POST /api/seed

Purpose: insert demo data for hackathon presentation.

Protection:
- Allow in development.
- In production require `?token=` matching `SEED_TOKEN`, or disable after demo setup.

Behavior:
- Check current complaint count.
- If non-empty and `force` is not provided, return without inserting.
- Insert 35 to 40 demo complaints.
- Insert status logs for demo complaints.
- Mark every row `is_demo = true`.

Response:

```json
{
  "inserted": 40,
  "skipped": false
}
```

## Fallback Classifier Rules

Use lowercase keyword matching. First matching high-risk branch wins.

- Critical words: gas, fire, crash, manhole, exposed wire, sparks, threat, broken cable.
  - Category: Safety.
  - Priority: `critical`.
  - `needsEmergencyWarning = true`.
- Traffic words: traffic light, crossing, pedestrian.
  - Category: Traffic lights and crossings.
  - Priority: `high`.
- Lighting words: lamp, lighting, dark, not working.
  - Category: Street lighting.
  - Priority: `high` if school or children are mentioned, otherwise `medium`.
- Electricity words: power, electricity, outage, no light.
  - Category: Electricity.
  - Priority: `high`.
- Water words: water, water supply, no water.
  - Category: Water supply.
  - Priority: `high` or `medium`.
- Road words: pothole, asphalt, road, sidewalk.
  - Category: Roads and sidewalks.
  - Priority: `medium`.
- Transport words: bus, route, stop.
  - Category: Public transport.
  - Priority: `medium`.
- Trash words: trash, cleaning, container.
  - Category: Trash and sanitation.
  - Priority: `medium`.
- Otherwise:
  - Category: Other.
  - Priority: `low`.

## Route Implementation Notes

- Keep route handlers small.
- Put reusable logic in `lib/`.
- Return `Response.json(...)`.
- Use service role only server-side.
- Sanitize client-provided status, priority, and source values against constants.
- Do not leak raw AI errors to users.
- Log server errors with enough context for debugging.
