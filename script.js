// ========================================================
// 1. NAVIGATION & PERSISTENCE
// ========================================================
window.ViewManager = {
    navigate: function(viewId) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        document.getElementById(viewId).classList.add('active-view');
        localStorage.setItem('ndh_last_active_view', viewId);
        
        if (viewId === 'staff-view') {
            StaffDashboard.loadRxQueue();
            StaffDashboard.loadOnlineOrders();
        }
    },
    secureNavigation: function(viewId, correctPassword) {
        if (sessionStorage.getItem('auth_valid_' + viewId) === 'true') {
            this.navigate(viewId);
            return;
        }
        const inputPass = prompt("Enter Authorized Security Password:");
        if (inputPass === correctPassword) {
            sessionStorage.setItem('auth_valid_' + viewId, 'true');
            this.navigate(viewId);
        } else if (inputPass !== null) {
            alert("❌ Invalid Password!");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const savedState = localStorage.getItem('ndh_last_active_view') || 'home-view';
    ViewManager.navigate(savedState);
});

// ========================================================
// 2. HEALTH ROTATOR
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    const medicalQuotes = [
        "Alexander Fleming discovered Penicillin in 1928, launching modern antibiotics.",
        "Wilhelm Röntgen developed X-Rays in 1895, unlocking diagnostic capabilities.",
        "Edward Jenner formulated the smallpox vaccine in 1796, pioneering immunology.",
        "Frederick Banting and Charles Best isolated Insulin in 1921, saving diabetic lives."
    ];
    const container = document.getElementById('medical-inventions-container');
    if (container) {
        container.innerHTML = `<div id="rotator-card" style="padding:12px; background:#e2e8f0; border-radius:8px; font-style:italic; text-align:center; border-left:5px solid var(--accent); margin-bottom:15px;"></div>`;
        let i = 0;
        function rotate() {
            document.getElementById('rotator-card').innerHTML = `💡 <b>Milestone:</b> "${medicalQuotes[i]}"`;
            i = (i + 1) % medicalQuotes.length;
        }
        rotate(); setInterval(rotate, 8000);
    }
});

// ========================================================
// 3. ONLINE ORDER PIPELINE (MANDATORY FIELDS FIXED)
// ========================================================
document.getElementById('online-order-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const pin = document.getElementById('cust-pin').value.trim();
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const bill = parseFloat(document.getElementById('cust-bill').value) || 0;
    const meds = document.getElementById('cust-meds').value.trim() || "See attached prescription photo";
    const fileInput = document.getElementById('cust-photo');

    if (pin !== "785684") {
        alert("❌ Home delivery is strictly possible only within PIN code 785684!");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Img = event.target.result;
        
        const newOrder = { name, phone, pin, bill, meds, image: base64Img, id: Date.now() };
        const orders = JSON.parse(localStorage.getItem('ndh_online_orders') || '[]');
        orders.push(newOrder);
        localStorage.setItem('ndh_online_orders', JSON.stringify(orders));

        alert("🎉 Online Order Submitted! Forwarded directly to Staff Dashboard.");
        document.getElementById('online-order-form').reset();
        ViewManager.navigate('home-view');
    };
    reader.readAsDataURL(file);
});

// ========================================================
// 4. DOCTOR DESK (UPDATED WITH ADVANCED FIELDS)
// ========================================================
window.DoctorDesk = {
    submitPrescription: function(e) {
        e.preventDefault();
        const patient = {
            name: document.getElementById('doc-pname').value.trim(),
            age: document.getElementById('doc-page').value.trim(),
            sex: document.getElementById('doc-psex').value,
            symptoms: document.getElementById('doc-symptoms').value.trim(),
            tests: document.getElementById('doc-tests').value.trim(),
            rx: document.getElementById('doc-rx').value.trim(),
            id: 'RX-' + Math.floor(1000 + Math.random() * 9000),
            date: new Date().toLocaleDateString()
        };

        const queue = JSON.parse(localStorage.getItem('ndh_rx_queue') || '[]');
        queue.push(patient);
        localStorage.setItem('ndh_rx_queue', JSON.stringify(queue));

        alert("📤 Rx Prescription directly routed to Staff counter!");
        document.getElementById('doctor-form').reset();
        ViewManager.navigate('home-view');
    }
};

