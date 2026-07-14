// ========================================================
// 1. ENGINE NAVIGATION & REFRESH PERSISTENCE (Bina Password Loop Ke)
// ========================================================
window.ViewManager = {
    navigate: function(viewId) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        document.getElementById(viewId).classList.add('active-view');
        
        // Save current view state
        localStorage.setItem('ndh_last_active_view', viewId);
        
        // Context loading
        if (viewId === 'staff-view') StaffDashboard.loadRxQueue();
    },
    
    secureNavigation: function(viewId, correctPassword) {
        // Checking Session persistence so refresh doesn't wipe auth lock
        if (sessionStorage.getItem('auth_valid_' + viewId) === 'true') {
            this.navigate(viewId);
            return;
        }

        const inputPass = prompt("Enter Authorized Security Password:");
        if (inputPass === correctPassword) {
            sessionStorage.setItem('auth_valid_' + viewId, 'true');
            this.navigate(viewId);
        } else if (inputPass !== null) {
            alert("❌ Access Denied: Invalid Security Key!");
        }
    }
};

// Auto-restoration of system on Page Reload
document.addEventListener('DOMContentLoaded', () => {
    const savedState = localStorage.getItem('ndh_last_active_view') || 'home-view';
    // Deep load verification
    ViewManager.navigate(savedState);
});


// ========================================================
// 2. PHARMACEUTICAL MEDICAL MILESTONES ROTATOR (Attractive Theme)
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    const medicalQuotes = [
        "Alexander Fleming discovered Penicillin in 1928, launching the modern era of lifesaving antibiotics.",
        "Wilhelm Röntgen developed X-Rays in 1895, unlocking non-invasive diagnostic capabilities.",
        "Edward Jenner formulated the smallpox vaccine in 1796, pioneering the science of immunology.",
        "Frederick Banting and Charles Best isolated Insulin in 1921, saving diabetic patients globally.",
        "The double-helix structure of Human DNA was mapped by Watson, Crick, and Franklin in 1953.",
        "Louis Pasteur developed the Rabies vaccine in 1885 and established microbial pasteurization."
    ];

    const container = document.getElementById('medical-inventions-container');
    if (container) {
        container.innerHTML = `<div id="medical-rotator-card" style="padding:15px; background: #e2e8f0; color:#334155; border-radius:8px; font-style:italic; font-size:0.95rem; text-align:center; border-left: 5px solid var(--accent); transition: all 0.5s;"></div>`;
        let index = 0;
        const card = document.getElementById('medical-rotator-card');
        
        function rotateQuotes() {
            card.style.opacity = 0;
            setTimeout(() => {
                card.innerHTML = `💡 <b>Medical Milestone:</b> "${medicalQuotes[index]}"`;
                card.style.opacity = 1;
                index = (index + 1) % medicalQuotes.length;
            }, 300);
        }
        rotateQuotes();
        setInterval(rotateQuotes, 7000); // Har 7 seconds me rotate hoga
    }
});


// ========================================================
// 3. CUSTOMER ONLINE ORDER HANDLING
// ========================================================
document.getElementById('online-order-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const pin = document.getElementById('cust-pin').value.trim();
    const bill = parseFloat(document.getElementById('cust-bill').value) || 0;
    
    if (pin !== "785684") {
        alert("❌ Order Terminated: We can only deliver home requests exclusively to PIN code 785684!");
        return;
    }

    let alertMsg = "✅ Order Registered successfully (COD Mode).";
    if (bill >= 1599) {
        alertMsg = "⚠️ Premium Order Detected (≥ ₹1599): Your order requires manual Advance Payment verification before dispatch!";
    }

    alert(alertMsg);
    this.reset();
    ViewManager.navigate('home-view');
});


// ========================================================
// 4. DOCTOR CONSULTATION FLOW
// ========================================================
window.DoctorDesk = {
    submitPrescription: function() {
        const name = document.getElementById('doc-patient-name').value.trim();
        const rx = document.getElementById('doc-rx-content').value.trim();

        if (!name || !rx) {
            alert("Please complete Patient Name and Rx Prescription lines!");
            return;
        }

        const rxQueue = JSON.parse(localStorage.getItem('ndh_rx_queue') || '[]');
        rxQueue.push({ name: name, rx: rx, timestamp: Date.now() });
        localStorage.setItem('ndh_rx_queue', JSON.stringify(rxQueue));

        alert("📤 Rx transmitted successfully to Pharmacy Counter Workflow!");
        document.getElementById('doc-patient-name').value = "";
        document.getElementById('doc-rx-content').value = "";
        ViewManager.navigate('home-view');
    }
};


