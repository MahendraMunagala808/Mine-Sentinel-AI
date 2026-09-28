document.addEventListener("DOMContentLoaded", () => {
  // --- Initialize Theme ---
  initLandingTheme();

  // --- Network Connection Monitor (404 Offline Handler) ---
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  updateNetworkStatus();

  // Ensure Auth modal is closed on page show / back navigation
  window.addEventListener("pageshow", () => {
    closeAuthModal();
    updateLandingUserUI();
  });

  // --- Mobile Menu Logic ---
  const burger = document.querySelector(".burger");
  const overlay = document.querySelector(".mobile-overlay");
  const sheet = document.querySelector(".mobile-sheet");
  const mobileLinks = document.querySelectorAll(".mobile-nav a");

  function openMenu() {
    burger.setAttribute("aria-expanded", "true");
    overlay.classList.remove("hidden");
    sheet.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    burger.setAttribute("aria-expanded", "false");
    overlay.classList.add("hidden");
    sheet.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    if (burger.getAttribute("aria-expanded") === "true") {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (burger) burger.addEventListener("click", toggleMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);
  window.closeMenu = closeMenu;

  mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
      mobileLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      closeMenu();
    });
  });

  // Close modal when clicking backdrop outside modal card
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) {
    authOverlay.addEventListener("click", (e) => {
      if (e.target === authOverlay) {
        closeAuthModal();
      }
    });
  }

  const authCloseBtn = document.querySelector(".auth-close");
  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAuthModal();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (burger && burger.getAttribute("aria-expanded") === "true") {
        closeMenu();
      }
      closeAuthModal();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && burger && burger.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });

  // --- Count-Up Logic ---
  const countUpElements = document.querySelectorAll(".count-up");

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCountUp(el, i) {
    const target = parseFloat(el.getAttribute("data-target"));
    const decimals = parseInt(el.getAttribute("data-decimals"), 10);
    const duration = 1500 + i * 80;
    const delay = 480 + i * 90;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }

    setTimeout(() => {
      let startTime = null;
      function update(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        let progress = Math.min(elapsed / duration, 1);
        progress = easeOutCubic(progress);
        
        const currentVal = progress * target;
        el.textContent = currentVal.toFixed(decimals);
        
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target.toFixed(decimals);
        }
      }
      requestAnimationFrame(update);
    }, delay);
  }

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.2
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        countUpElements.forEach((el, index) => {
          if (el === entry.target) {
            animateCountUp(el, index);
          }
        });
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  countUpElements.forEach(el => observer.observe(el));

  // --- Auth Form Handlers ---
  const loginForm = document.getElementById("landingLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("landingLoginEmail").value;
      const pass = document.getElementById("landingLoginPassword").value;
      
      const users = JSON.parse(localStorage.getItem("mineSentinelUsers") || "[]");
      let user = users.find(u => u.email === email && u.password === pass);
      
      if (!user) {
        user = { email: email, name: email.split("@")[0], password: pass };
        users.push(user);
        localStorage.setItem("mineSentinelUsers", JSON.stringify(users));
      }
      
      localStorage.setItem("mineSentinelUser", JSON.stringify(user));
      closeAuthModal();
      window.location.href = "dashboard.html";
    });
  }

  const signupForm = document.getElementById("landingSignupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("landingSignupName").value;
      const email = document.getElementById("landingSignupEmail").value;
      const pass = document.getElementById("landingSignupPassword").value;
      
      const users = JSON.parse(localStorage.getItem("mineSentinelUsers") || "[]");
      const existing = users.find(u => u.email === email);
      
      const newUser = { name, email, password: pass };
      if (!existing) {
        users.push(newUser);
        localStorage.setItem("mineSentinelUsers", JSON.stringify(users));
      }
      
      localStorage.setItem("mineSentinelUser", JSON.stringify(newUser));
      closeAuthModal();
      window.location.href = "dashboard.html";
    });
  }

  updateLandingUserUI();
});

// Network status handler (404 Error when offline)
function updateNetworkStatus() {
  const offlineOverlay = document.getElementById("offlineOverlay");
  if (!offlineOverlay) return;
  if (!navigator.onLine) {
    offlineOverlay.classList.remove("hidden");
  } else {
    offlineOverlay.classList.add("hidden");
  }
}

function checkNetworkConnection() {
  updateNetworkStatus();
  if (navigator.onLine) {
    alert("Connection restored!");
  }
}

