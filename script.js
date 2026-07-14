// =================================================================
// 1. ENGINE INITIALIZATION & VIEW MANAGER
// =================================================================
window.ViewManager = {
    navigate: function(viewId) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active-view');
        }
        localStorage.setItem('ndh_last_active_view', viewId);

        if (viewId === 'staff-view') {
            const searchInput = document.getElementById('staff-search-input');
            if (searchInput) searchInput.value = "";
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

    // FIX 1: GLOBAL SEARCH EVENT HANDLER SETUP (Fixed lower/upper case mismatch & phone filtering)
    const searchField = document.getElementById('staff-search-input');
    if (searchField) {
        searchField.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            if (window.StaffDashboard) {
                window.StaffDashboard.loadRxQueue(query);
                window.StaffDashboard.loadOnlineOrdersQueue(query);
            }
        });
    }

    const orderForm = document.getElementById('online-order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const pin = document.getElementById('cust-pin').value.trim();
            const bill = parseFloat(document.getElementById('cust-bill').value) || 0;
            const photofile = document.getElementById('cust-rx-photo').files[0];

            if (pin !== "785684") {
                alert("❌ Order Rejected: Home delivery is strictly possible for specific pins.");
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
                    meds: document.getElementById('cust-meds').value.trim(),
                    imgData: base64Img,
                    isPOS: false,
                    timestamp: currentStamp.getTime(),
                    formattedDate: currentStamp.toLocaleString('en-IN')
                };

                const existingOrders = JSON.parse(localStorage.getItem('ndh_longterm_orders')) || [];
                existingOrders.push(newOrder);
                localStorage.setItem('ndh_longterm_orders', JSON.stringify(existingOrders));

                let completionText = "🎉 Order Submitted Successfully!";
                if (bill >= 1500) {
                    completionText = "⚠️ Order Warning (Value >= ₹1599): Manual verification required!";
                }

                alert(completionText);
                orderForm.reset();
                window.ViewManager.navigate('home-view');
            };

            if (photofile) {
                reader.readAsDataURL(photofile);
            } else {
                // If no photo is uploaded, trigger manual object registration directly
                const currentStamp = new Date();
                const newOrder = {
                    id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
                    name: document.getElementById('cust-name').value.trim(),
                    phone: document.getElementById('cust-phone').value.trim(),
                    pin: pin,
                    estimatedBill: bill || 'Not Provided',
                    meds: document.getElementById('cust-meds').value.trim(),
                    imgData: '',
                    isPOS: false,
                    timestamp: currentStamp.getTime(),
                    formattedDate: currentStamp.toLocaleString('en-IN')
                };
                const existingOrders = JSON.parse(localStorage.getItem('ndh_longterm_orders')) || [];
                existingOrders.push(newOrder);
                localStorage.setItem('ndh_longterm_orders', JSON.stringify(existingOrders));
                alert("🎉 Order Submitted Successfully!");
                orderForm.reset();
                window.ViewManager.navigate('home-view');
            }
        });
    }
});

// =================================================================
// 2. PHARMACEUTICAL ROTATOR
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const medicalQuotes = [
        "Alexander Fleming discovered Penicillin in 1928, launching the antibiotics era.",
        "Wilhelm Röntgen developed X-Rays in 1895, unlocking non-invasive diagnosis.",
        "Edward Jenner formulated the smallpox vaccine in 1796, pioneering immunology.",
        "Frederick Banting and Charles Best isolated Insulin in 1921, saving diabetic lives."
    ];
    const container = document.getElementById('medical-inventions-container');
    if (container) {
        container.innerHTML = '<div id="rotator-card" style="padding:15px; background:#fff; border-radius:8px;"></div>';
        let i = 0;
        function rotate() {
            const card = document.getElementById('rotator-card');
            if (card) {
                card.innerHTML = `💡 <b>Medical Fact:</b> ${medicalQuotes[i]}`;
                i = (i + 1) % medicalQuotes.length;
            }
        }
        rotate();
        setInterval(rotate, 8000);
    }
});

// =================================================================
// 3. DOCTOR DIAGNOSTIC COUPLING
// =================================================================
window.DoctorDesk = {
    submitPrescription: function() {
        const name = document.getElementById('doc-patient-name').value.trim();
        const age = document.getElementById('doc-patient-age').value.trim();
        const sex = document.getElementById('doc-patient-sex').value;
        const rx = document.getElementById('doc-rx-content').value.trim();

        if (!name || !age || !sex || !rx) {
            alert("Please fill out all mandatory fields marked with an asterisk (*)");
            return;
        }

        const currentStamp = new Date();
        const newRxRecord = {
            id: 'RX-' + Math.floor(1000 + Math.random() * 9000),
            name: name,
            phone: 'Doctor Desk Direct',
            age: age,
            sex: sex,
            symptoms: document.getElementById('doc-symptoms').value.trim() || 'None',
            tests: document.getElementById('doc-tests').value.trim() || 'None',
            rx: rx,
            timestamp: currentStamp.getTime(),
            formattedDate: currentStamp.toLocaleString('en-IN')
        };

        const existingRx = JSON.parse(localStorage.getItem('ndh_longterm_rx')) || [];
        existingRx.push(newRxRecord);
        localStorage.setItem('ndh_longterm_rx', JSON.stringify(existingRx));

        alert("🩺 Medical Prescription dispatched safely to Pharmacy Counter Dashboard!");
        document.getElementById('doctor-rx-form').reset();
        window.ViewManager.navigate('home-view');
    }
};

