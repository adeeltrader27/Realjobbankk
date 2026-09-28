// Global State & Initial Data
let currentUser = JSON.parse(localStorage.getItem('rgb_current_user')) || null;
let jobs = JSON.parse(localStorage.getItem('rgb_jobs')) || [
    { id: 1, title: 'Senior Software Engineer', timing: 'Full-Time (9 AM - 5 PM)', salary: 'PKR 120,000 - 180,000', location: 'Multan', province: 'Punjab', edu: 'Bachelor in CS', details: 'Looking for an experienced Full-Stack Developer with strong JavaScript, HTML, CSS, and backend database expertise.' },
    { id: 2, title: 'IT Assistant & Network Support', timing: 'Contract / Day Shift', salary: 'PKR 45,000 - 60,000', location: 'Lahore', province: 'Punjab', edu: 'ICS / Bachelor', details: 'Manage local area network, thermal printers, hardware troubleshooting, and IT helpdesk duties.' },
    { id: 3, title: 'Medical Billing Specialist', timing: 'Night Shift', salary: 'PKR 60,000 - 90,000', location: 'Islamabad', province: 'Islamabad', edu: 'Graduation', details: 'Handle hospital data processing, medical billing records, and client communications.' }
];

let applications = JSON.parse(localStorage.getItem('rgb_applications')) || [];
let banners = JSON.parse(localStorage.getItem('rgb_banners')) || [];
let currentWizardJob = null;
let tempEduList = [];
let tempExpList = [];
let authMode = 'login'; // 'login' or 'register'

// Initialize App on Load
window.onload = function() {
    triggerLoadingBar();
    updateNavAuth();
    renderJobs();
    initSlider();
    
    // Restore hash route or default to home
    const lastSection = localStorage.getItem('rgb_last_section') || 'home-section';
    showSection(lastSection, false);
};

// Loading Bar simulation for fast UX
function triggerLoadingBar() {
    const bar = document.getElementById('loading-bar');
    bar.style.width = '70%';
    setTimeout(() => {
        bar.style.width = '100%';
        setTimeout(() => { bar.style.width = '0%'; }, 300);
    }, 400);
}

// Navigation & Sections
function showSection(sectionId, save = true) {
    triggerLoadingBar();
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    
    if(save) {
        localStorage.setItem('rgb_last_section', sectionId);
    }
    
    if(sectionId === 'dashboard-section') renderDashboard();
    if(sectionId === 'applications-section') renderMyApplications();
    if(sectionId === 'admin-section') renderAdminPanel();
}

// Banner Slider Logic (3s auto rotation & close)
let sliderInterval;
function initSlider() {
    const slider = document.getElementById('banner-slider');
    if(!slider) return;
    
    // If custom banners uploaded, render them
    if(banners.length > 0) {
        slider.innerHTML = `<button class="slider-close" onclick="closeBanner()"><i class="fa-solid fa-xmark"></i></button>`;
        banners.forEach((imgUrl, index) => {
            slider.innerHTML += `
                <div class="slide ${index === 0 ? 'active' : ''}" style="background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imgUrl}')">
                    <div class="slide-content">
                        <h2>Real Job Bank Featured Opportunities</h2>
                        <p>Explore verified jobs across Pakistan.</p>
                    </div>
                </div>`;
        });
    }

    const slides = slider.querySelectorAll('.slide');
    if(slides.length <= 1) return;
    
    let currentSlide = 0;
    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 3000);
}

function closeBanner() {
    document.getElementById('banner-slider').style.display = 'none';
}