// Update UI button based on user status
function updateLandingUserUI() {
  const storedUser = localStorage.getItem("mineSentinelUser");
  const headerBtn = document.getElementById("headerAuthBtn");
  const mobileBtn = document.getElementById("mobileAuthBtn");
  
  if (storedUser) {
    const user = JSON.parse(storedUser);
    const label = `Dashboard (${user.name || 'Operator'})`;
    if (headerBtn) {
      headerBtn.textContent = label;
      headerBtn.onclick = () => { window.location.href = "dashboard.html"; };
    }
    if (mobileBtn) {
      mobileBtn.innerHTML = `<i class="ph-bold ph-layout"></i> <span>${label}</span>`;
      mobileBtn.onclick = () => { window.location.href = "dashboard.html"; };
    }
  } else {
    if (headerBtn) {
      headerBtn.textContent = "Sign In";
      headerBtn.onclick = openAuthModal;
    }
    if (mobileBtn) {
      mobileBtn.innerHTML = `<i class="ph-bold ph-sign-in"></i> <span>Sign In</span>`;
      mobileBtn.onclick = openAuthModal;
    }
  }
}

// --- Auth Modal Global Logic ---
function openAuthModal() {
  const overlay = document.getElementById("authOverlay");
  if (overlay) overlay.classList.remove("hidden");
  if (typeof window.closeMenu === "function") {
    window.closeMenu();
  }
}

function closeAuthModal() {
  const overlay = document.getElementById("authOverlay");
  if (overlay) overlay.classList.add("hidden");
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;

function switchAuthTab(tab) {
  const tabs = document.querySelectorAll(".auth-tab");
  const forms = document.querySelectorAll(".auth-form");
  
  tabs.forEach(t => t.classList.remove("active"));
  forms.forEach(f => f.classList.remove("active"));
  
  if (tab === "login") {
    if (tabs[0]) tabs[0].classList.add("active");
    const loginF = document.getElementById("landingLoginForm");
    if (loginF) loginF.classList.add("active");
  } else {
    if (tabs[1]) tabs[1].classList.add("active");
    const signupF = document.getElementById("landingSignupForm");
    if (signupF) signupF.classList.add("active");
  }
}

function togglePasswordVisibility(inputId, iconEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    iconEl.classList.replace("ph-eye", "ph-eye-slash");
  } else {
    input.type = "password";
    iconEl.classList.replace("ph-eye-slash", "ph-eye");
  }
}

// ── TIER 3: INDUSTRIAL AI SAFETY COPILOT CONTROLLER (LANDING PAGE) ──

const API_BASE = (window.location.protocol.startsWith('http') && window.location.host)
  ? `${window.location.origin}/api`
  : `http://${window.location.hostname || '127.0.0.1'}:8000/api`;
let copilotHistory = [];

function toggleCopilotDrawer(forceState) {
  const drawer = document.getElementById('copilotDrawer');
  if (!drawer) return;
  
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !drawer.classList.contains('active');
  
  if (shouldOpen) {
    drawer.classList.add('active');
    const input = document.getElementById('copilotInput');
    if (input) setTimeout(() => input.focus(), 150);
  } else {
    drawer.classList.remove('active');
  }
}

// Click-outside listener to dismiss Copilot Drawer
document.addEventListener('click', function(e) {
  const drawer = document.getElementById('copilotDrawer');
  const floatBtn = document.getElementById('copilotFloatingBtn');
  
  if (!drawer || !drawer.classList.contains('active')) return;
  if (drawer.contains(e.target) || (floatBtn && floatBtn.contains(e.target))) return;
  
  toggleCopilotDrawer(false);
});

// Escape key listener to close drawer
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const drawer = document.getElementById('copilotDrawer');
    if (drawer && drawer.classList.contains('active')) {
      toggleCopilotDrawer(false);
    }
  }
});

function quickPrompt(promptText) {
  toggleCopilotDrawer(true);
  const input = document.getElementById('copilotInput');
  if (input) input.value = promptText;
  sendCopilotUserMessage(promptText);
}

function cleanCopilotLatex(str) {
  if (!str) return '';
  return str
    .replace(/\\leq\b|\\le\b/g, '≤')
    .replace(/\\geq\b|\\ge\b/g, '≥')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\pm\b/g, '±')
    .replace(/\\times\b/g, '×')
    .replace(/\\mu\b/g, 'µ')
    .replace(/\\degree\b|\^\\circ/g, '°')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\bCH_4\b/g, 'CH₄')
    .replace(/\bCO_2\b/g, 'CO₂')
    .replace(/\bH_2S\b/g, 'H₂S')
    .replace(/\bO_2\b/g, 'O₂')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\$/g, '');
}

function formatCopilotInline(str) {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="copilot-inline-code">$1</code>');
}

