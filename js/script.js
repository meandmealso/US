// js/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // IMPORTANT: Replace with your actual dates and times.
    // JavaScript's Date parsing can be tricky with timezones.
    // Using ISO 8601 format (YYYY-MM-DDTHH:mm:ss+HH:MM or Z for UTC) is safest.
    // Riyadh is UTC+3. So 3:35 AM is 00:35 UTC on the same day, or specified as +03:00.
    const firstMessageDate = '2025-04-18T03:35:00+03:00'; // April 18, 2025, 3:35 AM Riyadh Time
    const officialDate = '2025-05-08T15:31:00+03:00';     // May 8, 2025, 3:31 PM Riyadh Time

    // --- Initialize Timers ---
    updateTimer('timer-first-message', firstMessageDate);
    updateTimer('timer-official', officialDate);

    // --- Initialize Gallery Modal (Bootstrap 5) ---
    const imageModalElement = document.getElementById('imageModal');
    if (imageModalElement) {
        imageModalElement.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const imageUrl = button.getAttribute('data-bs-image');
            const captionText = button.getAttribute('data-bs-caption');

            const modalImage = imageModalElement.querySelector('#modalImage');
            const modalCaption = imageModalElement.querySelector('#modalCaption');
            const modalTitle = imageModalElement.querySelector('.modal-title');

            modalImage.src = imageUrl;
            modalCaption.textContent = captionText || ''; // Handle if no caption
            modalTitle.textContent = captionText || "Our Memories";
        });
    }

    // --- Load Spotify Playlist ---
    loadSpotifyPlaylist();

    // --- Update Footer Year ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Initialize AOS (Animate On Scroll) ---
    AOS.init({
        duration: 800, // values from 0 to 3000, with step 50ms
        once: true,    // whether animation should happen only once - while scrolling down
    });

    // --- Navbar Active Link highlighting and smooth scroll handling ---
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const sections = document.querySelectorAll('section[id]');

    function changeNavActiveState() {
        let index = sections.length;

        while(--index && window.scrollY + 100 < sections[index].offsetTop) {} // 100 is offset

        navLinks.forEach((link) => link.classList.remove('active'));
        if (navLinks[index]) { // Check if the link exists
            navLinks[index].classList.add('active');
        }
    }

    changeNavActiveState(); // Initial check
    window.addEventListener('scroll', changeNavActiveState);

    // Close mobile navbar on link click
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navCollapse = document.querySelector('.navbar-collapse');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navCollapse.classList.contains('show') && navbarToggler.offsetParent !== null) { // Check if mobile nav is open
                bootstrap.Collapse.getInstance(navCollapse).hide();
            }
        });
    });

}); // End DOMContentLoaded


// --- Timer Function ---
function updateTimer(elementId, targetDateString) {
    const timerElement = document.getElementById(elementId);
    if (!timerElement) {
        console.warn(`Timer element with ID '${elementId}' not found.`);
        return;
    }

    const targetDate = new Date(targetDateString).getTime();

    if (isNaN(targetDate)) {
        timerElement.innerHTML = "Invalid date provided for timer.";
        console.error(`Invalid date string for timer ${elementId}: ${targetDateString}`);
        return;
    }

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = now - targetDate; // Time elapsed since targetDate

        if (distance < 0) {
            // This case means the targetDate is in the future, which is not expected for "since" timers
            // If you wanted a countdown *to* a future date, the logic would be `targetDate - now`
            timerElement.innerHTML = "Waiting for this moment...";
            // clearInterval(interval); // Optionally stop if it's a countdown that hasn't started
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerElement.innerHTML = `
            <div><span class="time-value">${days}</span><span class="time-label">Days</span></div>
            <div><span class="time-value">${hours}</span><span class="time-label">Hours</span></div>
            <div><span class="time-value">${minutes}</span><span class="time-label">Minutes</span></div>
            <div><span class="time-value">${seconds}</span><span class="time-label">Seconds</span></div>
        `;
    }, 1000);
}


// --- Spotify Playlist Functions ---
let currentAudio = null; // To manage single audio playback

async function loadSpotifyPlaylist() {
    const songsContainer = document.getElementById('songs-gallery-row');
    const loadingSpinner = document.getElementById('songs-loading');
    if (!songsContainer || !loadingSpinner) return;

    try {
        // Path to your Netlify serverless function
        const response = await fetch('/.netlify/functions/get-spotify-playlist');

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || response.statusText}`);
        }

        const tracks = await response.json();
        loadingSpinner.style.display = 'none'; // Hide spinner

        if (tracks.length === 0) {
            songsContainer.innerHTML = "<p class='text-center col-12'>Our special playlist is currently empty or couldn't be loaded. ✨</p>";
            return;
        }

        let html = '';
        tracks.forEach(track => {
            html += `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4" data-aos="fade-up" data-aos-delay="${tracks.indexOf(track) * 100}">
                    <div class="card song-card">
                        <img src="${track.albumArt}" class="card-img-top" alt="${track.name} Album Art">
                        <div class="card-body">
                            <h5 class="card-title">${track.name}</h5>
                            <p class="card-text text-muted">${track.artist}</p>
                            <div class="mt-auto"> <!-- Buttons container -->
                                <a href="${track.spotifyUrl}" target="_blank" class="btn btn-spotify btn-sm d-block mb-2">
                                    <i class="fab fa-spotify"></i> Listen on Spotify
                                </a>
                                ${track.previewUrl ? `
                                <button onclick="playPreview('${track.previewUrl}', this)" class="btn btn-preview btn-sm d-block preview-btn">
                                    <i class="fas fa-play"></i> Preview
                                </button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        songsContainer.innerHTML = html;
    } catch (error) {
        console.error("Could not load Spotify playlist:", error);
        loadingSpinner.style.display = 'none'; // Hide spinner
        songsContainer.innerHTML = `<p class='text-center text-danger col-12'>Oops! We couldn't load our songs right now. Please check back later. (Error: ${error.message})</p>`;
    }
}

