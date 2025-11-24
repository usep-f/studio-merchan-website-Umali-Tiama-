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
   2. GLOBAL FUNCTIONS (DEFINED FIRST)
   ========================================= */
// We define these at the top so they are ready immediately

// Request Revision Logic
window.requestRevision = async (id, currentCount) => {
    console.log("Requesting revision for:", id);
    const notes = prompt("What changes would you like? (e.g. 'Vocals are too quiet')");
    
    if (notes) {
        try {
            const { error } = await supabase
                .from('online_projects')
                .update({ 
                    revisions_used: currentCount + 1,
                    status: 'Revision Requested',
                    revision_notes: notes
                })
                .eq('id', id);

            if (error) throw error;

            alert("Revision requested! The engineer has been notified.");
            // Reload data
            if(currentUser) loadRemoteProjects(currentUser.uid);

        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        }
    }
};

// Mark Completed Logic
window.markCompleted = async (id) => {
    console.log("Completing project:", id);
    if(!confirm("Happy with the mix? This will mark the project as Completed.")) return;
    
    const { error } = await supabase
        .from('online_projects')
        .update({ status: 'Completed' })
        .eq('id', id);

    if(!error) {
        if(currentUser) loadRemoteProjects(currentUser.uid);
    } else {
        alert(error.message);
    }
};

// Delete Project Logic
window.deleteProject = async (id) => {
    if(!confirm("Remove this project from your history? This cannot be undone.")) return;

    const { error } = await supabase
        .from('online_projects')
        .delete()
        .eq('id', id);

    if(!error) {
        // Refresh the list
        if(currentUser) loadRemoteProjects(currentUser.uid);
    } else {
        alert("Error: " + error.message);
    }
};

/* =========================================
   3. AUTH & LOADING
   ========================================= */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("Logged in:", user.uid);
        
        // Load Data
        loadUserProfile(user.uid);
        loadRemoteProjects(user.uid);
        loadStudioBookings(user.uid);
    } else {
        window.location.href = "login.html";
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "login.html");
});

async function loadUserProfile(uid) {
    const { data } = await supabase.from('clients').select('full_name, role').eq('client_uid', uid).single();
    if (data) {
        document.getElementById('user-name-display').textContent = data.full_name;
        document.getElementById('user-role-display').textContent = data.role || 'Client';
        document.getElementById('user-initial').textContent = data.full_name.charAt(0).toUpperCase();
    }
}

/* =========================================
   4. REMOTE PROJECTS LOADER
   ========================================= */
