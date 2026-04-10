# QR Studio — Dynamic QR Code Generator

A full-featured QR code generator with **Dynamic QR Code** support — change the destination URL anytime without reprinting the QR code.

## Features

- **Dynamic QR Codes** — Edit destination URL after creation
- **Multiple Content Types** — URL, Text, WiFi, vCard, Email, Phone, SMS
- **Custom Styling** — Dot styles, corner styles, colors, logo embedding
- **Scan Analytics** — Track scans by day, device type, and location
- **Download** — Export as PNG or SVG
- **Dashboard** — Manage all your QR codes in one place

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL  
- **Frontend:** Vanilla HTML/CSS/JS + [qr-code-styling](https://github.com/nickshabalin/qr-code-styling)
- **Deployment:** Railway

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd qr-code-app

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database URL

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session encryption |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: 3000) |
| `APP_URL` | Public URL of the app |

## Deploy on Railway

1. Push code to GitHub
2. Create new project on [Railway](https://railway.com)
3. Deploy from GitHub repo
4. Add PostgreSQL database
5. Set environment variables (`SESSION_SECRET`, `APP_URL`)
6. Generate domain
7. Done! 🚀

## How Dynamic QR Works

```
User creates Dynamic QR
  → Server generates short code (e.g., "abc123")
  → QR encodes: https://your-app.railway.app/r/abc123
  
Someone scans QR
  → Browser requests /r/abc123
  → Server looks up target URL in database
  → Logs analytics (device, time, etc.)
  → 302 redirects to target URL

User changes target URL anytime
  → QR code image stays the same!
```

## License

MIT
