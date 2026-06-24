# Hostinger Cron Job Setup

## What This Does
Runs automatic cleanup every 15 minutes to delete expired PoC files (older than 1 hour).

## Setup Instructions

### 1. Log into Hostinger Panel
- Go to your Hostinger dashboard
- Navigate to **Advanced** → **Cron Jobs**

### 2. Create New Cron Job

**Common Settings:** Every 15 minutes

**Command to run:**
```
php /home/your-username/public_html/csrf/api/cleanup.php
```

> **Note:** Replace `/home/your-username/public_html/` with your actual Hostinger path. You can find this in your Hostinger panel under "File Manager" - it's usually something like `/home/u123456789/public_html/` or `/home/yourdomain/public_html/`.

### 3. Verify It Works
After 15 minutes, check if the `.cleanup_lock` file exists in your `/csrf/` directory. If it does, the cron job is working.

### How It All Works Together

```
User clicks "Share" 
    ↓
store.php → stores PoC in temp/ → creates .cleanup_lock
    ↓
Cron runs every 15 min → cleanup.php → deletes files older than 1 hour → updates .cleanup_lock
    ↓
get.php serves PoC → checks lock → skips cleanup if cron ran recently (within 10 min)
```

### File Structure After Setup
```
csrf/
├── index.html
├── api/
│   ├── store.php      (stores new PoCs, lazy cleanup)
│   ├── get.php        (serves PoCs, lazy cleanup)
│   └── cleanup.php    (dedicated cleanup for cron)
├── temp/
│   └── .gitkeep
└── .cleanup_lock      (created automatically, marks last cleanup time)
```

### Important Notes
- **No server restart needed** - cron jobs start working immediately
- **Files still get deleted** even without cron (lazy cleanup runs if lock is older than 10 min)
- **Cron just makes it more reliable** - ensures files are deleted on time regardless of traffic
- **Privacy**: No data is ever stored permanently - everything auto-deletes after 1 hour
