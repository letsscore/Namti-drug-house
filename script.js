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
        
        // Retain orders that match correct scale boundary
        const keptOrders = currentOrders.filter(order => order.timestamp >= thirtyDaysAgo);
        const deletedCount = currentOrders.length - keptOrders.length;
        
        localStorage.setItem('namti_orders', JSON.stringify(keptOrders));
        alert(`${deletedCount} old orders successfully cleared from storage!`);
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-submission-form');
    const adminOrdersLog = document.getElementById('admin-orders-log');
    const paymentModalBox = document.getElementById('payment-modal-box');
    const closeModalAction = document.getElementById('close-modal-action');

    // AUDIO CONTEXT SYSTEM FOR REAL-TIME INSTANT BEEP NOTIFICATIONS TO OWNER
    let audioContext;
    function playBeepNotification() {
        try {
            if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let osc = audioContext.createOscillator();
            let gain = audioContext.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, audioContext.currentTime); // High crisp frequency beep
            gain.gain.setValueAtTime(0.2, audioContext.currentTime);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start();
            osc.stop(audioContext.currentTime + 0.15);
        } catch(e) { console.log("Audio notification context blocked by browser."); }
    }

    // LISTENER FOR CROSS-TAB STORAGE SYNC & IMMEDIATE BEEP FOR OWNER
    window.addEventListener('storage', (e) => {
        if (e.key === 'namti_orders') {
            loadSavedSystemOrders();
            playBeepNotification();
        }
    });

    // MEDICAL HISTORICAL DISCOVERIES TRIVIA PIPELINE
    const medicalHubData = [
        { q: "Your health is your greatest wealth. We care for your speedy recovery.", f: "Historical Fact: Sir Alexander Fleming discovered Penicillin in 1928, saving millions of lives!" },
        { q: "Medicines cure diseases, but only pharmacists can optimize your therapy.", f: "Discovery: In 1897, Felix Hoffmann synthesized Aspirin, creating the world's most popular drug." },
        { q: "Good health and good sense are two of life's greatest blessings.", f: "Invention: Wilhelm Röntgen discovered X-Rays in 1895, revolutionizing medical diagnostics." },
        { q: "Namti Drug House: Committed to your wellness, every single day.", f: "Vaccine Milestone: Edward Jenner successfully developed the world's first Smallpox vaccine in 1796." }
    ];
    
    let rotatingPointer = 0;
    setInterval(() => {
        rotatingPointer = (rotatingPointer + 1) % medicalHubData.length;
        const quoteEl = document.getElementById('dynamic-quote');
        const factEl = document.getElementById('historical-fact');
        if(quoteEl && factEl) {
            quoteEl.textContent = `"${medicalHubData[rotatingPointer].q}"`;
            factEl.textContent = medicalHubData[rotatingPointer].f;
        }
    }, 8000);

    const lastView = localStorage.getItem('namti_current_view');
    if (lastView === 'staff') {
        const customerView = document.getElementById('customer-view');
        const staffDashboard = document.getElementById('staff-dashboard');
        if (customerView && staffDashboard) {
            customerView.classList.remove('active-view');
            staffDashboard.classList.add('active-view');
        }
    }

    function loadSavedSystemOrders() {
        if (!adminOrdersLog) return;
        adminOrdersLog.innerHTML = "";
        const savedOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        savedOrders.forEach((data, trackingIndex) => {
            renderDatabaseRow(data, trackingIndex);
        });
        calculateLiveRevenue();
    }

    window.calculateLiveRevenue = function() {
        let currentDayTotal = 0;
        document.querySelectorAll('#admin-orders-log tr').forEach(row => {
            const billInput = row.querySelector('.bill-input');
            const statusField = row.querySelector('.status-field');
            if (billInput && statusField && statusField.textContent.includes("Confirmed")) {
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
            prescriptionVisualControl = `<button class="view-presc-btn" onclick="openInteractivePrescription('${data.imageBlob}')">👁️ View Image</button>`;
        }

        row.innerHTML = `
            <td><strong>${data.name}</strong><br><small>${data.phone}</small></td>
            <td>${data.village}<br><small data-pin="${data.pincode}">PIN: ${data.pincode} | ${data.district}</small></td>
            <td><div style="max-height:60px; overflow-y:auto; font-size:0.85rem; color:#334155;">${data.medicines}</div>${prescriptionVisualControl}</td>
            <td><input type="number" class="bill-input" value="${data.bill || ''}" placeholder="₹" oninput="window.calculateLiveRevenue()"></td>
            <td>
                <select class="gateway-select">
                    <option value="universal" ${data.preferredGateway === 'universal' ? 'selected' : ''}>Any UPI App</option>
                    <option value="gpay" ${data.preferredGateway === 'gpay' ? 'selected' : ''}>Google Pay</option>
                    <option value="phonepe" ${data.preferredGateway === 'phonepe' ? 'selected' : ''}>PhonePe</option>
                    <option value="paytm" ${data.preferredGateway === 'paytm' ? 'selected' : ''}>Paytm</option>
                </select>
            </td>
            <td><span class="badge ${data.statusClass || 'badge-pending'} status-field">${data.statusText || 'New Request'}</span></td>
            <td>
                <div class="action-flex">
                    <button class="sms-trigger-btn" onclick="executeSmsProcess(${indexPointer}, this)">Confirm ✅</button>
                    <button class="reject-trigger-btn" onclick="executeRejectProcess(${indexPointer}, this)">Reject ❌</button>
                    <button class="delete-trigger-btn" onclick="executeDeleteProcess(${indexPointer})">Delete 🗑️</button>
                </div>
            </td>
        `;
        adminOrdersLog.appendChild(row);
    }

    window.openInteractivePrescription = function(blobData) {
        const frame = document.getElementById('modal-target-image');
        const overlay = document.getElementById('prescription-preview-modal');
        if (frame && overlay) {
            frame.src = blobData;
            overlay.style.display = 'flex';
        }
    };

    // SMS HANDLER BUILT ON PRECISE PINCODE DELIVERY POLICIES
    window.executeSmsProcess = function(arrayIndex, buttonElement) {
        const rowItem = buttonElement.closest('tr');
        const phoneText = rowItem.cells[0].querySelector('small').textContent;
        const customerName = rowItem.cells[0].querySelector('strong').textContent;
        const billVal = parseFloat(rowItem.querySelector('.bill-input').value) || 0;
        const selectedGateway = rowItem.querySelector('.gateway-select').value;
        
        if (!billVal) { alert("Please enter Bill Amount first!"); return; }

        // AUTOMATIC POLICIES VALIDATOR: Pin must match 785684 & Bill >= 1999
        const targetPin = rowItem.cells[1].querySelector('small').getAttribute('data-pin');
        let mode = (targetPin.trim() === "785684" && billVal >= 1999) ? "Home Delivery" : "Self Collection";
        
        const statusField = rowItem.querySelector('.status-field');
        if (statusField) {
            statusField.textContent = "Confirmed: " + mode;
            statusField.className = "badge status-field " + (mode === "Home Delivery" ? "badge-delivery" : "badge-pickup");
        }
        
        const upiAddress = "hussain.abidur@ybl";
        const merchantName = encodeURIComponent("Namti Drug House");
        const note = encodeURIComponent("Medicine Bill");

        let finalUpiLink = "";
        let gatewayLabel = "";

        // 100% Guaranteed Clickable Web Redirect Hyperlinks
        if (selectedGateway === "gpay") {
            gatewayLabel = "Google Pay";
            finalUpiLink = `https://gpay.app.goo.gl/pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR&tn=${note}`;
        } else if (selectedGateway === "phonepe") {
            gatewayLabel = "PhonePe";
            finalUpiLink = `https://phon.pe/pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR`;
        } else if (selectedGateway === "paytm") {
            gatewayLabel = "Paytm";
            finalUpiLink = `https://paytm.me/pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR`;
        } else {
            gatewayLabel = "Any UPI App (GPay/PhonePe/Paytm/BHIM)";
            finalUpiLink = `https://upilinks.in/pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR`;
        }

        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].bill = billVal;
            currentOrders[arrayIndex].preferredGateway = selectedGateway;
            currentOrders[arrayIndex].statusText = "Confirmed: " + mode;
            currentOrders[arrayIndex].statusClass = (mode === "Home Delivery" ? "badge-delivery" : "badge-pickup");
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }

        window.calculateLiveRevenue();
        const msg = `Hello ${customerName}, your order is verified at Namti Drug House. Total Bill: Rs. ${billVal}. Mode: ${mode}. Pay via ${gatewayLabel} here: ${finalUpiLink}`;
        window.location.href = `sms:+91${phoneText}?body=${encodeURIComponent(msg)}`;
    };

    window.executeRejectProcess = function(arrayIndex, buttonElement) {
        if (!confirm("Reject this order request?")) return;
        const rowItem = buttonElement.closest('tr');
        const statusField = rowItem.querySelector('.status-field');
        if (statusField) {
            statusField.textContent = "Rejected";
            statusField.className = "badge status-field badge-rejected";
        }
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].statusText = "Rejected";
            currentOrders[arrayIndex].statusClass = "badge-rejected";
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }
        window.calculateLiveRevenue();
    };

    window.executeDeleteProcess = function(arrayIndex) {
        if (!confirm("Permanently delete this record?")) return;
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        currentOrders.splice(arrayIndex, 1);
        localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        loadSavedSystemOrders();
    };

    // FORM REGISTRATION DATA REDIRECT TO CUSTOM RECEIPT POPUP
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const photoFile = document.getElementById('prescription-photo').files[0];
            if (!photoFile) { alert("Please attach a Prescription photo first!"); return; }

            const fileEngineReader = new FileReader();
            fileEngineReader.onload = function(event) {
                const base64ImageString = event.target.result;
                const uniqueId = "NDH-" + Math.floor(1000 + Math.random() * 9000);

                const nameInput = document.getElementById('cust-name').value;
                const phoneInput = document.getElementById('cust-phone').value;
                const villageInput = document.getElementById('cust-village').value;
                const pinInput = document.getElementById('cust-pincode').value;
                const distInput = document.getElementById('cust-district').value;

                const orderData = {
                    timestamp: Date.now(),
                    name: nameInput,
                    phone: phoneInput,
                    village: villageInput,
                    pincode: pinInput,
                    district: distInput,
                    medicines: document.getElementById('medicine-details').value,
                    imageBlob: base64ImageString,
                    preferredGateway: "universal",
                    bill: "",
                    statusText: "New Request",
                    statusClass: "badge-pending"
                };

                const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
                currentOrders.unshift(orderData);
                localStorage.setItem('namti_orders', JSON.stringify(currentOrders));

                // INJECT DYNAMIC METADATA INTO THE PRINTABLE ELEMENT
                document.getElementById('rec-id').textContent = uniqueId;
                document.getElementById('rec-name').textContent = nameInput;
                document.getElementById('rec-phone').textContent = phoneInput;
                document.getElementById('rec-addr').textContent = `${villageInput}, PIN: ${pinInput}, ${distInput}`;

                loadSavedSystemOrders();
                if (paymentModalBox) paymentModalBox.style.display = 'flex';
                orderForm.reset();
            };
            fileEngineReader.readAsDataURL(photoFile);
        });
    }

    // CUSTOM SINGLE ELEMENT PRINT FUNCTION PIPELINE
    window.printReceipt = function() {
        const receiptContent = document.getElementById('printable-receipt').innerHTML;
        const originalBody = document.body.innerHTML;
        document.body.innerHTML = `<div style="padding:40px; font-family:monospace; width:320px; margin:0 auto; border:1px solid #000;">${receiptContent}</div>`;
        window.print();
        location.reload(); // Hard refresh to reset app state seamlessly
    };

    if (closeModalAction && paymentModalBox) {
        closeModalAction.addEventListener('click', () => { paymentModalBox.style.display = 'none'; });
    }

    loadSavedSystemOrders();
});

                          