// =================================================================
// 4. STAFF DASHBOARD, LOG MEMORIES & SANDBOX PRINT IFRAME ENGINE
// =================================================================
window.StaffDashboard = {
    loadRxQueue: function(filterTerm = "") {
        const target = document.getElementById('live-rx-queue');
        if (!target) return;
        target.innerHTML = "";
        
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx')) || [];
        
        let filtered = rxData;
        if (filterTerm) {
            filtered = rxData.filter(item => 
                (item.name && item.name.toLowerCase().includes(filterTerm)) ||
                (item.id && item.id.toLowerCase().includes(filterTerm)) ||
                (item.phone && item.phone.toLowerCase().includes(filterTerm))
            );
        }

        if (filtered.length === 0) {
            target.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#777;">No matching records found.</td></tr>';
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <b>${item.id}</b><br>${item.name}<br>
                    <small>Age: ${item.age} | ${item.sex}</small><br>
                    <small style="background:#eef2f7; padding:2px 4px; border-radius:4px; display:inline-block; margin-top:4px;">📅 ${item.formattedDate || 'N/A'}</small>
                </td>
                <td><small><b>Symptoms:</b></small> ${item.symptoms}<br><small><b>Tests:</b></small> ${item.tests}</td>
                <td style="white-space:pre-line; font-family:monospace; background:#fafafa; font-size:12px;">${item.rx}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <input type="number" id="rx-price-${item.id}" placeholder="Amt (₹)" style="padding:4px; border:1px solid #ccc; border-radius:4px; width:90px;">
                        <div style="display:flex; gap:4px;">
                            <button onclick="window.StaffDashboard.billingAction('Rx', '${item.id}', 'Cash')" style="background:#2ecc71; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Cash</button>
                            <button onclick="window.StaffDashboard.billingAction('Rx', '${item.id}', 'UPI')" style="background:#0088cc; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">UPI QR</button>
                        </div>
                        <button onclick="window.StaffDashboard.printPrescriptionPDF('${item.id}')" style="background:#34495e; color:#fff; border:none; padding:6px; border-radius:4px; cursor:pointer; font-size:11px;">Print Prescription 🖨️</button>
                        <button onclick="window.StaffDashboard.deleteRecord('Rx', '${item.id}')" style="background:#e74c3c; color:#fff; border:none; padding:6px; border-radius:4px; cursor:pointer; font-size:11px;">Delete Record 🗑️</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    loadOnlineOrdersQueue: function(filterTerm = "") {
        const target = document.getElementById('live-online-orders-queue');
        if (!target) return;
        target.innerHTML = "";

        const orders = JSON.parse(localStorage.getItem('ndh_longterm_orders')) || [];
        
        let filtered = orders.filter(item => item.isPOS !== true);
        if (filterTerm) {
            filtered = filtered.filter(item => 
                (item.name && item.name.toLowerCase().includes(filterTerm)) ||
                (item.phone && item.phone.toLowerCase().includes(filterTerm)) ||
                (item.id && item.id.toLowerCase().includes(filterTerm))
            );
        }

        if (filtered.length === 0) {
            target.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#777;">No active matching orders.</td></tr>';
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <b>${item.id}</b><br>${item.name}<br><small>Ph: ${item.phone}</small><br>
                    <small style="background:#eef2f7; padding:2px 4px; border-radius:4px; display:inline-block; margin-top:4px;">📅 ${item.formattedDate || 'N/A'}</small>
                </td>
                <td>
                    <small><b>Loc:</b></small> ${item.pin}<br><small><b>Note:</b></small> ${item.meds}<br>
                    ${item.imgData ? `<button onclick="window.StaffDashboard.viewPrescriptionImage('${item.imgData}')" style="margin-top:6px; padding:2px 6px; font-size:11px; cursor:pointer;">👁️ View Uploaded Image</button>` : '<small style="color:#aaa;">No attachment</small>'}
                </td>
                <td><small>Est. Price:</small> <b>₹${item.estimatedBill}</b></td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <input type="number" id="order-price-${item.id}" placeholder="Final Amt (₹)" style="padding:4px; border:1px solid #ccc; border-radius:4px; width:90px;">
                        <div style="display:flex; gap:4px;">
                            <button onclick="window.StaffDashboard.billingAction('Order', '${item.id}', 'Cash')" style="background:#2ecc71; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Cash</button>
                            <button onclick="window.StaffDashboard.billingAction('Order', '${item.id}', 'UPI')" style="background:#0088cc; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">UPI QR</button>
                        </div>
                        <button onclick="window.StaffDashboard.deleteRecord('Order', '${item.id}')" style="background:#e74c3c; color:#fff; border:none; padding:6px; border-radius:4px; cursor:pointer; font-size:11px;">Delete Record 🗑️</button>
                    </div>
                </td>
            `;
            target.appendChild(tr);
        });
    },

    // FIX 2: DELETE SYSTEM OPERATIONAL MECHANISM
    deleteRecord: function(type, itemId) {
        if (!confirm("⚠️ Kya aap sach me ye record humesha ke liye delete karna chahte hain?")) {
            return;
        }
        
        const storageKey = (type === 'Rx') ? 'ndh_longterm_rx' : 'ndh_longterm_orders';
        let dataset = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        // Target id filter framework
        dataset = dataset.filter(item => item.id !== itemId);
        localStorage.setItem(storageKey, JSON.stringify(dataset));
        
        alert("🗑️ Record successfully database se delete kar diya gaya!");
        
        // Refresh structural UI states safely
        const searchVal = document.getElementById('staff-search-input')?.value.toLowerCase().trim() || "";
        this.loadRxQueue(searchVal);
        this.loadOnlineOrdersQueue(searchVal);
    },

    // FIX 3: BLANK PDF STRUCTURAL CORRECTION OVER OVERFLOW CHANNELS
    printPrescriptionPDF: function(itemId) {
        const rxData = JSON.parse(localStorage.getItem('ndh_longterm_rx')) || [];
        const item = rxData.find(r => r.id === itemId);

        if (!item) {
            alert("Error: Prescription data missing!");
            return;
        }

        // Initialize jsPDF constructor checks safely
        const { jsPDF } = window.jspdf || window;
        if (!jsPDF) {
            alert("Error: Library jsPDF script loaded nahi hai HTML window pe!");
            return;
        }

        const doc = new jsPDF();

        // Top Corporate Header Background
        doc.setFillColor(41, 128, 185); 
        doc.rect(0, 0, 210, 38, 'F');

        // Header Corporate Text Content
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("NAMTI DRUG HOUSE", 15, 20);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Digital Generation Desk System Portal", 15, 28);
        doc.text(`Doc ID: ${item.id}`, 160, 16);
        doc.text(`Date: ${item.formattedDate || new Date().toLocaleDateString()}`, 160, 24);

        // Patient Structural Profile Section Block
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 46, 182, 32, 'F');
        
        doc.setTextColor(44, 62, 80);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("PATIENT REGISTRATION REGISTRY:", 18, 54);
        
        doc.setFont("helvetica", "normal");
        doc.text(`Full Name: ${item.name}`, 18, 64);
        doc.text(`Demographics: ${item.age} Years Old | Gender: ${item.sex}`, 18, 72);

        // Diagnostics Block
        doc.setFont("helvetica", "bold");
        doc.text("CLINICAL EVALUATION:", 18, 92);
        doc.setFont("helvetica", "normal");
        doc.text(`Symptoms Logged: ${item.symptoms || 'None Specified'}`, 18, 100);
        doc.text(`Advised Procedures/Tests: ${item.tests || 'None'}`, 18, 108);

        // Section Accent Break
        doc.setDrawColor(210, 215, 225);
        doc.setLineWidth(0.5);
        doc.line(14, 116, 196, 116);

        // RX Core Content Field Processing safely to prevent blank pages or overflows
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(41, 128, 185);
        doc.text("Rx - Prescribed Medication Logic", 18, 130);

        doc.setFont("courier", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);

        // String splitting protection layers against boundary overflow parameters
        const splitMeds = doc.splitTextToSize(item.rx || 'No medicine text structured.', 175);
        doc.text(splitMeds, 18, 142);

        // Ground Footer Metadata Verification Text
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(160, 160, 160);
        doc.text("This is an electronically verified record generated at Pharmacy Console.", 15, 285);

        // Document Export Stream
        doc.save(`Prescription_${item.id}_${item.name.replace(/\s+/g, '_')}.pdf`);
    },

    processOfflinePOS: function(mode) {
        const amount = parseFloat(document.getElementById('pos-amount').value);
        let customer = document.getElementById('pos-cust-name').value.trim();
        let phone = document.getElementById('pos-cust-phone').value.trim();

        if (!amount || amount <= 0) {
            alert("Please input a valid counter amount parameter!");
            return;
        }

        if (!customer) customer = "Walk-in Customer";
        if (!phone) phone = "By-Pass Counter";

        const currentStamp = new Date();
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
            formattedDate: currentStamp.toLocaleString('en-IN')
        };

        const existingOrders = JSON.parse(localStorage.getItem('ndh_longterm_orders')) || [];
        existingOrders.push(mockOrder
