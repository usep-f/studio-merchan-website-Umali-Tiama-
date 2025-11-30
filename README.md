# Studio Merchan Website

Official website for Studio Merchan, a professional recording studio in Lucena City offering recording, mixing, mastering, and live sound services.

## Overview

This project is a multi-page static website with dynamic features powered by Firebase and Supabase. It includes a public-facing brochure site, a client dashboard for project management, and an admin CMS for internal operations.

## Features

### Public Interface

- **Home:** Featured artists carousel, studio showcase, and testimonials.
- **Services:** Detailed sub-pages for Recording, Mixing, Mastering, and Live Sound.
- **Studios:** Virtual tours of Studio A, Studio B, and Studio C.
- **Team:** Profiles of engineers and staff.
- **Contact:** Message form and review submission system.

### Client Dashboard

- **Authentication:** User registration and login via Firebase Auth.
- **Profile Management:** Artist/Band profile setup.
- **Project Tracking:** View status of remote mixing/mastering projects.
- **Booking System:**
  - Quick book studio sessions.
  - Book live sound events.
  - Real-time availability checks.

### Admin Dashboard (CMS)

- **Booking Management:** Approve/Reject studio and live event requests.
- **Content Management:** Update "Featured Artists" carousel.
- **Client Database:** View registered users and their activity stats.
- **Inbox:** Read and manage contact form messages.
- **Reviews:** Moderate and approve client testimonials.

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
- **Framework:** Bootstrap 5.3.8 (Grid & Components)
- **Styling:** Custom CSS using the Studio Merchan Design System
- **Fonts:** Urbanist (Google Fonts)
- **Backend & Auth:** Firebase (Authentication, Firestore, Storage, Hosting)
- **Database:** Supabase (Relational data for bookings & clients)
- **Libraries:** FullCalendar (Booking interface), Bootstrap Icons

## Design System

The website follows a strict design consistency checklist:

- **Typography:** 'Urbanist' (Sans-serif).
  - Hero Titles: 4rem-5rem (Desktop), 3rem (Mobile), Weight 900.
- **Colors:**
  - Primary Dark Blue: `#003766`
  - Primary Orange: `#c8761d`
  - Background: `#D4D4E4`
- **Layout:**
  - Desktop: Multi-column grids with significant padding (6rem+).
  - Mobile: Single-column vertical stacks with reduced padding (1.5rem).

/
├── index.html # Homepage
├── aboutus.html # About page
├── services.html # Services hub
├── team.html # Team page
├── contact.html # Contact & Reviews
├── booking.html # Public Booking page
├── admin.html # Admin CMS login & dashboard
├── style.css # Main stylesheet
├── script.js # Main logic (Carousel/Testimonials)
├── assets/ # Images and icons
│
├── dashboards/ # Client-side app
│ ├── login.html
│ ├── signup.html
│ ├── dashboard.html
│ └── ... (Auth & Dashboard logic)
│
├── services subfolder/ # Individual service pages
│ ├── recordingservice.html
│ ├── mixingservice.html
│ └── ...
│
├── studios subfolder/ # Individual studio pages
│ ├── studioA.html
│ ├── studioB.html
│ └── ...
│
└── firebase-config.js # Shared Firebase configuration