function playPreview(previewUrl, buttonElement) {
    const icon = buttonElement.querySelector('i');

    if (currentAudio) {
        currentAudio.pause();
        // Reset all other preview buttons
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.innerHTML = '<i class="fas fa-play"></i> Preview';
            btn.classList.remove('playing');
        });

        if (currentAudio.src === previewUrl && !currentAudio.paused) { // If it's the same song and it was playing
            currentAudio = null; // Stop it
            return;
        }
    }

    currentAudio = new Audio(previewUrl);
    currentAudio.play()
        .then(() => {
            buttonElement.innerHTML = '<i class="fas fa-pause"></i> Pause';
            buttonElement.classList.add('playing');
        })
        .catch(e => {
            console.error("Error playing preview:", e);
            currentAudio = null; // Reset on error
            buttonElement.innerHTML = '<i class="fas fa-play"></i> Preview';
            buttonElement.classList.remove('playing');
        });

    currentAudio.onended = () => {
        buttonElement.innerHTML = '<i class="fas fa-play"></i> Preview';
        buttonElement.classList.remove('playing');
        currentAudio = null;
    };
    currentAudio.onpause = () => { // Handle external pauses or end of playback
        if (currentAudio && currentAudio.src === previewUrl) { // Ensure it's the correct audio instance
             buttonElement.innerHTML = '<i class="fas fa-play"></i> Preview';
             buttonElement.classList.remove('playing');
        }
    };
}


document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const firstMessageDate = '2025-04-18T03:35:00+03:00';
    const officialDate = '2025-05-08T15:31:00+03:00';

    // --- NEW: Birth Date Configurations ---
    const yourBirthDateString = '2003-05-25'; // YYYY-MM-DD
    const herBirthDateString = '2002-11-14';   // YYYY-MM-DD

    // ... (rest of your existing initializations) ...

    // --- Initialize Age and Birthday Countdowns ---
    if (document.getElementById('your-age')) {
        displayAgeAndBirthday('your-age', 'your-birthday-countdown', yourBirthDateString);
    }
    if (document.getElementById('her-age')) {
        displayAgeAndBirthday('her-age', 'her-birthday-countdown', herBirthDateString);
    }

});


function calculateAge(birthDateString) {
    const birthDate = new Date(birthDateString);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        // Get days in the previous month
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    return { years, months, days };
}

function getNextBirthday(birthDateString) {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let nextBirthdayYear = today.getFullYear();

    // Set month and day from birthDate, year from current or next year
    let nextBirthday = new Date(nextBirthdayYear, birthDate.getMonth(), birthDate.getDate());

    if (nextBirthday < today) { // If birthday this year has passed
        nextBirthday.setFullYear(nextBirthdayYear + 1);
    }
    return nextBirthday;
}

function displayAgeAndBirthday(ageElementId, countdownElementId, birthDateString) {
    const ageElement = document.getElementById(ageElementId);
    const countdownElement = document.getElementById(countdownElementId);

    if (!ageElement || !countdownElement) {
        console.warn(`Elements for age/birthday not found for: ${ageElementId}, ${countdownElementId}`);
        return;
    }

    // Display Age
    const age = calculateAge(birthDateString);
    ageElement.textContent = `${age.years} years, ${age.months} months, and ${age.days} days`;

    // Birthday Countdown
    const nextBirthdayDate = getNextBirthday(birthDateString);

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = nextBirthdayDate.getTime() - now;

        if (distance < 0) { // Should not happen if logic is correct, but good for safety
            countdownElement.innerHTML = "Happy Birthday!"; // Or update to next year
            // Potentially re-calculate next birthday and age here if it just passed
            const newAge = calculateAge(birthDateString);
            ageElement.textContent = `${newAge.years} years, ${newAge.months} months, and ${newAge.days} days`;
            // And restart countdown for next year - complex to do in interval, better to refresh page or trigger a function
            // For simplicity, we'll assume the page gets refreshed or it's handled by the getNextBirthday on load
            // clearInterval(interval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `
            <div><span class="time-value">${days}</span><span class="time-label">Days</span></div>
            <div><span class="time-value">${hours}</span><span class="time-label">Hours</span></div>
            <div><span class="time-value">${minutes}</span><span class="time-label">Minutes</span></div>
            <div><span class="time-value">${seconds}</span><span class="time-label">Seconds</span></div>
        `;

        // If birthday just passed (distance becomes negative during an interval)
        // This is a quick check to update age right after midnight on birthday
        if (new Date().getDate() === new Date(birthDateString).getDate() &&
            new Date().getMonth() === new Date(birthDateString).getMonth() &&
            distance < (1000 * 60 * 60 * 24) && distance > - (1000 * 60 * 60 * 24) ) { // within the birthday
            const currentAge = calculateAge(birthDateString);
            if (ageElement.textContent !== `${currentAge.years} years, ${currentAge.months} months, and ${currentAge.days} days`) {
                ageElement.textContent = `${currentAge.years} years, ${currentAge.months} months, and ${currentAge.days} days`;
            }
        }


    }, 1000);
}