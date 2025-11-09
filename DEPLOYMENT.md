# Tide Table Vue - Deployment Guide

## Overview

This is a Vue 3 + Vite application that displays real-time tide information using the QWeather API. This guide covers building and deploying the application to a production server.

## Prerequisites

- Node.js >= 20.19.0 or >= 22.12.0
- npm or yarn package manager
- QWeather API credentials (PROJECT_ID, KEY_ID, PRIVATE_KEY)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with your QWeather API credentials:

```env
VITE_PROJECT_ID=your_project_id
VITE_KEY_ID=your_key_id
VITE_PRIVATE_KEY=your_private_key_in_pem_format
```

Or update `src/config.js` directly:

```javascript
export default {
  PROJECT_ID: 'your_project_id',
  KEY_ID: 'your_key_id',
  PRIVATE_KEY: 'your_private_key_in_pem_format'
}
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5174`

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory with:
- Minified JavaScript and CSS
- Bundled assets
- Optimized images
- Source maps (optional)

### 2. Preview Production Build Locally

```bash
npm run preview
```

This serves the production build locally for testing before deployment.

## Deployment to Server

### Quick Deploy with rsync

The fastest way to sync your `dist` folder to the server:

#### 1. Build the application

```bash
npm run build
```

#### 2. Make the deploy script executable

```bash
chmod +x deploy.sh
```

#### 3. Deploy using the script

```bash
REMOTE_HOST=your-server.com REMOTE_USER=root REMOTE_PATH=/var/www/tidetable ./deploy.sh
```

#### 3. Or use rsync directly (one-liner)

```bash
rsync -avz --delete dist/ root@your-server.com:/var/www/tidetable/
```

**rsync options explained:**
- `-a`: Archive mode (preserves permissions, timestamps)
- `-v`: Verbose output
- `-z`: Compress during transfer
- `--delete`: Remove files on remote that don't exist locally
- `dist/`: Source folder (note the trailing slash - syncs contents)
- `root@your-server.com:/var/www/tidetable/`: Destination

#### 4. For subsequent deployments (faster)

```bash
npm run build && rsync -avz --delete dist/ root@your-server.com:/var/www/tidetable/
```

### Option 1: Static File Hosting (Recommended)

The `dist/` folder contains static files that can be served by any web server.

#### Using Nginx (with API Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/tidetable/dist;
    index index.html;

    # Handle SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to QWeather
    location /geo/ {
        proxy_pass https://pd78kymwkm.re.qweatherapi.com/geo/;
        proxy_set_header Host pd78kymwkm.re.qweatherapi.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /v7/ {
        proxy_pass https://pd78kymwkm.re.qweatherapi.com/v7/;
        proxy_set_header Host pd78kymwkm.re.qweatherapi.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

#### Using Apache (with API Proxy)

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/tidetable/dist

    <Directory /var/www/tidetable/dist>
        Options -MultiViews
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.html [QSA,L]
    </Directory>

    # Proxy API requests to QWeather
    ProxyPreserveHost On
    ProxyPass /geo/ https://pd78kymwkm.re.qweatherapi.com/geo/
    ProxyPassReverse /geo/ https://pd78kymwkm.re.qweatherapi.com/geo/

    ProxyPass /v7/ https://pd78kymwkm.re.qweatherapi.com/v7/
    ProxyPassReverse /v7/ https://pd78kymwkm.re.qweatherapi.com/v7/

    # Cache headers for static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>

    <FilesMatch "^index\.html$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
</VirtualHost>
```

**Note**: Enable Apache modules:
```bash
a2enmod proxy
a2enmod proxy_http
a2enmod rewrite
a2enmod headers
```

#### Using Node.js (Express)

```javascript
import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// Serve static files
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

### Option 2: Docker Deployment

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:

```bash
docker build -t tidetable .
docker run -p 3000:80 tidetable
```

## Important Configuration Notes

### 1. API Proxy Configuration

**Development**: The Vite dev server (`npm run dev`) includes a built-in proxy configured in `vite.config.js` that forwards requests to the QWeather API endpoint.

**Production**: The built files in `dist/` are static and don't include the dev server proxy. You MUST set up a reverse proxy on your web server to forward API requests to QWeather.

**Why?** The browser cannot make direct requests to `https://pd78kymwkm.re.qweatherapi.com` due to CORS restrictions. The reverse proxy acts as an intermediary:

```
Browser → Your Server (/geo, /v7) → QWeather API
```

**Configuration**:
- Use the Nginx or Apache configurations provided above
- The proxy forwards `/geo/*` and `/v7/*` requests to `https://pd78kymwkm.re.qweatherapi.com`
- The `changeOrigin` header ensures the QWeather API sees requests from the correct host

### 2. Environment Variables

For production, ensure your QWeather API credentials are:
- Stored securely (not in version control)
- Passed via environment variables or config files
- Never exposed in client-side code

### 3. HTTPS

Always use HTTPS in production:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... rest of config
}
```

## Deployment Checklist

- [ ] Build the application: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Configure QWeather API credentials
- [ ] Set up web server (Nginx/Apache/Node.js)
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up API proxy if needed
- [ ] Configure caching headers for static assets
- [ ] Test all features on production server
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy

## Troubleshooting

### Module Resolution Error

If you see: `Failed to resolve module specifier "vue"`

**Solution**: Ensure you've run `npm run build` to create the production bundle. The development source files cannot be served directly.

### API Requests Failing

**Solution**: 
- Verify QWeather API credentials are correct
- Check that API proxy is configured properly
- Ensure CORS is enabled if making direct API calls
- Check browser console for detailed error messages

### Cache Issues

**Solution**: 
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- Clear localStorage if needed
- Check that static assets have proper cache headers

## Performance Optimization

The application includes:
- ✅ Code splitting and lazy loading
- ✅ Minified assets
- ✅ localStorage caching for tide data (30-day expiry)
- ✅ Responsive design for all devices
- ✅ Optimized Chart.js visualization

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review the application logs
3. Verify API credentials and network connectivity
4. Check GitHub repository for updates

## License

See LICENSE file for details.

