<?php

include 'logic.php'; 
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Studio Booking System</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" xintegrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@700;900&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="style booking.css">
</head>
<body>
    
    <header class="navwrapper">
      <!--desktop -->
      <nav class="navbar desktop-navbar navbar-custom py-1 d-none d-lg-flex">
        <div class="container-fluid navbar-grid">
          
          <ul class="navbar-nav left-nav">
            <li class="nav-item"><a class="nav-link" href="aboutus.html">About</a></li>
            <li class="nav-item"><a class="nav-link" href="services.html">Services</a></li>
            <li class="nav-item"><a class="nav-link" href="team.html">Team</a></li>
          </ul>
         
          <a class="navbar-brand" href="index.html">
            <img src="assets/LOGO.png" alt="navbar logo" />
          </a>
          
          <ul class="navbar-nav right-nav">
            <li class="nav-item"><a class="nav-link" href="sample_booking\booking.php">Book Us</a></li>
            <li class="nav-item"><a class="nav-link" href="hiring.html">Join Us</a></li>
          </ul>
        </div>
      </nav>

      <!--mobile-->
      <nav class="navbar mobile-navbar navbar-custom py-2 d-lg-none">
        <div class="container-fluid justify-content-between">
          <a class="navbar-brand mx-2" href="index.html">
            <img src="assets\LOGO.png" alt="navbar logo" height="60">
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mobileNav">
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>
        
        <div class="collapse" id="mobileNav">
          <ul class="navbar-nav text-center">
            <li class="nav-item"><a class="nav-link" href="aboutus.html">About</a></li>
            <li class="nav-item"><a class="nav-link" href="services.html">Services</a></li>
            <li class="nav-item"><a class="nav-link" href="team.html">Team</a></li>
            <li class="nav-item"><a class="nav-link" href="sample_booking\booking.php">Book Us</a></li>
            <li class="nav-item"><a class="nav-link" href="hiring.html">Join Us</a></li>
          </ul>
        </div>
      </nav>
    </header>

    <div class="container-fluid g-0">
        <div class="row g-0 min-vh-100">
            
            <!-- Left Panel (Content) -->
            <div class="col-lg-9 p-4 p-md-5 d-flex flex-column justify-content-center align-items-center custom-left-panel">
                
                <h1 class="main-title">BOOK A SERVICE</h1>
            
                <!-- This message box will be populated by PHP -->
                <div id="message-box" class="w-100 <?php echo !empty($message) ? (strpos($message, 'Error') === 0 ? 'error' : 'success') : ''; ?>" style="max-width: 500px;">
                    <?php echo $message; ?>
                </div>

                <!-- Bootstrap Form (Horizontal) -->
                <form id="booking-form-element" action="booking.php" method="POST" class="w-100" style="max-width: 500px;">
                    
                    <div class="row mb-3">
                        <label for="customer_name" class="col-sm-4 col-form-label text-sm-end">Full Name:</label>
                        <div class="col-sm-8">
                            <input type="text" id="customer_name" name="customer_name" class="form-control" required>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <label for="customer_address" class="col-sm-4 col-form-label text-sm-end">Contact No:</label>
                        <div class="col-sm-8">
                            <input type="text" id="customer_address" name="customer_address" class="form-control" required>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <label for="service_type" class="col-sm-4 col-form-label text-sm-end">Service Type:</label>
                        <div class="col-sm-8">
                            <select id="service_type" name="service_type" class="form-select">
                                <option value="Recording">RECORDING</option>
                                <option value="Mixing">MIXING</option>
                                <option value="Mastering">MASTERING</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <label for="studio" class="col-sm-4 col-form-label text-sm-end">Studio:</label>
                        <div class="col-sm-8">
                            <select id="studio" name="studio" class="form-select">
                                <option value="Studio A">STUDIO A</option>
                                <option value="Studio B">STUDIO B</option>
                                <option value="Studio C">STUDIO C</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <label for="start_date" class="col-sm-4 col-form-label text-sm-end">Date:</label>
                        <div class="col-sm-8 d-flex gap-2">
                            <input type="date" id="start_date" name="start_date" required class="form-control date-input">
                            <input type="date" id="end_date" name="end_date" required class="form-control date-input">
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <button type="submit" class="btn book-button">BOOK</button>
                    </div>
                </form>

                <!-- Calendar Display (Custom Component) -->
                <div class="calendar-wrapper mt-4" style="max-width: 500px;">
                    <div class="calendar-header-custom">
                        <button id="prev-month-btn" class="calendar-nav-btn">&lt;</button>
                        <h2 id="current-month-year" class="calendar-month-year-text">November 2024</h2>
                        <button id="next-month-btn" class="calendar-nav-btn">&gt;</button>
                    </div>
                    <table class="calendar-grid-custom">
                        <thead>
                            <tr>
                                <th>Sun</th>
                                <th>Mon</th>
                                <th>Tue</th>
                                <th>Wed</th>
                                <th>Thu</th>
                                <th>Fri</th>
                                <th>Sat</th>
                            </tr>
                        </thead>
                        <tbody id="calendar-body">
                            <!-- Calendar days will be generated by script.js -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Right Panel (Image - hidden on small screens) -->
            <div class="col-lg-3 d-none d-lg-block right-panel">
                <!-- Background image will be set via CSS -->
            </div>
        </div>
    </div>

    <!--FOOTER-->
    <footer class="footer-custom text-light mt-0">
        <div class="container py-5">
            <div class="row align-items-center">

                <div class="col-md-4 mb-4 mb-md-0 text-center text-md-start">
                    <img
                        src="assets\LOGO_3-removebg-preview.png"
                        alt="Studio Merchan Logo"
                        height="80"
                        class="mb-3"
                    />
                    <p class="mb-1">Studio Merchan</p>
                    <p class="small">Para sa Musikerong Lucenahin.</p>
                </div>

                <div class="col-md-4 mb-4 mb-md-0 text-center">
                    <ul class="list-unstyled d-flex justify-content-center mb-0">
                        <li><a href="aboutus.html" class="footer-link mx-3">About</a></li>
                        <li><a href="services.html" class="footer-link mx-3">Services</a></li>
                        <li><a href="team.html" class="footer-link mx-3">Team</a></li>
                        <li><a href="sample_booking\booking.php" class="footer-link mx-3">Book Us</a></li>
                    </ul>
                </div>

                <div class="col-md-4 text-center text-md-end">
                    <p class="mb-2">Follow us</p>
                    <a href="#" class="footer-icon mx-2"></a>
                        <a href="#" class="footer-icon mx-2" aria-label="Facebook"
                        ><i class="bi bi-facebook"></i
                        ></a>
                        <a href="#" class="footer-icon mx-2" aria-label="Instagram"
                        ><i class="bi bi-instagram"></i
                        ></a>
                        <a href="#" class="footer-icon mx-2" aria-label="YouTube"
                        ><i class="bi bi-youtube"></i
                        ></a>
                        <a href="#" class="footer-icon mx-2" aria-label="twitter"
                        ><i class="bi bi-twitter"></i
                        ></a>
                        <a href="#" class="footer-icon mx-2" aria-label="TikTok"
                        ><i class="bi bi-tiktok"></i></a
                    ></a>
                    <p class="small mt-3 mb-0">
                        &copy; 2025 Studio Merchan. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap 5.3 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" xintegrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    
    <!-- Your custom script.js -->
    <script src="script.js"></script>
</body>
</html>