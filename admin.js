/* =========================================
   1. IMPORTS & CONFIG
   ========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// --- FIREBASE CONFIG ---
// (Keep your existing config here)
const firebaseConfig = {
    apiKey: "AIzaSyBd-IxyiDnyfwv7XDntnfHesmqD4_p8fzo",
    authDomain: "studio-merchan.firebaseapp.com",
    projectId: "studio-merchan",
    storageBucket: "studio-merchan.firebasestorage.app",
    messagingSenderId: "148020122490",
    appId: "1:148020122490:web:5c06af526e6b47a77b3cc3",
    measurementId: "G-QMC8J9PP9D"
};

// --- SUPABASE CONFIG ---
// ⚠️ PASTE YOUR KEYS HERE ⚠️
const supabaseUrl = 'https://cishguvndzwtlbchhqbf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2hndXZuZHp3dGxiY2hocWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg0NjMsImV4cCI6MjA3OTMzNDQ2M30.kKcLTk5BTTyDF_tcwTORM93vp-3rDtCpSmj9ypoZECY';

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const supabase = createClient(supabaseUrl, supabaseKey);

/* =========================================
   2. AUTHENTICATION
   ========================================= */
// Expose functions to window so HTML can call them
window.login = () => {
    const e = document.getElementById("login-email").value;
    const p = document.getElementById("login-password").value;
    signInWithEmailAndPassword(auth, e, p).catch((err) => {
        document.getElementById("login-error").textContent = err.message;
    });
};

window.logout = () => signOut(auth);

// Auth Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("dashboard-screen").classList.remove("hidden");
        loadSlotData(); // Load Carousel by default
    } else {
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("dashboard-screen").classList.add("hidden");
    }
});

/* =========================================
   3. NAVIGATION LOGIC
   ========================================= */
window.showSection = (sectionId) => {
    // Hide all sections
    document.getElementById('section-carousel').classList.add('hidden');
    document.getElementById('section-bookings').classList.add('hidden');
    
    // Reset buttons
    document.getElementById('btn-carousel').classList.remove('active');
    document.getElementById('btn-bookings').classList.remove('active');

    // Show target
    document.getElementById('section-' + sectionId).classList.remove('hidden');
    document.getElementById('btn-' + sectionId).classList.add('active');

    // Fetch Data if needed
    if (sectionId === 'bookings') fetchAdminBookings();
};

/* =========================================
   4. CAROUSEL MANAGER (Firestore)
   ========================================= */
window.loadSlotData = async () => {
    const slotNum = document.getElementById("slot-selector").value;
    const docId = "artist_" + slotNum;
    
    // Clear inputs
    document.getElementById("art-name").value = "";
    document.getElementById("art-link").value = "";
    document.getElementById("art-fb").value = "";
    document.getElementById("art-ig").value = "";
    document.getElementById("art-sc").value = "";

    try {
        const docSnap = await getDoc(doc(db, "featured_artists", docId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("art-name").value = data.name || "";
            document.getElementById("art-link").value = data.image_url || "";
            document.getElementById("art-fb").value = data.fb_link || "";
            document.getElementById("art-ig").value = data.ig_link || "";
            document.getElementById("art-sc").value = data.sc_link || "";
        }
    } catch (e) { console.error("Firestore Error:", e); }
};

window.saveSlot = async () => {
    const slotNum = document.getElementById("slot-selector").value;
    const docId = "artist_" + slotNum;
    const name = document.getElementById("art-name").value;
    let rawLink = document.getElementById("art-link").value;

    if (!name || !rawLink) { alert("Name and Image are required!"); return; }

    // Google Drive Link Converter
    const idMatch = rawLink.match(/\/d\/(.+?)\//);
    if (idMatch && idMatch[1]) {
        rawLink = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    }

    try {
        await setDoc(doc(db, "featured_artists", docId), {
            name: name,
            image_url: rawLink,
            fb_link: document.getElementById("art-fb").value || "#",
            ig_link: document.getElementById("art-ig").value || "#",
            sc_link: document.getElementById("art-sc").value || "#",
            order: Number(slotNum)
        });
        alert(`Slot ${slotNum} Updated Successfully!`);
    } catch (e) { alert("Error: " + e.message); }
};

/* =========================================
   5. BOOKINGS MANAGER (Supabase)
   ========================================= */
window.fetchAdminBookings = async () => {
    const tbody = document.getElementById('bookings-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">Loading bookings...</td></tr>';

    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('start_date', { ascending: false });

    if (error) {
        alert('Supabase Error: ' + error.message);
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">No bookings found.</td></tr>';
        return;
    }

    let html = '';
    data.forEach(b => {
        // Badge Color Logic
        let badgeClass = 'bg-warning text-dark';
        if (b.status === 'Confirmed') badgeClass = 'bg-success';
        
        html += `
        <tr>
            <td class="ps-4"><span class="badge ${badgeClass} rounded-pill px-3 py-2">${b.status}</span></td>
            <td>
                <div class="fw-bold">${b.start_date}</div>
                <div class="small text-muted">to ${b.end_date}</div>
            </td>
            <td>
                <div class="fw-bold text-primary">${b.studio}</div>
                <div class="small">${b.service_type}</div>
            </td>
            <td>
                <div class="fw-bold">${b.customer_name}</div>
                <div class="small text-muted"><i class="bi bi-telephone me-1"></i>${b.customer_contact}</div>
            </td>
            <td class="text-end pe-4">
                ${b.status === 'Pending' ? 
                    `<button onclick="updateStatus(${b.id}, 'Confirmed')" class="btn btn-sm btn-success me-2" title="Confirm"><i class="bi bi-check-lg"></i></button>` 
                    : ''}
                <button onclick="deleteBooking(${b.id})" class="btn btn-sm btn-danger" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
        `;
    });
    tbody.innerHTML = html;
};

window.updateStatus = async (id, newStatus) => {
    if(!confirm(`Confirm this booking?`)) return;
    
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    if (error) alert(error.message);
    else fetchAdminBookings();
};

window.deleteBooking = async (id) => {
    if(!confirm('Delete this booking? This action cannot be undone.')) return;

    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchAdminBookings();
};