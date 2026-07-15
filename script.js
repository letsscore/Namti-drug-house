// ========================================================
// 1. ENGINE INITIALIZATION & VIEW MANAGER
// ========================================================
window.ViewManager = {
    navigate: function(viewId) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active-view');
        }
        localStorage.setItem('ndh_last_active_view', viewId);
        
        if (viewId === 'staff-view') {
            if (window.StaffDashboard) {
                window.StaffDashboard.loadRxQueue("");
                window.StaffDashboard.loadOnlineOrdersQueue("");
                window.StaffDashboard.calculateRevenueLedger();
            }
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
    window.ViewManager.navigate(savedState);

    const orderForm = document.getElementById('online-order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
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
                const defaultDateStr = currentStamp.toLocaleDateString('en-IN') + ' | ' + currentStamp.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});
                
                const newOrder = {
                    id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
                    name: document.getElementById('cust-name').value.trim(),
                    phone: document.getElementById('cust-phone').value.trim(),
                    pin: pin,
                    estimatedBill: bill || 'Not Provided',
                    meds: document.getElementById('cust-meds').value.trim() || 'Refer to attached image document',
                    imgData: base64Img,
                    isPOS: false,
                    timestamp: currentStamp.getTime(),
                    formattedDate: defaultDateStr
                };

                const existingOrders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');
                existingOrders.push(newOrder);
                localStorage.setItem('ndh_longterm_orders', JSON.stringify(existingOrders));

                let completionText = "🎉 Order Submitted successfully (Cash on Delivery Mode). Record saved permanently.";
                if (bill >= 1599) {
                    completionText = "⚠️ Order Warning (Value ≥ ₹1599): Your order requires manual Advance Payment verification before dispatch!";
                }
                
                alert(completionText);
                orderForm.reset();
                window.ViewManager.navigate('home-view');
            };
            if (photoFile) reader.readAsDataURL(photoFile);
        });
    }
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
            const card = document.getElementById('rotator-card');
            if (card) {
                card.innerHTML = `💡 <b>Medical Fact:</b> "${medicalQuotes[i]}"`;
                i = (i + 1) % medicalQuotes.length;
            }
        }
        rotate(); setInterval(rotate, 8000);
    }
});

// ========================================================
// 3. DOCTOR DIAGNOSTIC COUPLING
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
        const defaultDateStr = currentStamp.toLocaleDateString('en-IN') + ' | ' + currentStamp.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});

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
            formattedDate: defaultDateStr
        };

        const existingRx = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
        existingRx.push(newRxRecord);
        localStorage.setItem('ndh_longterm_rx', JSON.stringify(existingRx));

        alert("📤 Medical Prescription dispatched safely to Pharmacy Counter! Saved in continuous history logs.");
        document.getElementById('doctor-rx-form').reset();
        window.ViewManager.navigate('home-view');
    }
};

