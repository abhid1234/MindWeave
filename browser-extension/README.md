# Mindweave Browser Extension

A Chrome browser extension for quick content capture to your Mindweave knowledge hub.

## Features

- One-click save of any webpage as a link
- Auto-fill page title and URL
- Add optional description and tags
- Seamless authentication with Mindweave web app
- Dark mode support

## Installation

### Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `browser-extension/` folder from this repository
5. The extension icon should appear in your browser toolbar

### Production

The extension will be available on the Chrome Web Store (coming soon).

## Usage

### First Time Setup

1. Click the Mindweave extension icon in your browser toolbar
2. If not logged in, click "Login to Mindweave"
3. Log in to your Mindweave account in the new tab
4. Return to any page and click the extension icon again

### Saving Content

1. Navigate to any webpage you want to save
2. Click the Mindweave extension icon
3. The page title and URL will be pre-filled
4. (Optional) Add a description
5. (Optional) Add comma-separated tags
6. Click "Save to Mindweave"
7. View your saved content in the Mindweave library

## Development

### Project Structure

```
browser-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── background.js          # Service worker
├── icons/
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── README.md              # This file
```

### Configuration

The extension connects to the Mindweave API. To configure the API URL:

1. Open `popup/popup.js`
2. Modify the `API_BASE_URL` constant:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000'; // Development
   // const API_BASE_URL = 'https://mindweave.app'; // Production
   ```

3. Also update `background.js` with the same URL

### Building Icons

The extension includes placeholder icons. To create proper icons:

1. Design icons at 16x16, 48x48, and 128x128 pixels
2. Use a purple (#6366f1) background with white "M" or brain icon
3. Save as PNG files in the `icons/` directory

### Testing

1. Load the extension in Chrome (see Installation > Development)
2. Make changes to the code
3. Click the refresh icon on the extension card in `chrome://extensions/`
4. Test the changes

## API Endpoints

The extension uses these API endpoints from the Mindweave web app:

### GET /api/extension/session

Check authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/extension/capture

Save content.

**Request:**
```json
{
  "type": "link",
  "title": "Page Title",
  "url": "https://example.com",
  "body": "Optional description",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content saved successfully",
  "data": { "id": "uuid" }
}
```

## Permissions

The extension requires the following permissions:

- `activeTab` - To read the current page's title and URL
- `storage` - For future offline/cache functionality
- Host permissions for Mindweave API (localhost:3000, mindweave.app)

## Troubleshooting

### "Not logged in" even after logging in

1. Make sure you logged in to Mindweave at the correct URL (same as `API_BASE_URL`)
2. Check that cookies are enabled for the Mindweave domain
3. Try logging out and back in to Mindweave

### "Network error" when saving

1. Make sure the Mindweave web app is running (for localhost)
2. Check your internet connection
3. Try refreshing the extension

### Extension not showing

1. Make sure the extension is enabled in `chrome://extensions/`
2. Click the puzzle piece icon in Chrome toolbar
3. Pin the Mindweave extension

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see the main project LICENSE file.
