# PeptideDosage API — Full Reference

**Base URL:** `https://api.peptidedosages.com/api`
**Protocol:** HTTPS only
**Auth:** Bearer JWT (include `Authorization: Bearer <token>` header)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Peptides](#peptides)
4. [Schedules](#schedules)
5. [Calendar & PDF](#calendar--pdf)
6. [Community](#community)
7. [Videos](#videos)
8. [Error Format](#error-format)
9. [Schedule Engine Logic](#schedule-engine-logic)
10. [Data Models](#data-models)

---

## Authentication

All auth endpoints are public (no token required).

### Register
```
POST /auth/register
```
**Body:**
```json
{
  "email":     "user@example.com",
  "password":  "min8chars",
  "firstName": "John",
  "lastName":  "Doe"
}
```
**Response `201`:**
```json
{
  "success": true,
  "token":   "eyJ...",
  "user":    { "id": "uuid", "email": "...", "firstName": "John", "role": "user" }
}
```

---

### Login
```
POST /auth/login
```
**Body:** `{ "email", "password" }`
**Response `200`:** Same shape as register.

---

### Forgot Password
```
POST /auth/forgot-password
```
**Body:** `{ "email": "user@example.com" }`
**Response `200`:** Always returns success (prevents email enumeration).

---

### Reset Password
```
POST /auth/reset-password
```
**Body:** `{ "token": "...", "password": "newpass123" }`

---

### Verify Email
```
GET /auth/verify-email/:token
```

---

## Users

> Requires authentication.

### Get My Profile
```
GET /users/me
```

### Update Profile
```
PATCH /users/me
```
**Body (all optional):** `{ "firstName", "lastName", "avatarUrl" }`

### Change Password
```
PATCH /users/me/password
```
**Body:** `{ "currentPassword", "newPassword" }`

### Deactivate Account
```
DELETE /users/me
```

---

## Peptides

> Public endpoints. Optional auth for personalization.

### List / Search Peptides
```
GET /peptides
```
**Query params:**
| Param      | Type   | Description                                      |
|------------|--------|--------------------------------------------------|
| `search`   | string | Fuzzy name search (case-insensitive)             |
| `type`     | enum   | `single` or `blend`                              |
| `category` | string | Health concern category e.g. `weight loss`       |
| `limit`    | int    | Results per page (default 20, max 100)           |
| `offset`   | int    | Pagination offset (default 0)                    |

**Response `200`:**
```json
{
  "success": true,
  "total":   93,
  "limit":   20,
  "offset":  0,
  "data": [
    {
      "id":                    "uuid",
      "name":                  "BPC-157",
      "mgAmount":              "10MG",
      "protocolTitle":         "BPC-157 (10 mg Vial) Dosage Protocol",
      "type":                  "single",
      "reconstitutionMl":      3.0,
      "reconstitutionRaw":     "3.0 mL BAC water",
      "sideEffects":           ["Mild injection site redness"],
      "benefits":              ["Tissue repair", "Gut healing"],
      "injectionFrequencyRaw": "Inject once daily",
      "cycleDurationRaw":      "8–12 weeks; optional extension to 16 weeks",
      "healthCategories":      ["recovery", "gut health"],
      "isActive":              true
    }
  ]
}
```

---

### Get Health Categories
```
GET /peptides/categories
```
Returns all unique health category strings across all peptides.

**Response `200`:**
```json
{ "success": true, "categories": ["cognitive", "hormones", "recovery", "weight loss"] }
```

---

### Get Peptide Detail
```
GET /peptides/:id
```
Returns full peptide data including `howItWorks`, `preparationNotes`,
and grouped dosing schedule variants with escalation steps.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id":               "uuid",
    "name":             "BPC-157",
    "howItWorks":       "BPC-157 is a gastric pentadecapeptide...",
    "preparationNotes": "• Use aseptic technique...",
    "scheduleVariants": [
      {
        "name": "Standard / Gradual Approach (3 mL = ~3.33 mg/mL)",
        "steps": [
          { "stepOrder": 1, "weekRangeLabel": "Weeks 1–2", "weekStart": 1, "weekEnd": 2, "unitsPerInjection": 6, "dailyDoseLabel": "200 mcg (0.2 mg)" },
          { "stepOrder": 2, "weekRangeLabel": "Weeks 3–4", "weekStart": 3, "weekEnd": 4, "unitsPerInjection": 12, "dailyDoseLabel": "400 mcg (0.4 mg)" },
          { "stepOrder": 3, "weekRangeLabel": "Weeks 5–8+", "weekStart": 5, "weekEnd": null, "unitsPerInjection": 18, "dailyDoseLabel": "600 mcg (0.6 mg)" }
        ]
      }
    ]
  }
}
```

---

### Search by Name
```
GET /peptides/by-name/:name
```
Returns up to 20 peptides whose name contains `:name` (case-insensitive).

---

## Schedules

> All schedule endpoints require authentication.

### Create a Schedule
```
POST /schedules
```
**Body:**
```json
{
  "name":          "My Recovery Stack",
  "startDate":     "2026-03-17",
  "durationWeeks": 12,
  "notes":         "Optional personal notes"
}
```
**Response `201`:** The created schedule object.

---

### List My Schedules
```
GET /schedules
```

---

### Get Schedule Detail
```
GET /schedules/:id
```
Returns the schedule with all items and their peptide + dosing step data.

---

### Update Schedule
```
PATCH /schedules/:id
```
**Body (all optional):** `{ "name", "startDate", "durationWeeks", "notes" }`
Updates `isGenerated = false` — you must regenerate after editing.

---

### Delete Schedule
```
DELETE /schedules/:id
```

---

### Add Peptide to Schedule
```
POST /schedules/:id/items
```
**Body:**
```json
{
  "peptideId":            "uuid-of-peptide",
  "position":             1,
  "selectedScheduleName": "Standard / Gradual Approach (3 mL = ~3.33 mg/mL)",

  // ── Override fields (all optional) ──
  "isOverridden":         false,
  "overrideConfirmed":    false,
  "overrideTimeOfDay":    "AM",
  "overrideDaysOfWeek":   ["MON", "THU"],
  "overrideDoseUnits":    10,
  "overrideFrequency":    "TWICE_WEEKLY",
  "overrideRestWeeks":    4
}
```

> **⚠ Override Rule:**
> If `isOverridden: true`, you **must** include `overrideConfirmed: true`.
> This confirms the user acknowledges that the escalation dosing table is disabled
> and their custom dose will be used permanently.

---

### Update a Schedule Item
```
PATCH /schedules/:id/items/:itemId
```
Same body as add. Requires `overrideConfirmed: true` when setting `isOverridden: true`.

---

### Remove a Peptide from Schedule
```
DELETE /schedules/:id/items/:itemId
```

---

## Calendar & PDF

### Generate Calendar Events
```
POST /schedules/:id/generate
```
Runs the schedule engine, calculates all injection events, and persists them.
Must be called after creating/editing a schedule and its items.

**Response `200`:**
```json
{ "success": true, "message": "Schedule generated. 168 injection events created.", "eventCount": 168 }
```

---

### Preview Calendar (no save)
```
GET /schedules/:id/preview
```
Runs the engine in-memory and returns the grouped calendar without saving.
Use this to show the user a preview before they confirm and generate.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "2026-03": {
      "2026-03-17": [
        {
          "peptideId":      "uuid",
          "eventDate":      "2026-03-17",
          "timeOfDay":      "AM",
          "doseUnits":      6,
          "doseLabel":      "200 mcg (0.2 mg)",
          "escalationStep": 1,
          "isRestDay":      false
        }
      ]
    }
  }
}
```

---

### Get Saved Calendar
```
GET /schedules/:id/calendar?month=2026-03
```
Returns pre-computed events grouped by month → day.
Omit `month` to return all months.

---

### Mark Injection Completed
```
PATCH /schedules/:id/calendar/:eventId/complete
```
Marks an individual injection event as done (user logs their dose).

---

### Download PDF Calendar
```
GET /pdf/schedules/:id?months=2026-03,2026-04
```
Streams a printable PDF calendar directly.
Omit `months` to include all months in the schedule.

**Headers set on response:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="peptide-schedule-<id>.pdf"`

---

## Community

### List Posts
```
GET /community
```
**Query params:**
| Param         | Type   | Description                                    |
|---------------|--------|------------------------------------------------|
| `peptideId`   | UUID   | Filter by peptide                              |
| `peptideName` | string | Fuzzy peptide name filter                      |
| `benefit`     | string | Filter by benefit tag                          |
| `sideEffect`  | string | Filter by side effect tag                      |
| `search`      | string | Full-text search in title + content            |
| `limit`       | int    | Default 20, max 50                             |
| `offset`      | int    | Pagination                                     |

---

### Get Post Detail
```
GET /community/:id
```

---

### Submit Post
```
POST /community
```
**Requires auth.**

**Body:**
```json
{
  "peptideId":      "uuid",
  "title":          "Noticeable joint improvement with BPC-157 after 3 weeks",
  "content":        "Started at 6 units AM...",
  "doseUsed":       "6 units (200 mcg)",
  "durationUsed":   "3 weeks",
  "benefitsTags":   ["joint recovery", "tissue repair"],
  "sideEffectsTags": ["mild injection site redness"]
}
```

---

### Edit Post
```
PATCH /community/:id
```
Only the post owner can edit. Same body fields as submit (all optional).

---

### Delete Post
```
DELETE /community/:id
```
Post owner or admin.

---

### Upvote Post
```
POST /community/:id/upvote
```
**Requires auth.**

---

### Flag Post (report)
```
POST /community/:id/flag
```
**Requires auth.** Marks the post for moderator review.

---

## Videos

### List Videos
```
GET /videos?category=reconstitution&peptideId=uuid
```
**Category options:** `reconstitution` | `injection` | `peptide_specific` | `general`

Each video in the response includes computed `embedUrl` and `thumbnailUrl`.

---

### Get Video Detail
```
GET /videos/:id
```

---

## Error Format

All error responses follow this consistent shape:

```json
{
  "success": false,
  "error":   "Human-readable error message",
  "details": [ { "field": "email", "message": "Valid email required" } ]
}
```

| HTTP Status | Meaning                                        |
|-------------|------------------------------------------------|
| 400         | Bad request / business rule violation          |
| 401         | Not authenticated (missing or expired token)   |
| 403         | Forbidden (authenticated but not authorized)   |
| 404         | Resource not found                             |
| 409         | Conflict (e.g. schedule not generated yet)     |
| 422         | Validation error (field-level details provided)|
| 429         | Rate limit exceeded                            |
| 500         | Internal server error                          |

---

## Schedule Engine Logic

### How a schedule is generated

1. **Frequency parsing** — The peptide's `injectionFrequencyRaw` text is parsed into:
   - `timesPerDay` (1, 2, or 3)
   - `daysPerWeek` (1, 2, 3, 5, or 7)
   - `pattern` (daily, twice_weekly, three_per_week, once_per_week, etc.)

2. **Day resolution** — Active injection days are spread across the week.
   - Daily → every day
   - 3x/week → default Monday / Wednesday / Friday (user can override start day)
   - 2x/week → default Monday / Thursday
   - Weekly → user's chosen start day

3. **Cycle parsing** — `cycleDurationRaw` is parsed into:
   - `activeWeeks` — how long to inject
   - `restWeeks` — how many weeks off between cycles

4. **Escalation** — `DosingStep` rows are ordered by `step_order`.
   Each step defines a week range and a dose. The engine looks up which
   step applies to each calendar week and assigns that dose to every
   injection event in that week.

5. **Override mode** — When `isOverridden = true` on a `ScheduleItem`:
   - The escalation table is **ignored**
   - `overrideDoseUnits` is used as a flat dose every injection day
   - `overrideDaysOfWeek` replaces the auto-spread day resolution
   - The user must confirm this choice (`overrideConfirmed: true`)

6. **Rest days** — After `activeWeeks`, the engine emits rest-day markers
   (isRestDay = true, doseUnits = 0) for `restWeeks` before the next cycle starts.

---

## Data Models

### Peptide
| Field                  | Type    | Description                                    |
|------------------------|---------|------------------------------------------------|
| `id`                   | UUID    | Primary key                                    |
| `name`                 | string  | Base peptide name e.g. "BPC-157"               |
| `mgAmount`             | string  | Vial size e.g. "10MG"                          |
| `protocolTitle`        | string  | Full protocol title (unique)                   |
| `type`                 | enum    | `single` or `blend`                            |
| `reconstitutionMl`     | float   | BAC water amount in mL                         |
| `howItWorks`           | text    | 100–200 word mechanism description             |
| `sideEffects`          | array   | Bullet strings                                 |
| `benefits`             | array   | Bullet strings                                 |
| `injectionFrequencyRaw`| string  | Raw frequency text from source data            |
| `cycleDurationRaw`     | string  | Raw cycle/duration text from source data       |
| `preparationNotes`     | text    | Multi-step preparation instructions            |
| `healthCategories`     | array   | Health concern tags                            |

### DosingStep
| Field                | Type    | Description                                      |
|----------------------|---------|--------------------------------------------------|
| `peptideId`          | UUID    | FK → Peptide                                     |
| `scheduleName`       | string  | Schedule variant name                            |
| `stepOrder`          | int     | 1-based order within the schedule                |
| `weekStart`          | int     | First week this step applies (1-based)           |
| `weekEnd`            | int     | Last week (null = open-ended)                    |
| `unitsPerInjection`  | float   | Dose in insulin syringe units                    |
| `dailyDoseMcg`       | float   | Dose in micrograms                               |
| `dailyDoseLabel`     | string  | Human-readable label e.g. "200 mcg (0.2 mg)"    |

### CalendarEvent
| Field           | Type    | Description                                        |
|-----------------|---------|----------------------------------------------------|
| `scheduleId`    | UUID    | FK → UserSchedule                                  |
| `scheduleItemId`| UUID    | FK → ScheduleItem                                  |
| `peptideId`     | UUID    | FK → Peptide (denormalized for query performance)  |
| `eventDate`     | date    | YYYY-MM-DD                                         |
| `timeOfDay`     | enum    | `AM`, `PM`, or `BOTH`                              |
| `doseUnits`     | float   | Units on injection syringe                         |
| `doseLabel`     | string  | Human-readable dose                                |
| `escalationStep`| int     | Which escalation step applies (null if override)   |
| `isRestDay`     | boolean | True during rest periods                           |
| `isCompleted`   | boolean | User has logged this injection                     |
