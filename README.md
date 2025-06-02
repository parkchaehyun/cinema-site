# 🎬 Art Film Screening Map

<p align="center">
  <img src="https://github.com/user-attachments/assets/2d83c101-2429-4e3e-a58c-2ab07ef9c59a" alt="App Screenshot" width="808" />
</p>


A React-based web application that displays nearby art-film screening times across various independent and chain theaters in Korea. Users can select a movie and instantly view where and when it's playing on an interactive map, sorted by proximity to their current location.

## 🌐 Website Link

[https://cinema.cpark.dev](https://cinema.cpark.dev)

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
**Cinema Crawler Repository** [https://github.com/parkchaehyun/cinema-crawler](https://github.com/parkchaehyun/cinema-crawler)

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
  │   ├── useGeo.js              # Hook to get user geolocation
  │   └── useNaverMaps.js        # Hook to integrate Naver Map SDK
  ├── lib/
  │   └── supabase.js            # Supabase client configuration
  └── services/                  # API access layer to Supabase
      ├── cinemaService.js       # Fetch cinema metadata
      ├── movieService.js        # Fetch list of movies
      └── screeningService.js    # Fetch screening data
```

## License

The MIT License (MIT)

Copyright (c) 2025 Chaehyun Park
