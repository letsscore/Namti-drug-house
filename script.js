// BRAND CONFIG & VIEW CONTROLLER CONTEXT ENGINE
window.ViewManager = {
    switchToStaff: function() {
        const passwordCheck = prompt("Enter Staff Security Password:");
        if (passwordCheck === "Happy2026") {
            const customerView = document.getElementById('customer-view');
            const staffDashboard = document.getElementById('staff-dashboard');
            if (customerView && staffDashboard) {
                customerView.classList.remove('active-view');
                staffDashboard.classList.add('active-view');
                localStorage.setItem('namti_current_view', 'staff');
                if (typeof window.loadSavedSystemOrders === 'function') {
                    window.loadSavedSystemOrders();
                }
                window.scrollTo(0, 0);
            }
        } else if (passwordCheck !== null) {
            alert("Wrong Password! Access Denied.");
        }
    },
    switchToCustomer: function() {
        const customerView = document.getElementById('customer-view');
        const staffDashboard = document.getElementById('staff-dashboard');
        if (customerView && staffDashboard) {
            staffDashboard.classList.remove('active-view');
            customerView.classList.add('active-view');
            localStorage.setItem('namti_current_view', 'customer');
            window.scrollTo(0, 0);
        }
    }
};

// AUTO DATA CLEANSING STORAGE SYSTEM
window.OrderManager = {
    clearThirtyDayOldOrders: function() {
        if (!confirm("Are you sure you want to delete all orders older than 30 days?")) return;
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000); 
        
        const keptOrders = currentOrders.filter(order => order.timestamp >= thirtyDaysAgo);
        const deletedCount = currentOrders.length - keptOrders.length;
        
        localStorage.setItem('namti_orders', JSON.stringify(keptOrders));
        alert(`${deletedCount} old orders successfully cleared from storage!`);
        if (typeof window.loadSavedSystemOrders === 'function') window.loadSavedSystemOrders();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-submission-form');
    const adminOrdersLog = document.getElementById('admin-orders-log');
    const paymentModalBox = document.getElementById('payment-modal-box');
    const closeModalAction = document.getElementById('close-modal-action');

    // INITIALIZE VIEWS & POLLED SYNC
    const lastView = localStorage.getItem('namti_current_view') || 'customer';
    const customerView = document.getElementById('customer-view');
    const staffDashboard = document.getElementById('staff-dashboard');
    
    if (lastView === 'staff' && customerView && staffDashboard) {
        customerView.classList.remove('active-view');
        staffDashboard.classList.add('active-view');
    }

    let audioContext;
    function playBeepNotification() {
        try {
            if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let osc = audioContext.createOscillator();
            let gain = audioContext.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, audioContext.currentTime); 
            gain.gain.setValueAtTime(0.2, audioContext.currentTime);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start();
            osc.stop(audioContext.currentTime + 0.15);
        } catch(e) { console.log("Audio blocked"); }
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'namti_orders' || e.key === 'namti_prescriptions') {
            window.loadSavedSystemOrders();
            if(window.loadDoctorPrescriptions) window.loadDoctorPrescriptions();
            playBeepNotification();
        }
    });

    // 1. DYNAMIC 3D MEDICAL QUOTATION ROTATOR ENGINE (10 Premium Entries)
    const medicalQuotes = [
        "Alexander Fleming discovered Penicillin in 1928, launching the modern era of lifesaving antibiotics.",
        "Wilhelm Röntgen developed X-Rays in 1895, unlocking non-invasive diagnostic capabilities for human bone structures.",
        "Edward Jenner formulated the smallpox vaccine in 1796, pioneering the science of immunology and eradication.",
        "Frederick Banting and Charles Best isolated Insulin in 1921, saving millions of diabetic patients globally.",
        "The structure of Human DNA was mapped by Watson, Crick, and Franklin in 1953, opening the frontier of molecular medicine.",
        "Louis Pasteur developed the Rabies vaccine in 1885 and successfully established principles of microbial pasteurization.",
        "William Harvey mapped the continuous human blood circulatory system pumped by the heart in 1628.",
        "The first successful human Heart Transplant was executed by Dr. Christiaan Barnard in Cape Town in 1967.",
        "Robert Koch isolated Mycobacterium tuberculosis in 1882, defining the foundational criteria of infectious disease science.",
        "Sir Frederick Hopkins discovered essential Vitamins in 1912, fundamentally transforming global nutritional healthcare standards."
    ];

    const targetQuoteContainer = document.getElementById('medical-inventions-container') || document.querySelector('.medical-quotation-box');
    if (targetQuoteContainer) {
        // Applying Premium High-Fidelity 3D Typography styles
        targetQuoteContainer.style.perspective = "1000px";
        targetQuoteContainer.innerHTML = `<div id="rotating-3d-card" style="padding:20px; background: linear-gradient(135deg, #1e293b, #0f172a); color:#f8fafc; border-radius:12px; font-style:italic; font-size:1rem; text-align:center; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3); border: 1px solid #334155;"></div>`;
        
        let currentQuoteIndex = 0;
        const rotatingCard = document.getElementById('rotating-3d-card');
        
        function rotateMedicalQuotesPeriodically() {
            if(!rotatingCard) return;
            rotatingCard.style.transform = "rotateX(90deg) scale(0.95)";
            rotatingCard.style.opacity = "0";
            
            setTimeout(() => {
                rotatingCard.innerHTML = `✨ <strong>Medical History Fact #${currentQuoteIndex + 1}:</strong><br><span style="display:block; margin-top:8px; line-height:1.5; font-weight:300; letter-spacing:0.5px; color:#cbd5e1;">"${medicalQuotes[currentQuoteIndex]}"</span>`;
                rotatingCard.style.transform = "rotateX(0deg) scale(1)";
                rotatingCard.style.opacity = "1";
                currentQuoteIndex = (currentQuoteIndex + 1) % medicalQuotes.length;
            }, 600);
        }
        rotateMedicalQuotesPeriodically();
        setInterval(rotateMedicalQuotesPeriodically, 7000); // Transitions seamlessly every 7 seconds
    }

    // 3. OFFLINE OVER-THE-COUNTER (POS) BILLING INTERFACE WITH LIVE QR GENERATION
    window.processOfflineCounterSale = function(e) {
        if(e) e.preventDefault();
        const clientName = document.getElementById('pos-cust-name').value || "Walk-in Customer";
        const clientPhone = document.getElementById('pos-cust-phone').value || "0000000000";
        const totalAmount = parseFloat(document.getElementById('pos-total-bill').value) || 0;
        const medicineDetails = document.getElementById('pos-medicine-list').value;

        if(!totalAmount || !medicineDetails) { alert("Please complete Bill Amount and Items list!"); return; }

        const upiId = "hussain.abidur@ybl";
        const merchantName = "Namti Drug House";
        const rawUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${totalAmount}&cu=INR&tn=CounterSale`;
        
        // Instant Generation of Live Verification QR Endpoint
        const liveQrEndpoint = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(rawUpiUri)}`;

        const orderData = {
            timestamp: Date.now(),
            name: "[OFFLINE] " + clientName,
            phone: clientPhone,
            village: "Counter Sale",
            pincode: "Offline POS",
            district: "In-Store",
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
        
        // Displaying the Dynamic Digital QR screen directly onto the cashier desk
        const qrWrapper = document.getElementById('pos-dynamic-qr-wrapper');
        if(qrWrapper) {
            qrWrapper.innerHTML = `
                <div style="text-align:center; padding:12px; background:#fff; border:2px dashed #16a34a; border-radius:8px;">
                    <p style="color:#16a34a; font-weight:bold; margin:0 0 8px 0;">Scan to Pay ₹${totalAmount}</p>
                    <img src="${liveQrEndpoint}" style="width:180px; height:180px; margin:0 auto; display:block;" alt="UPI QR">
                    <button type="button" style="margin-top:10px; font-size:0.8rem; background:#334155; color:#fff; border:none; padding:4px 8px; border-radius:4px;" onclick="this.parentElement.remove()">Dismiss QR</button>
                </div>`;
        }

        document.getElementById('pos-billing-form').reset();
        window.loadSavedSystemOrders();
        playBeepNotification();
    };

    // 4. DIGITIZED DOCTOR CONSULTATION DESK CONTEXT ENGINE
    window.submitDoctorPrescriptionLog = function(e) {
        if(e) e.preventDefault();
        const patientName = document.getElementById('doc-patient-name').value;
        const patientPhone = document.getElementById('doc-patient-phone').value;
        const medicalDiagnosis = document.getElementById('doc-clinical-notes').value;
        const RxMedicines = document.getElementById('doc-rx-prescription').value;

        if(!patientName || !RxMedicines) { alert("Patient details and Rx field cannot be blank!"); return; }

        const prescriptionObject = {
            id: "RX-" + Math.floor(1000 + Math.random() * 9000),
            timestamp: Date.now(),
            name: patientName,
            phone: patientPhone,
            diagnosis: medicalDiagnosis,
            rx: RxMedicines,
            status: "Pending Dispensing"
        };

        const activePrescriptions = JSON.parse(localStorage.getItem('namti_prescriptions') || '[]');
        activePrescriptions.unshift(prescriptionObject);
        localStorage.setItem('namti_prescriptions', JSON.stringify(activePrescriptions));

        document.getElementById('doctor-prescription-form').reset();
        if(window.loadDoctorPrescriptions) window.loadDoctorPrescriptions();
        alert("📋 Prescription locked and transmitted instantly to Pharmacy Staff Desk!");
    };

    window.loadDoctorPrescriptions = function() {
        const staffPrescLog = document.getElementById('staff-prescription-log');
        if (!staffPrescLog) return;
        staffPrescLog.innerHTML = "";
        
        const activePrescriptions = JSON.parse(localStorage.getItem('namti_prescriptions') || '[]');
        activePrescriptions.forEach((rx, ptrIndex) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${rx.id}</strong></td>
                <td><b>${rx.name}</b><br><small>${rx.phone}</small></td>
                <td><i>${rx.diagnosis}</i></td>
                <td><div style="white-space:pre-line; color:#1e293b; font-family:monospace; background:#f8fafc; padding:6px; border-radius:4px; font-size:0.85rem;">${rx.rx}</div></td>
                <td><span class="badge" style="background:#fef08a; color:#854d0e;">${rx.status}</span></td>
                <td>
                    <button style="background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:0.8rem; cursor:pointer;" onclick="window.dispenseAndPrintDoctorRx(${ptrIndex})">Print & Dispense 🖨️</button>
                </td>
            `;
            staffPrescLog.appendChild(rx.id ? tr : '');
        });
    };

    window.dispenseAndPrintDoctorRx = function(index) {
        const activePrescriptions = JSON.parse(localStorage.getItem('namti_prescriptions') || '[]');
        const rx = activePrescriptions[index];
        if(!rx) return;

        // Directly format print invoice window setup for the physical slip output
        const rxPrintContent = `
            <div style="font-family:monospace; padding:20px; width:280px;">
                <h3 style="text-align:center; margin:0;">NAMTI DRUG HOUSE</h3>
                <p style="text-align:center; font-size:0.8rem; margin:2px 0;">Clinical Consultation Unit</p>
                <hr style="border-top:1px dashed #000;">
                <p><strong>Rx ID:</strong> ${rx.id}</p>
                <p><strong>Patient:</strong> ${rx.name}</p>
                <p><strong>Phone:</strong> ${rx.phone}</p>
                <p><strong>Diagnosis:</strong> ${rx.diagnosis}</p>
                <hr style="border-top:1px dashed #000;">
                <p style="font-weight:bold;">MEDICINES PRESCRIBED (Rx):</p>
                <p style="white-space:pre-line; background:#f5f5f5; padding:4px;">${rx.rx}</p>
                <hr style="border-top:1px dashed #000;">
                <p style="text-align:center; font-size:0.75rem;">Handover this slip to counter for medicine collection.</p>
            </div>
        `;
        const originalBody = document.body.innerHTML;
        document.body.innerHTML = rxPrintContent;
        window.print();
        document.body.innerHTML = originalBody;
        
        // Remove item from desk after physical print collection is successful
        activePrescriptions.splice(index, 1);
        localStorage.setItem('namti_prescriptions', JSON.stringify(activePrescriptions));
        localStorage.setItem('namti_current_view', 'staff');
        location.reload();
    };

    // RENDERING DATABASE LOG SYSTEM FOR WEB INTAKES (ONLINE ORDER INTERFACE)
    window.loadSavedSystemOrders = function() {
        if (!adminOrdersLog) return;
        adminOrdersLog.innerHTML = "";
        const savedOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        savedOrders.forEach((data, trackingIndex) => {
            renderDatabaseRow(data, trackingIndex);
        });
        window.calculateLiveRevenue();
    };

    window.calculateLiveRevenue = function() {
        let currentDayTotal = 0;
        document.querySelectorAll('#admin-orders-log tr').forEach(row => {
            const billInput = row.querySelector('.bill-input');
            const statusField = row.querySelector('.status-field');
            if (billInput && statusField && (statusField.textContent.includes("Paid") || statusField.textContent.includes("Delivered"))) {
                currentDayTotal += parseFloat(billInput.value) || 0;
            }
        });
        const revenueDisplay = document.getElementById('total-revenue-display');
        if (revenueDisplay) {
            revenueDisplay.textContent = `Total Revenue: ₹ ${currentDayTotal.toFixed(2)}`;
        }
    };

    function renderDatabaseRow(data, indexPointer) {
        if (!adminOrdersLog) return;
        const row = document.createElement('tr');
        
        let prescriptionVisualControl = `<span style="color:gray; font-size:0.8rem;">No Photo</span>`;
        if (data.imageBlob) {
            prescriptionVisualControl = `<button class="view-presc-btn" onclick="window.openInteractivePrescription('${data.imageBlob}')">👁️ View Image</button>`;
        }

        let actionButtons = '';
        // 2. MODIFICATION: 100% PURE CASH ON DELIVERY DISPATCH FOR VEHICLE OUTBOUND LOGISTICS
        if (!data.statusText || data.statusText === 'New Request') {
            actionButtons = `<button class="sms-trigger-btn" style="background:#f59e0b; color:#fff;" onclick="window.executeSmsProcess(${indexPointer}, this)">Confirm COD & Dispatch 🚚</button>`;
        } else if (data.statusText.includes("Dispatched (COD)")) {
            actionButtons = `<button class="paid-trigger-btn" style="background:#16a34a; color:white; border:none; padding:0.5rem; border-radius:6px; cursor:pointer;" onclick="window.markAsPaid(${indexPointer}, this)">Collected Cash & Close Order 💰</button>`;
        } else if (data.statusText.includes("Paid") || data.statusText.includes("POS")) {
            actionButtons = `<button class="receipt-trigger-btn" style="background:#7c3aed; color:white; border:none; padding:0.5rem; border-radius:6px; cursor:pointer;" onclick="window.generateAndOpenReceipt(${indexPointer}, this)">View & Print Receipt 📄</button>`;
        }

        const displayMedicines = data.medicines ? data.medicines.replace(/\n/g, '<br>') : 'No written description';

        row.innerHTML = `
            <td><strong>${data.name}</strong><br><small>${data.phone}</small></td>
            <td>${data.village}<br><small data-pin="${data.pincode}">PIN: ${data.pincode} | ${data.district}</small></td>
            <td><div style="max-height:80px; overflow-y:auto; font-size:0.85rem; color:#334155; line-height: 1.4;">${displayMedicines}</div>${prescriptionVisualControl}</td>
            <td><input type="number" class="bill-input" value="${data.bill || ''}" placeholder="₹" ${data.statusText && (data.statusText.includes("Paid") || data.statusText.includes("POS")) ? 'disabled' : ''} oninput="window.calculateLiveRevenue()"></td>
            <td><span class="badge ${data.statusClass || 'badge-pending'} status-field">${data.statusText || 'New Request'}</span></td>
            <td>
                <div class="action-flex" style="flex-direction:column; gap:4px;">
                    ${actionButtons}
                    <div style="display:flex; gap:2px; margin-top:2px;">
                        <button class="reject-trigger-btn" onclick="window.executeRejectProcess(${indexPointer}, this)">Reject ❌</button>
                        <button class="delete-trigger-btn" onclick="window.executeDeleteProcess(${indexPointer})">🗑️</button>
                    </div>
                </div>
            </td>
        `;
        adminOrdersLog.appendChild(row);
    }

    // STAGE 1 OUTBOUND: CASH ON DELIVERY ORDER PROCESSOR
    window.executeSmsProcess = function(arrayIndex, buttonElement) {
        const rowItem = buttonElement.closest('tr');
        const phoneText = rowItem.cells[0].querySelector('small').textContent.trim();
        const customerName = rowItem.cells[0].querySelector('strong').textContent;
        const billVal = parseFloat(rowItem.querySelector('.bill-input').value) || 0;
        
        if (!billVal) { alert("Please input the finalized item bill before processing!"); return; }

        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].bill = billVal;
            currentOrders[arrayIndex].statusText = "Dispatched (COD)";
            currentOrders[arrayIndex].statusClass = "badge-pending";
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }

        const smsMsg = `Hello ${customerName},\nYour medicine order has been verified and packed at Namti Drug House.\n\nTotal Bill Amount: Rs. ${billVal}\nPayment Mode: Cash on Delivery (COD)\n\nOur delivery partner will collect the exact amount in cash at handover. Thank you!`;
        
        window.location.href = `sms:+91${phoneText}?body=${encodeURIComponent(smsMsg)}`;
        wi    
        
      

                          
