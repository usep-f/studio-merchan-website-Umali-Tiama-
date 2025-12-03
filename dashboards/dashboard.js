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
const supabaseUrl = 'https://cishguvndzwtlbchhqbf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2hndXZuZHp3dGxiY2hocWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg0NjMsImV4cCI6MjA3OTMzNDQ2M30.kKcLTk5BTTyDF_tcwTORM93vp-3rDtCpSmj9ypoZECY';

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let userProfileData = null; // Global store for Quick Book data

/* =========================================
   2. GLOBAL FUNCTIONS (Defined Top-Level)
   ========================================= */
window.requestRevision = async (id, currentCount) => {
    const notes = prompt("What changes would you like? (e.g. 'Vocals are too quiet')");
    if (notes) {
        try {
            const { error } = await supabase.from('online_projects').update({ 
                revisions_used: currentCount + 1,
                status: 'Revision Requested',
                revision_notes: notes
            }).eq('id', id);

            if (error) throw error;
            alert("Revision requested!");
            if(currentUser) loadRemoteProjects(currentUser.uid);
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
};

window.markCompleted = async (id) => {
    if(!confirm("Mark as Completed?")) return;
    const { error } = await supabase.from('online_projects').update({ status: 'Completed' }).eq('id', id);
    if(!error && currentUser) loadRemoteProjects(currentUser.uid);
};

window.deleteProject = async (id) => {
    if(!confirm("Remove this project history?")) return;
    const { error } = await supabase.from('online_projects').delete().eq('id', id);
    if(!error && currentUser) loadRemoteProjects(currentUser.uid);
};

/* =========================================
   3. AUTH & LOADING (The Main Entry Point)
   ========================================= */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("Logged in:", user.uid);
        
        // 1. Reveal Dashboard (Stop the loading state)
        document.body.classList.remove('loading-state');

        // 2. Wait for Profile (Vital for Quick Book)
        await loadUserProfile(user.uid);
        
        // 3. Load Tables
        loadRemoteProjects(user.uid);
        loadStudioBookings(user.uid);
        loadLiveBookings(user.uid);
    } else {
        // Use REPLACE to prevent "Back Button" loop
        window.location.replace("login.html");
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "login.html");
});

/* =========================================
   4. USER PROFILE LOADER
   ========================================= */
async function loadUserProfile(uid) {
    const { data, error } = await supabase.from('clients').select('*').eq('client_uid', uid).single();

    if (data) {
        userProfileData = data; 
        document.getElementById('user-name-display').textContent = data.full_name;
        document.getElementById('user-role-display').textContent = data.role || 'Client';
        
        const initEl = document.getElementById('user-initial');
        if(initEl && data.full_name) initEl.textContent = data.full_name.charAt(0).toUpperCase();
    } else {
        console.error("Profile missing:", error);
        document.getElementById('user-name-display').textContent = "Profile Error";
        alert("Account Error: Your profile is missing. Please create a NEW account via Sign Up.");
    }
}

/* =========================================
   5. REMOTE PROJECTS LOADER
   ========================================= */
