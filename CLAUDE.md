# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**人生小站 (Life Station)** is a romantic "message in a bottle" website for recording thoughts and memories. It's a full-stack application with a frontend hosted on GitHub Pages and a backend running on Cloudflare Workers with KV storage.

### Architecture

- **Frontend**: Vanilla HTML5/CSS3/JavaScript ES6 (no frameworks)
- **Backend**: Cloudflare Workers with KV storage
- **Hosting**: GitHub Pages (frontend) + Cloudflare Workers (API)
- **Database**: Cloudflare KV (NoSQL key-value store)

## Common Commands

### Backend Development (Cloudflare Workers)
```bash
cd backend
npm install                    # Install dependencies
npm run dev                   # Start local development server
npm run deploy               # Deploy to Cloudflare Workers
npm run tail                 # View live logs from deployed worker
wrangler kv key list --binding=BOTTLES_KV  # List all stored keys
wrangler kv key get "bottle:ID" --binding=BOTTLES_KV  # Get specific bottle
```

### Frontend Development
```bash
# No build step required - direct HTML/CSS/JS
python -m http.server 8000   # Serve locally for testing
node proxy-server.js         # Run local proxy for China access
```

### Data Export
```bash
node export_data.js          # Export all formats (JSON, CSV, MD, HTML)
node export_data.js json     # Export specific format
./export_data.sh            # Bash script for export
```

## Architecture Details

### Smart API Selection System
The frontend implements intelligent API endpoint selection to handle network restrictions (especially in China):

1. **Priority-based testing**: Tests multiple proxy services in order
2. **Automatic failover**: Falls back to working endpoints
3. **Configuration-driven**: Endpoints defined in `config.js`
4. **Runtime selection**: `selectBestAPI()` function in `script.js`

Key files:
- `config.js`: API endpoint configurations with priorities
- `script.js`: Smart API selection logic (`selectBestAPI()`, `getCurrentApiUrl()`)
- `proxy-server.js`: Local Node.js proxy for development

### Configuration Architecture
The system uses a centralized configuration in `config.js`:
- `API_ENDPOINTS[]`: Array of API endpoints with priorities and headers
- `SMART_API_SELECTION`: Feature flag for intelligent routing
- `DEBUG_MODE`: Controls logging (set to `false` for production)
- `USE_LOCAL_STORAGE`: Toggles between cloud and local storage

### Backend API Design
Cloudflare Workers backend (`backend/src/index.js`):
- RESTful API with CORS support
- KV storage with `BOTTLES_KV` binding
- Routes: `/health`, `/bottles` (GET/POST), `/search`
- Validation and error handling
- Rate limiting and content filtering

### Frontend State Management
No framework - uses vanilla JavaScript with:
- Global state variables (`bottles[]`, `searchResults[]`)
- Dynamic API URL/headers (`SELECTED_API_URL`, `SELECTED_API_HEADERS`)
- Local storage fallback for offline mode
- Canvas-based animations (`initOceanAnimation()`)

### China Access Optimization
Multi-layered approach to handle Cloudflare Workers restrictions in China:
1. **Free proxy services**: AllOrigins, CORS Anywhere, ThingProxy
2. **Local proxy server**: `proxy-server.js` for development
3. **IP direct connection**: Cloudflare IP addresses with Host headers
4. **Custom Workers proxy**: `cloudflare-china-proxy.js` template

## Key Configuration Points

### Cloudflare Workers Setup
- **KV Namespace**: `BOTTLES_KV` binding in `wrangler.toml`
- **Environment variables**: Set in `wrangler.toml` [vars] section
- **Custom domain**: Can be configured for better China access

### Frontend Configuration Modes
- **Production**: `DEBUG_MODE: false`, uses smart API selection
- **Development**: `DEBUG_MODE: true`, shows debug panels
- **Local**: `USE_LOCAL_STORAGE: true`, no API calls

### Debugging and Development
- Debug mode is **disabled by default** (`DEBUG_MODE: false`)
- All console logging is disabled in production
- Enable debug mode temporarily for troubleshooting by setting `DEBUG_MODE: true` in `config.js`

## Data Export and Management

The system includes comprehensive data export capabilities:
- **export_data.js**: Node.js script for multiple formats
- **export_data.sh**: Bash equivalent for Unix systems
- **Direct API**: `curl` commands for quick exports
- **Wrangler CLI**: Direct KV access for advanced operations

Supported export formats: JSON, CSV, Markdown, HTML with timestamps and metadata.

## Network Restrictions Handling

The codebase is specifically designed to handle network access restrictions:
- Automatic proxy detection and selection
- Graceful degradation from cloud to local storage
- Silent failure handling (no user-facing errors for network issues)
- Multiple redundant access methods

When modifying network-related code, always test both direct access and proxy scenarios.