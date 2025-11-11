<?php
/*
 * --------------------------------
 * PART 1: PHP BACKEND LOGIC
 * This file handles all database interactions.
 * --------------------------------
 */

// --- Initialize a variable for messages ---
$message = ""; 

// --- Database Connection ---
$servername = "localhost";  // Default for XAMPP
$username = "root";         // Default for XAMPP
$password = "";             // Default for XAMPP
$dbname = "studio_booking_db"; // The database for this project

// --- Create connection ---
$conn = new mysqli($servername, $username, $password);

// --- Check connection ---
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// --- Try to select the database. If it doesn't exist, create it. ---
if (!$conn->select_db($dbname)) {
    $sql_create_db = "CREATE DATABASE $dbname";
    if (!$conn->query($sql_create_db)) {
        die("Error creating database: " . $conn->error);
    }
    // Re-select the newly created DB
    $conn->select_db($dbname);
}

// --- Try to create the table if it doesn't exist ---
$sql_create_table = "CREATE TABLE IF NOT EXISTS `bookings` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `customer_name` varchar(255) NOT NULL,
    `customer_address` text NOT NULL,
    `service_type` varchar(100) NOT NULL,
    `studio` varchar(50) NOT NULL,
    `start_date` date NOT NULL,
    `end_date` date NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$conn->query($sql_create_table)) {
    die("Error creating table: " . $conn->error);
}

/*
 * --------------------------------
 * This file handles TWO types of requests:
 * 1. AJAX (GET) requests from script.js to *fetch* booked dates.
 * 2. Form (POST) requests from booking.php to *save* a new booking.
 * --------------------------------
 */


// --- LOGIC 1: Handle AJAX (GET) request for getting booked dates ---
// This block runs when the JavaScript 'fetches' data
if (isset($_GET['action']) && $_GET['action'] == 'get_bookings' && isset($_GET['studio'])) {
    
    // Set the response header to JSON
    header('Content-Type: application/json');
    
    $studio = $_GET['studio'];
    $booked_dates = [];
    
    // Prepare SQL to find all bookings for the selected studio
    $sql = "SELECT start_date, end_date FROM bookings WHERE studio = ?";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("s", $studio);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            // Expand the date range into individual dates
            try {
                $start = new DateTime($row['start_date']);
                $end = new DateTime($row['end_date']);
                $end = $end->modify('+1 day'); // Include the end date
                
                $period = new DatePeriod($start, new DateInterval('P1D'), $end);
                
                foreach ($period as $date) {
                    $booked_dates[] = $date->format('Y-m-d');
                }
            } catch (Exception $e) {
                // Handle exception
            }
        }
        $stmt->close();
    }
    
    // Return the unique list of booked dates as a JSON array
    echo json_encode(array_unique($booked_dates));
    
    $conn->close();
    exit; // CRITICAL: Stop the script here so it doesn't output HTML
}

// --- LOGIC 2: Handle Form (POST) Submission ---
// This block only runs if the form was submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 1. Get all form data
    $customer_name = $_POST['customer_name'] ?? '';
    $customer_address = $_POST['customer_address'] ?? '';
    $service_type = $_POST['service_type'] ?? '';
    $studio = $_POST['studio'] ?? '';
    $start_date = $_POST['start_date'] ?? '';
    $end_date = $_POST['end_date'] ?? '';

    // 2. Server-side Validation
    
    // Rule 1: Mastering must be in Studio C
    if ($service_type == 'Mastering' && $studio != 'Studio C') {
        $message = "Error: Mastering service must be in Studio C.";
    
    // Rule 2: End date must be on or after start date
    } else if (new DateTime($end_date) < new DateTime($start_date)) {
        $message = "Error: The 'End Date' must be on or after the 'Start Date'.";

    // Rule 3: Check for booking conflicts in the database (CRITICAL)
    } else {
        // This query checks for any booking that *overlaps* with the requested date range
        $sql_check = "SELECT id FROM bookings WHERE studio = ? AND ? <= end_date AND ? >= start_date";
        
        if ($stmt_check = $conn->prepare($sql_check)) {
            $stmt_check->bind_param("sss", $studio, $start_date, $end_date);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();

            if ($result_check->num_rows > 0) {
                // CONFLICT FOUND!
                $message = "Error: The selected dates ($start_date to $end_date) for $studio are unavailable. Please check the calendar and try again.";
            } else {
                // NO CONFLICT! Proceed to insert the booking
                
                $sql_insert = "INSERT INTO bookings (customer_name, customer_address, service_type, studio, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)";
                
                if ($stmt_insert = $conn->prepare($sql_insert)) {
                    $stmt_insert->bind_param("ssssss", $customer_name, $customer_address, $service_type, $studio, $start_date, $end_date);
                    
                    if ($stmt_insert->execute()) {
                        $message = "Booking successful! $studio is reserved for $customer_name from $start_date to $end_date.";
                    } else {
                        $message = "Error: Could not save booking. " . $stmt_insert->error;
                    }
                    $stmt_insert->close();
                }
            }
            $stmt_check->close();
        } else {
            $message = "Error preparing statement: " . $conn->error;
        }
    }
}

// Don't close the connection here if 'logic.php' is included in 'booking.php'
// $conn->close();
// We only close it after the AJAX request, which has an 'exit'.
// For the POST request, the connection will implicitly close when booking.php finishes.

?>