/* =========================================
   1. IMPORTS & CONFIG
   ========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, deleteDoc, updateDoc, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// ADDED: Storage Imports
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// --- FIREBASE CONFIG ---
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
const storage = getStorage(app); // ADDED: Storage Init
const supabase = createClient(supabaseUrl, supabaseKey);

/* =========================================
   2. AUTHENTICATION
   ========================================= */
window.login = () => {
    const e = document.getElementById("login-email").value;
    const p = document.getElementById("login-password").value;
    signInWithEmailAndPassword(auth, e, p).catch((err) => {
        // This will tell you EXACTLY why login failed
        console.error("Login Error:", err);
        document.getElementById("login-error").textContent = err.message;
    });
};

window.logout = () => signOut(auth);

// Auth Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("dashboard-screen").classList.remove("hidden");
        loadSlotData(); 
    } else {
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("dashboard-screen").classList.add("hidden");
    }
});

/* =========================================
   3. NAVIGATION LOGIC
   ========================================= */
window.showSection = (sectionId) => {
    // Hide all
    document.getElementById('section-carousel').classList.add('hidden');
    document.getElementById('section-bookings').classList.add('hidden');
    document.getElementById('section-testimonials').classList.add('hidden'); 
    
    // Reset buttons
    document.getElementById('btn-carousel').classList.remove('active');
    document.getElementById('btn-bookings').classList.remove('active');
    document.getElementById('btn-testimonials').classList.remove('active'); 

    // Show target
    document.getElementById('section-' + sectionId).classList.remove('hidden');
    document.getElementById('btn-' + sectionId).classList.add('active');

    // Fetch Data
    if (sectionId === 'bookings') fetchAdminBookings();
    if (sectionId === 'testimonials') fetchTestimonials(); 
};

/* =========================================
   4. CAROUSEL MANAGER (Firestore)
   ========================================= */
window.loadSlotData = async () => {
    const slotNum = document.getElementById("slot-selector").value;
    const docId = "artist_" + slotNum;
    
    document.querySelectorAll("#section-carousel input").forEach(i => i.value = "");

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
    const fileInput = document.getElementById("art-file");
    const oldUrl = document.getElementById("art-link").value; // From hidden input

    if (!name) { alert("Artist Name is required!"); return; }

    let finalImageUrl = oldUrl;

    // 1. Handle Image Upload (If user selected a file)
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        try {
            // Name it consistently (e.g., "artists/artist_1") so it overwrites old files automatically
            const storageRef = ref(storage, `artists/${docId}`);
            const snapshot = await uploadBytes(storageRef, file);
            finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            alert("Upload Failed: " + error.message);
            return;
        }
    }

    if (!finalImageUrl) { alert("Please upload an image!"); return; }

    // 2. Save to Firestore
    try {
        await setDoc(doc(db, "featured_artists", docId), {
            name: name,
            image_url: finalImageUrl,
            fb_link: document.getElementById("art-fb").value || "#",
            ig_link: document.getElementById("art-ig").value || "#",
            sc_link: document.getElementById("art-sc").value || "#",
            order: Number(slotNum)
        });
        alert(`Slot ${slotNum} Updated Successfully!`);
        
        // Update hidden input so we remember this new image
        document.getElementById("art-link").value = finalImageUrl;
        fileInput.value = ""; // Clear file selector
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
    if(!confirm('Delete this booking?')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchAdminBookings();
};

/* =========================================
   6. TESTIMONIALS MANAGER (Firestore + Storage)
   ========================================= */
// --- A. FETCH & RENDER ---
window.fetchTestimonials = async () => {
    const tbody = document.getElementById('testimonials-table-body');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">Loading...</td></tr>';

    const q = query(collection(db, "testimonials"), orderBy("order"));
    
    try {
        const querySnapshot = await getDocs(q);
        let html = '';
        
        querySnapshot.forEach((doc) => {
            const t = doc.data();
            const id = doc.id;
            
            // Escape quotes for HTML attribute
            const editData = JSON.stringify({ id, ...t }).replace(/"/g, "&quot;");

            html += `
            <tr>
                <td class="ps-4">
                    <div class="d-flex align-items-center">
                        <img src="${t.image_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" class="me-3">
                        <div>
                            <div class="fw-bold">${t.name}</div>
                            <div class="small text-muted">${t.role}</div>
                        </div>
                    </div>
                </td>
                <td style="max-width: 300px;">
                    <div class="text-truncate small text-muted">"${t.quote}"</div>
                </td>
                <td class="text-end pe-4">
                    <button onclick="editTestimonial(${editData})" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i></button>
                    <button onclick="deleteTestimonial('${id}')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
            `;
        });

        if(html === '') html = '<tr><td colspan="3" class="text-center p-4 text-muted">No testimonials found.</td></tr>';
        tbody.innerHTML = html;

    } catch (e) {
        console.error(e);
        alert("Error loading reviews: " + e.message);
    }
};

// --- B. SAVE (ADD / UPDATE) ---
window.saveTestimonial = async () => {
    const id = document.getElementById('testi-id').value;
    const name = document.getElementById('testi-name').value;
    const role = document.getElementById('testi-role').value;
    const quote = document.getElementById('testi-quote').value;
    const fileInput = document.getElementById('testi-file');
    const oldUrl = document.getElementById('testi-img-url').value;

    if (!name || !quote) { alert("Name and Quote are required!"); return; }

    let finalImageUrl = oldUrl;

    // 1. Handle Image Upload
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        try {
            // Unique name with timestamp to avoid conflicts
            const filename = `testimonials/${name}_${Date.now()}`;
            const storageRef = ref(storage, filename);
            const snapshot = await uploadBytes(storageRef, file);
            finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            alert("Upload Failed: " + error.message);
            return;
        }
    }

    if (!finalImageUrl) { alert("Please upload an image!"); return; }

    // 2. Save to Firestore
    try {
        const docData = {
            name, 
            role, 
            quote, 
            image_url: finalImageUrl,
            order: Date.now() 
        };

        if (id) {
            await updateDoc(doc(db, "testimonials", id), docData);
            alert("Updated successfully!");
        } else {
            await addDoc(collection(db, "testimonials"), docData);
            alert("Added successfully!");
        }

        resetTestiForm();
        fetchTestimonials();

    } catch (e) {
        alert("Database Error: " + e.message);
    }
};

// --- C. DELETE ---
window.deleteTestimonial = async (id) => {
    if(!confirm("Delete this review?")) return;
    try {
        await deleteDoc(doc(db, "testimonials", id));
        fetchTestimonials();
    } catch (e) {
        alert(e.message);
    }
};

// --- D. HELPERS ---
window.editTestimonial = (data) => {
    document.getElementById('testi-id').value = data.id;
    document.getElementById('testi-name').value = data.name;
    document.getElementById('testi-role').value = data.role;
    document.getElementById('testi-quote').value = data.quote;
    document.getElementById('testi-img-url').value = data.image_url;
    document.getElementById('testi-form-title').textContent = "Edit Review";
};

window.resetTestiForm = () => {
    document.getElementById('testi-id').value = "";
    document.getElementById('testi-name').value = "";
    document.getElementById('testi-role').value = "";
    document.getElementById('testi-quote').value = "";
    document.getElementById('testi-file').value = "";
    document.getElementById('testi-img-url').value = "";
    document.getElementById('testi-form-title').textContent = "Add New Review";
};