async function loadRemoteProjects(uid) {
    const activeContainer = document.getElementById('active-projects-list');
    const pastContainer = document.getElementById('past-projects-list');

    // 1. Fetch Projects
    const { data: projects, error } = await supabase
        .from('online_projects')
        .select('*')
        .eq('client_uid', uid)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading projects:", error);
        return;
    }

    // 2. Fetch Deliverables
    const { data: deliverables } = await supabase
        .from('project_deliverables')
        .select('*')
        .order('created_at', { ascending: false });

    activeContainer.innerHTML = '';
    pastContainer.innerHTML = '';

    let hasActive = false;
    let hasPast = false;

    projects.forEach(proj => {
        const latestMix = deliverables.find(d => d.project_id === proj.id);
        const isPast = (proj.status === 'Completed' || proj.status === 'Cancelled');
        
        // Styling Logic
        let statusClass = 'status-active';
        let badgeClass = 'bg-primary';

        if (proj.status === 'Pending') { statusClass = 'status-pending'; badgeClass = 'bg-warning text-dark'; }
        if (proj.status === 'Ready for Review') { statusClass = 'status-review'; badgeClass = 'bg-info text-dark'; }
        if (proj.status === 'Revision Requested') { statusClass = 'status-pending'; badgeClass = 'bg-warning text-dark'; }
        if (proj.status === 'Completed') { statusClass = 'status-done'; badgeClass = 'bg-success'; }

        let revText = `Revision ${proj.revisions_used} of ${proj.max_revisions}`;
        if(proj.revisions_used === 0) revText = "Initial Draft";

        // --- DYNAMIC ACTION AREA ---
        let actionContent = '';
        
        // CASE A: COMPLETED (Past Project) - SHOW DOWNLOAD ONLY
        if (isPast && latestMix) {
            actionContent = `
                <div class="mt-3 p-3 bg-white rounded border border-success shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong class="text-success"><i class="bi bi-check2-all"></i> Final Master: ${latestMix.version_name}</strong>
                        <span class="small text-muted">${new Date(latestMix.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="d-grid">
                        <a href="${latestMix.file_link}" target="_blank" class="btn btn-success fw-bold">
                            <i class="bi bi-cloud-download me-2"></i> RE-DOWNLOAD FINAL FILE
                        </a>
                    </div>
                </div>
            `;
        }
        
        // CASE B: ACTIVE - READY FOR REVIEW (Show Actions)
        else if (latestMix && proj.status === 'Ready for Review') {
            const engineerNotes = latestMix.notes 
                ? `<div class="alert alert-light border-start border-4 border-success py-2 px-3 mb-3 small fst-italic text-muted">
                     <strong>Note from Engineer:</strong> "${latestMix.notes}"
                   </div>` 
                : '';

            actionContent = `
                <div class="mt-3 p-3 bg-white rounded border shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong class="text-success"><i class="bi bi-check-circle-fill"></i> Review Mix: ${latestMix.version_name}</strong>
                        <span class="small text-muted">${new Date(latestMix.created_at).toLocaleDateString()}</span>
                    </div>
                    ${engineerNotes}
                    <div class="d-flex gap-2 flex-wrap">
                        <a href="${latestMix.file_link}" target="_blank" class="btn btn-sm btn-success fw-bold flex-grow-1">
                            <i class="bi bi-play-circle me-1"></i> DOWNLOAD / LISTEN
                        </a>
                        
                        ${ proj.revisions_used < proj.max_revisions ? 
                           `<button onclick="window.requestRevision(${proj.id}, ${proj.revisions_used})" class="btn btn-sm btn-outline-danger fw-bold">
                                <i class="bi bi-arrow-counterclockwise me-1"></i> REQUEST CHANGES
                            </button>` 
                           : 
                           `<button disabled class="btn btn-sm btn-secondary fw-bold" title="Limit Reached">
                                <i class="bi bi-lock me-1"></i> LIMIT REACHED
                            </button>`
                        }
                        
                        <button onclick="window.markCompleted(${proj.id})" class="btn btn-sm btn-outline-primary fw-bold">
                            <i class="bi bi-hand-thumbs-up me-1"></i> APPROVE
                        </button>
                    </div>
                </div>
            `;
        } 
        // CASE C: WAITING
        else if (proj.status === 'Revision Requested') {
            actionContent = `<div class="mt-2 small text-warning"><i class="bi bi-hourglass-split"></i> Waiting for engineer...</div>`;
        }

        // Build Card
        const deleteBtn = isPast 
        ? `<button onclick="deleteProject(${proj.id})" class="btn btn-sm btn-outline-secondary border-0" title="Remove from list">
             <i class="bi bi-trash"></i>
           </button>`
        : '';

    // HTML Card
    const cardHtml = `
    <div class="project-card ${statusClass} d-flex justify-content-between align-items-center">
        <div>
            <h5 class="fw-bold mb-1">${proj.project_title}</h5>
            <div class="text-muted small mb-2">
                <span class="me-3"><i class="bi bi-music-note-beamed"></i> ${proj.service_type}</span>
                <span><i class="bi bi-arrow-repeat"></i> ${revText}</span>
            </div>
            ${actionContent}
        </div>
        <div class="text-end">
            <div class="mb-2">
                <span class="badge ${badgeClass} badge-custom">${proj.status}</span>
                ${deleteBtn} </div>
            <div class="small text-muted">${new Date(proj.created_at).toLocaleDateString()}</div>
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

    if (!hasActive) activeContainer.innerHTML = '<div class="text-muted small p-3">No active projects. Click + to start!</div>';
    if (!hasPast) pastContainer.innerHTML = '<div class="text-muted small">No completed projects yet.</div>';
}

/* =========================================
   5. UPLOAD HANDLER
   ========================================= */
const uploadForm = document.getElementById('newProjectForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const progressContainer = document.getElementById('upload-progress-container');
        const progressBar = document.getElementById('upload-bar');
        
        btn.disabled = true; 
        btn.textContent = "UPLOADING...";
        progressContainer.classList.remove('d-none');

        try {
            const title = document.getElementById('proj-title').value;
            const service = document.getElementById('proj-service').value;
            const genre = document.getElementById('proj-genre').value;
            const file = document.getElementById('proj-file').files[0];

            const storagePath = `client_uploads/${currentUser.uid}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            progressBar.style.width = "50%";

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
            alert("Project Submitted!");
            
            // Close Modal
            const modalEl = document.getElementById('uploadModal');
            if(window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
            }
            
            e.target.reset();
            btn.disabled = false;
            btn.textContent = "SUBMIT PROJECT";
            progressContainer.classList.add('d-none');
            loadRemoteProjects(currentUser.uid);

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            btn.disabled = false;
            btn.textContent = "SUBMIT PROJECT";
        }
    });
}

/* =========================================
   6. STUDIO BOOKINGS
   ========================================= */
async function loadStudioBookings(uid) {
    const container = document.getElementById('bookings-list');
    if(!container) return;

    const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_uid', uid) // Requires 'client_uid' in bookings table!
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
                <td>-</td>
            </tr>`;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">No studio sessions found.</td></tr>';
    }
}