// Render Jobs with Search & Province Filter
function renderJobs() {
    const grid = document.getElementById('jobs-grid');
    const searchVal = document.getElementById('global-search').value.toLowerCase();
    const provinceVal = document.getElementById('province-filter').value;
    
    const filtered = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchVal) || job.details.toLowerCase().includes(searchVal) || job.location.toLowerCase().includes(searchVal);
        const matchesProvince = provinceVal === "" || job.province === provinceVal;
        return matchesSearch && matchesProvince;
    });

    document.getElementById('job-count').innerText = `Showing ${filtered.length} jobs`;

    grid.innerHTML = '';
    if(filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--text-light);">No jobs found matching your criteria.</p>`;
        return;
    }

    filtered.forEach(job => {
        grid.innerHTML += `
            <div class="job-card">
                <h3>${job.title}</h3>
                <div class="job-badges">
                    <span><i class="fa-solid fa-clock"></i> ${job.timing}</span>
                    <span><i class="fa-solid fa-money-bill-wave"></i> ${job.salary}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${job.location}</span>
                </div>
                <p style="font-size:14px; color: var(--text-light); margin-bottom:15px;">${job.details.substring(0, 100)}...</p>
                <button class="btn-primary" onclick="openJobDetails(${job.id})">View Details & Apply</button>
            </div>
        `;
    });
}

function filterJobs() {
    renderJobs();
}

// Job Details Modal
let activeJobId = null;
function openJobDetails(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if(!job) return;
    activeJobId = jobId;

    document.getElementById('modal-job-title').innerText = job.title;
    document.getElementById('modal-job-timing').innerHTML = `<i class="fa-solid fa-clock"></i> ${job.timing}`;
    document.getElementById('modal-job-salary').innerHTML = `<i class="fa-solid fa-money-bill-wave"></i> ${job.salary}`;
    document.getElementById('modal-job-location').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${job.location}, ${job.province}`;
    document.getElementById('modal-job-edu').innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${job.edu}`;
    document.getElementById('modal-job-desc').innerText = job.details;

    document.getElementById('job-details-modal').style.display = 'flex';
}

function closeJobModal() {
    document.getElementById('job-details-modal').style.display = 'none';
}

function triggerApplyFromModal() {
    closeJobModal();
    if(!currentUser) {
        alert('Please login or register to apply for jobs.');
        openAuthModal('login');
        return;
    }

    // Check if already applied
    const alreadyApplied = applications.some(app => app.userId === currentUser.cnic && app.jobId === activeJobId);
    if(alreadyApplied) {
        alert('You have already applied for this job! You cannot apply twice to the same job.');
        return;
    }

    const job = jobs.find(j => j.id === activeJobId);
    document.getElementById('wizard-job-title').innerText = `Apply for: ${job.title}`;
    
    // Pre-fill user data
    document.getElementById('app-name').value = currentUser.name;
    document.getElementById('app-cnic').value = currentUser.cnic;
    document.getElementById('app-mobile').value = currentUser.mobile;

    tempEduList = [];
    tempExpList = [];
    renderEduTable();
    renderExpTable();

    showSection('apply-section', false);
}

