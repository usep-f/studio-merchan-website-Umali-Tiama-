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

01110011 01110100 00101110 00100000 01100011 01100001 01110010 01101100 01101111 00100000 01100001 01100011 01110101 01110100 01101001 01110011 00101100 00100000 01110000 01110010 01100001 01111001 00100000 01100110 01101111 01110010 00100000 01110101 01110011
