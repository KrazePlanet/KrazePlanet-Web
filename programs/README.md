# Bug Bounty Programs Catalog - Standalone HTML Version

A complete standalone HTML/CSS/JavaScript bug bounty programs catalog with premium dark glassmorphism design. No frameworks, no build tools - just pure web technologies.

## 📁 Files

```
standalone-html/
├── index.html          # Main HTML structure
├── styles.css          # Dark glassmorphism styling
├── app.js              # Interactive functionality
├── programs.json       # Bug bounty programs data
└── public/             # Assets (favicon, logos)
    ├── favicon.ico
    ├── favicon.png
    └── ...
```

## ✨ Features

- **Search** - Real-time filtering by program name
- **Platform Filter** - Multi-select dropdown with 8 platforms
- **Sorting** - 6 sort options (Date, Name, Bounty)
- **View Toggle** - Switch between grid and list views
- **Pagination** - 24 items per page
- **"New" Badges** - Auto-detect today's programs
- **Responsive** - Mobile-friendly design
- **Premium Design** - Dark theme with glassmorphism effects

## 🚀 Quick Start

### Option 1: Python HTTP Server (Recommended)

```bash
cd standalone-html
python -m http.server 8080
```

Then open: **http://localhost:8080**

### Option 2: Node.js HTTP Server

```bash
cd standalone-html
npx http-server -p 8080
```

Then open: **http://localhost:8080**

### Option 3: VS Code Live Server

1. Open `standalone-html` folder in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## 🎨 Design

- **Color Scheme**: Deep purple-blue gradient with vibrant accents
- **Effects**: Glassmorphism, floating orbs, gradient animations
- **Typography**: System fonts for optimal performance
- **Animations**: Smooth micro-animations on all interactions

## 🔧 Customization

### Update Programs Data

Edit `programs.json` to add/remove programs:

```json
{
  "name": "Program Name",
  "program_url": "https://...",
  "logo": "https://...",
  "platform": "HackerOne",
  "reward": "$500 - $10,000",
  "last_updated": "2025-11-24"
}
```

### Change Colors

Edit CSS variables in `styles.css`:

```css
:root {
  --primary: rgb(168, 118, 255);
  --accent: rgb(132, 224, 255);
  --success: rgb(132, 255, 168);
}
```

### Modify Pagination

Change items per page in `app.js`:

```javascript
const PAGE_SIZE = 24; // Change to desired number
```

## 📊 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

Requires support for:
- CSS `backdrop-filter` (glassmorphism)
- ES6+ JavaScript (Fetch API, Arrow functions, etc.)
- CSS Grid & Flexbox

## 🚢 Deployment

Deploy to any static hosting service:

- **GitHub Pages**: Push to repo, enable Pages
- **Netlify**: Drag & drop the folder
- **Vercel**: Import the directory
- **Cloudflare Pages**: Connect and deploy

No build process needed - just upload the files!

## 📝 License

This is a standalone version created from the KrazePlanet bug bounty programs catalog.

## 🙏 Credits

- Original Next.js version: KrazePlanet
- Converted to HTML/CSS/JS: Pure web technologies
- Icons: Inline SVG (Lucide-inspired)
- Fonts: System font stack