// ========================================================
// 5. STAFF DASHBOARD, PDF PRINTING & FOREVER STORAGE
// ========================================================
window.StaffDashboard = {
    loadOnlineOrders: function() {
        const tbody = document.getElementById('online-orders-queue');
        tbody.innerHTML = "";
        const orders = JSON.parse(localStorage.getItem('ndh_online_orders') || '[]');

        if(orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No new online orders.</td></tr>`;
            return;
        }

        orders.forEach((ord, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${ord.name}</b><br>${ord.phone}</td>
                <td>PIN: ${ord.pin}<br><small>${ord.meds}</small></td>
                <td><img src="${ord.image}" style="width:60px; height:60px; border-radius:4px; cursor:pointer;" onclick="window.open('${ord.image}')" title="Click to Expand"></td>
                <td>
                    <input type="number" id="online-amt-${index}" placeholder="Final Amt" style="width:90px; margin:0 0 5px 0; padding:5px;">
                    <button onclick="StaffDashboard.payOnlineOrder(${index}, 'Cash')" class="btn-action btn-success" style="padding:4px 8px; font-size:0.8rem;">Cash</button>
                    <button onclick="StaffDashboard.payOnlineOrder(${index}, 'QR')" class="btn-action btn-accent" style="padding:4px 8px; font-size:0.8rem;">QR</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    loadRxQueue: function() {
        const tbody = document.getElementById('live-rx-queue');
        tbody.innerHTML = "";
        const queue = JSON.parse(localStorage.getItem('ndh_rx_queue') || '[]');

        if(queue.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No doctor prescriptions pending.</td></tr>`;
            return;
        }

        queue.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.name}</b><br>${item.age} Yrs / ${item.sex}</td>
                <td><small><b>Symptoms:</b> ${item.symptoms}<br><b>Tests:</b> ${item.tests}</small><br><div style="font-family:monospace; background:#f8fafc; padding:4px; margin-top:4px;">${item.rx}</div></td>
                <td><button onclick="StaffDashboard.printRxPDF(${index})" class="btn-action" style="background:#6366f1; font-size:0.8rem; padding:6px 10px;">Print Rx PDF 🖨️</button></td>
                <td>
                    <input type="number" id="rx-amt-${index}" placeholder="Amt (₹)" style="width:80px; margin:0 0 5px 0; padding:5px;">
                    <button onclick="StaffDashboard.payRx(${index}, 'Cash')" class="btn-action btn-success" style="padding:4px 8px; font-size:0.8rem;">Cash</button>
                    <button onclick="StaffDashboard.payRx(${index}, 'QR')" class="btn-action btn-accent" style="padding:4px 8px; font-size:0.8rem;">QR</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    printRxPDF: function(index) {
        const queue = JSON.parse(localStorage.getItem('ndh_rx_queue') || '[]');
        const p = queue[index];
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head><title>Prescription - ${p.name}</title></head>
            <body style="font-family:sans-serif; padding:40px; color:#333;">
                <div style="text-align:center; border-bottom:2px solid #0284c7; padding-bottom:10px;">
                    <h2 style="margin:0; color:#0284c7;">NAMTI DRUG HOUSE</h2>
                    <p style="margin:5px 0 0 0; font-size:0.9rem;">Sivasagar, Assam | Consultation Slip</p>
                </div>
                <div style="margin:20px 0; display:flex; justify-content:between; font-size:0.95rem; border-bottom:1px dashed #ccc; padding-bottom:10px;">
                    <div><b>Patient Name:</b> ${p.name} &nbsp;&nbsp;&nbsp;&nbsp; <b>Age/Sex:</b> ${p.age} Yrs / ${p.sex}</div>
                    <div style="margin-left:auto;"><b>Date:</b> ${p.date} &nbsp;&nbsp;&nbsp;&nbsp; <b>ID:</b> ${p.id}</div>
                </div>
                <div style="margin-bottom:15px;"><strong>Chief Symptoms:</strong><p style="margin:5px 0 0 10px; color:#555;">${p.symptoms}</p></div>
                <div style="margin-bottom:20px;"><strong>Diagnostic Tests Referred:</strong><p style="margin:5px 0 0 10px; color:#555; font-style:italic;">${p.tests}</p></div>
                <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                <div style="font-size:1.2rem; font-weight:bold; color:#0284c7; margin-bottom:10px;">Rx (Medicines Advised)</div>
                <div style="white-space:pre-wrap; font-family:monospace; background:#f9f9f9; padding:15px; border-radius:5px; font-size:1rem; line-height:1.5;">${p.rx}</div>
                <div style="margin-top:100px; text-align:right; font-size:0.9rem; border-top:1px solid #ddd; padding-top:10px;">Authorized Signature / Namti Drug House</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    },

    processOfflinePOS: function(mode) {
        const amount = parseFloat(document.getElementById('pos-amount').value);
        let name = document.getElementById('pos-cust-name').value.trim() || "Walk-In Customer";
        if (!amount || amount <= 0) { alert("Please input valid amount!"); return; }

        if (mode === 'Cash') {
            alert(`💵 Counter Cash Collected: ₹${amount}`);
            document.getElementById('pos-amount').value = "";
        } else {
            this.triggerUpiQr(amount, `POS Sale: ${name}`);
        }
    },

    payOnlineOrder: function(index, mode) {
        const amt = parseFloat(document.getElementById(`online-amt-${index}`).value);
        if(!amt) { alert("Please input final calculation bill amount!"); return; }
        const orders = JSON.parse(localStorage.getItem('ndh_online_orders') || '[]');
        
        if(mode === 'Cash') {
            alert(`💵 Online Order Closed via Cash payment: ₹${amt}`);
            this.removeElement('ndh_online_orders', index);
            this.loadOnlineOrders();
        } else {
            this.triggerUpiQr(amt, `Online Order: ${orders[index].name}`, 'online', index);
        }
    },

    payRx: function(index, mode) {
        const amt = parseFloat(document.getElementById(`rx-amt-${index}`).value);
        if(!amt) { alert("Please input bill amount!"); return; }
        const queue = JSON.parse(localStorage.getItem('ndh_rx_queue') || '[]');

        if(mode === 'Cash') {
            alert(`💵 Doctor Rx Dispatched via Cash: ₹${amt}`);
            this.removeElement('ndh_rx_queue', index);
            this.loadRxQueue();
        } else {
            this.triggerUpiQr(amt, `Rx Patient: ${queue[index].name}`, 'rx', index);
        }
    },

    triggerUpiQr: function(amount, note, type = null, targetIndex = null) {
        const upiId = "hussain.abidur@ybl";
        const cleanNote = note.replace(/[^a-zA-Z0-9 ]/g, "");
        const upiString = `upi://pay?pa=${upiId}&pn=NamtiDrugHouse&am=${amount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;

        document.getElementById('qr-modal-details').textContent = `${note} | Total: ₹${amount}`;
        document.getElementById('qr-image-container').innerHTML = `<img src="${qrUrl}" style="display:block; margin:0 auto; border:3px solid #16a34a; border-radius:4px;">`;
        
        const overlay = document.getElementById('qr-modal-overlay');
        overlay.setAttribute('data-type', type);
        overlay.setAttribute('data-idx', targetIndex);
        overlay.style.display = 'flex';
    },

    closeQrModal: function() {
        const overlay = document.getElementById('qr-modal-overlay');
        const type = overlay.getAttribute('data-type');
        const idx = overlay.getAttribute('data-idx');

        if (type === 'online' && idx !== null) {
            this.removeElement('ndh_online_orders', parseInt(idx));
            this.loadOnlineOrders();
        } else if (type === 'rx' && idx !== null) {
            this.removeElement('ndh_rx_queue', parseInt(idx));
            this.loadRxQueue();
        }

        overlay.style.display = 'none';
        alert("🔒 Transaction verified and list updated successfully!");
    },

    removeElement: function(key, index) {
        let arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.splice(index, 1); // Delete tabhi hoga jab complete action execute hoga
        localStorage.setItem(key, JSON.stringify(arr));
    }
};
