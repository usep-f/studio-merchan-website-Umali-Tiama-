import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, deleteDoc, updateDoc, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/* 1. Configuration and Initialization
   Sets up Firebase (Auth, Firestore, Storage) and Supabase client
   for database interactions across the dashboard. */
const firebaseConfig = {
    apiKey: "AIzaSyBd-IxyiDnyfwv7XDntnfHesmqD4_p8fzo",
    authDomain: "studio-merchan.firebaseapp.com",
    projectId: "studio-merchan",
    storageBucket: "studio-merchan.firebasestorage.app",
    messagingSenderId: "148020122490",
    appId: "1:148020122490:web:5c06af526e6b47a77b3cc3",
    measurementId: "G-QMC8J9PP9D"
};

const supabaseUrl = 'https://cishguvndzwtlbchhqbf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2hndXZuZHp3dGxiY2hocWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg0NjMsImV4cCI6MjA3OTMzNDQ2M30.kKcLTk5BTTyDF_tcwTORM93vp-3rDtCpSmj9ypoZECY';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const supabase = createClient(supabaseUrl, supabaseKey);

/* 2. Authentication Handlers and State
   Handles admin login/logout and checks user permission before showing the dashboard. */
window.login = () => {
    const e = document.getElementById("login-email").value;
    const p = document.getElementById("login-password").value;
    signInWithEmailAndPassword(auth, e, p).catch((err) => {
        console.error("Login Error:", err);
        document.getElementById("login-error").textContent = err.message;
    });
};

window.logout = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Check if the authenticated user has admin privileges in Supabase
        const { data, error } = await supabase
            .from('clients')
            .select('is_admin')
            .eq('client_uid', user.uid)
            .single();

        if (error || !data || data.is_admin !== true) {
            console.warn("Access Denied: User is not an admin.");
            alert("ACCESS DENIED: You do not have permission to view this page.");
            await signOut(auth); 
            document.getElementById("login-screen").classList.remove("hidden");
            document.getElementById("dashboard-screen").classList.add("hidden");
        } else {
            // Admin is verified. Show dashboard and load initial data.
            document.getElementById("login-screen").classList.add("hidden");
            document.getElementById("dashboard-screen").classList.remove("hidden");
            loadSlotData(); 
        }

    } else {
        // No user signed in, show login screen
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("dashboard-screen").classList.add("hidden");
    }
});

/* 3. Navigation Logic
   Controls which section is visible in the main content area and triggers data fetching. */
window.showSection = (sectionId) => {
    // Hide all sections and deactivate buttons (using hardcoded IDs from HTML)
    document.getElementById('section-carousel').classList.add('hidden');
    document.getElementById('section-bookings').classList.add('hidden');
    document.getElementById('section-live').classList.add('hidden');
    document.getElementById('section-testimonials').classList.add('hidden');
    document.getElementById('section-remote').classList.add('hidden');
    document.getElementById('section-clients').classList.add('hidden');
    document.getElementById('section-messages').classList.add('hidden');
    document.getElementById('section-reviews').classList.add('hidden');

    document.getElementById('btn-carousel').classList.remove('active');
    document.getElementById('btn-bookings').classList.remove('active');
    document.getElementById('btn-live').classList.remove('active');
    document.getElementById('btn-testimonials').classList.remove('active');
    document.getElementById('btn-remote').classList.remove('active');
    document.getElementById('btn-clients').classList.remove('active');
    document.getElementById('btn-messages').classList.remove('active');
    document.getElementById('btn-reviews').classList.remove('active');

    // Show target section and activate button
    document.getElementById('section-' + sectionId).classList.remove('hidden');
    document.getElementById('btn-' + sectionId).classList.add('active');

    // Fetch data based on section ID
    if (sectionId === 'bookings') fetchAdminBookings();
    if (sectionId === 'live') fetchLiveBookings();
    if (sectionId === 'testimonials') fetchTestimonials();
    if (sectionId === 'remote') fetchRemoteProjects();
    if (sectionId === 'clients') fetchClients();
    if (sectionId === 'messages') fetchMessages();
    if (sectionId === 'reviews') fetchReviews();
    
};

