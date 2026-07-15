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
                window.StaffDashboard.loadRxQueue();
                window.StaffDashboard.loadOnlineOrdersQueue();
                window.StaffDashboard.calculateRevenueLedger();
                window.StaffDashboard.updateCustomerFigures();
                window.StaffDashboard.renderHistoryTable();
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
    window.PromotionalSMS.checkAndTriggerSMS(); // Hook Promotional SMS Check on startup

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
// 3. DOCTOR DESK SUBMISSION
// ========================================================
window.DoctorDesk = {
    submitPrescription: function() {
        const name = document.getElementById('doc-patient-name').value.trim();
        const age = document.getElementById('doc-patient-age').value.trim();
        const sex = document.getElementById('doc-patient-sex').value;
        const rx = document.getElementById('doc-rx-content').value.trim();
        const referDoc = document.getElementById('doc-refer-details').value.trim();

        if (!name || !age || !sex || !rx) {
            alert("Please fill out all mandatory fields marked with an asterisk (*).");
            return;
        }

        const currentStamp = new Date();
        const defaultDateStr = currentStamp.toLocaleDateString('en-IN') + ' | ' + currentStamp.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});

        const newRxRecord = {
            id: 'RX-' + Math.floor(1000 + Math.random() * 9000),
            name: name,
            phone: "", 
            age: age,
            sex: sex,
            referDoc: referDoc || "Self / Internal NDH Consultation",
            symptoms: document.getElementById('doc-symptoms').value.trim() || 'N/A',
            tests: document.getElementById('doc-tests').value.trim() || 'None Referred',
            rx: rx,
            timestamp: currentStamp.getTime(),
            formattedDate: defaultDateStr
        };

        const existingRx = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
        existingRx.push(newRxRecord);
        localStorage.setItem('ndh_longterm_rx', JSON.stringify(existingRx));

        alert("📤 Medical Prescription dispatched safely to Pharmacy Counter Queue!");
        document.getElementById('doctor-rx-form').reset();
        window.ViewManager.navigate('home-view');
    }
};