async function loadRemoteProjects(uid) {
    const activeContainer = document.getElementById('active-projects-list');
    const pastContainer = document.getElementById('past-projects-list');

    const { data: projects } = await supabase.from('online_projects').select('*').eq('client_uid', uid).order('created_at', { ascending: false });
    const { data: deliverables } = await supabase.from('project_deliverables').select('*').order('created_at', { ascending: false });

    if (!activeContainer || !pastContainer) return;

    activeContainer.innerHTML = '';
    pastContainer.innerHTML = '';
    let hasActive = false;
    let hasPast = false;

    if (projects) {
        projects.forEach(proj => {
            const latestMix = deliverables ? deliverables.find(d => d.project_id === proj.id) : null;
            const isPast = (proj.status === 'Completed' || proj.status === 'Cancelled');
            
            let statusClass = 'status-active';
            let badgeClass = 'bg-primary';

            if (proj.status === 'Pending') { statusClass = 'status-pending'; badgeClass = 'bg-warning text-dark'; }
            if (proj.status === 'Ready for Review') { statusClass = 'status-review'; badgeClass = 'bg-info text-dark'; }
            if (proj.status === 'Completed') { statusClass = 'status-done'; badgeClass = 'bg-success'; }

            let actionContent = '';
            if (isPast && latestMix) {
                actionContent = `<div class="mt-2"><a href="${latestMix.file_link}" target="_blank" class="btn btn-sm btn-success w-100"><i class="bi bi-download"></i> Final Master</a></div>`;
            } else if (latestMix && proj.status === 'Ready for Review') {
                actionContent = `
                    <div class="mt-2 p-2 bg-white border rounded">
                        <strong class="text-success small d-block mb-2">New Mix: ${latestMix.version_name}</strong>
                        <div class="d-flex gap-1">
                            <a href="${latestMix.file_link}" target="_blank" class="btn btn-sm btn-success flex-grow-1"><i class="bi bi-play-circle"></i> Listen</a>
                            <button onclick="window.requestRevision(${proj.id}, ${proj.revisions_used})" class="btn btn-sm btn-outline-danger"><i class="bi bi-arrow-counterclockwise"></i></button>
                            <button onclick="window.markCompleted(${proj.id})" class="btn btn-sm btn-outline-primary"><i class="bi bi-check"></i></button>
                        </div>
                    </div>`;
            } else if (proj.status === 'Revision Requested') {
                actionContent = `<div class="mt-2 small text-warning"><i class="bi bi-hourglass-split"></i> Waiting for engineer...</div>`;
            }

            const cardHtml = `
            <div class="project-card ${statusClass} mb-3 p-3 border rounded bg-light">
                <div class="d-flex justify-content-between">
                    <div>
                        <h5 class="fw-bold mb-1">${proj.project_title}</h5>
                        <div class="small text-muted">${proj.service_type} • Rev: ${proj.revisions_used}</div>
                        ${actionContent}
                    </div>
                    <div class="text-end">
                        <span class="badge ${badgeClass} mb-2">${proj.status}</span>
                        ${isPast ? `<button onclick="deleteProject(${proj.id})" class="btn btn-sm btn-link text-muted p-0 d-block ms-auto"><i class="bi bi-trash"></i></button>` : ''}
                    </div>
                </div>
            </div>`;

            if (isPast) { pastContainer.innerHTML += cardHtml; hasPast = true; } 
            else { activeContainer.innerHTML += cardHtml; hasActive = true; }
        });
    }

    if (!hasActive) activeContainer.innerHTML = '<div class="text-muted small p-3">No active projects. Click + to start!</div>';
    if (!hasPast) pastContainer.innerHTML = '<div class="text-muted small">No completed projects yet.</div>';
}

/* =========================================
   6. UPLOAD FORM HANDLER
   ========================================= */
const uploadForm = document.getElementById('newProjectForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const progressBar = document.getElementById('upload-bar');
        document.getElementById('upload-progress-container').classList.remove('d-none');
        btn.disabled = true; btn.textContent = "UPLOADING...";

        try {
            const file = document.getElementById('proj-file').files[0];
            const storageRef = ref(storage, `client_uploads/${currentUser.uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            progressBar.style.width = "50%";

            await supabase.from('online_projects').insert([{
                client_uid: currentUser.uid,
                project_title: document.getElementById('proj-title').value,
                service_type: document.getElementById('proj-service').value,
                genre: document.getElementById('proj-genre').value,
                file_link: downloadURL,
                status: 'Pending',
                revisions_used: 0
            }]);

            progressBar.style.width = "100%";
            alert("Project Submitted!");
            
            const modalEl = document.getElementById('uploadModal');
            if(window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
            }
            
            e.target.reset();
            loadRemoteProjects(currentUser.uid);

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = "SUBMIT PROJECT";
            document.getElementById('upload-progress-container').classList.add('d-none');
        }
    });
}

/* =========================================
   7. STUDIO BOOKINGS LOADER
   ========================================= */
async function loadStudioBookings(uid) {
    const container = document.getElementById('bookings-list');
    if(!container) return;

    const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_uid', uid)
        .order('start_date', { ascending: false });

    if (data && data.length > 0) {
        container.innerHTML = data.map(b => {
            let badgeClass = b.status === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark';
            return `
            <tr>
                <td><span class="badge ${badgeClass}">${b.status}</span></td>
                <td>${b.service_type}</td>
                <td>${b.studio}</td>
                <td>${b.start_date} <small class="text-muted">to</small> ${b.end_date}</td>
            </tr>`;
        }).join('');
    } else {
        container.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">No studio sessions found.</td></tr>';
    }
}

/* =========================================
   8. LIVE BOOKINGS LOADER
   ========================================= */
async function loadLiveBookings(uid) {
    const container = document.getElementById('live-bookings-list');
    if(!container) return;

    const { data } = await supabase
        .from('live_bookings')
        .select('*')
        .eq('client_uid', uid)
        .order('start_time', { ascending: false });

    if (data && data.length > 0) {
        container.innerHTML = data.map(b => {
            let badgeClass = b.status === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark';
            const dateStr = new Date(b.start_time).toLocaleDateString();
            const timeStr = new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
            <tr>
                <td><span class="badge ${badgeClass}">${b.status}</span></td>
                <td>${b.event_type}</td>
                <td>${b.package}</td>
                <td>
                    <div class="fw-bold">${dateStr}</div>
                    <div class="small text-muted">${timeStr}</div>
                </td>
            </tr>`;
        }).join('');
    } else {
        container.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">No live events found.</td></tr>';
    }
}

