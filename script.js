// 1. Import the database connection
import { db } from './firebase-config.js'; 

// 2. Import Firestore tools
import { collection, getDocs, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =========================================
// SECTION A: LOAD ARTISTS (Existing)
// =========================================
async function loadArtists() {
    const container = document.getElementById('dynamic-artist-container');
    if (!container) return; // Skip if not on homepage

    const q = query(collection(db, "featured_artists"), orderBy("order"));
    
    try {
        const querySnapshot = await getDocs(q);
        let isFirstItem = true;
        let finalHtml = "";

        querySnapshot.forEach((doc) => {
            const artist = doc.data();
            const activeClass = isFirstItem ? 'active' : '';
            
            finalHtml += `
            <div class="carousel-item ${activeClass}">
                <div class="artist-card mx-auto">
                    <img src="${artist.image_url}" class="d-block w-100 artist-img" style="object-fit: cover; height: 500px;" alt="${artist.name}">
                    <div class="artist-info d-flex justify-content-between align-items-center px-3 py-2">
                        <span class="artist-name">${artist.name}</span>
                        <div class="artist-social">
                            <a href="${artist.ig_link}" target="_blank" class="mx-2"><i class="bi bi-instagram"></i></a>
                            <a href="${artist.fb_link}" target="_blank" class="mx-2"><i class="bi bi-facebook"></i></a>
                            <a href="${artist.sc_link}" target="_blank" class="mx-2"><i class="bi bi-spotify"></i></a>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            isFirstItem = false;
        });

        container.innerHTML = finalHtml;

    } catch (error) {
        console.error("Error loading artists:", error);
    }
}

// =========================================
// SECTION B: LOAD TESTIMONIALS (New)
// =========================================
async function loadTestimonials() {
    const container = document.getElementById('dynamic-testimonials-container');
    if (!container) return; // Skip if not on homepage

    // We order by 'order' field so you can control who appears first
    const q = query(collection(db, "testimonials"), orderBy("order"));

    try {
        const querySnapshot = await getDocs(q);
        let finalHtml = "";

        querySnapshot.forEach((doc) => {
            const t = doc.data();
            
            // Using your exact CSS classes for styling
            finalHtml += `
            <div class="col-md-5">
                <div class="testimonial-card p-4 text-start">
                    <div class="d-flex align-items-center mb-3">
                        <img src="${t.image_url}" alt="${t.name}" class="testimonial-img me-3">
                        <div>
                            <h5 class="mb-0">${t.name}</h5>
                            <small class="text-muted">${t.role}</small>
                        </div>
                    </div>
                    <p class="testimonial-text">
                        ${t.quote}
                    </p>
                </div>
            </div>
            `;
        });

        if (finalHtml === "") {
            container.innerHTML = '<div class="text-center text-white p-5">No reviews found.</div>';
        } else {
            container.innerHTML = finalHtml;
        }

    } catch (error) {
        console.error("Error loading testimonials:", error);
        container.innerHTML = '<div class="text-center text-danger p-5">Failed to load reviews.</div>';
    }
}

// =========================================
// SECTION C: INITIALIZE
// =========================================
// Run both functions when the page loads
loadArtists();
loadTestimonials();