/* 4. Carousel Manager (Firestore)
   Handles loading and saving artist data for the homepage carousel via Firestore. */
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
    const oldUrl = document.getElementById("art-link").value; 

    if (!name) { alert("Artist Name is required!"); return; }
    let finalImageUrl = oldUrl;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        try {
            const storageRef = ref(storage, `artists/${docId}`);
            const snapshot = await uploadBytes(storageRef, file);
            finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            alert("Upload Failed: " + error.message);
            return;
        }
    }

    if (!finalImageUrl) { alert("Please upload an image!"); return; }

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
        document.getElementById("art-link").value = finalImageUrl;
        fileInput.value = ""; 
    } catch (e) { alert("Error: " + e.message); }
};

/* 5. Studio Bookings Manager
   Fetches, renders, updates status, and deletes studio bookings from Supabase. */
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

/* 6. Live Events Manager
   Fetches, renders, updates status, and deletes live sound event bookings from Supabase. */
window.fetchLiveBookings = async () => {
    const tbody = document.getElementById('live-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5 text-muted">Loading live events...</td></tr>';

    const { data, error } = await supabase
        .from('live_bookings')
        .select('*')
        .order('start_time', { ascending: false });

    if (error) {
        alert('Supabase Error: ' + error.message);
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5 text-muted">No live sound bookings found.</td></tr>';
        return;
    }

    let html = '';
    data.forEach(b => {
        let badgeClass = 'bg-warning text-dark';
        if (b.status === 'Confirmed') badgeClass = 'bg-success';
        
        // Date Formatting
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

        html += `
        <tr>
            <td class="ps-4"><span class="badge ${badgeClass} rounded-pill px-3 py-2">${b.status}</span></td>
            <td>
                <div class="fw-bold">${dateStr}</div>
                <div class="small text-muted">${timeStr}</div>
            </td>
            <td>
                <div class="fw-bold text-primary">${b.event_type}</div>
                <div class="small">${b.package}</div>
            </td>
              <td>
                <div class="small fw-bold">${b.location}</div>
            </td>
            <td>
                <div class="fw-bold">${b.customer_name}</div>
                <div class="small text-muted"><i class="bi bi-telephone me-1"></i>${b.contact_number}</div>
            </td>
            <td class="text-end pe-4">
                ${b.status === 'Pending' ? 
                    `<button onclick="updateLiveStatus(${b.id}, 'Confirmed')" class="btn btn-sm btn-success me-2" title="Confirm"><i class="bi bi-check-lg"></i></button>` 
                    : ''}
                <button onclick="deleteLiveBooking(${b.id})" class="btn btn-sm btn-danger" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
        `;
    });
    tbody.innerHTML = html;
};

window.updateLiveStatus = async (id, newStatus) => {
    if(!confirm(`Confirm this live event?`)) return;
    const { error } = await supabase.from('live_bookings').update({ status: newStatus }).eq('id', id);
    if (error) alert(error.message);
    else fetchLiveBookings();
};

window.deleteLiveBooking = async (id) => {
    if(!confirm('Delete this event?')) return;
    const { error } = await supabase.from('live_bookings').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchLiveBookings();
};


/* 7. Testimonials Manager (Firestore)
   Handles CRUD operations and rendering for testimonials displayed on the homepage. */
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

window.saveTestimonial = async () => {
    const id = document.getElementById('testi-id').value;
    const name = document.getElementById('testi-name').value;
    const role = document.getElementById('testi-role').value;
    const quote = document.getElementById('testi-quote').value;
    const fileInput = document.getElementById('testi-file');
    const oldUrl = document.getElementById('testi-img-url').value;

    if (!name || !quote) { alert("Name and Quote are required!"); return; }
    let finalImageUrl = oldUrl;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        try {
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

    try {
        const docData = {
            name, role, quote, 
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

window.deleteTestimonial = async (id) => {
    if(!confirm("Delete this review?")) return;
    try {
        await deleteDoc(doc(db, "testimonials", id));
        fetchTestimonials();
    } catch (e) { alert(e.message); }
};

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

/* 8. Remote Projects Manager (Supabase)
   Fetches, renders, and manages project status for remote mixing/mastering requests. */
window.fetchRemoteProjects = async () => {
    const tbody = document.getElementById('remote-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">Loading projects...</td></tr>';

    try {
        const { data: projects, error: projError } = await supabase
            .from('online_projects')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (projError) throw projError;

        const { data: clients, error: clientError } = await supabase.from('clients').select('*');
        if (clientError) throw clientError;

        const clientMap = {};
        clients.forEach(c => { clientMap[c.client_uid] = c; });

        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">No projects found.</td></tr>';
            return;
        }

        let html = '';
        projects.forEach(p => {
            const client = clientMap[p.client_uid] || { full_name: 'Unknown', email: 'Unknown', phone_number: '' };
            let badgeClass = 'bg-secondary';
            if (p.status === 'Pending') badgeClass = 'bg-warning text-dark';
            if (p.status === 'In Progress') badgeClass = 'bg-primary';
            if (p.status === 'Ready for Review') badgeClass = 'bg-info text-dark';
            if (p.status === 'Completed') badgeClass = 'bg-success';

            html += `
            <tr>
                <td class="ps-4">
                    <span class="badge ${badgeClass} rounded-pill px-3 py-2 mb-1">${p.status}</span>
                    ${ p.status === 'Revision Requested' && p.revision_notes ? 
                        `<div class="small text-danger mt-1" style="max-width: 150px; line-height: 1.2;">
                            <strong>Note:</strong> "${p.revision_notes}"
                        </div>` 
                        : '' 
                    }
                </td>
                <td>
                    <div class="fw-bold text-primary">${p.project_title}</div>
                    <div class="small text-muted">${p.service_type} • ${p.genre || 'No Genre'}</div>
                </td>
                <td>
                    <div class="fw-bold">${client.full_name}</div>
                    <div class="small text-muted"><i class="bi bi-envelope me-1"></i>${client.email}</div>
                    <div class="small text-muted"><i class="bi bi-telephone me-1"></i>${client.phone_number}</div>
                </td>
                <td>
                    <button onclick="forceDownload('${p.file_link}', '${p.project_title}')" class="btn btn-sm btn-outline-dark mb-1">
                        <i class="bi bi-download me-1"></i> Download Files
                    </button>
                    <div class="small text-muted mt-1">Revisions: <strong>${p.revisions_used} / ${p.max_revisions}</strong></div>
                </td>
                <td class="text-end pe-4">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            Set Status
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" onclick="setProjectStatus(${p.id}, 'In Progress')">In Progress</a></li>
                            <li><a class="dropdown-item" onclick="setProjectStatus(${p.id}, 'Ready for Review')">Ready for Review</a></li>
                            <li><a class="dropdown-item" onclick="setProjectStatus(${p.id}, 'Completed')">Completed</a></li>
                        </ul>
                    </div>
                    <button onclick="resetRevisions(${p.id})" class="btn btn-sm btn-outline-warning ms-1" title="Reset Revision Count">
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </button>
                    <button onclick="openRevisionModal(${p.id})" class="btn btn-sm btn-primary ms-1" title="Upload Mix">
                        <i class="bi bi-cloud-upload"></i>
                    </button>
                    <button onclick="deleteRemoteProject(${p.id})" class="btn btn-sm btn-danger ms-1" title="Delete Project">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
    }
};

window.setProjectStatus = async (id, status) => {
    const { error } = await supabase.from('online_projects').update({ status: status }).eq('id', id);
    if (error) alert(error.message);
    else fetchRemoteProjects();
};

window.resetRevisions = async (id) => {
    if(!confirm("Reset revision count to 0 for this project?")) return;
    const { error } = await supabase.from('online_projects').update({ revisions_used: 0 }).eq('id', id);
    if (error) alert(error.message);
    else fetchRemoteProjects();
};

/* 9. Revision System Logic
   Handles the modal for uploading deliverables/revisions to clients. */
window.openRevisionModal = (projectId) => {
    document.getElementById('rev-project-id').value = projectId;
    document.getElementById('rev-name').value = "";
    document.getElementById('rev-file').value = "";
    document.getElementById('rev-notes').value = "";
    document.getElementById('btn-save-rev').disabled = false;
    document.getElementById('btn-save-rev').textContent = "SEND TO CLIENT";
    new bootstrap.Modal(document.getElementById('revisionModal')).show();
};

window.saveRevision = async () => {
    const projectId = document.getElementById('rev-project-id').value;
    const name = document.getElementById('rev-name').value;
    const fileInput = document.getElementById('rev-file');
    const notes = document.getElementById('rev-notes').value;
    const btn = document.getElementById('btn-save-rev');

    if (!name || fileInput.files.length === 0) {
        alert("Please provide a Version Name and a File.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Uploading...";

    try {
        const file = fileInput.files[0];
        const storageRef = ref(storage, `deliverables/${projectId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const { error: insertError } = await supabase
            .from('project_deliverables')
            .insert([{
                project_id: projectId,
                version_name: name,
                file_link: downloadURL,
                notes: notes
            }]);

        if (insertError) throw insertError;

        await supabase
            .from('online_projects')
            .update({ status: 'Ready for Review' })
            .eq('id', projectId);

        alert("Revision Sent Successfully!");
        
        const modalEl = document.getElementById('revisionModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        fetchRemoteProjects(); 

    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
        btn.disabled = false;
        btn.textContent = "SEND TO CLIENT";
    }
};

window.forceDownload = async (url, filename) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network error");
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        console.warn("Download forced failed, opening in new tab.", e);
        window.open(url, '_blank');
    }
};

window.deleteRemoteProject = async (id) => {
    if(!confirm("Permanently delete this project request?")) return;
    const { error } = await supabase.from('online_projects').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchRemoteProjects();
};

/* 10. Client Management System
    Handles client list fetching, user history viewing, and admin/delete actions. */

// --- A. FETCH & DISPLAY CLIENTS ---
window.fetchClients = async () => {
    const tbody = document.getElementById('clients-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">Loading clients and calculating stats...</td></tr>';

    try {
        // 1. Fetch All Users
        const { data: clients, error: clientError } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (clientError) throw clientError;

        // 2. Fetch All Activity (To calculate stats)
        const { data: studioData } = await supabase.from('bookings').select('client_uid');
        const { data: liveData } = await supabase.from('live_bookings').select('client_uid');
        const { data: remoteData } = await supabase.from('online_projects').select('client_uid');

        // 3. Render
        if (clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">No registered clients found.</td></tr>';
            return;
        }

        let html = '';
        const currentAdminUid = auth.currentUser ? auth.currentUser.uid : null;

        clients.forEach(c => {
            // Count Stats
            const studioCount = studioData.filter(b => b.client_uid === c.client_uid).length;
            const liveCount = liveData.filter(b => b.client_uid === c.client_uid).length;
            const remoteCount = remoteData.filter(b => b.client_uid === c.client_uid).length;

            // Admin Badge Logic
            const roleBadge = c.is_admin 
                ? '<span class="badge bg-danger">ADMIN</span>' 
                : '<span class="badge bg-secondary">User</span>';

            // Prevent deleting yourself
            const isMe = c.client_uid === currentAdminUid;
            const deleteBtn = isMe 
                ? `<button disabled class="btn btn-sm btn-secondary" title="You cannot delete yourself"><i class="bi bi-trash"></i></button>`
                : `<button onclick="deleteUser('${c.client_uid}')" class="btn btn-sm btn-danger" title="Hard Delete User"><i class="bi bi-trash"></i></button>`;

            const adminBtn = isMe
                ? ''
                : `<button onclick="toggleAdmin('${c.client_uid}', ${c.is_admin})" class="btn btn-sm ${c.is_admin ? 'btn-outline-secondary' : 'btn-outline-success'} me-1" title="${c.is_admin ? 'Revoke Admin' : 'Make Admin'}">
                    <i class="bi ${c.is_admin ? 'bi-person-dash' : 'bi-shield-check'}"></i>
                   </button>`;

            html += `
            <tr>
                <td class="ps-4">
                    <div class="d-flex align-items-center">
                        <div class="bg-light rounded-circle d-flex align-items-center justify-content-center me-3 text-secondary fw-bold" style="width:40px; height:40px;">
                            ${c.full_name ? c.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div class="fw-bold">${c.full_name}</div>
                    </div>
                </td>
                <td>
                    <div class="small"><i class="bi bi-envelope me-2"></i>${c.email}</div>
                    <div class="small text-muted"><i class="bi bi-telephone me-2"></i>${c.phone_number || '-'}</div>
                </td>
                <td>${roleBadge}</td>
                <td>
                    <div class="d-flex gap-2">
                        <span class="badge bg-light text-dark border" title="Studio Sessions"><i class="bi bi-mic me-1"></i>${studioCount}</span>
                        <span class="badge bg-light text-dark border" title="Live Events"><i class="bi bi-speaker me-1"></i>${liveCount}</span>
                        <span class="badge bg-light text-dark border" title="Remote Projects"><i class="bi bi-cloud me-1"></i>${remoteCount}</span>
                    </div>
                </td>
                <td class="text-end pe-4">
                    <button onclick="viewUserHistory('${c.client_uid}', '${c.full_name}')" class="btn btn-sm btn-primary me-1" title="View Details"><i class="bi bi-eye"></i></button>
                    ${adminBtn}
                    ${deleteBtn}
                </td>
            </tr>
            `;
        });
        tbody.innerHTML = html;

    } catch (e) {
        alert("Error loading clients: " + e.message);
    }
};

// --- B. VIEW HISTORY MODAL ---
window.viewUserHistory = async (uid, name) => {
    // Set Header
    document.getElementById('history-modal-title').textContent = `${name}'s History`;
    document.getElementById('history-modal-subtitle').textContent = `Client ID: ${uid}`;

    // Load Data for Tabs
    const studioBody = document.getElementById('hist-studio-body');
    const liveBody = document.getElementById('hist-live-body');
    const remoteBody = document.getElementById('hist-remote-body');

    studioBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    liveBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    remoteBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

    // Show Modal
    new bootstrap.Modal(document.getElementById('userHistoryModal')).show();

    // 1. Fetch Studio
    const { data: studio } = await supabase.from('bookings').select('*').eq('client_uid', uid).order('start_date', { ascending: false });
    studioBody.innerHTML = studio.length ? studio.map(b => `
        <tr>
            <td>${b.start_date}</td>
            <td>${b.service_type} (${b.studio})</td>
            <td><span class="badge ${b.status === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark'}">${b.status}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="3" class="text-muted">No studio history.</td></tr>';

    // 2. Fetch Live
    const { data: live } = await supabase.from('live_bookings').select('*').eq('client_uid', uid).order('start_time', { ascending: false });
    liveBody.innerHTML = live.length ? live.map(b => `
        <tr>
            <td>${new Date(b.start_time).toLocaleDateString()}</td>
            <td>${b.event_type}</td>
            <td>${b.location}</td>
            <td><span class="badge ${b.status === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark'}">${b.status}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="4" class="text-muted">No live event history.</td></tr>';

    // 3. Fetch Remote
    const { data: remote } = await supabase.from('online_projects').select('*').eq('client_uid', uid).order('created_at', { ascending: false });
    remoteBody.innerHTML = remote.length ? remote.map(p => `
        <tr>
            <td>${p.project_title}</td>
            <td>${p.service_type}</td>
            <td><span class="badge bg-secondary">${p.status}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="3" class="text-muted">No project history.</td></tr>';
};

// --- C. TOGGLE ADMIN STATUS ---
window.toggleAdmin = async (uid, currentStatus) => {
    const action = currentStatus ? "REVOKE Admin access" : "GRANT Admin access";
    if (!confirm(`Are you sure you want to ${action} for this user?`)) return;

    const { error } = await supabase.from('clients').update({ is_admin: !currentStatus }).eq('client_uid', uid);
    
    if (error) alert("Error: " + error.message);
    else fetchClients();
};

// --- D. HARD DELETE USER ---
window.deleteUser = async (uid) => {
    if (!confirm("WARNING: This will perform a HARD DELETE.\n\n- The user's profile will be removed.\n- ALL their booking history and projects will be erased.\n- They will be locked out of the dashboard.\n\nAre you absolutely sure?")) return;

    try {
        // 1. Delete Studio History
        await supabase.from('bookings').delete().eq('client_uid', uid);
        // 2. Delete Live History
        await supabase.from('live_bookings').delete().eq('client_uid', uid);
        // 3. Delete Remote Projects (Deliverables cascade if setup, otherwise delete them too)
        await supabase.from('online_projects').delete().eq('client_uid', uid);
        // 4. Delete Profile
        const { error } = await supabase.from('clients').delete().eq('client_uid', uid);

        if (error) throw error;

        alert("User and all associated data have been wiped.");
        fetchClients();

    } catch (e) {
        alert("Delete failed: " + e.message);
    }
};

/* 11. Messages / Inbox System (Firestore)
    Handles fetching, viewing, and deleting client contact messages from Firestore. */

// --- A. FETCH MESSAGES & UPDATE BADGE ---
window.fetchMessages = async () => {
    const tbody = document.getElementById('messages-table-body');
    const badgeEl = document.getElementById('unread-badge');
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">Loading inbox...</td></tr>';

    try {
        // 1. Fetch from Firestore (Collection: 'contact_messages')
        const q = query(collection(db, "contact_messages"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">Inbox is empty.</td></tr>';
            badgeEl.style.display = 'none';
            return;
        }

        let html = '';
        let unreadCount = 0;

        querySnapshot.forEach((doc) => {
            const msg = doc.data();
            const id = doc.id;
            
            // Calculate Status
            const isUnread = msg.status === 'unread';
            if (isUnread) unreadCount++;

            const statusBadge = isUnread 
                ? '<span class="badge bg-danger">NEW</span>' 
                : '<span class="badge bg-secondary">Read</span>';
            
            const rowClass = isUnread ? 'fw-bold bg-light' : ''; // Highlight unread rows

            // Format Date
            let dateStr = '-';
            if (msg.timestamp) {
                // Firestore Timestamp to JS Date
                dateStr = msg.timestamp.toDate().toLocaleDateString() + ' ' + 
                                 msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            // Escape quotes for the onclick handler
            const safeData = JSON.stringify({ id, ...msg }).replace(/"/g, "&quot;");

            html += `
            <tr class="${rowClass}">
                <td class="ps-4">${statusBadge}</td>
                <td>
                    <div>${msg.name}</div>
                    <div class="small text-muted">${msg.email}</div>
                </td>
                <td class="text-primary">${msg.subject}</td>
                <td class="small text-muted">${dateStr}</td>
                <td class="text-end pe-4">
                    <button onclick="viewMessage(${safeData})" class="btn btn-sm btn-primary me-1" title="Read Message">
                        <i class="bi bi-envelope-open"></i>
                    </button>
                    <button onclick="deleteMessage('${id}')" class="btn btn-sm btn-outline-danger" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        });

        tbody.innerHTML = html;

        // Update Sidebar Badge
        if (unreadCount > 0) {
            badgeEl.textContent = unreadCount;
            badgeEl.style.display = 'inline-block';
        } else {
            badgeEl.style.display = 'none';
        }

    } catch (e) {
        console.error("Error fetching messages:", e);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-5 text-danger">Error: ${e.message}</td></tr>`;
    }
};

// --- B. VIEW MESSAGE (OPEN MODAL) ---
window.viewMessage = async (data) => {
    // 1. Populate Modal
    document.getElementById('msg-sender').textContent = data.name;
    document.getElementById('msg-email').textContent = data.email;
    document.getElementById('msg-subject').textContent = data.subject;
    document.getElementById('msg-body').textContent = data.message;
    
    // Format Date for Modal
    if (data.timestamp && data.timestamp.seconds) {
        const dateObj = new Date(data.timestamp.seconds * 1000);
        document.getElementById('msg-date').textContent = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
    }

    // Setup "Reply" Button
    const replyBtn = document.getElementById('btn-reply');
    replyBtn.href = `mailto:${data.email}?subject=Re: ${data.subject}`;

    // 2. Show Modal
    new bootstrap.Modal(document.getElementById('readMessageModal')).show();

    // 3. Mark as Read (if currently unread)
    if (data.status === 'unread') {
        try {
            const msgRef = doc(db, "contact_messages", data.id);
            await updateDoc(msgRef, { status: 'read' });
            
            // Refresh list in background to update badge/status
            fetchMessages(); 
        } catch (e) {
            console.error("Error marking as read:", e);
        }
    }
};

// --- C. DELETE MESSAGE ---
window.deleteMessage = async (id) => {
    if(!confirm("Delete this message permanently?")) return;

    try {
        await deleteDoc(doc(db, "contact_messages", id));
        fetchMessages(); // Refresh list
    } catch (e) {
        alert("Error deleting: " + e.message);
    }
};

/* 12. Reviews Management (Firestore)
    Handles fetching, rendering, approving, and deleting public user reviews. */

// --- A. FETCH REVIEWS ---
window.fetchReviews = async () => {
    const tbody = document.getElementById('reviews-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">Loading reviews...</td></tr>';

    try {
        const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">No reviews yet.</td></tr>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const r = doc.data();
            const id = doc.id;
            
            // Generate Stars HTML
            let starsHtml = '';
            for(let i=1; i<=5; i++) {
                if(i <= r.rating) starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
                else starsHtml += '<i class="bi bi-star text-muted"></i>';
            }

            // Status Badge
            const statusBadge = r.status === 'approved' 
                ? '<span class="badge bg-success">Live</span>' 
                : '<span class="badge bg-warning text-dark">Pending</span>';

            // Actions
            const approveBtn = r.status === 'pending'
                ? `<button onclick="approveReview('${id}')" class="btn btn-sm btn-success me-1" title="Approve & Publish"><i class="bi bi-check-lg"></i></button>`
                : `<button disabled class="btn btn-sm btn-outline-secondary me-1"><i class="bi bi-check2-all"></i></button>`;

            html += `
            <tr>
                <td class="ps-4 text-nowrap">${starsHtml}</td>
                <td>
                    <div class="fw-bold">${r.name}</div>
                    <div class="small text-muted">${r.role}</div>
                </td>
                <td style="max-width: 350px;">
                    <div class="text-truncate" title="${r.message}">"${r.message}"</div>
                </td>
                <td>${statusBadge}</td>
                <td class="text-end pe-4">
                    ${approveBtn}
                    <button onclick="deleteReview('${id}')" class="btn btn-sm btn-outline-danger" title="Delete"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
            `;
        });

        tbody.innerHTML = html;

    } catch (e) {
        console.error("Error fetching reviews:", e);
        alert("Error: " + e.message);
    }
};

// --- B. APPROVE REVIEW ---
window.approveReview = async (id) => {
    if(!confirm("Approve this review? It will be marked as 'Live'.")) return;
    try {
        await updateDoc(doc(db, "reviews", id), { status: 'approved' });
        fetchReviews(); // Refresh list
    } catch (e) {
        alert("Error: " + e.message);
    }
};

// --- C. DELETE REVIEW ---
window.deleteReview = async (id) => {
    if(!confirm("Delete this review permanently?")) return;
    try {
        await deleteDoc(doc(db, "reviews", id));
        fetchReviews();
    } catch (e) {
        alert("Error: " + e.message);
    }
};