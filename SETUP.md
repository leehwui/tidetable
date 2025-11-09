# Tide Table Vue 3 Web Application

A modern web application for displaying real-time tide information using Vue 3, JavaScript, and the QWeather API.

## ✅ Project Setup Complete

The project has been successfully converted to **pure JavaScript** (no TypeScript) and is ready to run!

### Project Structure

```
src/
├── config.js              # API credentials (QWeather)
├── utils/
│   ├── jwt.js            # JWT token generation for EdDSA signing
│   └── api.js            # QWeather API service
├── stores/
│   └── tideStore.js      # Pinia store for tide data state management
├── views/
│   ├── TideTableView.vue # Main tide table display component
│   └── AboutView.vue     # About page
├── router/
│   └── index.js          # Vue Router configuration
├── App.vue               # Root component
└── main.js               # Application entry point
```

## Features

- 🌊 Real-time tide data from QWeather API
- 📍 Geolocation support to get current location
- 📅 Date picker to view tide data for different dates
- 🌙 Moon phase and sunrise/sunset information
- 🔐 EdDSA JWT authentication for API requests
- 📱 Responsive design for mobile and desktop
- ⚡ Built with Vue 3 + JavaScript + Vite

## Quick Start

### Prerequisites

- Node.js v20.19.0 or v23.10.0+ (use nvm to switch versions)
- npm or yarn

### Installation

```bash
cd tide-table-vue
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## API Configuration

The application uses QWeather API for tide data. Credentials are stored in `src/config.js`:

```javascript
const config = {
  PROJECT_ID: '4J2C9HXGDQ',
  PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIBHZykuoOf6avLwp/vn15zFfpvAEj2Z8Zs5KrA96ybhT
-----END PRIVATE KEY-----`,
  KEY_ID: 'TGWFM2HQHP'
}
```

## How It Works

1. **JWT Generation**: The app generates EdDSA-signed JWT tokens using the Web Crypto API
2. **Location Detection**: Users can get their current location via browser geolocation
3. **API Request**: Tide data is fetched from QWeather API with JWT authentication
4. **State Management**: Pinia store manages tide data, loading states, and errors
5. **Display**: Vue components render tide information with a responsive UI

## Technologies

- **Vue 3**: Progressive JavaScript framework
- **JavaScript**: No TypeScript - pure JS for simplicity
- **Vite**: Next-generation frontend build tool
- **Pinia**: State management
- **Vue Router**: Client-side routing
- **Web Crypto API**: For JWT signing

## Browser Support

- Chrome/Edge 37+
- Firefox 34+
- Safari 11+
- Opera 24+

(Requires support for Web Crypto API and Ed25519)

## Key Files Explained

### `src/config.js`
Contains QWeather API credentials. Keep this secure in production!

### `src/utils/jwt.js`
Handles JWT token generation using Web Crypto API:
- `generateJWT()` - Main function to create signed tokens
- `parsePemPrivateKey()` - Extracts PKCS8 bytes from PEM format
- `extractEd25519Key()` - Gets the raw 32-byte Ed25519 key
- `base64urlEncode()` / `base64Decode()` - Encoding utilities

### `src/utils/api.js`
API service for fetching tide data:
- `fetchTideData()` - Main function to fetch tide data
- `getTideData()` - Wrapper function with simpler interface

### `src/stores/tideStore.js`
Pinia store for state management:
- **State**: tideData, loading, error, selectedDate, location info
- **Computed**: currentDayTide, highTides, lowTides
- **Actions**: fetchTideData, setSelectedDate, setLocation, clearError

### `src/views/TideTableView.vue`
Main UI component with:
- Location section with geolocation button
- Date picker for selecting dates
- Loading and error states
- Tide data display with sunrise/sunset, moon info
- High/low tides sections

## Notes

- The application requires HTTPS in production (for geolocation and Web Crypto API)
- JWT tokens are valid for 15 minutes (900 seconds)
- Tide data is fetched fresh each time (no caching implemented yet)
- All code is pure JavaScript - no TypeScript compilation needed

## Build Status

✅ **Build successful** - No errors or warnings
- 42 modules transformed
- Output: 98.21 kB (gzip: 38.46 kB)

## Next Steps

1. Run `npm run dev` to start the development server
2. Click "Get Location" to fetch your current location
3. View tide data for today or select a different date
4. The app will automatically fetch new data when you change the date

Enjoy! 🌊
