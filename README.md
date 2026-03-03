# 🎬 IndieGo

<p align="center">
  <img src="https://github.com/user-attachments/assets/7fe94c7c-91fa-42fc-881e-2004ab18d3b4" alt="App Screenshot" width="1000" />
</p>


A React-based web application that displays nearby art-film screening times across various independent and chain theaters in Korea. Users can select a movie and instantly view where and when it's playing on an interactive map, sorted by proximity to their current location.

## 🌐 Website Link

[https://indiego.ing](https://indiego.ing)

## 📦 Tech Stack

- **Frontend**: React, Leaflet.js, Supabase
- **Backend**: Supabase PostgreSQL
- **Crawler**: Python (Selenium + BeautifulSoup + Supabase Client)
- **Deployment**: Vercel (frontend), AWS Lambda (crawler)

---

## 🧭 Features

- 🎞️ Movie selection dropdown from Supabase  
- 🗺️ Interactive Leaflet map showing cinema markers  
- 📍 Distance-based sorting using geolocation  
- 🧾 Screening info cards for each selected cinema  
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
  ├── App.js                     # Main compponent
  ├── components/              
  │   ├── CinemaMap.js           # Map with cinema markers
  │   ├── CinemaOverlay.js       # Popup for cinema screenings
  │   ├── MovieScreeningsList.js # List view of screening cards
  │   ├── ScreeningCard.js       # Individual movie card
  ├── hooks/                   
  │   ├── useGeo.js              # Shared geo provider/hook with fallback chain
  │   └── useNaverMaps.js        # Hook to integrate Naver Map SDK
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

From `cinema-site` root:

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

The MIT License (MIT)

Copyright (c) 2026 Chaehyun Park
