// ==========================================
// 1. ENGINE NAVIGATION & REFRESH PERSISTENCE
// ==========================================
window.ViewManager = {
    switchToCustomer: function() {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        document.getElementById('customer-view').classList.add('active-view');
        localStorage.setItem('namti_last_view', 'customer');
    },
    switchToDoctor: function() {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        document.getElementById('doctor-view').classList.add('active-view');
        localStorage.setItem('namti_last_view', 'doctor');
        if (window.loadDoctorPrescriptions) window.loadDoctorPrescriptions();
    },
    switchToStaff: function() {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        document.getElementById('staff-dashboard').classList.add('active-view');
        localStorage.setItem('namti_last_view', 'staff');
        if (window.loadSavedSystemOrders) window.loadSavedSystemOrders();
        if (window.loadDoctorPrescriptions) window.loadDoctorPrescriptions();
    },
    secureAccess: function(targetSection) {
        // Agar pehle se logged in hai toh password nahi maangeba (For session persistence)
        const sessionKey = 'authenticated_' + targetSection;
        if (sessionStorage.getItem(sessionKey) === 'true') {
            if (targetSection === 'doctor') this.switchToDoctor();
            if (targetSection === 'staff') this.switchToStaff();
            return;
        }

        if (targetSection === 'doctor') {
            const pass = prompt("Enter Doctor Desk Password:");
            if (pass === "doctor2026") {
                sessionStorage.setItem(sessionKey, 'true');
                this.switchToDoctor();
            } else if (pass !== null) { alert("❌ Invalid Doctor Password!"); }
        } 
        else if (targetSection === 'staff') {
            const pass = prompt("Enter Staff Security Password:");
            if (pass === "Happy2026") {
                sessionStorage.setItem(sessionKey, 'true');
                this.switchToStaff();
            } else if (pass !== null) { alert("❌ Invalid Staff Password!"); }
        }
    }
};

// AUTO-RESTORE LAST VIEW ON REFRESH (WITHOUT ASKING PASSWORD AGAIN)
document.addEventListener('DOMContentLoaded', () => {
    const lastSavedView = localStorage.getItem('namti_last_view') || 'customer';
    
    if (lastSavedView === 'doctor') {
        window.ViewManager.switchToDoctor();
    } else if (lastSavedView === 'staff') {
        window.ViewManager.switchToStaff();
    } else {
        window.ViewManager.switchToCustomer();
    }

    // Initialize System Sub-Modules
    window.loadSavedSystemOrders();
    window.loadDoctorPrescriptions();
});

// ==========================================
// 2. 3D HISTORICAL PHARMACEUTICAL ROTATOR
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const medicalQuotes = [
        "Alexander Fleming discovered Penicillin in 1928, launching the modern era of lifesaving antibiotics.",
        "Wilhelm Röntgen developed X-Rays in 1895, unlocking non-invasive diagnostic capabilities.",
        "Edward Jenner formulated the smallpox vaccine in 1796, pioneering the science of immunology.",
        "Frederick Banting and Charles Best isolated Insulin in 1921, saving diabetic patients globally.",
        "The double-helix structure of Human DNA was mapped by Watson, Crick, and Franklin in 1953.",
        "Louis Pasteur developed the Rabies vaccine in 1885 and established microbial pasteurization.",
        "William Harvey mapped the continuous human blood circulatory system pumped by the heart in 1628.",
        "The first successful human Heart Transplant was executed by Dr. Christiaan Barnard in 1967.",
        "Robert Koch isolated Mycobacterium tuberculosis in 1882, defining criteria of infectious diseases.",
        "Sir Frederick Hopkins discovered essential Vitamins in 1912, transforming nutritional healthcare."
    ];

    const targetQuoteContainer = document.getElementById('medical-inventions-container');
    if (targetQuoteContainer) {
        targetQuoteContainer.style.perspective = "1000px";
        targetQuoteContainer.innerHTML = `<div id="rotating-3d-card" style="padding:18px; background: linear-gradient(135deg, #1e293b, #0f172a); color:#f8fafc; border-radius:12px; font-style:italic; font-size:0.95rem; text-align:center; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; border: 1px solid #334155; box-shadow:0 10px 15px rgba(0,0,0,0.2);"></div>`;
        
        let currentQuoteIndex = 0;
        const rotatingCard = document.getElementById('rotating-3d-card');
        
        function rotateMedicalQuotesPeriodically() {
            if(!rotatingCard) return;
            rotatingCard.style.transform = "rotateX(90deg)";
            rotatingCard.style.opacity = "0";
            
            setTimeout(() => {
                rotatingCard.innerHTML = `✨ <strong>Medical Milestone #${currentQuoteIndex + 1}:</strong><br><span style="display:block; margin-top:6px; color:#cbd5e1;">"${medicalQuotes[currentQuoteIndex]}"</span>`;
                rotatingCard.style.transform = "rotateX(0deg)";
                rotatingCard.style.opacity = "1";
                currentQuoteIndex = (currentQuoteIndex + 1) % medicalQuotes.length;
            }, 600);
        }
        rotateMedicalQuotesPeriodically();
        setInterval(rotateMedicalQuotesPeriodically, 7000); 
    }
});

