# Google Maps Lead Scraper (Chrome Extension Manifest V3)

A high-performance, standalone Chrome Extension for personal business lead research on Google Maps. Built with **Manifest V3**, **TypeScript**, **React**, **Vite**, and the **Chrome Side Panel API**.

---

## Features

- **No External APIs or Costs**: Directly reads publicly visible Google Maps search results in your active browser tab. Zero API keys, zero paid scrapers, zero third-party servers.
- **Chrome Side Panel Integration**: Sleek, responsive, dark-themed UI that stays docked beside Google Maps while you browse and search.
- **Strict Container Scrolling**: Intelligently detects and scrolls **only** the Google Maps results feed (`role="feed"`), never scrolling the whole page or `window`.
- **Target Matching Leads**: In "Custom" mode, the extension continues scanning until the target count of **matching** businesses is reached (e.g. 50 matching businesses != 50 scanned businesses).
- **All Mode with Loop Protection**: Discovers all available leads in the current search query and halts when Google Maps results end or after consecutive scroll attempts yield no new cards.
- **Review Range Filter**: Inclusive review count filter (`[Min, Max]`), with real-time validation ensuring Min ≤ Max.
- **Website Filter**: Mutually exclusive filtering for `All`, `Website Available`, and `No Website`.
- **Field Customization**: Select which of the 11 fields appear in the results table and export to CSV.
- **Safe Stop & Data Retention**: Clicking **Stop Scraping** immediately halts scrolling and DOM inspection while preserving 100% of discovered leads.
- **CSV Export**: One-click RFC 4180 compliant CSV export with UTF-8 BOM for Microsoft Excel and Google Sheets compatibility.
- **Settings Persistence**: Saves your configuration in `chrome.storage.local` across browser sessions.
- **Results Filter**: Real-time keyword filter across collected leads without mutating underlying data.

---

## Project Structure

```
google-maps-lead-scraper/
├── dist/                          # Production build ready to load in Chrome
│   ├── background.js              # Service worker (Manifest V3 module)
│   ├── content-script.js          # IIFE bundle injected on Google Maps tabs
│   ├── icons/                     # Extension icons (16, 48, 128)
│   ├── manifest.json              # Extension Manifest V3
│   └── sidepanel/
│       ├── index.html             # Side Panel HTML entry
│       └── assets/                # Bundled React JS & CSS
├── manifest.json                  # Source Manifest V3 configuration
├── package.json                   # Dependencies and npm scripts
├── scripts/
│   ├── build.js                   # Vite multi-target extension builder
│   └── generate-icons.js          # Icon generator script
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Service worker & side panel behavior
│   ├── components/
│   │   ├── FieldSelector.tsx      # Checkboxes for 11 lead fields
│   │   ├── ProgressDisplay.tsx    # Live counters & status banners
│   │   ├── ResultsTable.tsx       # Horizontal scrolling leads table
│   │   ├── ReviewRange.tsx        # Min/Max review range with validation
│   │   ├── ScrapingConfig.tsx     # Custom vs All count selector
│   │   ├── ScrapingControls.tsx   # Start / Stop buttons
│   │   ├── SearchResults.tsx      # Inline keyword search filter
│   │   └── WebsiteFilter.tsx      # Mutually exclusive website filter
│   ├── content/
│   │   └── content-script.ts      # Tab message router & scraper invoker
│   ├── csv/
│   │   └── csvExporter.ts         # RFC 4180 CSV builder with UTF-8 BOM
│   ├── scraper/
│   │   ├── cardDetector.ts        # Robust card element selector
│   │   ├── containerDetector.ts   # Scroll container detection
│   │   ├── dataExtractor.ts       # Safe field extraction functions
│   │   ├── duplicateDetector.ts   # URL & Name+Address deduplication
│   │   ├── googleMapsScraper.ts   # Scraper controller & scroll loop
│   │   ├── reviewParser.ts        # Numeric & K/M review parser
│   │   └── types.ts               # Internal scraper types
│   ├── sidepanel/
│   │   ├── App.tsx                # Side Panel state & coordination
│   │   ├── index.html             # HTML template
│   │   ├── main.tsx               # React DOM root
│   │   └── styles.css             # Polished dark modern styles
│   ├── storage/
│   │   └── settingsStorage.ts     # chrome.storage.local persistence
│   ├── types/
│   │   ├── business.ts            # Business lead data models
│   │   ├── messages.ts            # Typed runtime message contracts
│   │   └── settings.ts            # Configuration options
│   └── utils/
│       ├── delays.ts              # Sleep & jitter delay helpers
│       ├── normalize.ts           # URL cleaner & business key creator
│       └── validation.ts          # Settings and range validation
├── tests/
│   ├── csvExporter.test.ts        # CSV escaping & formatting tests
│   ├── duplicateDetector.test.ts  # Deduplication tests
│   ├── reviewParser.test.ts       # Review count parsing & filter tests
│   └── validation.test.ts         # Settings validation tests
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## How to Build

1. Open PowerShell or Terminal in the project root:
   ```bash
   cd f:\google-maps-lead-scraper
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Run unit tests:
   ```bash
   npm test
   ```