// ========================================================
// 4. NEW HOME PAGE CUSTOMER DOWNLOAD & PRINT LOGIC
// ========================================================
window.HomeReceiptEngine = {
    searchAndPrint: function(e) {
        e.preventDefault();
        const searchName = document.getElementById('dl-cust-name').value.toLowerCase().trim();
        const searchPhone = document.getElementById('dl-cust-phone').value.trim();
        const searchDateInput = document.getElementById('dl-visit-date').value; // format: YYYY-MM-DD
        const searchDoc = document.getElementById('dl-doc-name').value.toLowerCase().trim();

        if(!searchName || !searchPhone || !searchDateInput) {
            alert("Please fill out all mandatory fields.");
            return;
        }

        // Convert search date into clean comparable components
        const parsedSearchDate = new Date(searchDateInput);
        const searchDay = parsedSearchDate.getDate();
        const searchMonth = parsedSearchDate.getMonth();
        const searchYear = parsedSearchDate.getFullYear();

        // 1. Scan Rx Records Database
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
        let targetMatch = rxData.find(item => {
            const txDate = new Date(item.timestamp || Date.now());
            const dateMatch = (txDate.getDate() === searchDay && txDate.getMonth() === searchMonth && txDate.getFullYear() === searchYear);
            const nameMatch = item.name && item.name.toLowerCase().includes(searchName);
            
            // For Rx, sometimes phone isn't provided or hardcoded, so we allow phone matching or bypass check 
            const phoneMatch = (item.phone === "Doctor Desk Direct" || (item.phone && item.phone.includes(searchPhone)));
            
            return nameMatch && dateMatch;
        });

        // 2. Scan Online/POS Orders Database if no doctor Rx matched
        if (!targetMatch) {
            const orderData = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');
            targetMatch = orderData.find(item => {
                const txDate = new Date(item.timestamp || Date.now());
                const dateMatch = (txDate.getDate() === searchDay && txDate.getMonth() === searchMonth && txDate.getFullYear() === searchYear);
                const nameMatch = item.name && item.name.toLowerCase().includes(searchName);
                const phoneMatch = item.phone && item.phone.includes(searchPhone);
                
                return nameMatch && phoneMatch && dateMatch;
            });
        }

        if (!targetMatch) {
            alert("❌ No matching invoice receipt or prescription log found for the provided details. Please verify your Name, Phone and Date!");
            return;
        }

        // Execute direct background layout assembly to avoid blank rendering
        const oldFrame = document.getElementById('ndh-print-frame');
        if (oldFrame) oldFrame.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'ndh-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.bottom = '0';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0.01';
        document.body.appendChild(iframe);

        const printDate = targetMatch.formattedDate || new Date(targetMatch.timestamp).toLocaleDateString('en-IN');
        const doc = iframe.contentWindow.document;
        doc.open();
        
        // Build printable dynamic document layout depending on database origin
        const isRx = targetMatch.id.startsWith('RX');
        doc.write(`
            <html>
            <head>
                <title>Receipt - ${targetMatch.id}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; color: #000; background: #fff; line-height: 1.5; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h2 { margin: 0; font-size: 1.8rem; font-weight: bold; }
                    .divider { border-top: 2px dashed #000; margin: 15px 0; }
                    .field { margin: 6px 0; font-size: 1rem; }
                    .rx-box { white-space: pre-line; background: #f9f9f9; padding: 12px; font-size: 1.05rem; border: 1px dashed #333; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>NAMTI DRUG HOUSE</h2>
                    <p>Sivasagar, Assam | Customer Digital Copy</p>
                </div>
                <div class="divider"></div>
                <div class="field"><b>Document ID  :</b> ${targetMatch.id}</div>
                <div class="field"><b>Customer Name:</b> ${targetMatch.name}</div>
                <div class="field"><b>Phone Number:</b> ${targetMatch.phone}</div>
                <div class="field"><b>Log Date/Time:</b> ${printDate}</div>
                ${isRx ? `<div class="field"><b>Age / Sex   :</b> ${targetMatch.age} Yrs / ${targetMatch.sex}</div>` : ''}
                <div class="divider"></div>
                
                ${isRx ? `
                    <div style="font-weight:bold; margin-top:10px;">Clinical Symptoms:</div>
                    <div style="padding-left:10px; margin-bottom:10px;">${targetMatch.symptoms || 'N/A'}</div>
                    <div style="font-weight:bold;">Referred Tests:</div>
                    <div style="padding-left:10px; margin-bottom:10px;">${targetMatch.tests || 'None'}</div>
                    <div class="divider"></div>
                    <div style="font-weight:bold; font-size:1.1rem;">💊 Rx Prescribed Medicines:</div>
                    <div class="rx-box">${targetMatch.rx}</div>
                ` : `
                    <div style="font-weight:bold; margin-top:10px;">Order Details / Requirements:</div>
                    <div style="padding-left:10px; margin-bottom:10px;">${targetMatch.meds || 'N/A'}</div>
                    <div class="field"><b>Settled Total Cost :</b> ₹ ${targetMatch.estimatedBill || '0.00'}</div>
                `}
                
                <div class="divider" style="margin-top: 40px;"></div>
                <p style="text-align: center; font-size: 0.85rem;">Generated digitally via Namti Drug House System Ecosystem</p>
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            document.getElementById('customer-receipt-download-form').reset();
        }, 800);
    }
};

// ========================================================
// 5. STAFF DASHBOARD ENGINE
// ========================================================
window.StaffDashboard = {
    loadRxQueue: function(filterTerm = "") {
        const target = document.getElementById('live-rx-queue');
        if (!target) return; target.innerHTML = "";
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');

        if (rxData.length === 0) {
            target.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No prescriptions currently logged.</td></tr>`;
            return;
        }

        rxData.forEach((item) => {
            const displayDate = (item.formattedDate && item.formattedDate !== "undefined") ? item.formattedDate : new Date(item.timestamp || Date.now()).toLocaleDateString('en-IN');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.id}</b><br>${item.name}<br><small>Age: ${item.age} | ${item.sex}</small><br><span style="background:#e0f2fe; padding:2px 6px; border-radius:4px; font-size:0.75rem; display:inline-block; margin-top:4px; font-weight:600;">⏰ ${displayDate}</span></td>
                <td><small><b>Symptoms:</b> ${item.symptoms}<br><b>Tests:</b> ${item.tests}</small></td>
                <td><div style="white-space:pre-line; font-family:monospace; background:#f8fafc; padding:6px; border-radius:4px; font-size:0.85rem;">${item.rx}</div></td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <input type="number" id="rx-price-${item.id}" placeholder="Amt (₹)" style="margin:0; padding:6px;">
                        <div style="display:flex; gap:4px;">
                            <button onclick="window.StaffDashboard.billingAction('Rx', '${item.id}', 'Cash')" class="btn-action btn-success" style="padding:6px; font-size:0.8rem; flex:1;">Cash</button>
                            <button onclick="window.StaffDashboard.billingAction('Rx', '${item.id}', 'QR')" class="btn-action" style="padding:6px; background:#0284c7; font-size:0.8rem; flex:1;">UPI QR</button>
                        </div>
                        <button onclick="window.StaffDashboard.printRxMedicalPdf('${item.id}')" style="background:#475569; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.85rem;">Print Prescription 🖨️</button>
                        <button onclick="window.StaffDashboard.deletePermanentItem('Rx', '${item.id}')" style="background:#ef4444; color:white; border:none; padding:6px; border-radius:4px; font-size:0.85rem; cursor:pointer; font-weight:bold;">Delete Record 🗑️</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    loadOnlineOrdersQueue: function(filterTerm = "") {
        const target = document.getElementById('live-online-orders-queue');
        if (!target) return; target.innerHTML = "";
        const orders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');
        let baseOrders = orders.filter(item => item.isPOS !== true);

        if (baseOrders.length === 0) {
            target.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No customer requests listed.</td></tr>`;
            return;
        }

        baseOrders.forEach((item) => {
            const displayDate = (item.formattedDate && item.formattedDate !== "undefined") ? item.formattedDate : new Date(item.timestamp || Date.now()).toLocaleDateString('en-IN');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.id}</b><br>${item.name}<br><small>Ph: ${item.phone}</small><br><span style="background:#fef3c7; padding:2px 6px; border-radius:4px; font-size:0.75rem; display:inline-block; margin-top:4px; font-weight:600;">⏰ ${displayDate}</span></td>
                <td><small><b>Loc:</b> ${item.pin}<br><b>Note:</b> ${item.meds}</small><br>
                    <button onclick="window.StaffDashboard.viewPrescriptionImage('${item.imgData}')" style="background:#e2e8f0; border:1px solid #cbd5e1; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; margin-top:5px;">👁️ View Uploaded Image</button>
                </td>
                <td><small>Est. Price: <b>₹ ${item.estimatedBill}</b></small></td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <input type="number" id="order-price-${item.id}" placeholder="Final Amt (₹)" style="margin:0; padding:6px;">
                        <div style="display:flex; gap:4px;">
                            <button onclick="window.StaffDashboard.billingAction('Order', '${item.id}', 'Cash')" class="btn-action btn-success" style="padding:6px; font-size:0.8rem; flex:1;">Cash</button>
                            <button onclick="window.StaffDashboard.billingAction('Order', '${item.id}', 'QR')" class="btn-action" style="padding:6px; background:#0284c7; font-size:0.8rem; flex:1;">UPI QR</button>
                        </div>
                        <button onclick="window.StaffDashboard.deletePermanentItem('Order', '${item.id}')" style="background:#ef4444; color:white; border:none; padding:6px; border-radius:4px; font-size:0.85rem; cursor:pointer; font-weight:bold;">Delete Record 🗑️</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    processOfflinePOS: function(mode) {
        const amount = parseFloat(document.getElementById('pos-amount').value);
        let customer = document.getElementById('pos-cust-name').value.trim() || "Walk-In Customer";
        let phone = document.getElementById('pos-cust-phone').value.trim() || "N/A";
        
        if (!amount || amount <= 0) { alert("Please input a valid counter sale bill total!"); return; }

        const currentStamp = new Date();
        const defaultDateStr = currentStamp.toLocaleDateString('en-IN') + ' | ' + currentStamp.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});

        const mockOrder = {
            id: 'POS-' + Math.floor(1000 + Math.random() * 9000),
            name: customer,
            phone: phone,
            pin: "Counter Sale",
            estimatedBill: amount,
            meds: "Direct Counter Billing Transaction",
            imgData: "",
            isPOS: true,
            timestamp: currentStamp.getTime(),
            formattedDate: defaultDateStr
        };

        const existingOrders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');
        existingOrders.push(mockOrder);
        localStorage.setItem('ndh_longterm_orders', JSON.stringify(existingOrders));

        this.logRevenueTransaction(amount);
        
        if (mode === 'Cash') {
            alert(`💵 Store Sale Finished! Collected ₹${amount} in Cash via ${customer}. Record saved in ledger database.`);
        } else {
            this.generateSystemUpiQr(amount, `POS Sale: ${customer}`);
        }

        document.getElementById('pos-amount').value = ""; 
        document.getElementById('pos-cust-name').value = "";
        document.getElementById('pos-cust-phone').value = "";
        
        this.loadOnlineOrdersQueue();
    },

    billingAction: function(type, itemId, mode) {
        const amtField = document.getElementById(type === 'Rx' ? `rx-price-${itemId}` : `order-price-${itemId}`);
        const finalPrice = parseFloat(amtField.value);
        if (!finalPrice || finalPrice <= 0) { alert("Please calculate items and input final billing value!"); return; }

        const storageKey = (type === 'Rx') ? 'ndh_longterm_rx' : 'ndh_longterm_orders';
        const dataset = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const activeItem = dataset.find(item => item.id === itemId);

        if(!activeItem) return;

        this.logRevenueTransaction(finalPrice);
        if (mode === 'Cash') {
            alert(`💵 Transaction Settled! Collected ₹${finalPrice} for ${activeItem.name}. Structural details remain saved.`);
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

        const rToday = document.getElementById('rev-today');
        const rMonth = document.getElementById('rev-month');
        const rTotal = document.getElementById('rev-total');

        if(rToday) rToday.textContent = `₹ ${todaySum.toFixed(2)}`;
        if(rMonth) rMonth.textContent = `₹ ${lastMonthSum.toFixed(2)}`;
        if(rTotal) rTotal.textContent = `₹ ${grandTotal.toFixed(2)}`;
    },

    clearRevenueMetrics: function() {
        if(confirm("🚨 Owner Verification Required: Do you want to wipe all past audited financial analytics ledger history?")) {
            localStorage.setItem('ndh_revenue_ledger', '[]');
            this.calculateRevenueLedger();
            alert("🧹 Financial logs wiped successfully.");
        }
    },

    printRxMedicalPdf: function(itemId) {
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
        const rx = rxData.find(item => item.id === itemId);
        if (!rx) { alert("Prescription data corrupted or missing!"); return; }

        const oldFrame = document.getElementById('ndh-print-frame');
        if (oldFrame) oldFrame.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'ndh-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.bottom = '0';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0.01';
        document.body.appendChild(iframe);

        const printDate = (rx.formattedDate && rx.formattedDate !== "undefined") ? rx.formattedDate : new Date(rx.timestamp || Date.now()).toLocaleDateString('en-IN');

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Print Rx - ${rx.id}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; color: #000; background: #fff; line-height: 1.5; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h2 { margin: 0; font-size: 1.8rem; font-weight: bold; }
                    .divider { border-top: 2px dashed #000; margin: 15px 0; }
                    .field { margin: 6px 0; font-size: 1rem; }
                    .rx-box { white-space: pre-line; background: #f9f9f9; padding: 12px; font-size: 1.05rem; border: 1px dashed #333; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>NAMTI DRUG HOUSE</h2>
                    <p>Sivasagar, Assam | Consultation Desk Receipt</p>
                </div>
                <div class="divider"></div>
                <div class="field"><b>Rx Token ID :</b> ${rx.id}</div>
                <div class="field"><b>Patient Name:</b> ${rx.name}</div>
                <div class="field"><b>Age / Sex  :</b> ${rx.age} Yrs / ${rx.sex}</div>
                <div class="field"><b>Visit Time :</b> ${printDate}</div>
                <div class="divider"></div>
                
                <div style="font-weight:bold; margin-top:10px;">Symptoms:</div>
                <div style="padding-left:10px; margin-bottom:10px;">${rx.symptoms || 'N/A'}</div>
                
                <div style="font-weight:bold;">Referred Tests:</div>
                <div style="padding-left:10px; margin-bottom:10px;">${rx.tests || 'None'}</div>
                
                <div class="divider"></div>
                <div style="font-weight:bold; font-size:1.1rem;">💊 Rx Medicines:</div>
                <div class="rx-box">${rx.rx}</div>
                
                <div class="divider" style="margin-top: 40px;"></div>
                <p style="text-align: center; font-size: 0.85rem;">Generated digitally via Doctor Desk Engine</p>
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 800);
    },

    deletePermanentItem: function(type, itemId) {
        if (confirm("🚨 Admin Authorization: Are you absolutely sure you want to permanently delete this operational record from portal memory? This action cannot be undone.")) {
            const storageKey = (type === 'Rx') ? 'ndh_longterm_rx' : 'ndh_longterm_orders';
            let dataset = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            const updatedDataset = dataset.filter(item => item.id !== itemId);
            localStorage.setItem(storageKey, JSON.stringify(updatedDataset));
            
            this.loadRxQueue();
            this.loadOnlineOrdersQueue();
            
            alert("🗑️ Record expunged permanently by Admin.");
        }
    }
};
