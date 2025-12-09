# Scorella API Documentation v1.0

Base URL: `http://localhost:3000` (Dev) / `https://api.scorella.net` (Prod)

## Authentication

### Login with Apple

`POST /auth/apple`

Validates Apple Identity Token and creates/returns a session.

**Request Body**

```json
{
  "appleId": "000343.c...",
  "email": "user@privaterelay.appleid.com",
  "ageBucket": "13-15"
}
```

**Response (201 Created)**

```json
{
  "message": "Authenticated successfully",
  "user": {
    "id": "uuid...",
    "appleId": "...",
    "ageBucket": "13-15"
  }
}
```

## Videos

### Get Upload URL (S3 Presigned)

`POST /videos/upload-url`

Request a direct-to-cloud upload URL.

**Request Body**

```json
{
  "userId": "uuid...",
  "contentType": "video/mp4"
}
```

**Response**

```json
{
  "uploadUrl": "https://fra1.digitaloceanspaces.com/scorella-videos/raw/...?Signature=...",
  "videoId": "uuid-for-tracking",
  "key": "raw/user/file.mp4",
  "publicUrl": "https://fra1.digitaloceanspaces.com/..."
}
```

### Confirm Upload

`PATCH /videos/:id/confirm`

Mark a video as ready/transcoded.

### Get Feed

`GET /videos/feed`

Returns a list of videos for the main feed.

**Response**

```json
[
  {
    "id": "uuid...",
    "videoUrl": "...",
    "title": "Math Lesson 1",
    "user": { "id": "..." }
  }
]
```
