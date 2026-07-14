// ========================================================
// 1. STATE CONFIGURATION & ENGINE PERSISTENCE
// ========================================================
window.ViewManager = {
    navigate: function(viewId) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        document.getElementById(viewId).classList.add('active-view');
        localStorage.setItem('ndh_last_active_view', viewId);
        
        if (viewId === 'staff-view') {
            document.getElementById('staff-search-input').value = ""; // Reset search field
            StaffDashboard.loadRxQueue();
            StaffDashboard.loadOnlineOrdersQueue();
            StaffDashboard.calculateRevenueLedger();
        }
    },
    secureNavigation: function(viewId, correctPassword) {
        if (sessionStorage.getItem('auth_valid_' + viewId) === 'true') {
            this.navigate(viewId);
            return;
        }
        const inputPass = prompt("Enter Authorized Access Key:");
        if (inputPass === correctPassword) {
            sessionStorage.setItem('auth_valid_' + viewId, 'true');
            this.navigate(viewId);
        } else if (inputPass !== null) {
            alert("❌ Security Lockout: Invalid Password Entry!");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const savedState = localStorage.getItem('ndh_last_active_view') || 'home-view';
    ViewManager.navigate(savedState);
});

// ========================================================
// 2. PHARMACEUTICAL ROTATOR
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    const medicalQuotes = [
        "Alexander Fleming discovered Penicillin in 1928, launching the modern era of lifesaving antibiotics.",
        "Wilhelm Röntgen developed X-Rays in 1895, unlocking non-invasive diagnostic capabilities.",
        "Edward Jenner formulated the smallpox vaccine in 1796, pioneering the science of immunology.",
        "Frederick Banting and Charles Best isolated Insulin in 1921, saving diabetic patients globally."
    ];
    const container = document.getElementById('medical-inventions-container');
    if (container) {
        container.innerHTML = `<div id="rotator-card" style="padding:15px; background:#e2e2e2; color:#334155; border-radius:8px; font-style:italic; font-size:0.95rem; text-align:center; border-left:5px solid var(--accent); margin-bottom:15px;"></div>`;
        let i = 0;
        function rotate() {
            document.getElementById('rotator-card').innerHTML = `💡 <b>Medical Fact:</b> "${medicalQuotes[i]}"`;
            i = (i + 1) % medicalQuotes.length;
        }
        rotate(); setInterval(rotate, 8000);
    }
});

// ========================================================
// 3. ONLINE CUSTOMER DESK - LOGISTICS (WITH TIMESTAMP ENGINE)
// ========================================================
document.getElementById('online-order-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const pin = document.getElementById('cust-pin').value.trim();
    const bill = parseFloat(document.getElementById('cust-bill').value) || 0;
    const photoFile = document.getElementById('cust-rx-photo').files[0];

    if (pin !== "785684") {
        alert("❌ Order Rejected: Home delivery is strictly possible only within PIN code 785684!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Img = event.target.result;
        const currentStamp = new Date();
        
        const newOrder = {
            id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            name: document.getElementById('cust-name').value.trim(),
            phone: document.getElementById('cust-phone').value.trim(),
            pin: pin,
            estimatedBill: bill || 'Not Provided',
            meds: document.getElementById('cust-meds').value.trim() || 'Refer to attached image document',
            imgData: base64Img,
            timestamp: currentStamp.getTime(),
            formattedDate: currentStamp.toLocaleDateString('en-IN') + ' | ' + currentStamp.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})
        };

        const existingOrders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');
        existingOrders.push(newOrder);
        localStorage.setItem('ndh_longterm_orders', JSON.stringify(existingOrders));

        let completionText = "🎉 Order Submitted successfully (Cash on Delivery Mode).";
        if (bill >= 1599) {
            completionText = "⚠️ Order Warning (Value ≥ ₹1599): Your order requires manual Advance Payment verification before dispatch!";
        }
        
        alert(completionText);
        document.getElementById('online-order-form').reset();
        ViewManager.navigate('home-view');
    };
    reader.readAsDataURL(photoFile);
});

