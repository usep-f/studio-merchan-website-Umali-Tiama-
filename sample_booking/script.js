/* * --------------------------------
 * PART 4: JAVASCRIPT LOGIC
 * All client-side logic is now in this file.
 * --------------------------------
 */

// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
            
    // --- Get DOM Elements ---
    const serviceSelect = document.getElementById('service_type');
    const studioSelect = document.getElementById('studio');
    const bookingForm = document.getElementById('booking-form-element');
    const messageBox = document.getElementById('message-box');
    
    // Calendar elements
    const calendarBody = document.getElementById('calendar-body');
    const currentMonthYearEl = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    
    // --- State Variables ---
    let currentDisplayDate = new Date();
    let bookedDates = []; // This will be filled by our API call
    
    // --- Core Functions ---
    
    /**
     * Generates and displays the calendar for a given month and year.
     */
    function generateCalendar(date) {
        calendarBody.innerHTML = ''; // Clear old calendar
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        
        // Set the header text
        currentMonthYearEl.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let dayCounter = 1;
        const today = new Date().toDateString();

        // Create the calendar grid (6 weeks)
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                const dayNumberSpan = document.createElement('span');
                dayNumberSpan.classList.add('day-number');

                if (i === 0 && j < firstDayOfMonth) {
                    // Empty cells before the 1st day
                    cell.classList.add('other-month');
                } else if (dayCounter > daysInMonth) {
                    // Empty cells after the last day
                    cell.classList.add('other-month');
                } else {
                    // A valid day in the month
                    const currentDate = new Date(year, month, dayCounter);
                    const dateString = currentDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'

                    dayNumberSpan.textContent = dayCounter;
                    cell.appendChild(dayNumberSpan);
                    cell.classList.add('day-cell');
                    cell.dataset.date = dateString; // Store the date in 'YYYY-MM-DD' format
                    
                    // Check if this date is today
                    if (currentDate.toDateString() === today) {
                        cell.classList.add('today');
                    }
                    
                    // Check if this date is booked
                    if (bookedDates.includes(dateString)) {
                        cell.classList.add('booked-day');
                    }
                    
                    // Add click listener to fill form dates
                    cell.addEventListener('click', () => {
                        const startDateInput = document.getElementById('start_date');
                        const endDateInput = document.getElementById('end_date');
                        
                        // Simple logic: if start is empty, fill it. Else, fill end.
                        if (startDateInput.value === '') {
                            startDateInput.value = dateString;
                        } else {
                            endDateInput.value = dateString;
                            // If end date is before start date, swap them
                            if (new Date(endDateInput.value) < new Date(startDateInput.value)) {
                                [startDateInput.value, endDateInput.value] = [endDateInput.value, startDateInput.value];
                            }
                        }
                    });
                    
                    dayCounter++;
                }
                row.appendChild(cell);
            }
            calendarBody.appendChild(row);
            if (dayCounter > daysInMonth) break; // Stop creating rows if we're past the end
        }
    }
    
    /**
     * Fetches booked dates from our PHP backend (logic.php)
     */
    async function fetchBookings(studio) {
        try {
            // *** CRITICAL CHANGE ***
            // We now fetch from 'logic.php' to get the JSON data.
            const response = await fetch(`logic.php?action=get_bookings&studio=${studio}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            bookedDates = data; // Update our global state
            generateCalendar(currentDisplayDate); // Re-generate calendar with new data
        } catch (error) {
            console.error('Error fetching bookings:', error);
            // Show a non-blocking error
            showTempMessage('Could not load calendar availability.', 'error');
        }
    }
    
    /**
     * Shows a message in the message box (e.g., for validation)
     */
    function showTempMessage(text, type = 'error') {
        // Use the *other* message box (the one in the form)
        const phpMessageBox = document.getElementById('message-box');
        phpMessageBox.textContent = text;
        phpMessageBox.className = type; // 'error' or 'success'
    }

    // --- Event Listeners ---
    
    // 1. Service dropdown logic
    serviceSelect.addEventListener('change', () => {
        if (serviceSelect.value === 'Mastering') {
            studioSelect.value = 'Studio C';
            studioSelect.disabled = true;
        } else {
            studioSelect.disabled = false;
        }
        // Trigger a change on studioSelect to update the calendar
        studioSelect.dispatchEvent(new Event('change'));
    });
    
    // 2. Studio dropdown logic
    studioSelect.addEventListener('change', () => {
        const selectedStudio = studioSelect.value;
        fetchBookings(selectedStudio); // Fetch new data and redraw
    });
    
    // 3. Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
        generateCalendar(currentDisplayDate);
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
        generateCalendar(currentDisplayDate);
    });
    
    // 4. Form submission logic (Client-side validation)
    bookingForm.addEventListener('submit', (event) => {
        // Get form values
        const startDate = new Date(document.getElementById('start_date').value);
        const endDate = new Date(document.getElementById('end_date').value);
        
        // Check 1: Valid dates
        if (isNaN(startDate) || isNaN(endDate)) {
            showTempMessage('Please select a valid start and end date.', 'error');
            event.preventDefault(); // Stop form from submitting
            return;
        }

        // Check 2: End date is after start date
        if (endDate < startDate) {
            showTempMessage('Error: The "End Date" must be on or after the "Start Date".', 'error');
            event.preventDefault(); // Stop form from submitting
            return;
        }
        
        // Check 3: Conflict check (this is your requirement)
        let conflictFound = false;
        const loopDate = new Date(startDate);
        
        while (loopDate <= endDate) {
            const dateString = loopDate.toISOString().split('T')[0];
            if (bookedDates.includes(dateString)) {
                conflictFound = true;
                break;
            }
            loopDate.setDate(loopDate.getDate() + 1); // Move to the next day
        }
        
        if (conflictFound) {
            // This is the warning pop-up!
            showTempMessage('Error: The date/s you selected are already booked. Please check the calendar.', 'error');
            event.preventDefault(); // Stop form from submitting
        }
        
        // If no errors, the form will submit normally to the PHP backend
    });
    
    // --- Initial Load ---
    
    // Set default dates (e.g., today)
    const todayString = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');
    
    if (startDateInput.value === '') {
        startDateInput.value = todayString;
    }
    if (endDateInput.value === '') {
        endDateInput.value = todayString;
    }
    
    startDateInput.min = todayString;
    endDateInput.min = todayString;

    // Load the initial calendar data for the default selected studio
    fetchBookings(studioSelect.value);
    
});