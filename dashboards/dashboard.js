/* =========================================
   1. IMPORTS & CONFIG
   ========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
const storage = getStorage(app);
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;

/* =========================================
   2. AUTH & PROFILE CHECK
   ========================================= */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("Logged in as:", user.email);
        
        // 1. Load Profile
        loadUserProfile(user.uid);
        // 2. Load Remote Projects
        loadRemoteProjects(user.uid);
        // 3. Load Studio Bookings
        loadStudioBookings(user.uid);

    } else {
        // Not logged in? Go back to login.
        window.location.href = "login.html";
    }
});

// Logout Logic
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "login.html");
});

async function loadUserProfile(uid) {
    const { data, error } = await supabase
        .from('clients')
        .select('full_name, role')
        .eq('client_uid', uid)
        .single();

    if (data) {
        document.getElementById('user-name-display').textContent = data.full_name;
        document.getElementById('user-role-display').textContent = data.role || 'Client';
        // First letter of name as avatar
        document.getElementById('user-initial').textContent = data.full_name.charAt(0).toUpperCase();
    }
}

/* =========================================
   3. REMOTE PROJECTS (Active & Past)
   ========================================= */
async function loadRemoteProjects(uid) {
    const activeContainer = document.getElementById('active-projects-list');
    const pastContainer = document.getElementById('past-projects-list');

    const { data, error } = await supabase
        .from('online_projects')
        .select('*')
        .eq('client_uid', uid)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading projects:", error);
        activeContainer.innerHTML = '<div class="text-danger">Failed to load projects.</div>';
        return;
    }

    // Clear loaders
    activeContainer.innerHTML = '';
    pastContainer.innerHTML = '';

    let hasActive = false;
    let hasPast = false;

    data.forEach(proj => {
        // Determine Status Color & Bucket
        const isPast = (proj.status === 'Completed' || proj.status === 'Cancelled');
        let statusClass = 'status-active';
        let badgeClass = 'bg-primary';

        if (proj.status === 'Pending') { statusClass = 'status-pending'; badgeClass = 'bg-warning text-dark'; }
        if (proj.status === 'Ready for Review') { statusClass = 'status-review'; badgeClass = 'bg-info text-dark'; }
        if (proj.status === 'Completed') { statusClass = 'status-done'; badgeClass = 'bg-success'; }

        // Revision Text
        let revText = `Revision ${proj.revisions_used} of ${proj.max_revisions}`;
        if(proj.revisions_used === 0) revText = "Initial Draft";

        // HTML Card
        const cardHtml = `
        <div class="project-card ${statusClass} d-flex justify-content-between align-items-center">
            <div>
                <h5 class="fw-bold mb-1">${proj.project_title}</h5>
                <div class="text-muted small">
                    <span class="me-3"><i class="bi bi-music-note-beamed"></i> ${proj.service_type}</span>
                    <span><i class="bi bi-arrow-repeat"></i> ${revText}</span>
                </div>
            </div>
            <div class="text-end">
                <span class="badge ${badgeClass} badge-custom mb-2">${proj.status}</span>
                ${ proj.status === 'Ready for Review' ? 
                   `<br><a href="#" class="btn btn-sm btn-outline-dark mt-1">Review Track</a>` : '' 
                }
            </div>
        </div>
        `;

        if (isPast) {
            pastContainer.innerHTML += cardHtml;
            hasPast = true;
        } else {
            activeContainer.innerHTML += cardHtml;
            hasActive = true;
        }
    });

    // Empty States
    if (!hasActive) activeContainer.innerHTML = '<div class="text-muted small p-3">No active projects right now. Click + to start one!</div>';
    if (!hasPast) pastContainer.innerHTML = '<div class="text-muted small">No completed projects yet.</div>';
}

/* =========================================
   4. NEW PROJECT UPLOAD LOGIC
   ========================================= */
document.getElementById('newProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('proj-title').value;
    const service = document.getElementById('proj-service').value;
    const genre = document.getElementById('proj-genre').value;
    const fileInput = document.getElementById('proj-file');
    
    // UI Feedback
    const btn = e.target.querySelector('button');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-bar');
    
    btn.disabled = true;
    btn.textContent = "UPLOADING...";
    progressContainer.classList.remove('d-none');

    // 1. Upload File to Firebase Storage
    try {
        const file = fileInput.files[0];
        // Path: user_uid/timestamp_filename
        const storagePath = `client_uploads/${currentUser.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        // Upload
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        progressBar.style.width = "50%"; // File done

        // 2. Save Data to Supabase
        const { error } = await supabase.from('online_projects').insert([{
            client_uid: currentUser.uid,
            project_title: title,
            service_type: service,
            genre: genre,
            file_link: downloadURL,
            status: 'Pending',
            revisions_used: 0
        }]);

        if (error) throw error;

        progressBar.style.width = "100%";
        setTimeout(() => {
            alert("Project Submitted Successfully!");
            // Close modal manually
            const modalEl = document.getElementById('uploadModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            // Reset form & Refresh list
            e.target.reset();
            btn.disabled = false;
            btn.textContent = "SUBMIT PROJECT";
            progressContainer.classList.add('d-none');
            loadRemoteProjects(currentUser.uid);
        }, 500);

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
        btn.disabled = false;
        btn.textContent = "SUBMIT PROJECT";
    }
});

/* =========================================
   5. STUDIO BOOKINGS LIST
   ========================================= */
async function loadStudioBookings(uid) {
    const container = document.getElementById('bookings-list');
    
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        // NOTE: This assumes you added 'client_uid' to bookings table!
        // If not, this query will return nothing.
        // .eq('client_uid', uid) 
        .order('start_date', { ascending: false });

    if (data && data.length > 0) {
        let html = '';
        data.forEach(b => {
            let statusColor = b.status === 'Confirmed' ? 'text-success' : 'text-warning';
            html += `
            <tr>
                <td><strong>${b.start_date}</strong></td>
                <td>${b.studio}</td>
                <td class="${statusColor} fw-bold">${b.status}</td>
                <td>
                    ${b.status === 'Pending' ? '<button class="btn btn-sm btn-link text-danger p-0">Cancel</button>' : '-'}
                </td>
            </tr>
            `;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">No studio sessions found.</td></tr>';
    }
}