// ========================================================
// 4. DOCTOR DIAGNOSTIC COUPLING (WITH DATE & TIME)
// ========================================================
window.DoctorDesk = {
    submitPrescription: function() {
        const name = document.getElementById('doc-patient-name').value.trim();
        const age = document.getElementById('doc-patient-age').value.trim();
        const sex = document.getElementById('doc-patient-sex').value;
        const rx = document.getElementById('doc-rx-content').value.trim();

        if (!name || !age || !sex || !rx) {
            alert("Please fill out all mandatory fields marked with an asterisk (*).");
            return;
        }

        const currentStamp = new Date();

        const newRxRecord = {
            id: 'RX-' + Math.floor(1000 + Math.random() * 9000),
            name: name,
            phone: "Doctor Desk Direct", 
            age: age,
            sex: sex,
            symptoms: document.getElementById('doc-symptoms').value.trim() || 'N/A',
            tests: document.getElementById('doc-tests').value.trim() || 'None Referred',
            rx: rx,
            timestamp: currentStamp.getTime(),
            formattedDate: currentStamp.toLocaleDateString('en-IN') + ' | ' + currentStamp.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})
        };

        const existingRx = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
        existingRx.push(newRxRecord);
        localStorage.setItem('ndh_longterm_rx', JSON.stringify(existingRx));

        alert("📤 Medical Prescription dispatched safely to Pharmacy Counter!");
        document.getElementById('doctor-rx-form').reset();
        ViewManager.navigate('home-view');
    }
};

