// ========================================================
// 1. ENGINE INITIALIZATION & GLOBAL STATE MATRIX
// ========================================================
window.ViewManager = {
    navigate: function(viewId) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active-view');
        localStorage.setItem('ndh_last_active_view', viewId);
        
        if (viewId === 'staff-view') {
            window.StaffDashboard.loadRxQueue();
            window.StaffDashboard.loadOnlineOrdersQueue();
            window.StaffDashboard.calculateRevenueLedger();
            window.StaffDashboard.updateCustomerFigures();
            window.StaffDashboard.renderHistoryTable();
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

// Global Event Initialization Loop
document.addEventListener('DOMContentLoaded', () => {
    const savedState = localStorage.getItem('ndh_last_active_view') || 'home-view';
    window.ViewManager.navigate(savedState);
    if(window.PromotionalSMS) window.PromotionalSMS.checkAndTriggerSMS();

    const orderForm = document.getElementById('online-order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const pin = document.getElementById('cust-pin').value.trim();
            const bill = parseFloat(document.getElementById('cust-bill').value) || 0;
            const photoFile = document.getElementById('cust-rx-photo').files[0];

            if (pin !== "785684") {
                alert("❌ Order Rejected: Delivery localized only within PIN code 785684!");
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
                    meds: document.getElementById('cust-meds').value.trim() || 'Refer to image',
                    imgData: base64Img,
                    timestamp: currentStamp.getTime(),
                    formattedDate: currentStamp.toLocaleDateString('en-IN') + ' ' + currentStamp.toLocaleTimeString('en-IN')
                };

                const existingOrders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');
                existingOrders.push(newOrder);
                localStorage.setItem('ndh_longterm_orders', JSON.stringify(existingOrders));

                alert(bill >= 1599 ? "⚠️ Advance Payment verification mandatory before dispatch!" : "🎉 Order Submitted successfully!");
                orderForm.reset();
                window.ViewManager.navigate('home-view');
            };
            if (photoFile) reader.readAsDataURL(photoFile);
        });
    }
});

// ========================================================
// 2. DOCTOR DESK SUBMISSION
// ========================================================
window.DoctorDesk = {
    submitPrescription: function() {
        const name = document.getElementById('doc-patient-name').value.trim();
        const age = document.getElementById('doc-patient-age').value.trim();
        const sex = document.getElementById('doc-patient-sex').value;
        const rx = document.getElementById('doc-rx-content').value.trim();
        const referDoc = document.getElementById('doc-refer-details').value.trim();

        if (!name || !age || !sex || !rx) {
            alert("Please fill out all mandatory fields (*).");
            return;
        }

        const currentStamp = new Date();

        const newRxRecord = {
            id: 'RX-' + Math.floor(1000 + Math.random() * 9000),
            name: name,
            age: age,
            sex: sex,
            referDoc: referDoc || "Internal Consultation Desk",
            symptoms: document.getElementById('doc-symptoms').value.trim() || 'N/A',
            tests: document.getElementById('doc-tests').value.trim() || 'None',
            rx: rx,
            timestamp: currentStamp.getTime(),
            formattedDate: currentStamp.toLocaleDateString('en-IN') + ' ' + currentStamp.toLocaleTimeString('en-IN')
        };

        const existingRx = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
        existingRx.push(newRxRecord);
        localStorage.setItem('ndh_longterm_rx', JSON.stringify(existingRx));

        alert("📤 Medical Prescription dispatched safely to Counter Queue!");
        document.getElementById('doctor-rx-form').reset();
        window.ViewManager.navigate('home-view');
    }
};

