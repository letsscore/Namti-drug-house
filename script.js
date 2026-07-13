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
                // Force load orders upon login to sync state
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

    // AUDIO CONTEXT SYSTEM FOR REAL-TIME INSTANT BEEP NOTIFICATIONS TO OWNER
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
        } catch(e) { console.log("Audio notification context blocked by browser."); }
    }

    // LISTENER FOR CROSS-TAB STORAGE SYNC
    window.addEventListener('storage', (e) => {
        if (e.key === 'namti_orders') {
            window.loadSavedSystemOrders();
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
            prescriptionVisualControl = `<button class="view-presc-btn" onclick="window.openInteractivePrescription('${data.imageBlob}')">👁️ View Image</button>`;
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
                    <button class="sms-trigger-btn" onclick="window.executeSmsProcess(${indexPointer}, this)">Confirm ✅</button>
                    <button class="reject-trigger-btn" onclick="window.executeRejectProcess(${indexPointer}, this)">Reject ❌</button>
                    <button class="delete-trigger-btn" onclick="window.executeDeleteProcess(${indexPointer})">Delete 🗑️</button>
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

    // SMS COMMUNICATION HANDLER RUN BY OWNER
    window.executeSmsProcess = function(arrayIndex, buttonElement) {
        const rowItem = buttonElement.closest('tr');
        const phoneText = rowItem.cells[0].querySelector('small').textContent;
        const customerName = rowItem.cells[0].querySelector('strong').textContent;
        const billVal = parseFloat(rowItem.querySelector('.bill-input').value) || 0;
        const selectedGateway = rowItem.querySelector('.gateway-select').value;
        
        if (!billVal) { alert("Please enter Bill Amount first!"); return; }

        const targetPin = rowItem.cells[1].querySelector('small').getAttribute('data-pin');
        let mode = (targetPin.trim() === "785684" && billVal >= 1999) ? "Home Delivery" : "Self Collection";
        
        const statusField = rowItem.querySelector('.status-field');
        if (statusField) {
            statusField.textContent = "Confirmed: " + mode;
            statusField.className = "badge status-field " + (mode === "Home Delivery" ? "badge-delivery" : "badge-pickup");
        }
        
        const upiAddress = "hussain.abidur@ybl";
        const merchantName = encodeURIComponent("Namti Drug House");

        let finalUpiLink = `https://upilinks.in/pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR`;

        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].bill = billVal;
            currentOrders[arrayIndex].preferredGateway = selectedGateway;
            currentOrders[arrayIndex].statusText = "Confirmed: " + mode;
            currentOrders[arrayIndex].statusClass = (mode === "Home Delivery" ? "badge-delivery" : "badge-pickup");
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }

        window.calculateLiveRevenue();

        // Trigger SMS communication containing payment details
        const msg = `Hello ${customerName}, your order is verified at Namti Drug House. Total Bill: Rs. ${billVal}. Mode: ${mode}. Kindly clear payment here: ${finalUpiLink}`;
        
        // Open receipt metadata for owner to issue/print post successful payment verification
        const uniqueId = "NDH-" + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('rec-id').textContent = uniqueId;
        document.getElementById('rec-name').textContent = customerName;
        document.getElementById('rec-phone').textContent = phoneText;
        document.getElementById('rec-addr').textContent = rowItem.cells[1].innerHTML.split('<br>')[0];

        // Fire SMS gateway intent redirect smoothly
        window.location.href = `sms:+91${phoneText}?body=${encodeURIComponent(msg)}`;
        
        // Show the printable receipt workspace to owner so they can print/save it anytime
        if (paymentModalBox) paymentModalBox.style.display = 'flex';
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
        window.loadSavedSystemOrders();
    };

    // FORM REGISTRATION DATA PIPELINE (ONLY SUBMITS WITHOUT BREAKING SCREEN STATE)
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const photoFile = document.getElementById('prescription-photo').files[0];
            if (!photoFile) { alert("Please attach a Prescription photo first!"); return; }

            const fileEngineReader = new FileReader();
            fileEngineReader.onload = function(event) {
                const base64ImageString = event.target.result;

                const orderData = {
                    timestamp: Date.now(),
                    name: document.getElementById('cust-name').value,
                    phone: document.getElementById('cust-phone').value,
                    village: document.getElementById('cust-village').value,
                    pincode: document.getElementById('cust-pincode').value,
                    district: document.getElementById('cust-district').value,
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

                // Instantly sync internal views without disruptive reloads
                window.loadSavedSystemOrders();
                playBeepNotification();

                alert("✅ Your Order has been placed successfully! Namti Drug House staff will verify your prescription and send an SMS with payment instructions shortly.");
                orderForm.reset();
            };
            fileEngineReader.readAsDataURL(photoFile);
        });
    }

    // NATIVE SAFE SYSTEM FOR DESKTOP AND SMARTPHONE PRINT-TO-PDF
    window.printReceipt = function() {
        const receiptElement = document.getElementById('printable-receipt');
        const originalContent = document.body.innerHTML;
        const printLayout = `<div style="padding:30px; font-family:monospace; max-width:400px; margin:0 auto; border:1px dashed #000;">${receiptElement.innerHTML}</div>`;
        
        document.body.innerHTML = printLayout;
        window.print();
        
        // Restore context state safely
        document.body.innerHTML = originalContent;
        window.location.reload();
    };

    if (closeModalAction && paymentModalBox) {
        closeModalAction.addEventListener('click', () => { paymentModalBox.style.display = 'none'; });
    }

    window.loadSavedSystemOrders();
});
      

                          
