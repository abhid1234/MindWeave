# Mindweave API Documentation

Complete API reference for Mindweave's REST endpoints and Server Actions.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [REST API Endpoints](#rest-api-endpoints)
  - [Health Check](#health-check)
  - [File Upload](#file-upload)
  - [Import](#import)
  - [Export](#export)
  - [Browser Extension](#browser-extension)
  - [Device Management](#device-management)
- [Server Actions](#server-actions)
  - [Content Management](#content-management)
  - [Collections](#collections)
  - [Search](#search)
  - [Analytics](#analytics)
  - [AI Features](#ai-features)

---

## Authentication

Mindweave uses **Auth.js v5** with JWT sessions for authentication.

### Supported Providers

| Provider | Description |
|----------|-------------|
| Google OAuth | Primary authentication method |
| Email/Password | Credentials-based authentication |
| Credentials | Development-only (requires `ALLOW_DEV_LOGIN=true`) |

### Bot Protection

Login and registration forms are protected by **Cloudflare Turnstile**. The Turnstile token is submitted as `cf-turnstile-response` in the form data and verified server-side before authentication proceeds. If verification fails, the server redirects with `?error=TurnstileFailed`.

### Session Access

All authenticated endpoints require a valid session. The session includes:

```typescript
interface Session {
  user: {
    id: string;      // User UUID
    email: string;
    name: string;
    image?: string;
  };
  expires: string;   // ISO date string
}
```

### Protected Routes

- `/dashboard/*` - Requires authentication
- `/api/upload` - Requires authentication
- `/api/import` - Requires authentication
- `/api/export` - Requires authentication
- `/api/extension/capture` - Requires authentication
- `/api/devices` - Requires authentication

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse.

### Rate Limit Headers

Every response includes rate limit information:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | ISO timestamp when limit resets |
| `Retry-After` | Seconds until next request allowed (only on 429) |

### Rate Limits by Endpoint

| Endpoint | Max Requests | Window |
|----------|--------------|--------|
| `/api/*` (general) | 100 | 1 minute |
| `/api/upload` | 20 | 1 hour |
| `/api/import` | 5 | 1 hour |
| `/api/export` | 10 | 1 hour |
| `/api/extension/capture` | 100 | 1 minute |
| Authentication attempts | 10 | 15 minutes |

### Rate Limit Response

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

**Status Code**: `429 Too Many Requests`

---

## REST API Endpoints

### Health Check

Check if the application is running.

```
GET /api/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T16:00:00.000Z"
}
```

---

### File Upload

Upload files (images, PDFs, documents) to associate with content.

```
POST /api/upload
Content-Type: multipart/form-data
```

**Authentication**: Required

**Rate Limit**: 20 requests/hour

**Request Body** (form-data):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | File to upload |

**Supported File Types**:
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Documents: `.pdf`, `.doc`, `.docx`
- Text: `.txt`, `.md`

**Max File Size**: 10MB

**Security**: Files are validated using magic bytes to prevent MIME type spoofing.

**Success Response** (200):
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileName": "document.pdf",
    "filePath": "/uploads/user-id/abc123-document.pdf",
    "fileType": "application/pdf",
    "fileSize": 1048576
  }
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | File size exceeds 10MB limit |
| 400 | File type not allowed |
| 400 | File content does not match file type |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |

---

### Import

Parse uploaded files from external services for import.

```
POST /api/import
Content-Type: multipart/form-data
```

**Authentication**: Required

**Rate Limit**: 5 requests/hour

**Request Body** (form-data):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Export file to parse |
| `source` | String | Yes | Source type (see below) |

**Supported Sources**:
| Source | File Types | Description |
|--------|------------|-------------|
| `bookmarks` | `.html` | Browser bookmarks export (Chrome, Firefox, Safari, Edge) |
| `pocket` | `.html`, `.csv` | Pocket export file |
| `notion` | `.zip` | Notion export (HTML/Markdown) |
| `evernote` | `.enex` | Evernote ENEX export |

**Max File Size**: 100MB

**Success Response** (200):
```json
{
  "success": true,
  "items": [
    {
      "title": "Bookmark Title",
      "url": "https://example.com",
      "type": "link",
      "tags": ["folder-name"],
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "errors": [],
  "warnings": [],
  "stats": {
    "total": 150,
    "parsed": 148,
    "skipped": 2
  }
}
```

---

### Export

Export user content in various formats.

```
POST /api/export
Content-Type: application/json
```

**Authentication**: Required

**Rate Limit**: 10 requests/hour

**Request Body**:
```json
{
  "contentIds": ["id1", "id2"],  // Optional: specific IDs to export
  "format": "json"               // "json" | "markdown" | "csv"
}
```

**Response**: File download with appropriate headers

**Formats**:
| Format | Content-Type | Description |
|--------|--------------|-------------|
| `json` | `application/json` | Full data with metadata |
| `markdown` | `text/markdown` | Human-readable document |
| `csv` | `text/csv` | Spreadsheet-compatible |

---

### Browser Extension

#### Check Session

Verify if user is authenticated (for extension popup).

```
GET /api/extension/session
```

**Response**:
```json
{
  "authenticated": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### Capture Content

Save content from browser extension.

```
POST /api/extension/capture
Content-Type: application/json
```

**Authentication**: Required (via session cookie)

**Rate Limit**: 100 requests/minute

**Request Body**:
```json
{
  "type": "link",
  "title": "Page Title",
  "url": "https://example.com",
  "body": "Optional description",
  "tags": ["optional", "tags"]
}
```

**Validation**:
| Field | Rules |
|-------|-------|
| `type` | Required: `note`, `link`, or `file` |
| `title` | Required, 1-500 characters |
| `url` | Optional, valid URL format |
| `body` | Optional, max 50,000 characters |
| `tags` | Optional, array of strings |

**Success Response** (201):
```json
{
  "success": true,
  "message": "Content saved successfully",
  "data": {
    "id": "content-uuid"
  }
}
```

**CORS**: Configured for extension access from `NEXT_PUBLIC_APP_URL`

---

### Device Management

Register mobile devices for push notifications.

#### Register Device

```
POST /api/devices
Content-Type: application/json
```

**Authentication**: Required

**Request Body**:
```json
{
  "token": "fcm-or-apns-token",
  "platform": "android",  // "android" | "ios" | "web"
  "name": "Pixel 6"       // Optional device name
}
```

**Response** (201):
```json
{
  "success": true,
  "deviceId": "device-uuid"
}
```

#### List Devices

```
GET /api/devices
```

**Response**:
```json
{
  "devices": [
    {
      "id": "device-uuid",
      "platform": "android",
      "name": "Pixel 6",
      "createdAt": "2026-01-27T10:00:00.000Z"
    }
  ]
}
```

#### Unregister Device

```
DELETE /api/devices?deviceId=device-uuid
```

**Response**:
```json
{
  "success": true,
  "message": "Device unregistered"
}
```

---

## Server Actions

Server Actions are called directly from React components and handle authentication automatically.

### Content Management

#### `createContentAction(formData: FormData)`

Create new content (note, link, or file).

**Parameters** (FormData):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | String | Yes | `note`, `link`, or `file` |
| `title` | String | Yes | Content title (1-500 chars) |
| `body` | String | No | Content body (max 50,000 chars) |
| `url` | String | No | URL for links |
| `tags` | String[] | No | User-defined tags |

**Returns**:
```typescript
{
  success: boolean;
  message: string;
  data?: { id: string };
  errors?: Record<string, string[]>;
}
```

**Side Effects**:
- Auto-generates tags via Gemini AI (if `GOOGLE_AI_API_KEY` set)
- Generates summary via Gemini AI
- Creates embedding via Google Gemini (if `GOOGLE_AI_API_KEY` set)

---

#### `getContentAction(options)`

Retrieve user's content with filtering, sorting, and pagination.

**Parameters**:
```typescript
{
  type?: 'note' | 'link' | 'file';
  tag?: string;
  query?: string;           // Full-text search
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  collectionId?: string;
  favorites?: boolean;
  cursor?: string;          // Pagination cursor
  limit?: number;           // Default: 20
}
```

**Returns**:
```typescript
{
  success: boolean;
  message: string;
  data?: {
    items: Content[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}
```

---

#### `updateContentAction(id: string, formData: FormData)`

Update existing content.

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | No | New title |
| `body` | String | No | New body |
| `url` | String | No | New URL |

**Side Effects**:
- Re-generates auto-tags if body changes
- Re-generates embedding if body changes

---

#### `deleteContentAction(id: string)`

Delete content and associated data.

**Cascading Deletes**:
- Removes content from all collections
- Deletes associated embeddings
- Revokes any share links

---

#### `bulkDeleteContentAction(ids: string[])`

Delete multiple content items at once.

---

#### `toggleFavoriteAction(id: string)`

Toggle favorite status of content.

---

#### `shareContentAction(id: string)`

Generate a public share link for content.

**Returns**:
```typescript
{
  success: boolean;
  shareUrl?: string;
  shareId?: string;
}
```

---

#### `revokeShareAction(id: string)`

Revoke a share link, making content private again.

---

### Collections

#### `createCollectionAction(data)`

Create a new collection.

```typescript
{
  name: string;        // 1-100 chars
  description?: string;
  color?: string;      // Hex color code
}
```

---

#### `updateCollectionAction(id: string, data)`

Update collection properties.

---

#### `deleteCollectionAction(id: string)`

Delete a collection (content is preserved, just unlinked).

---

#### `addToCollectionAction(contentId: string, collectionId: string)`

Add content to a collection.

---

#### `removeFromCollectionAction(contentId: string, collectionId: string)`

Remove content from a collection.

---

#### `bulkAddToCollectionAction(contentIds: string[], collectionId: string)`

Add multiple items to a collection.

---

### Search

#### `semanticSearchAction(query: string, limit?: number)`

Search content using semantic similarity (vector search).

**Parameters**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | String | Required | Search query |
| `limit` | Number | 10 | Max results |

**Returns**:
```typescript
{
  success: boolean;
  results?: Array<{
    id: string;
    title: string;
    body: string;
    similarity: number;  // 0-1 score
  }>;
}
```

---

#### `askQuestionAction(question: string)`

Ask a question about your knowledge base (RAG).

**Process**:
1. Generates embedding for question
2. Finds similar content via vector search
3. Sends context + question to Gemini AI
4. Returns answer with citations

**Returns**:
```typescript
{
  success: boolean;
  answer?: string;
  citations?: Array<{
    id: string;
    title: string;
    similarity: number;
  }>;
}
```

---

#### `getRecommendationsAction(contentId: string, limit?: number)`

Get similar content recommendations.

---

### Analytics

#### `getOverviewStatsAction()`

Get aggregate statistics.

**Returns**:
```typescript
{
  totalItems: number;
  itemsThisMonth: number;
  totalCollections: number;
  uniqueTags: number;
}
```

**Caching**: 60 seconds

---

#### `getContentGrowthAction(period: 'week' | 'month' | 'year')`

Get time-series data for content creation.

**Returns**:
```typescript
Array<{
  date: string;      // ISO date
  notes: number;
  links: number;
  files: number;
}>
```

**Caching**: 60 seconds

---

#### `getTagDistributionAction()`

Get top tags with usage percentages.

**Returns**:
```typescript
Array<{
  tag: string;
  count: number;
  percentage: number;
}>
```

**Caching**: 300 seconds

---

#### `getKnowledgeInsightsAction()`

Get AI-generated insights about your knowledge base.

**Returns**:
```typescript
{
  insights: Array<{
    type: 'connection' | 'pattern' | 'gap' | 'suggestion';
    title: string;
    description: string;
  }>;
}
```

---

### AI Features

#### `getSearchSuggestionsAction(query: string)`

Get smart search suggestions based on query and user's content.

**Returns**:
```typescript
{
  suggestions: string[];
}
```

---

#### `getContentClustersAction()`

Get content organized into AI-generated clusters.

**Returns**:
```typescript
{
  clusters: Array<{
    id: string;
    name: string;
    description: string;
    contentIds: string[];
  }>;
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {
    "fieldName": ["Validation error 1", "Validation error 2"]
  }
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation failed) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (no access to resource) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Security Headers

All responses include security headers:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Strict CSP directives |
| `Strict-Transport-Security` | `max-age=31536000` (production) |

---

## SDK Usage Examples

### JavaScript/TypeScript (Server Actions)

```typescript
// Create content
const result = await createContentAction(formData);
if (result.success) {
  console.log('Created:', result.data.id);
}

// Search content
const searchResult = await semanticSearchAction('machine learning', 5);
searchResult.results?.forEach(item => {
  console.log(`${item.title}: ${Math.round(item.similarity * 100)}% match`);
});

// Ask a question
const answer = await askQuestionAction('What are my notes about React?');
console.log(answer.answer);
answer.citations?.forEach(c => console.log(`Source: ${c.title}`));
```

### Browser Extension

```javascript
// Check authentication
const response = await fetch('/api/extension/session', {
  credentials: 'include'
});
const { authenticated, user } = await response.json();

// Save current page
if (authenticated) {
  await fetch('/api/extension/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      type: 'link',
      title: document.title,
      url: window.location.href,
      body: window.getSelection()?.toString() || ''
    })
  });
}
```

---

## Changelog

### v1.0.0 (2026-01-27)
- Initial API documentation
- Rate limiting on all endpoints
- Security headers configured
- Magic bytes file validation
