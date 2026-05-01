# n8n Social Media Workflow Setup

This document explains how to configure the n8n workflow for automated social media post generation and publishing for GeoMoney.

---

## Overview

The workflow has **3 main stages**:

1. **Daily Generation** — n8n cron triggers post generation at 12:00 AM IST
2. **Admin Approval** — Admin reviews via email or admin panel
3. **Publishing** — Approved posts are sent to LinkedIn, X, and Instagram

---

## Environment Variables

Add these to your `.env` file:

```env
# n8n Webhook Security
N8N_WEBHOOK_SECRET=your-random-secret-here

# Admin email for post-ready notifications
ADMIN_EMAIL=admin@geomoney.tv

# n8n webhook for publishing to social platforms
N8N_SOCIAL_PUBLISH_WEBHOOK=https://your-n8n-instance.com/webhook/social-publish

# (Optional) Image generation API
SOCIAL_IMAGE_API_URL=https://your-n8n-instance.com/webhook/generate-image
SOCIAL_IMAGE_API_KEY=optional-key

# (Optional) Direct platform API keys (if not using n8n for publishing)
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
LINKEDIN_ACCESS_TOKEN=
```

---

## n8n Workflow 1: Daily Post Generation

### Nodes:

1. **Cron Trigger**
   - Schedule: Daily at `18:30 UTC` (= 12:00 AM IST)
2. **HTTP Request** — Call GeoMoney API
   - Method: `POST`
   - URL: `https://geomoney.tv/api/cron/social-post`
   - Headers:
     - `Authorization`: `Bearer {{$env.N8N_WEBHOOK_SECRET}}`
     - `Content-Type`: `application/json`
   - Body (JSON):
     ```json
     {
       "secret": "{{$env.N8N_WEBHOOK_SECRET}}",
       "platforms": ["linkedin", "x", "instagram"]
     }
     ```

3. **IF Node** — Check success
   - Condition: `{{$json.success}}` equals `true`
   - True branch → continue (or log success)
   - False branch → send error alert email

---

## n8n Workflow 2: Email Reply Monitor (Auto-Approve)

### Nodes:

1. **Email Trigger (IMAP)**
   - Connect to the admin inbox
   - Filter: Subject contains `Social Media Post Ready`
   - Polling interval: Every 5 minutes

2. **IF Node** — Check if reply contains "YES"
   - Condition: `{{$json.text}}` contains `yes` (case-insensitive)

3. **HTTP Request** — Approve & Publish
   - Method: `POST`
   - URL: `https://geomoney.tv/api/cron/social-post/approve`
   - Headers:
     - `Authorization`: `Bearer {{$env.N8N_WEBHOOK_SECRET}}`
     - `Content-Type`: `application/json`
   - Body:
     ```json
     {
       "secret": "{{$env.N8N_WEBHOOK_SECRET}}"
     }
     ```

---

## n8n Workflow 3: Social Media Publisher

This webhook receives publish requests from GeoMoney and posts to each platform.

### Webhook Trigger

- Method: `POST`
- Path: `/social-publish`
- Response: JSON

### Expected Payload:

```json
{
  "postId": "clxyz...",
  "shortText": "Tweet-length text with #hashtags",
  "longText": "Longer LinkedIn/Instagram version...",
  "imageUrl": "https://...",
  "platforms": ["linkedin", "x", "instagram"]
}
```

### Platform Nodes:

#### X (Twitter) — via Twitter API v2

1. **Twitter Node** (built-in n8n node)
   - Operation: `Create Tweet`
   - Text: `{{$json.shortText}}`
   - Media: Download image from `{{$json.imageUrl}}` first if present

#### LinkedIn — via LinkedIn API

1. **HTTP Request** to LinkedIn API
   - Or use the n8n LinkedIn node
   - Post text: `{{$json.longText}}`
   - Include image if available

#### Instagram — via Facebook Graph API

1. **HTTP Request** to Instagram Content Publishing API
   - Step 1: Create media container with image URL
   - Step 2: Publish the container
   - Caption: `{{$json.longText}}`

### Response:

Return a JSON array of results:

```json
{
  "results": [
    { "platform": "x", "success": true, "postUrl": "https://x.com/..." },
    { "platform": "linkedin", "success": true },
    { "platform": "instagram", "success": true }
  ]
}
```

---

## n8n Workflow 4: Image Generation (Optional)

If `SOCIAL_IMAGE_API_URL` is configured, GeoMoney sends a prompt and expects an image URL back.

### Webhook Trigger

- Path: `/generate-image`

### Expected Payload:

```json
{
  "prompt": "Professional editorial illustration of..."
}
```

### Nodes:

1. Use **DALL-E**, **Stability AI**, or **Midjourney API** node
2. Upload generated image to cloud storage (S3, Cloudinary, etc.)
3. Return:

```json
{
  "imageUrl": "https://your-cdn.com/generated-image.png"
}
```

---

## Admin Panel

Access the social posts manager at: `/admin/social-posts`

Features:

- **Generate Post** — Manually trigger AI generation
- **Approve & Publish** — One-click approve and send to all platforms
- **Approve Only** — Approve without publishing (publish later)
- **Reject** — Mark as rejected
- **Regenerate** — Reject current and generate a new post
- **Edit Text** — Modify the generated text before publishing
- **Delete** — Remove a post entirely
- **Filter** — View by status (pending, approved, published, rejected)

---

## Flow Summary

```
12:00 AM IST (n8n Cron)
        │
        ▼
  POST /api/cron/social-post
        │
        ▼
  AI generates text + image
        │
        ▼
  Saved to DB (status: pending)
        │
        ▼
  Email sent to admin
        │
        ├──── Admin replies "YES" via email ──→ n8n detects ──→ POST /api/cron/social-post/approve
        │                                                              │
        │                                                              ▼
        │                                                    Publish to LinkedIn, X, Instagram
        │
        ├──── Admin clicks "Approve & Publish" in panel ──→ POST /api/admin/social-posts
        │                                                              │
        │                                                              ▼
        │                                                    Publish to LinkedIn, X, Instagram
        │
        └──── Admin clicks "Regenerate" ──→ New AI post generated ──→ Email sent again
```