/* =========================================
   9. QUICK BOOK HANDLER
   ========================================= */
const quickBookForm = document.getElementById('quick-book-form');
if (quickBookForm) {
    quickBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!userProfileData) {
            alert("Profile loading... please wait.");
            return;
        }

        const btn = e.target.querySelector('button');
        btn.textContent = "BOOKING...";
        btn.disabled = true;

        const start = document.getElementById('qb-start').value;
        const end = document.getElementById('qb-end').value;

        if (end < start) { 
            alert("End date cannot be before start date."); 
            btn.textContent = "CONFIRM BOOKING";
            btn.disabled = false; 
            return; 
        }
        
        try {
            const { error } = await supabase.from('bookings').insert([{
                client_uid: currentUser.uid,
                customer_name: userProfileData.full_name,
                customer_contact: userProfileData.phone_number,
                service_type: document.getElementById('qb-service').value,
                studio: document.getElementById('qb-studio').value,
                start_date: start,
                end_date: end,
                status: 'Pending'
            }]);

            if (error) throw error;

            alert("Session Requested Successfully!");
            e.target.reset();
            
            // Close Collapse if using Bootstrap
            const collapseEl = document.getElementById('quickBookCollapse');
            if(window.bootstrap && collapseEl) {
                new bootstrap.Collapse(collapseEl, { toggle: false }).hide();
            }

            loadStudioBookings(currentUser.uid); // Refresh Table

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.textContent = "CONFIRM BOOKING";
            btn.disabled = false;
        }
    });
}

/* =========================================
   10. LIVE SOUND QUICK BOOK HANDLER
   ========================================= */
const quickBookLiveForm = document.getElementById('quick-book-live-form');
if (quickBookLiveForm) {
    quickBookLiveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!userProfileData) {
            alert("Profile loading... please wait.");
            return;
        }

        const btn = e.target.querySelector('button');
        btn.textContent = "BOOKING...";
        btn.disabled = true;

        const start = document.getElementById('qbl-start').value;
        const end = document.getElementById('qbl-end').value;

        // Validation: End must be after Start
        if (end <= start) { 
            alert("End time must be after start time."); 
            btn.textContent = "CONFIRM EVENT";
            btn.disabled = false; 
            return; 
        }
        
        try {
            const { error } = await supabase.from('live_bookings').insert([{
                client_uid: currentUser.uid,
                customer_name: userProfileData.full_name,       // Auto-filled
                contact_number: userProfileData.phone_number,   // Auto-filled (Note: column is 'contact_number' in live_bookings)
                event_type: document.getElementById('qbl-type').value,
                package: document.getElementById('qbl-package').value,
                location: document.getElementById('qbl-location').value,
                start_time: start,
                end_time: end,
                status: 'Pending'
            }]);

            if (error) throw error;

            alert("Live Event Requested Successfully!");
            e.target.reset();
            
            // Close Collapse if using Bootstrap
            const collapseEl = document.getElementById('quickBookLiveCollapse');
            if(window.bootstrap && collapseEl) {
                new bootstrap.Collapse(collapseEl, { toggle: false }).hide();
            }

            // Refresh the Live table immediately
            loadLiveBookings(currentUser.uid);

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.textContent = "CONFIRM EVENT";
            btn.disabled = false;
        }
    });
}