// ========================================================
// 5. STAFF OPERATIONS, SEARCH FILTER & PRINT ARCHITECTURE
// ========================================================
window.StaffDashboard = {
    loadRxQueue: function(filterTerm = "") {
        const target = document.getElementById('live-rx-queue');
        if (!target) return; target.innerHTML = "";
        let rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');

        if (filterTerm) {
            rxData = rxData.filter(item => 
                item.name.toLowerCase().includes(filterTerm) || 
                item.phone.toLowerCase().includes(filterTerm) ||
                item.id.toLowerCase().includes(filterTerm)
            );
        }

        if (rxData.length === 0) {
            target.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No matching prescriptions found.</td></tr>`;
            return;
        }

        rxData.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.id}</b><br>${item.name}<br><small>Age: ${item.age} | ${item.sex}</small><br><span style="background:#e0f2fe; padding:2px 6px; border-radius:4px; font-size:0.75rem; display:inline-block; margin-top:4px; font-weight:600;">⏰ ${item.formattedDate}</span></td>
                <td><small><b>Symptoms:</b> ${item.symptoms}<br><b>Tests:</b> ${item.tests}</small></td>
                <td><div style="white-space:pre-line; font-family:monospace; background:#f8fafc; padding:6px; border-radius:4px; font-size:0.85rem;">${item.rx}</div></td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <input type="number" id="rx-price-${index}" placeholder="Amt (₹)" style="margin:0; padding:6px;">
                        <div style="display:flex; gap:4px;">
                            <button onclick="StaffDashboard.billingAction('Rx', ${index}, 'Cash')" class="btn-action btn-success" style="padding:6px; font-size:0.8rem; flex:1;">Cash</button>
                            <button onclick="StaffDashboard.billingAction('Rx', ${index}, 'QR')" class="btn-action" style="padding:6px; background:#0284c7; font-size:0.8rem; flex:1;">UPI QR</button>
                        </div>
                        <button onclick="StaffDashboard.printRxMedicalPdf(${index})" style="background:#475569; color:white; border:none; padding:6px; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.8rem;">Print Prescription 🖨️</button>
                        <button onclick="StaffDashboard.deletePermanentItem('Rx', ${index})" style="background:#ef4444; color:white; border:none; padding:4px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Delete Record 🗑️</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    loadOnlineOrdersQueue: function(filterTerm = "") {
        const target = document.getElementById('live-online-orders-queue');
        if (!target) return; target.innerHTML = "";
        let orders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');

        if (filterTerm) {
            orders = orders.filter(item => 
                item.name.toLowerCase().includes(filterTerm) || 
                item.phone.toLowerCase().includes(filterTerm) ||
                item.id.toLowerCase().includes(filterTerm)
            );
        }

        if (orders.length === 0) {
            target.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No matching customer requests listed.</td></tr>`;
            return;
        }

        orders.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.id}</b><br>${item.name}<br><small>Ph: ${item.phone}</small><br><span style="background:#fef3c7; padding:2px 6px; border-radius:4px; font-size:0.75rem; display:inline-block; margin-top:4px; font-weight:600;">⏰ ${item.formattedDate}</span></td>
                <td><small><b>Loc:</b> ${item.pin}<br><b>Note:</b> ${item.meds}</small><br>
                    <button onclick="StaffDashboard.viewPrescriptionImage('${item.imgData}')" style="background:#e2e8f0; border:1px solid #cbd5e1; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; margin-top:5px;">👁️ View Uploaded Image</button>
                </td>
                <td><small>Est. Price: <b>₹ ${item.estimatedBill}</b></small></td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <input type="number" id="order-price-${index}" placeholder="Final Amt (₹)" style="margin:0; padding:6px;">
                        <div style="display:flex; gap:4px;">
                            <button onclick="StaffDashboard.billingAction('Order', ${index}, 'Cash')" class="btn-action btn-success" style="padding:6px; font-size:0.8rem; flex:1;">Cash</button>
                            <button onclick="StaffDashboard.billingAction('Order', ${index}, 'QR')" class="btn-action" style="padding:6px; background:#0284c7; font-size:0.8rem; flex:1;">UPI QR</button>
                        </div>
                        <button onclick="StaffDashboard.deletePermanentItem('Order', ${index})" style="background:#ef4444; color:white; border:none; padding:4px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Delete Record 🗑️</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    filterRecords: function() {
        const query = document.getElementById('staff-search-input').value.toLowerCase().trim();
        this.loadRxQueue(query);
        this.loadOnlineOrdersQueue(query);
    },

    processOfflinePOS: function(mode) {
        const amount = parseFloat(document.getElementById('pos-amount').value);
        let customer = document.getElementById('pos-cust-name').value.trim() || "Walk-In Customer";
        let phone = document.getElementById('pos-cust-phone').value.trim() || "N/A";
        
        if (!amount || amount <= 0) { alert("Please input a valid counter sale bill total!"); return; }

        const currentStamp = new Date();

        // Storing offline POS sale directly to permanent order log for future database references
        const mockOrder = {
            id: 'POS-' + Math.floor(1000 + Math.random() * 9000),
            name: customer,
            phone: phone,
            pin: "Counter Sale",
            estimatedBill: amount,
            meds: "Direct Counter Billing Transaction",
            imgData: "",
            timestamp: currentStamp.getTime(),
            formattedDate: currentStamp.toLocaleDateString('en-IN') + ' | ' + currentStamp.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})
        };

        const existingOrders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');
        existingOrders.push(mockOrder);
        localStorage.setItem('ndh_longterm_orders', JSON.stringify(existingOrders));

        this.logRevenueTransaction(amount);
        
        if (mode === 'Cash') {
            alert(`💵 Store Sale Finished! Collected ₹${amount} in Cash via ${customer}.`);
        } else {
            this.generateSystemUpiQr(amount, `POS Sale: ${customer}`);
        }

        document.getElementById('pos-amount').value = ""; 
        document.getElementById('pos-cust-name').value = "";
        document.getElementById('pos-cust-phone').value = "";
        this.loadOnlineOrdersQueue();
    },

    billingAction: function(type, index, mode) {
        const amtField = document.getElementById(type === 'Rx' ? `rx-price-${index}` : `order-price-${index}`);
        const finalPrice = parseFloat(amtField.value);
        if (!finalPrice || finalPrice <= 0) { alert("Please calculate items and input final billing value!"); return; }

        const dataset = JSON.parse(localStorage.getItem(type === 'Rx' ? 'ndh_longterm_rx' : 'ndh_longterm_orders'));
        const activeItem = dataset[index];

        this.logRevenueTransaction(finalPrice);
        if (mode === 'Cash') {
            alert(`💵 Transaction Settled via Cash! Collected ₹${finalPrice} for ${activeItem.name}.`);
        } else {
            this.generateSystemUpiQr(finalPrice, `${type} Sale: ${activeItem.name}`);
        }
    },

    generateSystemUpiQr: function(amount, memo) {
        const merchantUpi = "hussain.abidur@ybl";
        const serializedMemo = memo.replace(/[^a-zA-Z0-9 ]/g, "");
        const rawString = `upi://pay?pa=${merchantUpi}&pn=NamtiDrugHouse&am=${amount}&cu=INR&tn=${encodeURIComponent(serializedMemo)}`;
        const finalQrEndpoint = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(rawString)}`;

        document.getElementById('qr-modal-details').textContent = `${memo} | Invoice: ₹${amount}`;
        document.getElementById('qr-image-container').innerHTML = `<img src="${finalQrEndpoint}" alt="UPI Dynamic QR Engine" style="display:block; margin:0 auto; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.15);">`;
        document.getElementById('qr-modal-overlay').style.display = 'flex';
    },

    closeQrModal: function() {
        document.getElementById('qr-modal-overlay').style.display = 'none';
        alert("🔒 Payment Window verified & logged successfully!");
    },

    viewPrescriptionImage: function(blobString) {
        if(!blobString) { alert("No prescription attachment for custom counter billing."); return; }
        document.getElementById('modal-rx-img-render').src = blobString;
        document.getElementById('prescription-photo-modal').style.display = 'flex';
    },

    logRevenueTransaction: function(amount) {
        const ledger = JSON.parse(localStorage.getItem('ndh_revenue_ledger') || '[]');
        ledger.push({
            amount: amount,
            dateString: new Date().toDateString(),
            timestamp: Date.now()
        });
        localStorage.setItem('ndh_revenue_ledger', JSON.stringify(ledger));
        this.calculateRevenueLedger();
    },

    calculateRevenueLedger: function() {
        const ledger = JSON.parse(localStorage.getItem('ndh_revenue_ledger') || '[]');
        const todayStr = new Date().toDateString();
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        let todaySum = 0;
        let lastMonthSum = 0;
        let grandTotal = 0;

        ledger.forEach(tx => {
            grandTotal += tx.amount;
            if (tx.dateString === todayStr) {
                todaySum += tx.amount;
            }
            
            const txDate = new Date(tx.timestamp);
            let targetMonth = currentMonth - 1;
            let targetYear = currentYear;
            if (targetMonth < 0) {
                targetMonth = 11;
                targetYear--;
            }
            if (txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear) {
                lastMonthSum += tx.amount;
            }
        });

        document.getElementById('rev-today').textContent = `₹ ${todaySum.toFixed(2)}`;
        document.getElementById('rev-month').textContent = `₹ ${lastMonthSum.toFixed(2)}`;
        document.getElementById('rev-total').textContent = `₹ ${grandTotal.toFixed(2)}`;
    },

    clearRevenueMetrics: function() {
        if(confirm("🚨 Owner Verification Required: Do you want to wipe all past audited financial analytics ledger history?")) {
            localStorage.setItem('ndh_revenue_ledger', '[]');
            this.calculateRevenueLedger();
            alert("🧹 Financial logs wiped successfully.");
        }
    },

    // NEW 100% BLANK-FREE MULTI-DEVICE PRINT WINDOW SYSTEM
    printRxMedicalPdf: function(index) {
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
        const rx = rxData[index];
        if (!rx) return;

        // Creating an isolated native document framework context window to fix mobile renderer bugs
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Print Prescription - ${rx.id}</title>
                
                <style>
                    body { font-family: 'Courier New', monospace; padding: 30px; color: #000; background: #fff; line-height: 1.5; }
                    .wrapper { max-width: 700px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h2 { margin: 0; font-size: 1.8rem; font-weight: bold; letter-spacing: 1px; }
                    .dashed-line { border-top: 2px dashed #000; margin: 15px 0; }
                    .thin-line { border-top: 1px dashed #000; margin: 15px 0; }
                    p { margin: 6px 0; font-size: 1rem; }
                    .rx-box { white-space: pre-line; background: #f5f5f5; padding: 15px; font-size: 1.05rem; border-radius: 4px; border: 1px solid #ccc; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="header">
                        <h2>NAMTI DRUG HOUSE</h2>
                        <p style="margin: 4px 0 0 0; font-size: 0.9rem;">Sivasagar, Assam | Consultation Desk Receipt</p>
                    </div>
                    <div class="dashed-line"></div>
                    <p><b>Rx Token ID :</b> ${rx.id}</p>
                    <p><b>Patient Name:</b> ${rx.name}</p>
                    <p><b>Age / Sex  :</b> ${rx.age} Yrs / ${rx.sex}</p>
                    <p><b>Visit Time :</b> ${rx.formattedDate}</p>
                    <div class="thin-line"></div>
                    <p><b>CHIEF SYMPTOMS & COMPLAINTS:</b></p>
                    <p style="padding-left: 20px; color: #222;">${rx.symptoms}</p>
                    <br>
                    <p><b>DIAGNOSTIC TESTS REFERRED:</b></p>
                    <p style="padding-left: 20px; font-style: italic; color: #222;">${rx.tests}</p>
                    <div class="thin-line"></div>
                    <p style="font-weight: bold; font-size: 1.15rem;">💊 Rx PRESCRIBED MEDICINES:</p>
                    <div class="rx-box">${rx.rx}</div>
                    <div class="dashed-line" style="margin-top: 50px;"></div>
                    <p style="text-align: center; font-size: 0.85rem; color: #444;">Generated digitally via Doctor Consultation Desk Engine</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    deletePermanentItem: function(type, index) {
        if (confirm("🚨 Warning: Are you absolutely sure you want to permanently delete this operational record from portal memory?")) {
            const storageKey = (type === 'Rx') ? 'ndh_longterm_rx' : 'ndh_longterm_orders';
            let dataset = JSON.parse(localStorage.getItem(storageKey) || '[]');
            dataset.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(dataset));
            
            this.filterRecords(); 
            alert("🗑️ Record expunged permanently.");
        }
    }
};
            