// ========================================================
// 3. DUAL SEPARATE PRINT ENGINE: INVOICE VS stand-alone Rx
// ========================================================
window.HomeReceiptEngine = {
    searchAndPrint: function(printMode) {
        const searchName = document.getElementById('dl-cust-name').value.toLowerCase().trim();
        const searchPhone = document.getElementById('dl-cust-phone').value.trim();
        const searchDateInput = document.getElementById('dl-visit-date').value;

        if(!searchName || !searchPhone || !searchDateInput) {
            alert("Please fill out Name, Phone, and Visit Date fields to isolate documentation!");
            return;
        }

        const targetDate = new Date(searchDateInput);
        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');
        
        let matchingTransaction = universalLedger.find(item => {
            const txD = new Date(item.timestamp);
            return txD.toDateString() === targetDate.toDateString() &&
                   item.name.toLowerCase().includes(searchName) &&
                   item.phone.includes(searchPhone);
        });

        let matchingRx = rxData.find(item => {
            const txD = new Date(item.timestamp);
            return txD.toDateString() === targetDate.toDateString() &&
                   item.name.toLowerCase().includes(searchName);
        });

        if (!matchingTransaction && matchingRx) {
            matchingTransaction = {
                id: matchingRx.id, name: matchingRx.name, phone: searchPhone,
                referDoc: matchingRx.referDoc, itemsBreakdown: [], finalPrice: 0,
                timestamp: matchingRx.timestamp, formattedDate: matchingRx.formattedDate
            };
        }

        if (printMode === 'prescription') {
            const rxToPrint = matchingRx || (matchingTransaction && matchingTransaction.rx ? matchingTransaction : null);
            if (!rxToPrint) { alert("❌ Clinical Prescription record not found for these parameters!"); return; }
            this.executePrintPrescription(rxToPrint);
        } else {
            if (!matchingTransaction || (matchingTransaction.finalPrice === 0 && matchingTransaction.itemsBreakdown.length === 0)) {
                alert("❌ Financial Billing data not settled yet for this parameters!"); return; 
            }
            this.executePrintReceipt(matchingTransaction);
        }
    },

    executePrintPrescription: function(rx) {
        const iframe = this.getCleanIframe();
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial; padding: 25px; color: #334155; line-height: 1.5; }
                    .letterhead { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
                    .letterhead h2 { margin: 0; color: #0f172a; letter-spacing: 1px; }
                    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 6px; }
                    .rx-symbol { font-size: 28px; font-weight: bold; color: #8b5cf6; margin: 15px 0 5px 0; }
                    .content-box { white-space: pre-line; min-height: 150px; font-size: 16px; border-left: 4px solid #8b5cf6; padding-left: 15px; margin-bottom: 20px; }
                    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 50px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="letterhead">
                    <h2>NAMTI DRUG HOUSE (CLINICAL DESK)</h2>
                    <p>Sivasagar, Assam | Healthcare Support Point</p>
                </div>
                <div class="meta-grid">
                    <div><b>Patient Name:</b> ${rx.name} ${rx.age ? `(${rx.age} Yrs / ${rx.sex})` : ''}</div>
                    <div><b>Date:</b> ${rx.formattedDate || new Date(rx.timestamp).toLocaleDateString('en-IN')}</div>
                    <div><b>Referrer/Consultant:</b> ${rx.referDoc || 'Internal Staff'}</div>
                    <div><b>Document ID:</b> ${rx.id}</div>
                </div>
                ${rx.symptoms && rx.symptoms !== 'N/A' ? `<p><b>Chief Symptoms:</b> ${rx.symptoms}</p>` : ''}
                ${rx.tests && rx.tests !== 'None' ? `<p><b>Diagnostic Advice:</b> ${rx.tests}</p>` : ''}
                <div class="rx-symbol">℞</div>
                <div class="content-box">${rx.rx || 'No medication logs configured.'}</div>
                <div class="footer">This document represents a pure medical consultation chart record. Contains zero financial billing figures.</div>
            </body>
            </html>
        `);
        doc.close();
        this.triggerPrint(iframe);
    },

    executePrintReceipt: function(tx) {
        const iframe = this.getCleanIframe();
        const doc = iframe.contentWindow.document;
        doc.open();

        let tableRows = "";
        let calculatedBase = 0;
        let calculatedCgst = 0;
        let calculatedSgst = 0;

        tx.itemsBreakdown.forEach((item, index) => {
            const totalMrp = parseFloat(item.mrp || 0);
            const basePrice = totalMrp / 1.12;
            const taxComponent = totalMrp - basePrice;
            const halfTax = taxComponent / 2;

            calculatedBase += basePrice;
            calculatedCgst += halfTax;
            calculatedSgst += halfTax;

            tableRows += `<tr>
                <td>${index+1}. ${item.name}</td>
                <td>₹${basePrice.toFixed(2)}</td>
                <td>6%</td>
                <td>6%</td>
                <td style="text-align:right; font-weight:600;">₹${totalMrp.toFixed(2)}</td>
            </tr>`;
        });

        doc.write(`
            <html>
            <head>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 15px; font-size: 13px; line-height: 1.4; color: #000; }
                    .text-center { text-align: center; }
                    .dashed-line { border-top: 1px dashed #000; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { padding: 4px; text-align: left; }
                    th { border-bottom: 1px dashed #000; }
                    .totals-box { text-align: right; font-size: 13px; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="text-center">
                    <h3>NAMTI DRUG HOUSE</h3>
                    <p>Sivasagar, Assam<br>TAX INVOICE / CASH MEMO</p>
                </div>
                <div class="dashed-line"></div>
                <div><b>Bill No  :</b> ${tx.id}</div>
                <div><b>Customer :</b> ${tx.name} (${tx.phone})</div>
                <div><b>Date     :</b> ${tx.formattedDate || new Date(tx.timestamp).toLocaleDateString('en-IN')}</div>
                <div><b>Referrer :</b> ${tx.referDoc}</div>
                <div class="dashed-line"></div>
                <table>
                    <thead>
                        <tr>
                            <th>Item Desc</th>
                            <th>Base Vol</th>
                            <th>CGST</th>
                            <th>SGST</th>
                            <th style="text-align:right;">Total (MRP)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <div class="dashed-line"></div>
                <div class="totals-box">
                    Total Taxable Base: ₹${calculatedBase.toFixed(2)}<br>
                    Integrated CGST: ₹${calculatedCgst.toFixed(2)}<br>
                    Integrated SGST: ₹${calculatedSgst.toFixed(2)}<br>
                    <span style="font-size:15px; font-weight:bold;">GRAND PAYABLE (INCL. GST): ₹${parseFloat(tx.finalPrice).toFixed(2)}</span>
                </div>
                <div class="dashed-line"></div>
                <p class="text-center" style="font-size:11px;">Thank You! This is a dedicated itemized tax document. No health data embedded.</p>
            </body>
            </html>
        `);
        doc.close();
        this.triggerPrint(iframe);
    },

    getCleanIframe: function() {
        const old = document.getElementById('ndh-print-frame');
        if (old) old.remove();
        const iframe = document.createElement('iframe');
        iframe.id = 'ndh-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.opacity = '0.01';
        document.body.appendChild(iframe);
        return iframe;
    },

    triggerPrint: function(iframe) {
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 600);
    }
};

// ========================================================
// 4. STAFF DASHBOARD & REAL-TIME GST CALCULATIONS
// ========================================================
window.StaffDashboard = {
    switchTab: function(tabName) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-content'));
        document.getElementById(`tab-${tabName}-btn`).classList.add('active-tab');
        document.getElementById(`tab-${tabName}-content`).classList.add('active-content');
        if(tabName === 'analytics') { this.updateCustomerFigures(); this.renderHistoryTable(); }
    },

    addPosRow: function() {
        const container = document.getElementById('pos-items-container');
        const row = document.createElement('div');
        row.className = 'dynamic-item-row';
        row.innerHTML = `
            <input type="text" class="pos-med-name" placeholder="Medicine Name" style="margin:0;">
            <input type="number" class="pos-med-mrp" placeholder="MRP Price Incl. Tax (₹)" style="margin:0;" oninput="window.StaffDashboard.syncPosTotal()">
        `;
        container.appendChild(row);
    },

    syncPosTotal: function() {
        let grandTotal = 0;
        document.querySelectorAll('.pos-med-mrp').forEach(input => {
            grandTotal += parseFloat(input.value) || 0;
        });
        
        const baseAmount = grandTotal / 1.12;
        const totalTax = grandTotal - baseAmount;
        const cgstSgst = totalTax / 2;

        document.getElementById('pos-calculated-base').textContent = baseAmount.toFixed(2);
        document.getElementById('pos-calculated-cgst').textContent = cgstSgst.toFixed(2);
        document.getElementById('pos-calculated-sgst').textContent = cgstSgst.toFixed(2);
        document.getElementById('pos-calculated-total').textContent = grandTotal.toFixed(2);
    },

    processOfflinePOS: function(mode) {
        let customer = document.getElementById('pos-cust-name').value.trim() || "Walk-In Customer";
        let phone = document.getElementById('pos-cust-phone').value.trim() || "0000000000";
        let referDoc = document.getElementById('pos-refer-doc').value.trim() || "Direct Counter Self";
        
        let itemsBreakdown = [];
        let grandTotal = 0;

        const names = document.querySelectorAll('.pos-med-name');
        const mrps = document.querySelectorAll('.pos-med-mrp');

        names.forEach((el, index) => {
            const mName = el.value.trim();
            const mMrp = parseFloat(mrps[index].value) || 0;
            if(mName && mMrp > 0) {
                itemsBreakdown.push({ name: mName, mrp: mMrp });
                grandTotal += mMrp;
            }
        });

        if (itemsBreakdown.length === 0) { alert("Add at least one medicine with valid numeric value!"); return; }

        const currentStamp = new Date();
        const finalizedTx = {
            id: 'POS-' + Math.floor(1000 + Math.random() * 9000),
            name: customer, phone: phone, referDoc: referDoc,
            itemsBreakdown: itemsBreakdown, finalPrice: grandTotal,
            timestamp: currentStamp.getTime(),
            formattedDate: currentStamp.toLocaleDateString('en-IN') + ' ' + currentStamp.toLocaleTimeString('en-IN')
        };

        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        universalLedger.push(finalizedTx);
        localStorage.setItem('ndh_universal_ledger', JSON.stringify(universalLedger));

        this.logRevenueTransaction(grandTotal);
        
        if (mode === 'Cash') {
            alert(`💵 Bill Settled via Cash (GST Applied)! Amount: ₹${grandTotal.toFixed(2)}.`);
        } else {
            this.generateSystemUpiQr(grandTotal, `Invoice ${finalizedTx.id} - Total Due`);
        }

        document.getElementById('pos-cust-name').value = "";
        document.getElementById('pos-cust-phone').value = "";
        document.getElementById('pos-refer-doc').value = "";
        document.getElementById('pos-items-container').innerHTML = `
            <div class="dynamic-item-row">
                <input type="text" class="pos-med-name" placeholder="Medicine Name" style="margin:0;">
                <input type="number" class="pos-med-mrp" placeholder="MRP Price Incl. Tax (₹)" style="margin:0;" oninput="window.StaffDashboard.syncPosTotal()">
            </div>
        `;
        this.syncPosTotal();
        this.updateCustomerFigures();
    },

    loadRxQueue: function() {
        const target = document.getElementById('live-rx-queue');
        if (!target) return; target.innerHTML = "";
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx') || '[]');

        if (rxData.length === 0) {
            target.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No medical prescriptions waiting.</td></tr>`;
            return;
        }

        rxData.forEach((item) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.id}</b><br>${item.name} (${item.age}y / ${item.sex})<br><small>${item.formattedDate}</small></td>
                <td><div style="font-size:0.85rem; font-family:monospace; background:#faf5ff; padding:8px; border-radius:4px; border-left:3px solid var(--doctor-color);">${item.rx}</div></td>
                <td>
                    <input type="text" id="rx-refer-field-${item.id}" value="${item.referDoc || ''}" placeholder="Referral Location" style="padding:6px; margin:0 0 5px 0; font-size:0.8rem;">
                    <div id="rx-breakdown-container-${item.id}">
                        <div class="dynamic-item-row">
                            <input type="text" class="rx-med-name-${item.id}" placeholder="Medicine Name" style="padding:6px; margin:0; font-size:0.8rem;">
                            <input type="number" class="rx-med-mrp-${item.id}" placeholder="MRP Tax Incl." style="padding:6px; margin:0; font-size:0.8rem; width:100px;">
                        </div>
                    </div>
                    <button type="button" onclick="window.StaffDashboard.addRxRow('${item.id}')" style="margin-top:4px; padding:2px 6px; font-size:0.75rem;">+ Add Row</button>
                </td>
                <td>
                    <input type="text" id="rx-phone-field-${item.id}" placeholder="Cust Phone *" style="padding:6px; margin:0 5px 5px 0; font-size:0.8rem;" required>
                    <div style="display:flex; gap:4px;">
                        <button onclick="window.StaffDashboard.billingAction('Rx', '${item.id}', 'Cash')" class="btn-action btn-success" style="padding:6px; font-size:0.8rem; flex:1;">Cash</button>
                        <button onclick="window.StaffDashboard.billingAction('Rx', '${item.id}', 'QR')" class="btn-action" style="padding:6px; background:#0284c7; font-size:0.8rem; flex:1;">UPI</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    addRxRow: function(id) {
        const container = document.getElementById(`rx-breakdown-container-${id}`);
        const row = document.createElement('div');
        row.className = 'dynamic-item-row'; row.style.marginTop = '4px';
        row.innerHTML = `
            <input type="text" class="rx-med-name-${id}" placeholder="Medicine Name" style="padding:6px; margin:0; font-size:0.8rem;">
            <input type="number" class="rx-med-mrp-${id}" placeholder="MRP Tax Incl." style="padding:6px; margin:0; font-size:0.8rem; width:100px;">
        `;
        container.appendChild(row);
    },

    loadOnlineOrdersQueue: function() {
        const target = document.getElementById('live-online-orders-queue');
        if (!target) return; target.innerHTML = "";
        const orders = JSON.parse(localStorage.getItem('ndh_longterm_orders') || '[]');

        if(orders.length === 0) {
            target.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No incoming remote orders.</td></tr>`;
            return;
        }

        orders.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.id}</b><br>${item.name}<br><small>${item.phone}</small></td>
                <td><small>${item.meds}</small><br><button onclick="window.StaffDashboard.viewPrescriptionImage('${item.imgData}')" style="font-size:0.75rem; padding:2px 6px; cursor:pointer; margin-top:4px;">View Doc Image</button></td>
                <td>
                    <input type="text" id="order-refer-field-${item.id}" placeholder="Referral Hub" style="padding:6px; margin:0 0 5px 0; font-size:0.8rem;">
                    <div id="order-breakdown-container-${item.id}">
                        <div class="dynamic-item-row">
                            <input type="text" class="order-med-name-${item.id}" placeholder="Medicine Name" style="padding:6px; margin:0; font-size:0.8rem;">
                            <input type="number" class="order-med-mrp-${item.id}" placeholder="MRP Tax Incl." style="padding:6px; margin:0; font-size:0.8rem; width:100px;">
                        </div>
                    </div>
                    <button type="button" onclick="window.StaffDashboard.addOrderRow('${item.id}')" style="margin-top:4px; padding:2px 6px; font-size:0.75rem;">+ Add Row</button>
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button onclick="window.StaffDashboard.billingAction('Order', '${item.id}', 'Cash')" class="btn-action btn-success" style="padding:6px; font-size:0.8rem; flex:1;">Cash</button>
                        <button onclick="window.StaffDashboard.billingAction('Order', '${item.id}', 'QR')" class="btn-action" style="padding:6px; background:#0284c7; font-size:0.8rem; flex:1;">UPI</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    addOrderRow: function(id) {
        const container = document.getElementById(`order-breakdown-container-${id}`);
        const row = document.createElement('div');
        row.className = 'dynamic-item-row'; row.style.marginTop = '4px';
        row.innerHTML = `
            <input type="text" class="order-med-name-${id}" placeholder="Medicine Name" style="padding:6px; margin:0; font-size:0.8rem;">
            <input type="number" class="order-med-mrp-${id}" placeholder="MRP Tax Incl." style="padding:6px; margin:0; font-size:0.8rem; width:100px;">
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
            if(!phoneValue) { alert("Enter active Phone Number!"); return; }
        }

        let refField = (type === 'Rx') ? `rx-refer-field-${itemId}` : `order-refer-field-${itemId}`;
        let referVal = document.getElementById(refField).value.trim() || "Walk-In Counter Redirect";

        let itemsBreakdown = [];
        let grandTotal = 0;

        const nameSel = (type === 'Rx') ? `.rx-med-name-${itemId}` : `.order-med-name-${itemId}`;
        const priceSel = (type === 'Rx') ? `.rx-med-mrp-${itemId}` : `.order-med-mrp-${itemId}`;

        const nEls = document.querySelectorAll(nameSel);
        const pEls = document.querySelectorAll(priceSel);

        nEls.forEach((el, idx) => {
            const mN = el.value.trim();
            const mP = parseFloat(pEls[idx].value) || 0;
            if(mN && mP > 0) {
                itemsBreakdown.push({ name: mN, mrp: mP });
                grandTotal += mP;
            }
        });

        if(itemsBreakdown.length === 0) { alert("Configure items break down matrix first!"); return; }

        const finalizedTx = {
            ...activeItem,
            phone: phoneValue,
            referDoc: referVal,
            itemsBreakdown: itemsBreakdown,
            finalPrice: grandTotal,
            timestamp: new Date().getTime()
        };

        const universalLedger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        universalLedger.push(finalizedTx);
        localStorage.setItem('ndh_universal_ledger', JSON.stringify(universalLedger));

        this.logRevenueTransaction(grandTotal);

        if (type !== 'Rx') {
            localStorage.setItem(storageKey, JSON.stringify(dataset.filter(i => i.id !== itemId)));
        }

        if(mode === 'Cash') {
            alert(`💵 Invoice Settled! GST Applied.`);
        } else {
            this.generateSystemUpiQr(grandTotal, `Settled Queue Item ${itemId}`);
        }

        this.loadRxQueue();
        this.loadOnlineOrdersQueue();
        this.updateCustomerFigures();
    },

    updateCustomerFigures: function() {
        const ledger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        const now = new Date();
        let t = 0, m = 0, y = 0;

        ledger.forEach(item => {
            const d = new Date(item.timestamp);
            if(d.toDateString() === now.toDateString()) t++;
            
            let lmMonth = now.getMonth() - 1; let lmYear = now.getFullYear();
            if(lmMonth < 0) { lmMonth = 11; lmYear--; }
            if(d.getMonth() === lmMonth && d.getFullYear() === lmYear) m++;
            
            if(d.getFullYear() === (now.getFullYear() - 1)) y++;
        });

        if(document.getElementById('stats-cust-today')) document.getElementById('stats-cust-today').textContent = t;
        if(document.getElementById('stats-cust-month')) document.getElementById('stats-cust-month').textContent = m;
        if(document.getElementById('stats-cust-year')) document.getElementById('stats-cust-year').textContent = y;
    },

    renderHistoryTable: function() {
        const tbody = document.getElementById('analytics-history-tbody');
        if(!tbody) return; tbody.innerHTML = "";

        const ledger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        const sVal = document.getElementById('analytics-search-input').value.toLowerCase().trim();

        const filtered = ledger.filter(i => !sVal || i.name.toLowerCase().includes(sVal) || i.phone.includes(sVal));

        if(filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No settled ledger records found.</td></tr>`;
            return;
        }

        filtered.reverse().forEach(item => {
            let rowMeds = "";
            (item.itemsBreakdown || []).forEach(med => {
                const total = parseFloat(med.mrp || 0);
                const base = total / 1.12;
                const tax = total - base;
                rowMeds += `• ${med.name} (Base: ₹${base.toFixed(2)} + GST: ₹${tax.toFixed(2)})<br>`;
            });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small>${item.formattedDate || new Date(item.timestamp).toLocaleDateString('en-IN')}</small><br><b>${item.id}</b></td>
                <td><b>${item.name}</b><br><small>Ph: ${item.phone}</small></td>
                <td><span style="color:var(--purple); font-weight:600;">${item.referDoc}</span></td>
                <td style="font-size:0.8rem; line-height:1.4;">${rowMeds || 'Direct POS'}</td>
                <td style="font-weight:bold; color:var(--success);">₹${parseFloat(item.finalPrice || 0).toFixed(2)}</td>
                <td><button onclick="window.StaffDashboard.deleteHistoryRecord(${item.timestamp})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem;">Wipe</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    deleteHistoryRecord: function(ts) {
        if(confirm("Permanently delete this customer transaction history?")) {
            let ledger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
            localStorage.setItem('ndh_universal_ledger', JSON.stringify(ledger.filter(i => i.timestamp !== ts)));
            this.updateCustomerFigures(); this.renderHistoryTable(); this.calculateRevenueLedger();
        }
    },

    generateSystemUpiQr: function(amt, memo) {
        const mUpi = "hussain.abidur@ybl";
        const cleanMemo = memo.replace(/[^a-zA-Z0-9 ]/g, "");
        const raw = `upi://pay?pa=${mUpi}&pn=NamtiDrugHouse&am=${amt}&cu=INR&tn=${encodeURIComponent(cleanMemo)}`;
        document.getElementById('qr-modal-details').textContent = `${memo}\n\nPayable Amount (GST Incl.): ₹${amt.toFixed(2)}`;
        document.getElementById('qr-image-container').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(raw)}" style="display:block; margin:0 auto; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.15);">`;
        document.getElementById('qr-modal-overlay').style.display = 'flex';
    },

    closeQrModal: function() { document.getElementById('qr-modal-overlay').style.display = 'none'; },
    viewPrescriptionImage: function(blob) {
        if(!blob) return; document.getElementById('modal-rx-img-render').src = blob;
        document.getElementById('prescription-photo-modal').style.display = 'flex';
    },

    logRevenueTransaction: function(amt) {
        const ledger = JSON.parse(localStorage.getItem('ndh_revenue_ledger') || '[]');
        ledger.push({ amount: amt, dateString: new Date().toDateString(), timestamp: Date.now() });
        localStorage.setItem('ndh_revenue_ledger', JSON.stringify(ledger));
        this.calculateRevenueLedger();
    },

    calculateRevenueLedger: function() {
        const ledger = JSON.parse(localStorage.getItem('ndh_revenue_ledger') || '[]');
        const todayStr = new Date().toDateString(); const now = new Date();
        let tSum = 0, mSum = 0, total = 0;

        ledger.forEach(tx => {
            total += tx.amount; if(tx.dateString === todayStr) tSum += tx.amount;
            const d = new Date(tx.timestamp);
            let targetM = now.getMonth() - 1; let targetY = now.getFullYear();
            if(targetM < 0) { targetM = 11; targetY--; }
            if(d.getMonth() === targetM && d.getFullYear() === targetY) mSum += tx.amount;
        });

        if(document.getElementById('rev-today')) document.getElementById('rev-today').textContent = `₹ ${tSum.toFixed(2)}`;
        if(document.getElementById('rev-month')) document.getElementById('rev-month').textContent = `₹ ${mSum.toFixed(2)}`;
        if(document.getElementById('rev-total')) document.getElementById('rev-total').textContent = `₹ ${total.toFixed(2)}`;
    },

    clearRevenueMetrics: function() {
        if(confirm("Wipe all sales stats data memory?")) {
            localStorage.setItem('ndh_revenue_ledger', '[]'); this.calculateRevenueLedger();
        }
    }
};

// ========================================================
// 5. CRM AUTOMATED SMS PROTOCOL
// ========================================================
window.PromotionalSMS = {
    checkAndTriggerSMS: function() {
        const now = new Date();
        if(now.getDate() !== 3) return;

        const currentMYear = now.getMonth() + "-" + now.getFullYear();
        if(localStorage.getItem('ndh_sms_last_dispatched_m') === currentMYear) return;

        const ledger = JSON.parse(localStorage.getItem('ndh_universal_ledger') || '[]');
        const uniqueContacts = {};
        ledger.forEach(e => { if(e.phone && e.phone !== "0000000000") uniqueContacts[e.phone] = e.name || "Customer"; });

        const numbers = Object.keys(uniqueContacts);
        if(numbers.length === 0) return;

        numbers.forEach(phone => {
            const smsText = `Hello ${uniqueContacts[phone]}, Thank you for choosing Namti Drug House! flat 10% discount on your next tax invoice!`;
            console.log(`[SMS Broadcast] Sent to: ${phone} | Content: ${smsText}`);
        });

        const bar = document.getElementById('sms-notification-bar');
        if(bar) {
            bar.textContent = `📢 Monthly CRM Promo Campaign Dispatched to ${numbers.length} contacts!`;
            bar.style.display = 'block'; setTimeout(() => { bar.style.display = 'none'; }, 8000);
        }
        localStorage.setItem('ndh_sms_last_dispatched_m', currentMYear);
    }
};