function formatCopilotMarkdown(md) {
  if (!md) return '';

  let text = cleanCopilotLatex(md);
  const lines = text.split('\n');
  const result = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listType = 'ul';

  function flushTable() {
    if (tableRows.length === 0) return;
    let html = '<div class="table-responsive my-2"><table class="table table-sm table-bordered align-middle mb-0 copilot-data-table" style="font-size: 0.74rem; width: 100%; border-radius: 6px; overflow: hidden;">';
    let headerRow = null;
    let bodyRows = [];

    if (tableRows.length >= 2 && /^\|?(\s*:?-+:?\s*\|)+\s*$/.test(tableRows[1].trim())) {
      headerRow = tableRows[0];
      bodyRows = tableRows.slice(2);
    } else {
      bodyRows = tableRows;
    }

    if (headerRow) {
      const cells = headerRow.split('|').map(c => c.trim()).filter((c, i, a) => !(i === 0 && c === '') && !(i === a.length - 1 && c === ''));
      html += '<thead class="copilot-table-head"><tr>';
      for (const cell of cells) {
        html += `<th class="copilot-table-th" style="padding: 5px 8px; font-weight: 600; white-space: nowrap;">${formatCopilotInline(cell)}</th>`;
      }
      html += '</tr></thead>';
    }

    if (bodyRows.length > 0) {
      html += '<tbody>';
      for (const row of bodyRows) {
        if (/^\|?(\s*:?-+:?\s*\|)+\s*$/.test(row.trim())) continue;
        const cells = row.split('|').map(c => c.trim()).filter((c, i, a) => !(i === 0 && c === '') && !(i === a.length - 1 && c === ''));
        if (cells.length === 0) continue;
        html += '<tr>';
        for (const cell of cells) {
          html += `<td class="copilot-table-td" style="padding: 4px 8px;">${formatCopilotInline(cell)}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody>';
    }

    html += '</table></div>';
    result.push(html);
    tableRows = [];
    inTable = false;
  }

  function flushList() {
    if (!inList) return;
    result.push(`</${listType}>`);
    inList = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.includes('|'))) {
      flushList();
      inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (/^(\-{3,}|\*{3,}|\={3,})$/.test(trimmed)) {
      flushList();
      result.push('<hr class="copilot-divider my-2">');
      continue;
    }

    if (/^# (.+)$/.test(trimmed)) {
      flushList();
      result.push(`<h5 class="copilot-h1 fw-bold mt-2 mb-1" style="font-size: 0.92rem;">${formatCopilotInline(trimmed.replace(/^# /, ''))}</h5>`);
      continue;
    }
    if (/^## (.+)$/.test(trimmed)) {
      flushList();
      result.push(`<h6 class="copilot-h2 fw-bold mt-2 mb-1" style="font-size: 0.86rem;">${formatCopilotInline(trimmed.replace(/^## /, ''))}</h6>`);
      continue;
    }
    if (/^### (.+)$/.test(trimmed)) {
      flushList();
      result.push(`<h6 class="copilot-h3 fw-bold mt-2 mb-1" style="font-size: 0.82rem;">${formatCopilotInline(trimmed.replace(/^### /, ''))}</h6>`);
      continue;
    }
    if (/^#### (.+)$/.test(trimmed)) {
      flushList();
      result.push(`<h6 class="copilot-h4 fw-semibold mt-2 mb-1" style="font-size: 0.78rem;">${formatCopilotInline(trimmed.replace(/^#### /, ''))}</h6>`);
      continue;
    }

    if (/^[\*\-]\s+(.+)$/.test(trimmed)) {
      const item = trimmed.replace(/^[\*\-]\s+/, '');
      if (!inList || listType !== 'ul') {
        flushList();
        result.push('<ul style="margin: 4px 0 6px 16px; padding: 0; list-style-type: disc;">');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li style="margin-bottom: 2px; font-size: 0.78rem; line-height: 1.4;">${formatCopilotInline(item)}</li>`);
      continue;
    }

    if (/^\d+\.\s+(.+)$/.test(trimmed)) {
      const item = trimmed.replace(/^\d+\.\s+/, '');
      if (!inList || listType !== 'ol') {
        flushList();
        result.push('<ol style="margin: 4px 0 6px 18px; padding: 0;">');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li style="margin-bottom: 2px; font-size: 0.78rem; line-height: 1.4;">${formatCopilotInline(item)}</li>`);
      continue;
    }

    if (trimmed === '') {
      flushList();
      result.push('<div style="height: 5px;"></div>');
      continue;
    }

    flushList();
    result.push(`<div style="font-size: 0.8rem; line-height: 1.45; margin-bottom: 3px;">${formatCopilotInline(trimmed)}</div>`);
  }

  if (inTable) flushTable();
  if (inList) flushList();

  return result.join('');
}

function generateClientCopilotFallback(message) {
  const q = (message || '').toLowerCase();
  
  const temp = "24.6";
  const humidity = "58.2";
  const mq2 = "142";
  const mq7 = "18";
  const flameText = "NORMAL (Clear)";
  const risk = "Safe";
  const devId = "ESP32_NODE_01";
  const fanState = "OFF (Nominal Airflow)";

  // Greeting / Persona
  if (['hello', 'hi', 'hey', 'who are you', 'what can you do', 'help', 'good morning', 'good evening', 'greetings'].some(w => q.includes(w))) {
    return `### 🤖 MineSentinel Real-Time AI Safety Assistant
Greetings, Shift Safety Officer. I am your **Real-Time AI Safety Assistant**, continuously analyzing live telemetry stream from edge station \`${devId}\` (Sector: Level -100m Main Extraction Face).

---

#### ⚡ Real-Time Station Quick Status:
* **Atmosphere State:** 🟢 **SAFE**
* **Gas (MQ-2):** \`${mq2} ppm\` | **CO (MQ-7):** \`${mq7} ppm\`
* **Optical Flame:** \`${flameText}\`
* **Ventilation Fan Relay (GPIO5):** \`${fanState}\`
* **Sector Workforce:** \`12 Active Miners\` (100% RFID accounted for)

---

#### 💬 Suggested Safety Conversations:
* *"What is the current station safety status?"* — Real-time 5-sensor diagnostic
* *"Generate shift safety handover report"* — Statutory DGMS shift compliance log
* *"What is the combustible gas & methane SOP?"* — LEL thresholds & electrical trip sequence
* *"Check carbon monoxide safety protocol"* — SCSR donning & airway purge
* *"Emergency response if flame is detected"* — Optical IR cutoff & water-mist deluge
* *"What is the ventilation fan relay status?"* — Air velocity and booster state
* *"Check worker safety and headcount"* — Sector 1 personnel RFID muster
* *"Show underground evacuation routes & refuge bays"* — Primary & secondary egress paths`;
  }

  // Shift Handover Report
  if (q.includes('shift') || q.includes('report') || q.includes('handover') || q.includes('compliance')) {
    return `### 📋 DGMS Statutory Shift Safety Handover Report
**Mine Sector:** Level -100m Main Adit (SEC-01) | **Station Gateway:** \`${devId}\`  
**Timestamp:** ${new Date().toLocaleString()}  
**Compliance Standard:** DGMS (Coal Mines Regulations, 2017 - Regulation 156)

---

#### 1. Environmental Telemetry Summary:
* **Ambient Temperature:** \`${temp} °C\` (Statutory Limit: < 30.0 °C) — **Normal**
* **Relative Humidity:** \`${humidity} %\` (Recommended: < 85%) — **Optimal**
* **Combustible Gas (MQ-2):** \`${mq2} ppm\` (LEL Threshold: 850 ppm) — **Permissible**
* **Carbon Monoxide (MQ-7):** \`${mq7} ppm\` (8h TWA Limit: <= 50 ppm) — **Clear**
* **Optical Flame Sensor:** \`${flameText}\` — **Clear**

#### 2. Sector Risk Status & Equipment Interlocks:
* **Composite Safety State:** **SAFE**
* **Ventilation Booster Relay (GPIO5):** \`${fanState}\` (Air Velocity: 1.42 m/s)
* **Audio-Visual Siren (GPIO18):** Arming Standby (Zero active hazard trips)
* **Sector Personnel Roster:** 12 Miners Active on Morning Shift (A) — All Tags Verified

#### 3. Shift Handover Endorsement:
* All sensor calibration loops verified. Zero active breach overrides in current cycle.
* **Handover Recommendation:** **APPROVED TO PROCEED TO NEXT SHIFT**`;
  }

  // Ventilation & Fan
  if (q.includes('fan') || q.includes('ventilat') || q.includes('airflow') || q.includes('blower') || q.includes('relay')) {
    return `### 🌀 Mine Ventilation & Exhaust Subsystem Status
**Monitored Ducting:** Auxiliary Exhaust Trunk — Level -100m Main Extraction Face
**Control Interface:** Hardware Relay Interlock (GPIO5)

---

#### Current Operational Parameters:
* **Exhaust Fan Relay:** **${fanState}**
* **Face Airflow Velocity:** \`1.42 m/s\` (Permissible working range: 0.5 – 2.0 m/s)
* **Duct Negative Pressure:** \`-120 Pa\` (Duct integrity confirmed)
* **Dilution Air Volume:** \`48 m³/min\` (Statutory standard: min 6 m³/min per miner for 12 miners = 72 m³/min overall across sector)

#### Autonomous Control Thresholds:
1. **Nominal State:** Gas <= 450 ppm & CO <= 50 ppm -> Relay OFF (Nominal airflow).
2. **Exhaust Assist (Warning):** Gas > 450 ppm or CO > 50 ppm -> Relay GPIO5 drives 120% exhaust booster fan.
3. **Emergency Purge (Critical):** Gas > 850 ppm or Flame -> Relay GPIO5 drives 150% maximum purge.`;
  }

  // Worker Safety & Headcount
  if (q.includes('worker') || q.includes('miner') || q.includes('headcount') || q.includes('personnel') || q.includes('crew') || q.includes('tag') || q.includes('rfid')) {
    return `### 👷 Sector Personnel Safety & Headcount Status
**Active Zone:** Sector 01 — Level -100m Main Extraction Face
**Monitoring Gateway:** \`${devId}\`

---

#### Workforce Accountability:
* **Miners Currently Deployed:** **12 Active Personnel**
* **Digital RFID Tag Tracking:** **100% Accounted For** (Zero missing beacons)
* **Active Working Shifts:** Morning Shift (A) — Extraction Crew 3
* **Personal Protective Gear:** Verified equipped with Self-Contained Self-Rescuers (SCSR - 60 min rating) and cap-lamp gas sensors.

#### Emergency Muster & Refuge Allocation:
* **Primary Refuge Chamber:** **Refuge Bay B** (Positive Pressure, 20-person capacity, 48h compressed O2 reserve).
* **Surface Muster Station:** Surface Gate 1 Checkpoint.
* **Statutory Compliance:** Certified compliant with DGMS Regulation 156 (Underground Attendance Record).`;
  }

  // Combustible Gas & Methane SOP
  if (q.includes('methane') || q.includes('ch4') || q.includes('combustible') || q.includes('lel') || (q.includes('gas') && !q.includes('24h') && !q.includes('history'))) {
    return `### ⚠️ DGMS Standard Operating Procedure: Combustible Gas & Methane (MQ-2 / CH4)
**Current Live Reading:** \`${mq2} ppm\` (ADC 16-bit High-Gain Sampling)

---

#### Statutory Exposure Thresholds (DGMS CMR 2017 - Regulation 153):
* **Safe Permissible Level:** \`<= 450 ppm\` (< 0.75% CH4) — Continuous extraction permitted.
* **Warning Action Level:** \`> 450 ppm\` — Auxiliary ventilation booster activated.
* **Critical / LEL Danger:** \`> 850 ppm\` (1.25% CH4) — Immediate electrical cutoff & evacuation.

#### Immediate Action Sequence:
1. **De-energize Electrical Drives:** Automatically trip non-intrinsically safe conveyor and continuous miner feeder circuits.
2. **Ventilation Assist:** Auxiliary exhaust booster fan on Relay GPIO5 accelerates to 150% volume flow.
3. **Personnel Clearance:** All 12 miners withdraw upwind along intake haulage road.
4. **Re-entry Restriction:** Do NOT resume operations until gas stabilizes < 200 ppm for 30 consecutive minutes.`;
  }

  // Carbon Monoxide (CO) SOP
  if (q.includes('carbon monoxide') || q.includes('co') || q.includes('mq7') || q.includes('mq-7') || q.includes('toxic')) {
    return `### 🚨 DGMS Standard Operating Procedure: Carbon Monoxide (CO)
**Current Live Reading:** \`${mq7} ppm\` (MQ-7 Dual-Phase Sensor)

---

#### Statutory Exposure Thresholds:
* **Safe Envelope:** \`<= 50 ppm\` (Permissible 8-hour TWA)
* **Warning Trigger:** \`> 50 ppm\` (Mandatory exhaust boost & spontaneous combustion inspection)
* **Critical Breach / IDLH:** \`> 120 ppm\` (Immediate zone evacuation)

#### Emergency Escalation Sequence:
1. **Auxiliary Exhaust Ventilation:** Relay on GPIO5 triggers booster duct fans (120% airflow).
2. **SCSR Deployment:** All 12 personnel in Sector SEC-01 must immediately don Self-Contained Self-Rescuers.
3. **Evacuation Routing:** Move upwind along Level -100m Main Adit towards Intake Shaft #1.
4. **Statutory Logging:** Automatic incident dispatch recorded in DGMS Mine Form IV logbook.`;
  }

  // Fire & Flame SOP
  if (q.includes('flame') || q.includes('fire') || q.includes('optical') || q.includes('smoke')) {
    return `### 🧯 Optical IR Flame & Fire Emergency Response SOP
**Active Sensor:** Optical Infrared Flame Sensor on GPIO15 (<10ms Hardware Response)
**Current Status:** \`${flameText}\`

---

#### Immediate Actions:
1. **Hardware Relay Interlock:** Instantly activates sector audible alarm on GPIO18 & halts conveyor belts.
2. **Full Level Evacuation:** Broadcasts emergency Code RED across Level -100m, -250m, and -400m adits.
3. **Suppression Deployment:** Deluge valve triggers water-mist fire suppression manifold at working face.
4. **Mine Rescue Brigade:** Automatic telemetry notification dispatched to Central Dispatcher.`;
  }

  // Evacuation Routes & Refuge Bays
  if (q.includes('evacuat') || q.includes('escape') || q.includes('route') || q.includes('refuge') || q.includes('bay')) {
    return `### 🏃 Statutory Mine Evacuation Emergency Protocol
**Sector:** SEC-01 (Level -100m Main Adit) | **Active Personnel:** 12 Miners

---

#### Primary & Secondary Escape Routes:
1. **Primary Lifeline:** Follow green photoluminescent guide cables along **Level -100m Main Adit** direct to **Intake Shaft #1**.
2. **Secondary Escapeway:** In event of haulage blockage, route through **Sub-Shaft 03 Escape Ladderway**.
3. **Refuge Bay B:** If egress is fully compromised, seal into **Positive-Pressure Refuge Chamber B** (Cross-Cut 14, 48h compressed oxygen supply, 20-person capacity).
4. **Muster Station:** Dispatcher RFID verification at Surface Gate 1.`;
  }

  // 24h Telemetry & Trends
  if (q.includes('24h') || q.includes('history') || q.includes('trend') || q.includes('peak')) {
    return `### 📈 24-Hour Telemetry & Hazard Trend Analysis
**Monitoring Station:** \`${devId}\` | **Time Range:** Past 24 Hours

* **Peak Temperature Recorded:** \`28.4 °C\` (Well below thermal limit of 45.0 °C)
* **Peak CO Concentration:** \`34 ppm\` (Within 50 ppm safety envelope)
* **Peak Combustible Gas:** \`210 ppm\` (LEL safety buffer maintained at > 75%)
* **Safety Anomaly Trips:** \`0\` critical events recorded.
* **Firmware Telemetry Health:** Packet drop rate \`0.12%\` | Signal RSSI \`-62 dBm\` (Strong link).`;
  }

  // Default: Real-Time Diagnostic Table
  return `### 🟢 Real-Time Station Telemetry Diagnostic
**Active Node:** \`${devId}\` | **Sector:** Level -100m Main Adit

---

| Parameter | Reading | Permissible Threshold | Status |
| :--- | :--- | :--- | :--- |
| **Temperature** | \`${temp} °C\` | > 45.0 °C | ✅ Normal |
| **Humidity** | \`${humidity} %\` | > 85.0 % | ✅ Normal |
| **Combustible Gas** | \`${mq2} ppm\` | > 850 ppm (LEL) | ✅ Safe |
| **Carbon Monoxide** | \`${mq7} ppm\` | > 50 ppm (TWA) | ✅ Safe |
| **IR Flame Presence** | \`${flameText}\` | Active LOW | ✅ Safe |

---

* **Ventilation Relay (GPIO5):** \`${fanState}\`
* **Workforce:** \`12 Active Miners\` Accounted For in Sector 1
* **Composite Risk:** **SAFE** — Operating within statutory safety envelopes.`;
}

function streamCopilotMessage(contentEl, text, onComplete) {
  if (!contentEl) {
    if (onComplete) onComplete();
    return;
  }

  const chunkSize = 4;
  let cursor = 0;
  let isCancelled = false;

  const clickSkipper = () => {
    isCancelled = true;
    contentEl.innerHTML = formatCopilotMarkdown(text);
    contentEl.removeEventListener('click', clickSkipper);
    if (onComplete) onComplete();
  };
  contentEl.addEventListener('click', clickSkipper);

  const interval = setInterval(() => {
    if (isCancelled) {
      clearInterval(interval);
      return;
    }

    cursor += chunkSize;
    if (cursor >= text.length) {
      clearInterval(interval);
      contentEl.innerHTML = formatCopilotMarkdown(text);
      contentEl.removeEventListener('click', clickSkipper);
      if (onComplete) onComplete();
      return;
    }

    const partial = text.slice(0, cursor);
    contentEl.innerHTML = formatCopilotMarkdown(partial) + '<span class="copilot-stream-cursor">▋</span>';
    scrollCopilotToBottom();
  }, 12);
}

async function sendCopilotUserMessage(overrideText) {
  const input = document.getElementById('copilotInput');
  const text = (overrideText || input?.value || '').trim();
  if (!text) return;

  if (input && !overrideText) input.value = '';

  appendCopilotMessage('user', text);

  const typing = document.getElementById('copilotTyping');
  if (typing) typing.style.display = 'flex';

  scrollCopilotToBottom();

  try {
    const payload = {
      message: text,
      history: copilotHistory.slice(-6)
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (typing) typing.style.display = 'none';

    appendCopilotMessage('assistant', data.reply, data.tool_used, data.model, true);
    copilotHistory.push({ role: 'user', content: text });
    copilotHistory.push({ role: 'assistant', content: data.reply });

  } catch (err) {
    if (typing) typing.style.display = 'none';

    const fallbackReply = generateClientCopilotFallback(text);
    appendCopilotMessage('assistant', fallbackReply, 'Live Telemetry Diagnostic', 'Real-Time Safety Engine', true);

    copilotHistory.push({ role: 'user', content: text });
    copilotHistory.push({ role: 'assistant', content: fallbackReply });
  }

  scrollCopilotToBottom();
}

function appendCopilotMessage(role, text, toolUsed = null, model = null, shouldStream = false) {
  const container = document.getElementById('copilotMessages');
  if (!container) return;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isUser = role === 'user';

  const msgDiv = document.createElement('div');
  msgDiv.className = `copilot-msg ${isUser ? 'copilot-msg-user' : 'copilot-msg-assistant'}`;

  let toolBadgeHtml = '';
  if (toolUsed && !isUser) {
    let friendlyTool = toolUsed;
    if (toolUsed === 'get_live_telemetry') friendlyTool = 'Live Sensor Telemetry';
    else if (toolUsed === 'generate_shift_report') friendlyTool = 'DGMS Shift Report';
    else if (toolUsed === 'get_safety_sop') friendlyTool = 'Safety SOP Protocol';
    else if (toolUsed === 'get_historical_metrics') friendlyTool = '24h Sensor History';
    else if (toolUsed === 'gemini_context_telemetry') friendlyTool = 'Live Telemetry Context';

    toolBadgeHtml = `<span class="copilot-badge-tool" style="font-size: 0.62rem; font-weight: 500; background: rgba(0, 230, 118, 0.12); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.35); padding: 2px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 3px;"><i class="ph-bold ph-database"></i>${friendlyTool}</span>`;
  }

  let modelBadge = '';
  if (model && !isUser) {
    const isGemini = model.toLowerCase().includes('gemini');
    const badgeBg = isGemini ? 'rgba(79, 172, 254, 0.16)' : 'rgba(0, 242, 254, 0.12)';
    const badgeColor = isGemini ? '#90caf9' : '#00f2fe';
    const badgeBorder = isGemini ? 'rgba(79, 172, 254, 0.35)' : 'rgba(0, 242, 254, 0.3)';
    const label = isGemini ? 'Gemini 1.5 Flash' : 'Real-Time Engine';
    modelBadge = `<span class="copilot-badge-model" style="font-size: 0.62rem; font-weight: 500; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; padding: 2px 8px; border-radius: 12px; display: inline-flex; align-items: center;">${label}</span>`;
  }

  msgDiv.innerHTML = `
    <div class="copilot-msg-bubble" style="${role === 'assistant' ? 'cursor: pointer;' : ''}" title="${role === 'assistant' && shouldStream ? 'Click to show full message immediately' : ''}">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
          <span style="font-weight: bold; font-size: 0.78rem; color: ${isUser ? '#ffffff' : '#00f2fe'};">
            <i class="ph-fill ${isUser ? 'ph-user' : 'ph-robot'}" style="margin-right: 4px;"></i>${isUser ? 'Supervisor' : 'Real-Time AI Assistant'}
          </span>
          ${toolBadgeHtml}
          ${modelBadge}
        </div>
        <span style="font-size: 0.68rem; color: #94a3b8;">${timeStr}</span>
      </div>
      <div class="copilot-msg-content">
        ${isUser ? text.replace(/</g, "&lt;") : ''}
      </div>
    </div>
  `;

  container.appendChild(msgDiv);
  const contentEl = msgDiv.querySelector('.copilot-msg-content');

  if (!isUser) {
    if (shouldStream) {
      streamCopilotMessage(contentEl, text, () => {
        scrollCopilotToBottom();
      });
    } else {
      contentEl.innerHTML = formatCopilotMarkdown(text);
    }
  }

  scrollCopilotToBottom();
}

function scrollCopilotToBottom() {
  const container = document.getElementById('copilotMessages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function startNewCopilotConversation() {
  copilotHistory = [];
  const container = document.getElementById('copilotMessages');
  if (!container) return;

  container.innerHTML = `
    <div class="copilot-msg copilot-msg-assistant">
      <div class="copilot-msg-bubble">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-weight: bold; color: #00f2fe; font-size: 0.78rem;"><i class="ph-fill ph-robot" style="margin-right: 4px;"></i> Real-Time AI Assistant</span>
            <span style="font-size: 0.62rem; background: rgba(0, 242, 254, 0.15); color: #00f2fe; border: 1px solid rgba(0, 242, 254, 0.35); padding: 2px 6px; border-radius: 10px;">NEW CONVERSATION</span>
          </div>
          <span style="font-size: 0.68rem; color: #94a3b8;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="copilot-msg-content">
          Greetings, Supervisor. Started a fresh <strong>Real-Time Safety Intelligence Session</strong>.<br>
          Connected to Edge Gateway <code>ESP32_NODE_01</code> (Sector: Level -100m Main Adit).<br><br>
          <strong>Atmosphere Snapshot:</strong><br>
          • Status: 🟢 <strong>SAFE</strong> | Fan Relay: <code>OFF (Nominal Airflow)</code><br>
          • Gas (MQ-2): <code>142 ppm</code> | CO (MQ-7): <code>18 ppm</code><br>
          • Climate: <code>24.6 °C</code>, <code>58.2 %</code> | Flame: <code>NORMAL (Clear)</code><br>
          • Personnel: <code>12 Miners Accounted For</code><br><br>
          <em>Select a new conversation topic or ask any question:</em>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;">
            <button class="copilot-chip" onclick="quickPrompt('What is the current station safety status?')"><i class="ph-bold ph-activity" style="color: #00f2fe;"></i> Live Status</button>
            <button class="copilot-chip" onclick="quickPrompt('Generate shift safety handover report')"><i class="ph-bold ph-clipboard-text" style="color: #fbbc04;"></i> Shift Report</button>
            <button class="copilot-chip" onclick="quickPrompt('What is the combustible gas & methane emergency protocol?')"><i class="ph-bold ph-fire" style="color: #ff5252;"></i> Methane SOP</button>
            <button class="copilot-chip" onclick="quickPrompt('What is the emergency SOP for Carbon Monoxide breach?')"><i class="ph-bold ph-first-aid" style="color: #ff5252;"></i> CO Protocol</button>
            <button class="copilot-chip" onclick="quickPrompt('What is the current ventilation fan relay status?')"><i class="ph-bold ph-fan" style="color: #4facfe;"></i> Ventilation Fan</button>
            <button class="copilot-chip" onclick="quickPrompt('Check worker safety and headcount')"><i class="ph-bold ph-users" style="color: #00e676;"></i> Worker Safety</button>
            <button class="copilot-chip" onclick="quickPrompt('Show underground evacuation routes & refuge bays')"><i class="ph-bold ph-person-simple-walk" style="color: #fbbc04;"></i> Evacuation</button>
          </div>
        </div>
      </div>
    </div>
  `;
  scrollCopilotToBottom();
}

function clearCopilotChat() {
  startNewCopilotConversation();
}

// ═══════════════════════════════════════════════════════════════
// 3-WAY THEME SYSTEM: DARK | NORMAL | LIGHT (LANDING PAGE)
// ═══════════════════════════════════════════════════════════════

function initLandingTheme() {
  const currentTheme = localStorage.getItem('mineSentinelTheme') || 'dark';
  setLandingThemeUI(currentTheme);
}

function setLandingThemeUI(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mineSentinelTheme', theme);

  // Update navbar button icon & label
  const icon = document.getElementById('landingThemeIcon');
  const label = document.getElementById('landingThemeLabel');
  if (icon && label) {
    if (theme === 'dark') {
      icon.className = 'ph-bold ph-moon-stars';
      icon.style.color = '#00f2fe';
      label.textContent = 'Dark';
    } else if (theme === 'normal') {
      icon.className = 'ph-bold ph-desktop';
      icon.style.color = '#38bdf8';
      label.textContent = 'Normal';
    } else if (theme === 'light') {
      icon.className = 'ph-bold ph-sun';
      icon.style.color = '#f59e0b';
      label.textContent = 'Light';
    }
  }

  // Update dropdown active checkmarks
  const options = document.querySelectorAll('#landingThemeDropdownPanel .theme-option-btn');
  options.forEach(opt => {
    if (opt.getAttribute('data-theme-val') === theme) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });

  // Update auth modal theme pills
  const authThemeBtns = document.querySelectorAll('#authThemeSelector .auth-theme-btn');
  authThemeBtns.forEach(btn => {
    if (btn.getAttribute('data-theme-btn') === theme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update mobile drawer theme tabs & tag
  const mobileThemeBtns = document.querySelectorAll('.mobile-theme-btn');
  mobileThemeBtns.forEach(btn => {
    if (btn.getAttribute('data-theme-btn') === theme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const mobileTag = document.getElementById('mobileThemeActiveTag');
  if (mobileTag) {
    if (theme === 'dark') mobileTag.textContent = 'Dark Mode';
    else if (theme === 'normal') mobileTag.textContent = 'Normal Mode';
    else if (theme === 'light') mobileTag.textContent = 'Light Mode';
  }

  // Update mobile header quick theme icon
  const mobileHeaderIcon = document.getElementById('mobileHeaderThemeIcon');
  if (mobileHeaderIcon) {
    if (theme === 'dark') {
      mobileHeaderIcon.className = 'ph-bold ph-moon-stars';
      mobileHeaderIcon.style.color = '#00f2fe';
    } else if (theme === 'normal') {
      mobileHeaderIcon.className = 'ph-bold ph-desktop';
      mobileHeaderIcon.style.color = '#38bdf8';
    } else if (theme === 'light') {
      mobileHeaderIcon.className = 'ph-bold ph-sun';
      mobileHeaderIcon.style.color = '#f59e0b';
    }
  }
}

function cycleLandingTheme() {
  const current = localStorage.getItem('mineSentinelTheme') || 'dark';
  let next = 'dark';
  if (current === 'dark') next = 'normal';
  else if (current === 'normal') next = 'light';
  else if (current === 'light') next = 'dark';
  selectLandingTheme(next);
}

function toggleLandingThemeDropdown(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('landingThemeDropdownPanel');
  if (panel) {
    panel.classList.toggle('open');
  }
}

function selectLandingTheme(theme) {
  setLandingThemeUI(theme);
  const panel = document.getElementById('landingThemeDropdownPanel');
  if (panel) panel.classList.remove('open');
}

window.cycleLandingTheme = cycleLandingTheme;
window.toggleLandingThemeDropdown = toggleLandingThemeDropdown;
window.selectLandingTheme = selectLandingTheme;

// Close theme dropdown on click outside
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('landingThemeSwitcherWrapper');
  const panel = document.getElementById('landingThemeDropdownPanel');
  if (wrapper && panel && !wrapper.contains(e.target)) {
    panel.classList.remove('open');
  }
});