4. Build the production extension:
   ```bash
   npm run build
   ```
   This generates the complete, unpacked extension in `dist/`.

---

## How to Load the Extension in Google Chrome

1. Open **Google Chrome**.
2. Navigate to `chrome://extensions/` in the URL bar.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button in the top left.
5. In the file picker, select the `dist` folder:
   ```
   f:\google-maps-lead-scraper\dist
   ```
6. The extension **Google Maps Lead Scraper** is now loaded and ready!
7. Pin the extension to your Chrome toolbar for quick access.

---

## How to Test and Use the Scraper

1. In Chrome, open Google Maps: [https://www.google.com/maps](https://www.google.com/maps)
2. Search for any business type and location, for example:
   ```
   Electricians, Edmonton, Canada
   ```
3. Wait for the search results feed to appear on the left side of Google Maps.
4. Click the **Google Maps Lead Scraper** icon in your Chrome toolbar. The extension side panel opens automatically docked to the right.
5. Configure your scraping parameters:
   - **Scraping Limit**: e.g., `Custom` (50) or `All`
   - **Review Range Filter**: e.g., `Min: 0`, `Max: 60` (or leave empty for any)
   - **Website Filter**: e.g., `All`, `Website Available`, or `No Website`
   - **Fields**: Check the fields you want to view and export (Business Name, Phone, Website, etc.)
6. Click **Start Scraping**.
   - Notice the live progress: `Scraping... 23 / 50 matching businesses`
   - Notice the distinct counter: `Businesses scanned: 47` vs `Matching businesses: 23`
   - Notice the Google Maps results feed scrolling automatically without scrolling the window.
7. Click **Stop Scraping** at any time:
   - Scrolling stops immediately.
   - All collected leads are preserved in the table.
   - Click **Export CSV** to download a spreadsheet file of your leads.

---

## Minimum Test Scenarios Verified

- **Test 1 (Custom 50, Review 0–60, No Website)**: Verified that only businesses with 0–60 reviews and no website count toward the 50 target.
- **Test 2 (Custom 10, Review 50–200, All)**: Inclusive boundary testing verified (50 through 200 included, 49 and 201 excluded).
- **Test 3 (Min empty, Max 60)**: Verified that 0–60 is used.
- **Test 4 (Min 50, Max empty)**: Verified that 50+ reviews are included.
- **Test 5 (Both review fields empty)**: Verified no review filtering is applied.
- **Test 6 (Min 100, Max 50)**: Verified validation displays error `"Minimum reviews cannot be greater than maximum reviews."` and blocks scraping.
- **Test 7 (Website Available)**: Verified only businesses with visible websites match.
- **Test 8 (No Website)**: Verified only businesses without websites match.
- **Test 9 (Custom 100 with Early Stop)**: Verified clicking Stop halts discovery and preserves all leads for CSV export.
- **Test 10 (All Mode)**: Verified continuous discovery stops automatically when feed ends or no new cards load.
- **Test 11 (Duplicate Prevention)**: Normalized canonical place URLs and Name + Address keys prevent duplicate additions when Google Maps re-renders elements.
- **Test 12 (Missing Fields Safety)**: Missing fields safely default to null/empty without crashing the scraper or CSV generator.

---

## Known Google Maps DOM Behaviors & Safeguards

1. **Virtual DOM Recycling**: Google Maps unmounts cards that scroll far out of view. The scraper maintains an in-memory `DuplicateDetector` using canonical place URLs and normalized identifiers so re-rendered cards are never counted twice.
2. **Dynamic Lazy-Loading**: Google Maps batches results as the feed scrolls. The scraper incorporates dynamic jitter delays (1.2s – 1.9s) and nudge scrolling to give the Google Maps DOM adequate time to fetch and render subsequent batches.
3. **End-of-Feed Indicators**: Google Maps displays specific indicators (`.HlvSq`) or stops increasing feed height when reaching the final business. The scraper uses both DOM markers and a 6-attempt consecutive no-new-cards safety threshold to terminate cleanly.
