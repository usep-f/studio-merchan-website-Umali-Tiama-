/* =========================================
   1. SUPABASE CONFIGURATION
   ========================================= */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// PASTE YOUR KEYS HERE
const supabaseUrl = 'https://cishguvndzwtlbchhqbf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2hndXZuZHp3dGxiY2hocWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg0NjMsImV4cCI6MjA3OTMzNDQ2M30.kKcLTk5BTTyDF_tcwTORM93vp-3rDtCpSmj9ypoZECY'
const supabase = createClient(supabaseUrl, supabaseKey)

/* =========================================
   2. VARIABLES & ELEMENTS
   ========================================= */
let calendar; // The FullCalendar instance
let bookedRanges = []; // Stores current bookings for conflict checking

// DOM Elements
const studioSelect = document.getElementById('studio');
const serviceSelect = document.getElementById('service_type');
const form = document.getElementById('booking-form-element');
const msgBox = document.getElementById('message-box');

// Date Inputs
const startDateInput = document.getElementById('start_date');
const endDateInput = document.getElementById('end_date');

/* =========================================
   3. INITIALIZATION (On Page Load)
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    
    // A. Initialize Calendar
    var calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        validRange: {
            start: new Date().toISOString().split('T')[0] // Sets start of calendar to Today
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: '' // Simple look
        },
        // Allow clicking dates to auto-fill the form
        dateClick: function(info) {
            handleDateClick(info.dateStr);
        },
        // Show events as background blocks
        events: [] 
    });

    calendar.render();

    // B. Load Initial Data (for default "Studio A")
    fetchBookings('Studio A');

    // C. Setup Event Listeners
    studioSelect.addEventListener('change', (e) => {
        fetchBookings(e.target.value);
    });

    serviceSelect.addEventListener('change', (e) => {
        handleServiceChange(e.target.value);
    });

    // Handle Form Submission
    form.addEventListener('submit', handleBookingSubmit);
});

/* =========================================
   4. CORE FUNCTIONS
   ========================================= */

/**
 * Fetches bookings from Supabase for the selected studio
 * and updates the Calendar display.
 */
async function fetchBookings(studioName) {
    console.log(`Fetching bookings for ${studioName}...`);
    
    // 1. Clear current events
    calendar.removeAllEvents();
    bookedRanges = [];

    // 2. Ask Supabase
    const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('studio', studioName);

    if (error) {
        console.error('Error fetching:', error);
        showMessage('Error loading calendar data.', 'error');
        return;
    }

    // 3. Transform data for FullCalendar
    // FullCalendar expects { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', display: 'background' }
    // Note: FullCalendar "end" date is exclusive (stops at midnight), so we might need +1 day logic if visual is short.
    // For simplicity, we will use the raw dates first.
    
    const events = data.map(booking => {
        // Add to our local list for conflict checking
        bookedRanges.push({
            start: new Date(booking.start_date),
            end: new Date(booking.end_date)
        });

        // Return visual object
        return {
            start: booking.start_date,
            end: addDays(booking.end_date, 1), // +1 day to make the bar cover the end date fully
            display: 'background',
            color: '#8B0000', // Dark Red for booked
            title: 'Booked'
        };
    });

    // 4. Add to Calendar
    calendar.addEventSource(events);
}

/**
 * Handles the logic when a user clicks a date on the calendar grid.
 */
function handleDateClick(dateStr) {
    // Auto-fill the form inputs
    startDateInput.value = dateStr;
    endDateInput.value = dateStr; // Default to 1-day booking
    
    // Scroll up to the form smoothly so user sees the inputs changed
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Handles the "Mastering = Studio C" logic
 */
function handleServiceChange(service) {
    if (service === 'Mastering') {
        studioSelect.value = 'Studio C';
        studioSelect.disabled = true;
        fetchBookings('Studio C'); // Refresh calendar immediately
    } else {
        studioSelect.disabled = false;
    }
}

/**
 * The Main Booking Logic (Submit Button)
 */
async function handleBookingSubmit(e) {
    e.preventDefault(); // Stop page reload
    showMessage('', 'none'); // Clear old messages

    // 1. Get Form Data (Fixed variable name to 'newBooking')
    const newBooking = {
        customer_name: document.getElementById('customer_name').value,
        customer_contact: document.getElementById('customer_address').value, 
        service_type: serviceSelect.value,
        studio: studioSelect.value,
        start_date: startDateInput.value,
        end_date: endDateInput.value,
        status: 'Pending'
    };

    // 2. Validation: Check for Empty Dates
    if (!newBooking.start_date || !newBooking.end_date) {
        showMessage('Please select a date.', 'error');
        return;
    }

    // 3. Validation: End Date cannot be before Start Date
    if (newBooking.end_date < newBooking.start_date) {
        showMessage('End Date cannot be before Start Date.', 'error');
        return;
    }

    // 4. Validation: Cannot book past dates (Robust String Method)
    // Get today's date as "YYYY-MM-DD" in your local timezone
    const todayStr = new Date().toLocaleDateString('en-CA'); 
    
    // Simple string compare: "2023-11-20" < "2023-11-22" works perfectly
    if (newBooking.start_date < todayStr) {
        showMessage('You cannot book a date in the past.', 'error');
        return;
    }

    // 5. Validation: Conflicts (Database Check)
    if (isDateRangeBooked(newBooking.start_date, newBooking.end_date)) {
        showMessage('Error: These dates are already booked. Please check the calendar.', 'error');
        return;
    }

    // 6. Send to Supabase
    const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking]);

    if (error) {
        console.error('Supabase Insert Error:', error);
        showMessage('Booking failed. Please try again.', 'error');
    } else {
        showMessage('Booking Successful! We will contact you shortly.', 'success');
        form.reset(); // Clear form
        
        // Reset studio dropdown state if it was locked
        studioSelect.disabled = false;
        
        // Re-fetch to show the new red block
        fetchBookings(newBooking.studio);
    }
}

/* =========================================
   5. HELPER FUNCTIONS
   ========================================= */

// Display message in the red/green box
function showMessage(text, type) {
    msgBox.textContent = text;
    msgBox.style.display = type === 'none' ? 'none' : 'block';
    
    if (type === 'error') {
        msgBox.style.backgroundColor = '#f8d7da';
        msgBox.style.color = '#721c24';
        msgBox.style.border = '1px solid #f5c6cb';
    } else if (type === 'success') {
        msgBox.style.backgroundColor = '#d4edda';
        msgBox.style.color = '#155724';
        msgBox.style.border = '1px solid #c3e6cb';
    }
}

// Check if requested range overlaps with existing bookings
function isDateRangeBooked(reqStart, reqEnd) {
    const start = new Date(reqStart);
    const end = new Date(reqEnd);

    for (let booking of bookedRanges) {
        // Logic: (StartA <= EndB) and (EndA >= StartB) means overlap
        if (start <= booking.end && end >= booking.start) {
            return true;
        }
    }
    return false;
}

// Helper to add days to a date string (for visual calendar padding)
function addDays(dateStr, days) {
    const result = new Date(dateStr);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
}