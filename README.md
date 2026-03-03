# 🎬 IndieGo

<p align="center">
  <img src="https://github.com/user-attachments/assets/668c5ba7-e95b-49d5-a166-b5809e948e30" alt="App Screenshot" width="1000" />
</p>


A React-based web application that displays nearby art-film screening times across independent theaters in Korea. Users can browse movies via a poster rail and instantly view where and when they're playing, sorted by proximity to their current location. A map view shows all cinemas with numbered pins and distance sorting.

## 🌐 Website Link

[https://indiego.ing](https://indiego.ing)

## 📦 Tech Stack

- **Frontend**: React, Supabase
- **Backend**: Supabase PostgreSQL
- **Crawler**: Python (Playwright + Supabase Client) — crawler + TMDB poster updater, both on AWS Lambda
- **Deployment**: Vercel (frontend), AWS Lambda (crawler)

---

## 🧭 Features

- 🎞️ Horizontally scrollable movie poster rail with full title display
- 🗺️ Naver Maps view with numbered teardrop pins and split-panel cinema detail
- 📍 Distance-based sorting using geolocation
- 🧾 Screening info cards with color-coded seat availability badges
- 📌 Non-blocking location fallback (GPS → IP-based → cached session → Seoul default)

---

## 🏗️ Architecture

```
┌───────┐     ┌──────────────────┐     ┌────────────────────┐
│ User  │ ──▶ │ Frontend (React) │ ──▶ │ Backend (Supabase) │
└───────┘     └──────────────────┘     └────────────────────┘
                                                  ▲
                                                  │
                                      ┌───────────┴──────────┐
                                      │ Crawler (AWS Lambda) │
                                      └──────────────────────┘

```

🧩 Crawler source code:  
**Cinema Crawler Repository** [https://github.com/parkchaehyun/indiego-crawler](https://github.com/parkchaehyun/indiego-crawler)

---

## 🗂️ Project Structure

```
public/
  └── index.html                 # HTML entry point

src/
  ├── App.js                     # Main component
  ├── components/              
  │   ├── CinemaMap.js           # Map view with split-panel cinema detail
  │   ├── CinemaOverlay.js       # Cinema timetable (inline or modal)
  │   ├── LocationStatusBar.js   # Location status and permission prompt
  │   ├── MovieScreeningsList.js # Movie poster rail and screening cards
  │   ├── ScreeningCard.js       # Individual screening card with seat badge
  ├── hooks/
  │   ├── useGeo.js              # Shared geo provider/hook with fallback chain
  │   └── useNaverMaps.js        # Hook to integrate Naver Maps SDK
  ├── lib/
  │   └── supabase.js            # Supabase client configuration
  └── services/                  # API access layer to Supabase
      ├── cinemaService.js       # Fetch cinema metadata
      ├── locationService.js     # IP-based fallback location resolver
      ├── movieService.js        # Fetch list of movies
      └── screeningService.js    # Fetch screening data
```

## 📍 Location Fallback Design

The app never hard-blocks UI when geolocation fails.

Location resolution order:
1. Browser geolocation (`navigator.geolocation`)
2. Supabase Edge Function `ip-location` (server-side IP lookup)
3. Last successful coordinates in `sessionStorage`
4. Seoul default coordinates

Notes:
- `Use my location` retries browser geolocation on demand.
- If permission is `denied`, browsers usually do not re-show the prompt automatically.  
  User must allow location in site settings, then click retry.
- `ip-location` should return JSON like:
  `{ "lat": 37.56, "lng": 126.97 }`

### Deploy `ip-location` Edge Function

From `indiego-web` root:

```bash
supabase login
supabase functions deploy ip-location \
  --project-ref jhkiwoktrwrcracojdyn \
  --no-verify-jwt
```

Set IP2Location key (authenticated primary provider):

```bash
supabase secrets set IP2LOCATION_API_KEY=your_key_here \
  --project-ref jhkiwoktrwrcracojdyn
```

Optional local serve:

```bash
supabase functions serve ip-location --no-verify-jwt
```

## License

[PolyForm Noncommercial License 1.0.0](./LICENSE)

Commercial use is not permitted. For commercial licensing, contact the repository owner.

Copyright (c) 2026 Chaehyun Park