// ========================================================
// 5. STAFF OPERATIONS, OFFLINE POS & UPI GENERATOR ENGINE
// ========================================================
window.StaffDashboard = {
    loadRxQueue: function() {
        const container = document.getElementById('live-rx-queue');
        if (!container) return;
        container.innerHTML = "";

        const rxQueue = JSON.parse(localStorage.getItem('ndh_rx_queue') || '[]');
        
        if (rxQueue.length === 0) {
            container.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#94a3b8;">No active prescriptions from doctor desk.</td></tr>`;
            return;
        }

        rxQueue.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.name}</b></td>
                <td><div style="white-space:pre-line; font-family:monospace; background:#f8fafc; padding:6px; border-radius:4px; font-size:0.85rem;">${item.rx}</div></td>
                <td>
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="number" id="rx-amt-${index}" placeholder="Amt (₹)" style="margin:0; width:90px; padding:6px;">
                        <button onclick="StaffDashboard.processRxBilling(${index}, 'Cash')" class="btn-action btn-success" style="padding:6px 10px; font-size:0.8rem;">Cash</button>
                        <button onclick="StaffDashboard.processRxBilling(${index}, 'QR')" class="btn-action" style="padding:6px 10px; background:#0284c7; font-size:0.8rem;">UPI QR</button>
                    </div>
                </td>
            `;
            container.appendChild(tr);
        });
    },

    processOfflinePOS: function(mode) {
        const amount = parseFloat(document.getElementById('pos-amount').value);
        let customer = document.getElementById('pos-cust-name').value.trim() || "Walk-In Patient";

        if (!amount || amount <= 0) {
            alert("Please input a valid transaction amount!");
            return;
        }

        if (mode === 'Cash') {
            alert(`💵 Counter Sale Closed! Received ₹${amount} in Cash from ${customer}.`);
            document.getElementById('pos-amount').value = "";
            document.getElementById('pos-cust-name').value = "";
        } else {
            this.triggerUpiQrEngine(amount, `POS Sale: ${customer}`);
            document.getElementById('pos-amount').value = "";
            document.getElementById('pos-cust-name').value = "";
        }
    },

    processRxBilling: function(index, mode) {
        const amtField = document.getElementById(`rx-amt-${index}`);
        const amount = parseFloat(amtField.value);
        
        const rxQueue = JSON.parse(localStorage.getItem('ndh_rx_queue') || '[]');
        const patient = rxQueue[index];

        if (!amount || amount <= 0) {
            alert("Please fill the calculated medicine invoice amount first!");
            return;
        }

        if (mode === 'Cash') {
            alert(`💵 Bill Cleared via Cash! Collected ₹${amount} for Patient: ${patient.name}`);
            this.removeRxFromQueue(index);
        } else {
            this.triggerUpiQrEngine(amount, `Rx: ${patient.name}`, index);
        }
    },

    triggerUpiQrEngine: function(amount, note, rxIndexToRemove = null) {
        const upiId = "hussain.abidur@ybl";
        const cleanNote = note.replace(/[^a-zA-Z0-9 ]/g, ""); // Standard string criteria
        const upiString = `upi://pay?pa=${upiId}&pn=NamtiDrugHouse&am=${amount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
        
        // Global Dynamic QR Endpoint injection
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
        
        document.getElementById('qr-modal-details').textContent = `${note} | Bill: ₹${amount}`;
        document.getElementById('qr-image-container').innerHTML = `<img src="${qrUrl}" alt="Scan QR Code" style="display:block; margin:0 auto; box-shadow:0 4px 10px rgba(0,0,0,0.1); border:4px solid white;">`;
        
        // Save targeted index reference to clear after close
        if (rxIndexToRemove !== null) {
            document.getElementById('qr-modal-overlay').setAttribute('data-target-rx', rxIndexToRemove);
        } else {
            document.getElementById('qr-modal-overlay').removeAttribute('data-target-rx');
        }

        document.getElementById('qr-modal-overlay').style.display = 'flex';
    },

    closeQrModal: function() {
        const overlay = document.getElementById('qr-modal-overlay');
        const rxIndex = overlay.getAttribute('data-target-rx');
        
        if (rxIndex !== null && rxIndex !== undefined) {
            this.removeRxFromQueue(parseInt(rxIndex));
        }
        
        overlay.style.display = 'none';
        alert("🔒 Digital payment window synchronized & recorded!");
    },

    removeRxFromQueue: function(index) {
        let rxQueue = JSON.parse(localStorage.getItem('ndh_rx_queue') || '[]');
        rxQueue.splice(index, 1);
        localStorage.setItem('ndh_rx_queue', JSON.stringify(rxQueue));
        this.loadRxQueue();
    }
};
            
        
