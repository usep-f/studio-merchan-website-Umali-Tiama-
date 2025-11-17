document.addEventListener("DOMContentLoaded",()=>{
    const links=document.querySelectorAll("div a");

    links.forEach(link=>{
        link.addEventListener("click",event=>{
            event.preventDefault();
            const sectionId=link.getAttribute("data-section");
            document.getElementById(sectionId).scrollIntoView({
                behavior:"smooth"
            })
        })
    })

})

// 1. Import the database connection we just created
import { db } from './firebase-config.js'; 

// 2. Import the specific Firestore tools we need for logic
import { collection, getDocs, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 3. Your Logic Function (No changes needed inside)
async function loadArtists() {
    const container = document.getElementById('dynamic-artist-container');
    
    // Notice: we use 'db' here, which came from the import above!
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

// 4. Run it
loadArtists();