// Auth Modal Management
function openAuthModal(mode) {
    authMode = mode;
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-modal-title');
    const nameGroup = document.getElementById('group-name');
    const confirmGroup = document.getElementById('group-pass-confirm');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('auth-switch-text');

    if(mode === 'register') {
        title.innerText = 'Candidate Registration';
        nameGroup.style.display = 'block';
        confirmGroup.style.display = 'block';
        submitBtn.innerText = 'Register Account';
        switchText.innerHTML = `Already have an account? <a href="#" onclick="openAuthModal('login')">Login here</a>`;
    } else {
        title.innerText = 'Candidate Portal Login';
        nameGroup.style.display = 'none';
        confirmGroup.style.display = 'none';
        submitBtn.innerText = 'Login';
        switchText.innerHTML = `Don't have an account? <a href="#" onclick="openAuthModal('register')">Register Now</a>`;
    }

    modal.style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

function toggleAuthMode() {
    openAuthModal(authMode === 'login' ? 'register' : 'login');
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const cnicInput = document.getElementById('auth-cnic').value.trim();
    const mobileInput = document.getElementById('auth-mobile').value.trim();
    const passInput = document.getElementById('auth-password').value;

    // SECRET ADMIN MASTER KEY LOGIN CHECK
    if(cnicInput === 'Admin@realjobbank' || mobileInput === 'Admin@realjobbank') {
        closeAuthModal();
        currentUser = { name: 'Super Admin', cnic: 'Admin@realjobbank', mobile: 'Admin', role: 'admin' };
        localStorage.setItem('rgb_current_user', JSON.stringify(currentUser));
        updateNavAuth();
        showSection('admin-section');
        alert('Successfully logged into Admin Control Center!');
        return;
    }

    let users = JSON.parse(localStorage.getItem('rgb_users')) || [];

    if(authMode === 'register') {
        const nameInput = document.getElementById('auth-name').value.trim();
        const passConfirm = document.getElementById('auth-password-confirm').value;

        if(passInput !== passConfirm) {
            alert('Passwords do not match!');
            return;
        }

        // Check if CNIC or mobile already registered
        const exists = users.find(u => u.cnic === cnicInput || u.mobile === mobileInput);
        if(exists) {
            alert('An account with this CNIC or Mobile Number already exists! Only one account per CNIC is allowed.');
            return;
        }

        const newUser = { name: nameInput, cnic: cnicInput, mobile: mobileInput, password: passInput, role: 'candidate' };
        users.push(newUser);
        localStorage.setItem('rgb_users', JSON.stringify(users));
        
        alert(`Registration Successful! Welcome ${nameInput}. You can now login.`);
        openAuthModal('login');
    } else {
        // Login process
        const found = users.find(u => (u.cnic === cnicInput || u.mobile === cnicInput) && u.password === passInput);
        if(!found) {
            alert('Invalid credentials! Please check your CNIC/Mobile and Password.');
            return;
        }

        currentUser = found;
        localStorage.setItem('rgb_current_user', JSON.stringify(currentUser));
        closeAuthModal();
        updateNavAuth();
        alert(`Welcome back, ${currentUser.name}!`);
        showSection('home-section');
    }
}

function updateNavAuth() {
    const navItem = document.getElementById('auth-nav-item');
    if(currentUser) {
        if(currentUser.role === 'admin') {
            navItem.innerHTML = `<button class="btn-danger" onclick="adminLogout()">Admin Logout</button>`;
            // Add Admin tab in nav links if not present
            return;
        }
        navItem.innerHTML = `<button class="btn-secondary" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout (${currentUser.name})</button>`;
    } else {
        navItem.innerHTML = `<button class="btn-primary" onclick="openAuthModal('login')">Login / Register</button>`;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('rgb_current_user');
    updateNavAuth();
    showSection('home-section');
    alert('Logged out successfully.');
}

function adminLogout() {
    logout();
}

// Multi-Step Wizard Navigation
function nextStep(stepNumber) {
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');

    document.querySelectorAll('.step-dot').forEach(dot => dot.classList.remove('active'));
    for(let i=1; i<=stepNumber; i++) {
        document.getElementById(`dot-${i}`).classList.add('active');
    }
}

// Education Dynamic Table
function addEducationRow() {
    const degree = document.getElementById('edu-degree').value;
    const institute = document.getElementById('edu-institute').value.trim();
    const year = document.getElementById('edu-year').value.trim();
    const obtained = parseFloat(document.getElementById('edu-obtained').value);
    const total = parseFloat(document.getElementById('edu-total').value);

    if(!institute || !year || isNaN(obtained) || isNaN(total)) {
        alert('Please fill out all education fields correctly.');
        return;
    }

    const percentage = ((obtained / total) * 100).toFixed(2);
    tempEduList.push({ degree, institute, year, obtained, total, percentage });
    renderEduTable();

    // Clear inputs
    document.getElementById('edu-institute').value = '';
    document.getElementById('edu-year').value = '';
    document.getElementById('edu-obtained').value = '';
    document.getElementById('edu-total').value = '';
}

function renderEduTable() {
    const tbody = document.getElementById('edu-tbody');
    tbody.innerHTML = '';
    tempEduList.forEach((edu, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${edu.degree}</td>
                <td>${edu.institute}</td>
                <td>${edu.year}</td>
                <td>${edu.obtained}/${edu.total}</td>
                <td>${edu.percentage}%</td>
                <td><button type="button" class="btn-danger" style="padding:2px 6px; font-size:12px;" onclick="removeEdu(${index})">X</button></td>
            </tr>
        `;
    });
}

function removeEdu(index) {
    tempEduList.splice(index, 1);
    renderEduTable();
}

// Experience Dynamic Table
function addExperienceRow() {
    const company = document.getElementById('exp-company').value.trim();
    const role = document.getElementById('exp-role').value.trim();
    const from = document.getElementById('exp-from').value;
    const to = document.getElementById('exp-to').value;

    if(!company || !role || !from || !to) {
        alert('Please fill out all experience fields.');
        return;
    }

    tempExpList.push({ company, role, from, to });
    renderExpTable();

    document.getElementById('exp-company').value = '';
    document.getElementById('exp-role').value = '';
    document.getElementById('exp-from').value = '';
    document.getElementById('exp-to').value = '';
}

function renderExpTable() {
    const tbody = document.getElementById('exp-tbody');
    tbody.innerHTML = '';
    tempExpList.forEach((exp, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${exp.company}</td>
                <td>${exp.role}</td>
                <td>${exp.from}</td>
                <td>${exp.to}</td>
                <td><button type="button" class="btn-danger" style="padding:2px 6px; font-size:12px;" onclick="removeExp(${index})">X</button></td>
            </tr>
        `;
    });
}

function removeExp(index) {
    tempExpList.splice(index, 1);
    renderExpTable();
}

// Submit Application & Generate Application ID + PDF data
function submitApplication(e) {
    e.preventDefault();
    if(!document.getElementById('terms-check').checked) {
        alert('Please agree to the terms before submitting.');
        return;
    }

    const job = jobs.find(j => j.id === activeJobId);
    const appId = 'RGB' + Math.floor(10000000 + Math.random() * 90000000);
    
    const picInput = document.getElementById('app-pic');
    let picUrl = 'https://via.placeholder.com/150';
    if(picInput.files && picInput.files[0]) {
        picUrl = URL.createObjectURL(picInput.files[0]);
    }

    const applicationData = {
        appId,
        userId: currentUser.cnic,
        candidateName: currentUser.name,
        jobId: activeJobId,
        jobTitle: job.title,
        status: 'Under Review',
        date: new Date().toLocaleDateString(),
        personal: {
            father: document.getElementById('app-father').value,
            marital: document.getElementById('app-marital').value,
            email: document.getElementById('app-email').value,
            province: document.getElementById('app-province').value,
            city: document.getElementById('app-city').value,
            license: document.getElementById('app-license').value,
            mobile: currentUser.mobile,
            cnic: currentUser.cnic,
            pic: picUrl
        },
        education: tempEduList,
        experience: tempExpList
    };

    applications.push(applicationData);
    localStorage.setItem('rgb_applications', JSON.stringify(applications));

    alert(`Application Submitted Successfully! Your Official Application ID is: ${appId}`);
    showSection('applications-section');
}

// Render My Applied Jobs
function renderMyApplications() {
    const list = document.getElementById('applied-jobs-list');
    if(!currentUser) {
        list.innerHTML = `<p>Please login to view your applications.</p>`;
        return;
    }

    const myApps = applications.filter(app => app.userId === currentUser.cnic);
    list.innerHTML = '';

    if(myApps.length === 0) {
        list.innerHTML = `<p>You have not applied for any jobs yet.</p>`;
        return;
    }

    myApps.forEach(app => {
        list.innerHTML += `
            <div class="job-card" style="margin-bottom: 15px;">
                <h3>${app.jobTitle}</h3>
                <p><strong>Application ID:</strong> <span style="color:var(--primary); font-weight:bold;">${app.appId}</span></p>
                <p><strong>Status:</strong> <span style="color: ${app.status === 'Approved' ? 'var(--success)' : 'orange'}; font-weight:bold;">${app.status}</span></p>
                <p><strong>Applied Date:</strong> ${app.date}</p>
                <div style="margin-top: 15px; display:flex; gap:10px;">
                    <button class="btn-primary" onclick='downloadCV("${app.appId}")'><i class="fa-solid fa-download"></i> Download PDF CV</button>
                    <button class="btn-secondary" onclick='printCV("${app.appId}")'><i class="fa-solid fa-print"></i> Print A4 CV</button>
                </div>
            </div>
        `;
    });
}

// Generate A4 CV PDF via html2pdf
function downloadCV(appId) {
    const app = applications.find(a => a.appId === appId);
    if(!app) return;

    populatePDFTemplate(app);
    const element = document.getElementById('cv-printable-area');
    element.style.display = 'block';

    const opt = {
        margin:       10,
        filename:     `CV_${app.candidateName.replace(/\s+/g, '_')}_${app.appId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
        element.style.display = 'none';
    });
}

function printCV(appId) {
    const app = applications.find(a => a.appId === appId);
    if(!app) return;

    populatePDFTemplate(app);
    const element = document.getElementById('cv-printable-area');
    element.style.display = 'block';
    
    window.print();
    element.style.display = 'none';
}

function populatePDFTemplate(app) {
    document.getElementById('cv-img').src = app.personal.pic;
    document.getElementById('cv-name').innerText = app.candidateName;
    document.getElementById('cv-applied-job').innerText = app.jobTitle;
    document.getElementById('cv-appid').innerText = app.appId;
    document.getElementById('cv-cnic').innerText = app.personal.cnic;
    document.getElementById('cv-mobile').innerText = app.personal.mobile;
    document.getElementById('cv-email').innerText = app.personal.email;
    document.getElementById('cv-father').innerText = app.personal.father;
    document.getElementById('cv-marital').innerText = app.personal.marital;
    document.getElementById('cv-location').innerText = `${app.personal.city}, ${app.personal.province}`;

    const eduTbody = document.querySelector('#cv-edu-table tbody');
    eduTbody.innerHTML = '';
    app.education.forEach(e => {
        eduTbody.innerHTML += `<tr><td>${e.degree}</td><td>${e.institute}</td><td>${e.year}</td><td>${e.obtained}/${e.total}</td><td>${e.percentage}%</td></tr>`;
    });

    const expTbody = document.querySelector('#cv-exp-table tbody');
    expTbody.innerHTML = '';
    app.experience.forEach(ex => {
        expTbody.innerHTML += `<tr><td>${ex.company}</td><td>${ex.role}</td><td>${ex.from}</td><td>${ex.to}</td></tr>`;
    });
}

// Dashboard Render
function renderDashboard() {
    if(!currentUser) return;
    const myApps = applications.filter(app => app.userId === currentUser.cnic);
    const approvedCount = myApps.filter(app => app.status === 'Approved').length;
    const reviewCount = myApps.filter(app => app.status === 'Under Review').length;

    document.getElementById('stat-applied').innerText = myApps.length;
    document.getElementById('stat-review').innerText = reviewCount;
    document.getElementById('stat-approved').innerText = approvedCount;

    document.getElementById('user-profile-summary').innerHTML = `
        <p><strong>Name:</strong> ${currentUser.name}</p>
        <p><strong>CNIC / ID:</strong> ${currentUser.cnic}</p>
        <p><strong>Mobile:</strong> ${currentUser.mobile}</p>
    `;
}

// Admin Panel Functions
function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabId === 'applicants-tab') renderAdminApplicants();
    if(tabId === 'banners-tab') renderAdminBanners();
}

function handlePostJob(e) {
    e.preventDefault();
    const title = document.getElementById('admin-job-title').value.trim();
    const timing = document.getElementById('admin-job-timing').value.trim();
    const salary = document.getElementById('admin-job-salary').value.trim();
    const location = document.getElementById('admin-job-location').value.trim();
    const edu = document.getElementById('admin-job-edu').value.trim();
    const details = document.getElementById('admin-job-details').value.trim();

    // Check duplicate post
    const exists = jobs.some(j => j.title.toLowerCase() === title.toLowerCase() && j.location.toLowerCase() === location.toLowerCase());
    if(exists) {
        alert('This job title and location already exists! A post cannot be uploaded twice.');
        return;
    }

    const newJob = { id: Date.now(), title, timing, salary, location, province: 'Punjab', edu, details };
    jobs.push(newJob);
    localStorage.setItem('rgb_jobs', JSON.stringify(jobs));

    alert('Job successfully posted!');
    document.getElementById('add-job-form').reset();
    renderAdminPanel();
    renderJobs();
}

function renderAdminPanel() {
    const list = document.getElementById('admin-jobs-list');
    list.innerHTML = `
        <table>
            <thead><tr><th>Title</th><th>Location</th><th>Salary</th><th>Action</th></tr></thead>
            <tbody>
                ${jobs.map(j => `
                    <tr>
                        <td>${j.title}</td>
                        <td>${j.location}</td>
                        <td>${j.salary}</td>
                        <td><button class="btn-danger" onclick="deleteJob(${j.id})">Delete</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteJob(jobId) {
    if(confirm('Are you sure you want to delete this job post?')) {
        jobs = jobs.filter(j => j.id !== jobId);
        localStorage.setItem('rgb_jobs', JSON.stringify(jobs));
        renderAdminPanel();
        renderJobs();
    }
}

function renderAdminApplicants() {
    const list = document.getElementById('admin-applicants-list');
    if(applications.length === 0) {
        list.innerHTML = `<p>No candidate applications received yet.</p>`;
        return;
    }

    list.innerHTML = `
        <table>
            <thead><tr><th>App ID</th><th>Candidate</th><th>Job Applied</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
                ${applications.map((app, index) => `
                    <tr>
                        <td><strong>${app.appId}</strong></td>
                        <td>${app.candidateName} (${app.personal.mobile})</td>
                        <td>${app.jobTitle}</td>
                        <td><span style="color: ${app.status === 'Approved' ? 'green':'orange'}">${app.status}</span></td>
                        <td>
                            <button class="btn-primary" style="padding:4px 8px; font-size:12px;" onclick="toggleAppStatus(${index})">Mark Approved</button>
                            <button class="btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="downloadCV('${app.appId}')">PDF</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function toggleAppStatus(index) {
    applications[index].status = 'Approved';
    localStorage.setItem('rgb_applications', JSON.stringify(applications));
    renderAdminApplicants();
    alert(`Application ${applications[index].appId} marked as Approved successfully!`);
}

function uploadBannerImages(e) {
    const files = e.target.files;
    for(let i=0; i<files.length; i++) {
        if(banners.length >= 7) {
            alert('Maximum 7 banner images allowed.');
            break;
        }
        const url = URL.createObjectURL(files[i]);
        banners.push(url);
    }
    localStorage.setItem('rgb_banners', JSON.stringify(banners));
    renderAdminBanners();
    initSlider();
    alert('Banner images updated successfully!');
}

function renderAdminBanners() {
    const preview = document.getElementById('admin-banner-preview');
    preview.innerHTML = '';
    banners.forEach((url, index) => {
        preview.innerHTML += `
            <div>
                <img src="${url}" class="admin-banner-thumb">
                <button class="btn-danger" style="width:100%; margin-top:5px; font-size:11px;" onclick="removeBanner(${index})">Remove</button>
            </div>
        `;
    });
}

function removeBanner(index) {
    banners.splice(index, 1);
    localStorage.setItem('rgb_banners', JSON.stringify(banners));
    renderAdminBanners();
    initSlider();
}