// ========================================================
// 4. UNIFIED CUSTOMER SEARCH & RECEIPT PRINT ENGINE
// ========================================================
window.HomeReceiptEngine = {
    searchAndPrint: function(e) {
        e.preventDefault();
        const searchName = document.getElementById('dl-cust-name').value.toLowerCase().trim();
        const searchPhone = document.getElementById('dl-cust-phone').value.trim();
        const searchDateInput = document.getElementById('dl-visit-date').value;

        if(!searchName || !searchPhone || !searchDateInput) {
            alert("Please fill out all mandatory fields.");
            return;
        }

        const parsedSearchDate = new Date(searchDateInput);
        const searchDay = parsedSearchDate.getDate();
        const searchMonth = parsedSearchDate.getMonth();
        const searchYear = parsedSearchDate.getFullYear();

        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        
        let targetMatch = universalLedger.find(item => {
            const txDate = new Date(item.timestamp || Date.now());
            const dateMatch = (txDate.getDate() === searchDay && txDate.getMonth() === searchMonth && txDate.getFullYear() === searchYear);
            const nameMatch = item.name && item.name.toLowerCase().includes(searchName);
            const phoneMatch = item.phone && item.phone.includes(searchPhone);
            return nameMatch && phoneMatch && dateMatch;
        });

        if (!targetMatch) {
            const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
            let matchedRx = rxData.find(item => {
                const txDate = new Date(item.timestamp || Date.now());
                const dateMatch = (txDate.getDate() === searchDay && txDate.getMonth() === searchMonth && txDate.getFullYear() === searchYear);
                const nameMatch = item.name && item.name.toLowerCase().includes(searchName);
                return nameMatch && dateMatch;
            });
            if(matchedRx) {
                targetMatch = {
                    ...matchedRx,
                    phone: searchPhone,
                    itemsBreakdown: [],
                    finalPrice: 0,
                    mode: "Consultation Queue Print"
                };
            }
        }

        if (!targetMatch) {
            alert("❌ No matching billing data or invoice file found! Please verify parameters.");
            return;
        }

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
        
        let itemsHTML = "";
        if(targetMatch.itemsBreakdown && targetMatch.itemsBreakdown.length > 0) {
            targetMatch.itemsBreakdown.forEach((med, index) => {
                itemsHTML += `<tr>
                    <td>${index+1}. ${med.name}</td>
                    <td style="text-align: right;">₹ ${parseFloat(med.mrp).toFixed(2)}</td>
                </tr>`;
            });
        } else {
            itemsHTML = `<tr><td colspan="2">No custom items structured. Direct settlement.</td></tr>`;
        }

        doc.write(`
            <html>
            <head>
                <title>Invoice Receipt - ${targetMatch.id}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 15px; color: #000; background: #fff; line-height: 1.4; font-size: 14px; }
                    .header { text-align: center; margin-bottom: 15px; }
                    .header h2 { margin: 0; font-size: 1.5rem; font-weight: bold; }
                    .divider { border-top: 2px dashed #000; margin: 12px 0; }
                    .field { margin: 4px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { padding: 6px; text-align: left; }
                    th { border-bottom: 1px dashed #000; }
                    .rx-box { white-space: pre-line; background: #f5f5f5; padding: 10px; border: 1px dashed #000; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>NAMTI DRUG HOUSE</h2>
                    <p>Sivasagar, Assam<br>Itemized Customer Payment Receipt</p>
                </div>
                <div class="divider"></div>
                <div class="field"><b>Invoice ID   :</b> ${targetMatch.id}</div>
                <div class="field"><b>Customer Name:</b> ${targetMatch.name}</div>
                <div class="field"><b>Phone Number :</b> ${targetMatch.phone}</div>
                <div class="field"><b>Date & Time  :</b> ${printDate}</div>
                <div class="field"><b>Referrer     :</b> ${targetMatch.referDoc || 'Walk-in Direct'}</div>
                ${targetMatch.age ? `<div class="field"><b>Age / Sex    :</b> ${targetMatch.age} Yrs / ${targetMatch.sex}</div>` : ''}
                <div class="divider"></div>
                
                <h4 style="margin: 5px 0;">📦 MEDICINE BILLING breakdown:</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Medicine Description</th>
                            <th style="text-align: right;">MRP (Price)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <div class="divider"></div>
                <div style="text-align: right; font-size: 1.1rem; font-weight: bold;">
                    GRAND TOTAL SETTLED: ₹ ${parseFloat(targetMatch.finalPrice || 0).toFixed(2)}
                </div>

                ${targetMatch.rx ? `
                    <div class="divider"></div>
                    <div style="font-weight:bold; font-size:1rem;">📋 ORIGINAL DOCTOR PRESCRIPTION (Rx):</div>
                    <div class="rx-box">${targetMatch.rx}</div>
                ` : ''}
                
                <div class="divider" style="margin-top: 30px;"></div>
                <p style="text-align: center; font-size: 0.8rem;">Thank You! Access your receipt instantly anytime.</p>
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
// 5. STAFF DASHBOARD & LEDGER HISTORY ENGINE
// ========================================================
window.StaffDashboard = {
    switchTab: function(tabName) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-content'));
        
        document.getElementById(`tab-${tabName}-btn`).classList.add('active-tab');
        document.getElementById(`tab-${tabName}-content`).classList.add('active-content');

        if(tabName === 'analytics') {
            this.updateCustomerFigures();
            this.renderHistoryTable();
        }
    },

    addPosRow: function() {
        const container = document.getElementById('pos-items-container');
        const row = document.createElement('div');
        row.className = 'dynamic-item-row';
        row.innerHTML = `
            <input type="text" class="pos-med-name" placeholder="Medicine Name" style="margin:0;">
            <input type="number" class="pos-med-mrp" placeholder="MRP (₹)" style="margin:0;" oninput="window.StaffDashboard.syncPosTotal()">
        `;
        container.appendChild(row);
    },

    syncPosTotal: function() {
        let sum = 0;
        document.querySelectorAll('.pos-med-mrp').forEach(input => {
            sum += parseFloat(input.value) || 0;
        });
        document.getElementById('pos-calculated-total').textContent = sum.toFixed(2);
    },

    processOfflinePOS: function(mode) {
        let customer = document.getElementById('pos-cust-name').value.trim() || "Walk-In Customer";
        let phone = document.getElementById('pos-cust-phone').value.trim() || "0000000000";
        let referDoc = document.getElementById('pos-refer-doc').value.trim() || "Direct Counter Self";
        
        let itemsBreakdown = [];
        let calculatedTotal = 0;

        const names = document.querySelectorAll('.pos-med-name');
        const mrps = document.querySelectorAll('.pos-med-mrp');

        names.forEach((el, index) => {
            const medName = el.value.trim();
            const medMrp = parseFloat(mrps[index].value) || 0;
            if(medName) {
                itemsBreakdown.push({ name: medName, mrp: medMrp });
                calculatedTotal += medMrp;
            }
        });

        if (itemsBreakdown.length === 0 || calculatedTotal <= 0) {
            alert("❌ Please add at least one medicine item with its respective MRP price!");
            return;
        }

        const currentStamp = new Date();
        const defaultDateStr = currentStamp.toLocaleDateString('en-IN') + ' | ' + currentStamp.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});

        const transactionRecord = {
            id: 'POS-' + Math.floor(1000 + Math.random() * 9000),
            name: customer,
            phone: phone,
            referDoc: referDoc,
            itemsBreakdown: itemsBreakdown,
            finalPrice: calculatedTotal,
            isPOS: true,
            timestamp: currentStamp.getTime(),
            formattedDate: defaultDateStr
        };

        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        universalLedger.push(transactionRecord);
        localStorage.setItem('ndh_universal_ledger', JSON.stringify(universalLedger));

        this.logRevenueTransaction(calculatedTotal);
        this.updateCustomerFigures();
        
        if (mode === 'Cash') {
            alert(`💵 Counter POS Invoice Processed! Collected ₹${calculatedTotal.toFixed(2)}.`);
        } else {
            let itemSummary = itemsBreakdown.map(i => `${i.name}: ₹${i.mrp}`).join('\n');
            this.generateSystemUpiQr(calculatedTotal, `POS: ${customer}\n${itemSummary}`);
        }

        // Reset inputs
        document.getElementById('pos-cust-name').value = "";
        document.getElementById('pos-cust-phone').value = "";
        document.getElementById('pos-refer-doc').value = "";
        document.getElementById('pos-items-container').innerHTML = `
            <div class="dynamic-item-row">
                <input type="text" class="pos-med-name" placeholder="Medicine Name" style="margin:0;">
                <input type="number" class="pos-med-mrp" placeholder="MRP (₹)" style="margin:0;" oninput="window.StaffDashboard.syncPosTotal()">
            </div>
        `;
        document.getElementById('pos-calculated-total').textContent = "0.00";
    },

    loadRxQueue: function() {
        const target = document.getElementById('live-rx-queue');
        if (!target) return; target.innerHTML = "";
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');

        if (rxData.length === 0) {
            target.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No prescriptions logged.</td></tr>`;
            return;
        }

        rxData.forEach((item) => {
            const displayDate = item.formattedDate || new Date(item.timestamp).toLocaleDateString('en-IN');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.id}</b><br>${item.name}<br><small>Age: ${item.age} | ${item.sex}</small><br><span style="background:#e0f2fe; padding:2px 6px; border-radius:4px; font-size:0.75rem; display:inline-block; margin-top:4px;">⏰ ${displayDate}</span></td>
                <td><div style="font-family:monospace; font-size:0.85rem; background:#f8fafc; padding:6px; border-radius:4px;">${item.rx}</div></td>
                <td>
                    <div style="margin-bottom:6px;">
                        <input type="text" id="rx-refer-field-${item.id}" value="${item.referDoc || ''}" placeholder="Refer Doctor / Hospital" style="padding:6px; margin:0; font-size:0.8rem; background:#fffbeb;">
                    </div>
                    <div id="rx-breakdown-container-${item.id}">
                        <div class="dynamic-item-row">
                            <input type="text" class="rx-med-name-${item.id}" placeholder="Med Name" style="padding:6px; margin:0; font-size:0.8rem;">
                            <input type="number" class="rx-med-mrp-${item.id}" placeholder="MRP" style="padding:6px; margin:0; font-size:0.8rem; width:80px;">
                        </div>
                    </div>
                    <button type="button" onclick="window.StaffDashboard.addRxRow('${item.id}')" style="margin-top:4px; padding:2px 6px; font-size:0.75rem;">+ Add Row</button>
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <input type="text" id="rx-phone-field-${item.id}" placeholder="Cust Phone *" style="padding:6px; margin:0; font-size:0.85rem;" required>
                        <div style="display:flex; gap:4px;">
                            <button onclick="window.StaffDashboard.billingAction('Rx', '${item.id}', 'Cash')" class="btn-action btn-success" style="padding:6px; font-size:0.8rem; flex:1;">Cash</button>
                            <button onclick="window.StaffDashboard.billingAction('Rx', '${item.id}', 'QR')" class="btn-action" style="padding:6px; background:#0284c7; font-size:0.8rem; flex:1;">UPI QR</button>
                        </div>
                        <button onclick="window.StaffDashboard.deletePermanentItem('Rx', '${item.id}')" style="background:#ef4444; color:white; border:none; padding:4px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Delete 🗑️</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    addRxRow: function(id) {
        const container = document.getElementById(`rx-breakdown-container-${id}`);
        const row = document.createElement('div');
        row.className = 'dynamic-item-row';
        row.style.marginTop = '4px';
        row.innerHTML = `
            <input type="text" class="rx-med-name-${id}" placeholder="Med Name" style="padding:6px; margin:0; font-size:0.8rem;">
            <input type="number" class="rx-med-mrp-${id}" placeholder="MRP" style="padding:6px; margin:0; font-size:0.8rem; width:80px;">
        `;
        container.appendChild(row);
    },

    loadOnlineOrdersQueue: function() {
        const target = document.getElementById('live-online-orders-queue');
        if (!target) return; target.innerHTML = "";
        const orders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');
        let baseOrders = orders.filter(item => item.isPOS !== true);

        if (baseOrders.length === 0) {
            target.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No online requests.</td></tr>`;
            return;
        }

        baseOrders.forEach((item) => {
            const displayDate = item.formattedDate || new Date(item.timestamp).toLocaleDateString('en-IN');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.id}</b><br>${item.name}<br><small>Ph: ${item.phone}</small><br><span style="background:#fef3c7; padding:2px 6px; border-radius:4px; font-size:0.75rem; display:inline-block; margin-top:4px;">⏰ ${displayDate}</span></td>
                <td><small><b>Note:</b> ${item.meds}</small><br>
                    <button onclick="window.StaffDashboard.viewPrescriptionImage('${item.imgData}')" style="background:#e2e8f0; border:1px solid #cbd5e1; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; margin-top:5px;">👁️ View Pic</button>
                </td>
                <td>
                    <div style="margin-bottom:6px;">
                        <input type="text" id="order-refer-field-${item.id}" placeholder="Refer Doctor / Hospital" style="padding:6px; margin:0; font-size:0.8rem; background:#fffbeb;">
                    </div>
                    <div id="order-breakdown-container-${item.id}">
                        <div class="dynamic-item-row">
                            <input type="text" class="order-med-name-${item.id}" placeholder="Med Name" style="padding:6px; margin:0; font-size:0.8rem;">
                            <input type="number" class="order-med-mrp-${item.id}" placeholder="MRP" style="padding:6px; margin:0; font-size:0.8rem; width:80px;">
                        </div>
                    </div>
                    <button type="button" onclick="window.StaffDashboard.addOrderRow('${item.id}')" style="margin-top:4px; padding:2px 6px; font-size:0.75rem;">+ Add Row</button>
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; gap:4px;">
                            <button onclick="window.StaffDashboard.billingAction('Order', '${item.id}', 'Cash')" class="btn-action btn-success" style="padding:6px; font-size:0.8rem; flex:1;">Cash</button>
                            <button onclick="window.StaffDashboard.billingAction('Order', '${item.id}', 'QR')" class="btn-action" style="padding:6px; background:#0284c7; font-size:0.8rem; flex:1;">UPI QR</button>
                        </div>
                        <button onclick="window.StaffDashboard.deletePermanentItem('Order', '${item.id}')" style="background:#ef4444; color:white; border:none; padding:4px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Delete</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    addOrderRow: function(id) {
        const container = document.getElementById(`order-breakdown-container-${id}`);
        const row = document.createElement('div');
        row.className = 'dynamic-item-row';
        row.style.marginTop = '4px';
        row.innerHTML = `
            <input type="text" class="order-med-name-${id}" placeholder="Med Name" style="padding:6px; margin:0; font-size:0.8rem;">
            <input type="number" class="order-med-mrp-${id}" placeholder="MRP" style="padding:6px; margin:0; font-size:0.8rem; width:80px;">
        `;
        container.appendChild(row);
    },

    billingAction: function(type, itemId, mode) {
        const storageKey = (type === 'Rx') ? 'ndh_longterm_rx' : 'ndh_longterm_orders';
        const dataset = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const activeItem = dataset.find(item => item.id === itemId);

        if(!activeItem) return;

        let phoneValue = activeItem.phone;
        if(type === 'Rx') {
            phoneValue = document.getElementById(`rx-phone-field-${itemId}`).value.trim();
            if(!phoneValue) { alert("Please input active Customer Phone number!"); return; }
        }

        let referDocFieldId = (type === 'Rx') ? `rx-refer-field-${itemId}` : `order-refer-field-${itemId}`;
        let extractedReferValue = document.getElementById(referDocFieldId).value.trim() || "NDH Dynamic Internal Walk-in";

        let itemsBreakdown = [];
        let grandTotal = 0;

        const selectorPrefix = (type === 'Rx') ? `.rx-med-name-${itemId}` : `.order-med-name-${itemId}`;
        const pricePrefix = (type === 'Rx') ? `.rx-med-mrp-${itemId}` : `.order-med-mrp-${itemId}`;

        const itemNames = document.querySelectorAll(selectorPrefix);
        const itemPrices = document.querySelectorAll(pricePrefix);

        itemNames.forEach((el, index) => {
            const name = el.value.trim();
            const mrp = parseFloat(itemPrices[index].value) || 0;
            if(name) {
                itemsBreakdown.push({ name: name, mrp: mrp });
                grandTotal += mrp;
            }
        });

        if(itemsBreakdown.length === 0 || grandTotal <= 0) {
            alert("❌ Operational Error: Enter at least one medicine item along with MRP!");
            return;
        }

        const finalizedTransaction = {
            ...activeItem,
            phone: phoneValue,
            referDoc: extractedReferValue,
            itemsBreakdown: itemsBreakdown,
            finalPrice: grandTotal,
            timestamp: new Date().getTime()
        };

        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        universalLedger.push(finalizedTransaction);
        localStorage.setItem('ndh_universal_ledger', JSON.stringify(universalLedger));

        this.logRevenueTransaction(grandTotal);

        const filteredTemp = dataset.filter(i => i.id !== itemId);
        localStorage.setItem(storageKey, JSON.stringify(filteredTemp));

        if(mode === 'Cash') {
            alert(`💵 Bill Settled permanently! Collected ₹${grandTotal.toFixed(2)}.`);
            this.loadRxQueue();
            this.loadOnlineOrdersQueue();
        } else {
            let itemSummary = itemsBreakdown.map(i => `${i.name}: ₹${i.mrp}`).join('\n');
            this.generateSystemUpiQr(grandTotal, `Settlement: ${activeItem.name}\n${itemSummary}`);
            this.loadRxQueue();
            this.loadOnlineOrdersQueue();
        }
        this.updateCustomerFigures();
    },

    updateCustomerFigures: function() {
        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        const now = new Date();
        const todayStr = now.toDateString();

        let todayCount = 0;
        let lastMonthCount = 0;
        let lastYearCount = 0;

        universalLedger.forEach(item => {
            const txDate = new Date(item.timestamp || Date.now());
            
            // Today check
            if (txDate.toDateString() === todayStr) {
                todayCount++;
            }
            
            // Last Month check
            let lmMonth = now.getMonth() - 1;
            let lmYear = now.getFullYear();
            if(lmMonth < 0) { lmMonth = 11; lmYear--; }
            if(txDate.getMonth() === lmMonth && txDate.getFullYear() === lmYear) {
                lastMonthCount++;
            }

            // Last Year check
            if(txDate.getFullYear() === (now.getFullYear() - 1)) {
                lastYearCount++;
            }
        });

        if(document.getElementById('stats-cust-today')) document.getElementById('stats-cust-today').textContent = todayCount;
        if(document.getElementById('stats-cust-month')) document.getElementById('stats-cust-month').textContent = lastMonthCount;
        if(document.getElementById('stats-cust-year')) document.getElementById('stats-cust-year').textContent = lastYearCount;
    },

    renderHistoryTable: function() {
        const tbody = document.getElementById('analytics-history-tbody');
        if(!tbody) return;
        tbody.innerHTML = "";

        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        const searchVal = document.getElementById('analytics-search-input').value.toLowerCase().trim();

        const filtered = universalLedger.filter(item => {
            const nameMatch = item.name && item.name.toLowerCase().includes(searchVal);
            const phoneMatch = item.phone && item.phone.includes(searchVal);
            return !searchVal || nameMatch || phoneMatch;
        });

        if(filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No customer transaction records found.</td></tr>`;
            return;
        }

        // Display newest records first
        filtered.reverse().forEach((item, globalIndex) => {
            const dateStr = item.formattedDate || new Date(item.timestamp).toLocaleDateString('en-IN');
            
            let itemsText = "";
            if(item.itemsBreakdown && item.itemsBreakdown.length > 0) {
                itemsText = item.itemsBreakdown.map(i => `• ${i.name} (₹${i.mrp})`).join('<br>');
            } else {
                itemsText = `<small style="color:#94a3b8;">Direct Settlement</small>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small>${dateStr}</small><br><b>${item.id || 'POS'}</b></td>
                <td><b>${item.name}</b><br><small>Ph: ${item.phone}</small></td>
                <td><span style="color:#4f46e5; font-weight:600;">${item.referDoc || 'Direct Walk-in'}</span></td>
                <td style="font-size:0.85rem; line-height:1.3;">${itemsText}</td>
                <td style="font-weight:bold; color:var(--success);">₹${parseFloat(item.finalPrice || 0).toFixed(2)}</td>
                <td>
                    <button onclick="window.StaffDashboard.deleteHistoryRecord(${item.timestamp})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Wipe 🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    deleteHistoryRecord: function(timestampIdentifier) {
        if(confirm("Are you sure you want to permanently delete this customer record from history? This action cannot be undone.")) {
            let universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
            universalLedger = universalLedger.filter(item => item.timestamp !== timestampIdentifier);
            localStorage.setItem('ndh_universal_ledger', JSON.stringify(universalLedger));
            
            this.updateCustomerFigures();
            this.renderHistoryTable();
            this.calculateRevenueLedger();
        }
    },

    generateSystemUpiQr: function(amount, memo) {
        const merchantUpi = "hussain.abidur@ybl";
        const cleanMemo = memo.split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, "");
        const rawString = `upi://pay?pa=${merchantUpi}&pn=NamtiDrugHouse&am=${amount}&cu=INR&tn=${encodeURIComponent(cleanMemo)}`;
        const finalQrEndpoint = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(rawString)}`;

        document.getElementById('qr-modal-details').textContent = `${memo}\n\nGrand Total Due: ₹${amount.toFixed(2)}`;
        document.getElementById('qr-image-container').innerHTML = `<img src="${finalQrEndpoint}" alt="UPI QR" style="display:block; margin:0 auto; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.15);">`;
        document.getElementById('qr-modal-overlay').style.display = 'flex';
    },

    closeQrModal: function() {
        document.getElementById('qr-modal-overlay').style.display = 'none';
    },

    viewPrescriptionImage: function(blobString) {
        if(!blobString) { alert("No attachment."); return; }
        document.getElementById('modal-rx-img-render').src = blobString;
        document.getElementById('prescription-photo-modal').style.display = 'flex';
    },

    logRevenueTransaction: function(amount) {
        const ledger = JSON.parse(localStorage.getItem('ndh_revenue_ledger') || '[]');
        ledger.push({ amount: amount, dateString: new Date().toDateString(), timestamp: Date.now() });
        localStorage.setItem('ndh_revenue_ledger', JSON.stringify(ledger));
        this.calculateRevenueLedger();
    },

    calculateRevenueLedger: function() {
        const ledger = JSON.parse(localStorage.getItem('ndh_revenue_ledger') || '[]');
        const todayStr = new Date().toDateString();
        const now = new Date();
        
        let todaySum = 0, lastMonthSum = 0, grandTotal = 0;

        ledger.forEach(tx => {
            grandTotal += tx.amount;
            if (tx.dateString === todayStr) todaySum += tx.amount;
            
            const txDate = new Date(tx.timestamp);
            let targetMonth = now.getMonth() - 1;
            let targetYear = now.getFullYear();
            if (targetMonth < 0) { targetMonth = 11; targetYear--; }
            if (txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear) {
                lastMonthSum += tx.amount;
            }
        });

        if(document.getElementById('rev-today')) document.getElementById('rev-today').textContent = `₹ ${todaySum.toFixed(2)}`;
        if(document.getElementById('rev-month')) document.getElementById('rev-month').textContent = `₹ ${lastMonthSum.toFixed(2)}`;
        if(document.getElementById('rev-total')) document.getElementById('rev-total').textContent = `₹ ${grandTotal.toFixed(2)}`;
    },

    clearRevenueMetrics: function() {
        if(confirm("Wipe all active analytics ledger memory?")) {
            localStorage.setItem('ndh_revenue_ledger', '[]');
            this.calculateRevenueLedger();
        }
    },

    deletePermanentItem: function(type, itemId) {
        if (confirm("Delete this queue record?")) {
            const storageKey = (type === 'Rx') ? 'ndh_longterm_rx' : 'ndh_longterm_orders';
            let dataset = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify(dataset.filter(item => item.id !== itemId)));
            this.loadRxQueue();
            this.loadOnlineOrdersQueue();
        }
    }
};

// ========================================================
// 6. AUTOMATED MONTHLY CRM PROMOTIONAL SMS ENGINE
// ========================================================
window.PromotionalSMS = {
    checkAndTriggerSMS: function() {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonthYear = now.getMonth() + "-" + now.getFullYear();
        
        // Strictly trigger only on 3rd of the month
        if (currentDay !== 3) {
            return;
        }

        // Check if already dispatched for this specific month cycle
        if (localStorage.getItem('ndh_sms_last_dispatched_m') === currentMonthYear) {
            console.log("Promotional campaign already successfully executed for this month cycle.");
            return;
        }

        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        if (universalLedger.length === 0) return;

        // Collect unique active numbers
        const uniqueContacts = {};
        universalLedger.forEach(entry => {
            if(entry.phone && entry.phone !== "0000000000") {
                uniqueContacts[entry.phone] = entry.name || "Valued Customer";
            }
        });

        const contactNumbers = Object.keys(uniqueContacts);
        if(contactNumbers.length === 0) return;

        console.log(`============= DYNAMIC CRM SMS DISPATCH LOGS (${now.toLocaleDateString()}) ======