// ==========================================
// 3. TOAST NOTIFICATION UTILITY
// ==========================================
function triggerSuccessToast(message) {
    const popupNotification = document.getElementById('success-popup');
    if (!popupNotification) return;
    popupNotification.textContent = message || "✅ Action Registered Successfully!";
    popupNotification.style.display = 'block';
    setTimeout(() => { popupNotification.style.display = 'none'; }, 4500);
}

// ==========================================
// 4. CUSTOMER ONLINE SYSTEM ORDER ROUTING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-submission-form');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const enteredPin = document.getElementById('cust-pincode').value.trim();
            const estimatedBill = parseFloat(document.getElementById('cust-est-bill').value) || 0;
            const photoFile = document.getElementById('prescription-photo').files[0];

            // STRICT EXCLUSIVE RULES VALIDATION
            if (enteredPin !== "785684") {
                alert("❌ Order Rejected: Home delivery is strictly possible only within PIN code 785684!");
                return;
            }

            if (!photoFile) { alert("Please upload prescription image!"); return; }

            const fileEngineReader = new FileReader();
            fileEngineReader.onload = function(event) {
                const base64ImageString = event.target.result;
                
                let initialStatus = "New Request (COD)";
                let flagAlert = "Your Cash on Delivery order is recorded.";
                
                if (estimatedBill >= 1599) {
                    initialStatus = "Awaiting Advance Payment Verification";
                    flagAlert = "⚠️ Order Value is Rs. 1599 or more! Advance Payment Verification is required before dispatch.";
                }

                const orderData = {
                    timestamp: Date.now(),
                    name: document.getElementById('cust-name').value,
                    phone: document.getElementById('cust-phone').value,
                    village: document.getElementById('cust-village').value,
                    pincode: enteredPin,
                    district: document.getElementById('cust-district').value,
                    medicines: document.getElementById('medicine-details').value || "See attached prescription image",
                    imageBlob: base64ImageString,
                    bill: estimatedBill || "",
                    statusText: initialStatus,
                    statusClass: "badge-pending"
                };

                const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
                currentOrders.unshift(orderData);
                localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
                
                orderForm.reset();
                window.loadSavedSystemOrders();
                triggerSuccessToast("🎉 Order Submitted Successfully! " + flagAlert);
            };
            fileEngineReader.readAsDataURL(photoFile);
        });
    }
});

// ==========================================
// 5. DOCTOR CONSULTATION DESK TRANSMISSION
// ==========================================
window.submitDoctorPrescriptionLog = function(e) {
    if(e) e.preventDefault();
    const patientName = document.getElementById('doc-patient-name').value;
    const patientPhone = document.getElementById('doc-patient-phone').value || "N/A";
    const medicalDiagnosis = document.getElementById('doc-clinical-notes').value || "Routine Checkup";
    const RxMedicines = document.getElementById('doc-rx-prescription').value;

    if(!patientName || !RxMedicines) { alert("Fields missing!"); return; }

    const prescriptionObject = {
        id: "RX-" + Math.floor(1000 + Math.random() * 9000),
        timestamp: Date.now(),
        name: patientName,
        phone: patientPhone,
        diagnosis: medicalDiagnosis,
        rx: RxMedicines,
        status: "Awaiting Dispense"
    };

    const activePrescriptions = JSON.parse(localStorage.getItem('namti_prescriptions') || '[]');
    activePrescriptions.unshift(prescriptionObject);
    localStorage.setItem('namti_prescriptions', JSON.stringify(activePrescriptions));

    document.getElementById('doctor-prescription-form').reset();
    window.loadDoctorPrescriptions();
    triggerSuccessToast("Prescription beamed down to counter queue! 📤");
};

window.loadDoctorPrescriptions = function() {
    const staffPrescLog = document.getElementById('staff-prescription-log');
    if (!staffPrescLog) return;
    staffPrescLog.innerHTML = "";
    
    const activePrescriptions = JSON.parse(localStorage.getItem('namti_prescriptions') || '[]');
    activePrescriptions.forEach((rx, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${rx.id}</strong></td>
            <td><b>${rx.name}</b><br><small>${rx.phone}</small></td>
            <td>${rx.diagnosis}</td>
            <td><div style="white-space:pre-line; font-family:monospace; background:#f8fafc; padding:5px; font-size:0.8rem;">${rx.rx}</div></td>
            <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${rx.status}</span></td>
            <td>
                <button style="background:var(--accent); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;" onclick="window.dispenseAndPrintDoctorRx(${index})">Dispense & Print 🖨️</button>
            </td>
        `;
        staffPrescLog.appendChild(tr);
    });
};

window.dispenseAndPrintDoctorRx = function(index) {
    const activePrescriptions = JSON.parse(localStorage.getItem('namti_prescriptions') || '[]');
    const rx = activePrescriptions[index];
    if(!rx) return;

    const rxPrintContent = `
        <div style="font-family:monospace; padding:15px; width:260px;">
            <h3 style="text-align:center; margin:0;">NAMTI DRUG HOUSE</h3>
            <p style="text-align:center; font-size:0.75rem; margin:0;">Doctor Consultation Slip</p>
            <hr style="border-top:1px dashed #000; margin:10px 0;">
            <p><strong>Rx ID:</strong> ${rx.id}</p>
            <p><strong>Patient:</strong> ${rx.name}</p>
            <p><strong>Diagnosis:</strong> ${rx.diagnosis}</p>
            <hr style="border-top:1px dashed #000;">
            <p><strong>MEDICINES PRESCRIBED:</strong></p>
            <p style="white-space:pre-line; background:#f0f0f0; padding:5px;">${rx.rx}</p>
        </div>
    `;
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = rxPrintContent;
    window.print();
    
    activePrescriptions.splice(index, 1);
    localStorage.setItem('namti_prescriptions', JSON.stringify(activePrescriptions));
    location.reload();
};

// ==========================================
// 6. COUNTER OFFLINE POS BILLING CONSOLE
// ==========================================
window.processOfflineCounterSale = function(e) {
    if(e) e.preventDefault();
    const clientName = document.getElementById('pos-cust-name').value || "Walk-in Customer";
    const clientPhone = document.getElementById('pos-cust-phone').value || "N/A";
    const totalAmount = parseFloat(document.getElementById('pos-total-bill').value) || 0;
    const medicineDetails = document.getElementById('pos-medicine-list').value;

    if(!totalAmount || !medicineDetails) { alert("Please input total bill and medicine rows!"); return; }

    const upiId = "hussain.abidur@ybl";
    const rawUpiUri = `upi://pay?pa=${upiId}&pn=NamtiDrugHouse&am=${totalAmount}&cu=INR&tn=CounterPOS`;
    const liveQrEndpoint = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(rawUpiUri)}`;

    const orderData = {
        timestamp: Date.now(),
        name: "[OFFLINE] " + clientName,
        phone: clientPhone,
        village: "Counter Sale",
        pincode: "In-Store",
        district: "Sivasagar",
        medicines: medicineDetails,
        imageBlob: "",
        bill: totalAmount,
        statusText: "Paid (Counter POS)",
        statusClass: "badge-delivery",
        counterQr: liveQrEndpoint
    };

    const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
    currentOrders.unshift(orderData);
    localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
    
    const qrWrapper = document.getElementById('pos-dynamic-qr-wrapper');
    if(qrWrapper) {
        qrWrapper.innerHTML = `
            <div style="text-align:center; padding:10px; background:#fff; border:2px dashed #16a34a; border-radius:8px;">
                <p style="color:#16a34a; font-weight:bold; font-size:0.8rem; margin-bottom:5px;">Scan QR: ₹${totalAmount}</p>
                <img src="${liveQrEndpoint}" style="width:140px; height:140px; display:block; margin:0 auto;">
            </div>`;
    }

    document.getElementById('pos-billing-form').reset();
    window.loadSavedSystemOrders();
    triggerSuccessToast("POS Sale Recorded & Digital QR Generated! ⚡");
};

// ==========================================
// 7. STAFF OPERATIONS & RECORDS MANAGER
// ==========================================
window.loadSavedSystemOrders = function() {
    const adminOrdersLog = document.getElementById('admin-orders-log');
    if (!adminOrdersLog) return;
    adminOrdersLog.innerHTML = "";
    
    const savedOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
    savedOrders.forEach((data, index) => {
        const row = document.createElement('tr');
        let prescControl = data.imageBlob ? `<button style="padding:2px 6px; cursor:pointer;" onclick="window.openInteractivePrescription('${data.imageBlob}')">👁️ View</button>` : `No Image`;

        let actionButtons = '';
        if (data.statusText.includes("New Request") || data.statusText.includes("Awaiting Advance")) {
            actionButtons = `<button style="background:var(--warning); color:#fff; border:none; padding:5px; border-radius:4px; cursor:pointer;" onclick="window.executeSmsProcess(${index}, this)">Verify & Dispatch 🚚</button>`;
        } else if (data.statusText.includes("Dispatched")) {
            actionButtons = `<button style="background:var(--success); color:#fff; border:none; padding:5px; border-radius:4px; cursor:pointer;" onclick="window.markAsPaid(${index})">Collect Cash & Close 💰</button>`;
        } else {
            actionButtons = `<button style="background:#7c3aed; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;" onclick="window.generateAndOpenReceipt(${index})">Receipt 📄</button>`;
        }

        row.innerHTML = `
            <td><strong>${data.name}</strong><br><small>${data.phone}</small></td>
            <td>${data.village}<br><small><b>PIN: ${data.pincode}</b></small></td>
            <td><div style="max-height:50px; overflow-y:auto; font-size:0.8rem;">${data.medicines}</div>${prescControl}</td>
            <td><input type="number" class="bill-input" value="${data.bill}" style="width:70px; padding:4px;" oninput="window.calculateLiveRevenue()"></td>
            <td><span class="badge ${data.statusClass} status-field">${data.statusText}</span></td>
            <td>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    ${actionButtons}
                    <button style="background:var(--danger); color:white; font-size:0.75rem; border:none; padding:2px; cursor:pointer;" onclick="window.executeDeleteProcess(${index})">Delete</button>
                </div>
            </td>
        `;
        adminOrdersLog.appendChild(row);
    });
    window.calculateLiveRevenue();
};

window.executeSmsProcess = function(index, btn) {
    const row = btn.closest('tr');
    const billVal = parseFloat(row.querySelector('.bill-input').value) || 0;
    const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
    const order = currentOrders[index];

    if (!billVal) { alert("Please input total items bill amount!"); return; }

    order.bill = billVal;
    order.statusText = "Dispatched (Shipping)";
    order.statusClass = "badge-pending";
    
    let smsMsg = `Hello ${order.name},\nYour order from Namti Drug House is packed. Total: Rs. ${billVal}. Mode: Cash on Delivery.`;
    
    if (billVal >= 1599) {
        order.statusText = "Dispatched (Advance Paid Verified)";
        order.statusClass = "badge-delivery";
        smsMsg = `Hello ${order.name},\nYour premium order (Rs. ${billVal}) has been approved after Advance Payment verification. Delivering shortly!`;
    }

    localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
    window.loadSavedSystemOrders();
    window.location.href = `sms:+91${order.phone}?body=${encodeURIComponent(smsMsg)}`;
};

window.markAsPaid = function(index) {
    const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
    currentOrders[index].statusText = "Paid & Closed Complete";
    currentOrders[index].statusClass = "badge-delivery";
    localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
    window.loadSavedSystemOrders();
    triggerSuccessToast("Payment transaction completely recorded!");
};

window.calculateLiveRevenue = function() {
    let total = 0;
    document.querySelectorAll('#admin-orders-log tr').forEach(row => {
        const val = parseFloat(row.querySelector('.bill-input').value) || 0;
        const statusField = row.querySelector('.status-field');
        if (statusField) {
            const status = statusField.textContent;
            if (status.includes("Paid") || status.includes("Closed") || status.includes("POS")) { total += val; }
        }
    });
    const totalRevDisplay = document.getElementById('total-revenue-display');
    if (totalRevDisplay) totalRevDisplay.textContent = `Total Revenue: ₹ ${total.toFixed(2)}`;
};

window.openInteractivePrescription = function(blob) {
    document.getElementById('modal-target-image').src = blob;
    document.getElementById('prescription-preview-modal').style.display = '
        
