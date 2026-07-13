// GLOBAL SECURE STATE CONFIG GATE
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

window.OrderManager = {
    clearThirtyDayOldOrders: function() {
        if (!confirm("Are you sure you want to delete all orders older than 30 days?")) return;
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        
        // 30 Days scale memory barrier
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000); 
        
        // BUG FIX: Keep orders that are NEWER than thirtyDaysAgo (order.timestamp >= thirtyDaysAgo)
        const keptOrders = currentOrders.filter(order => order.timestamp >= thirtyDaysAgo);
        const deletedCount = currentOrders.length - keptOrders.length;
        
        localStorage.setItem('namti_orders', JSON.stringify(keptOrders));
        alert(`${deletedCount} old orders cleared from system storage!`);
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-submission-form');
    const adminOrdersLog = document.getElementById('admin-orders-log');
    const paymentModalBox = document.getElementById('payment-modal-box');
    const closeModalAction = document.getElementById('close-modal-action');

    // HIGHLY COLOURFUL MEDICAL HISTORY AND DISCOVERIES REVOLVING DATA ENGINE
    const medicalHubData = [
        { q: "Your health is your greatest wealth. We care for your speedy recovery.", f: "Historical Fact: Sir Alexander Fleming discovered Penicillin in 1928, saving millions of lives!" },
        { q: "Medicines cure diseases, but only pharmacists can optimize your therapy.", f: "Discovery: In 1897, Felix Hoffmann synthesized Aspirin, creating the world's most popular drug." },
        { q: "Good health and good sense are two of life's greatest blessings.", f: "Invention: Wilhelm Röntgen discovered X-Rays in 1895, revolutionizing medical diagnostics." },
        { q: "Namti Drug House: Committed to your wellness, every single day.", f: "Vaccine Milestone: Edward Jenner successfully developed the world's first Smallpox vaccine in 1796." },
        { q: "Let food be thy medicine and medicine be thy food.", f: "Ancient Discovery: Lord Dhanvantari & Charaka compiled the Charaka Samhita (Ayurveda) around 300 BCE." }
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

    // PERSIST VIEW ENGINE LOOKUP
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
                    <option value="paytm" ${data.preferredGateway === 'paytm' ? 'selected' : ''}>Paytm</option>
                    <option value="phonepe" ${data.preferredGateway === 'phonepe' ? 'selected' : ''}>PhonePe</option>
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

    // IMAGE MODAL PREVIEW HOOK
    window.openInteractivePrescription = function(blobData) {
        const frame = document.getElementById('modal-target-image');
        const overlay = document.getElementById('prescription-preview-modal');
        if (frame && overlay) {
            frame.src = blobData;
            overlay.style.display = 'flex';
        }
    };

    // PROCESS DISPATCH FLOW
    window.executeSmsProcess = function(arrayIndex, buttonElement) {
        const rowItem = buttonElement.closest('tr');
        const phoneText = rowItem.cells[0].querySelector('small').textContent;
        const customerName = rowItem.cells[0].querySelector('strong').textContent;
        const billVal = parseFloat(rowItem.querySelector('.bill-input').value) || 0;
        const selectedGateway = rowItem.querySelector('.gateway-select').value;
        
        if (!billVal) { alert("Please enter Bill Amount first!"); return; }

        const targetPin = rowItem.cells[1].querySelector('small').getAttribute('data-pin');
        let mode = (targetPin === "785684" && billVal >= 1999) ? "Home Delivery" : "Self Collection";
        
        const statusField = rowItem.querySelector('.status-field');
        if (statusField) {
            statusField.textContent = "Confirmed: " + mode;
            statusField.className = "badge status-field " + (mode === "Home Delivery" ? "badge-delivery" : "badge-pickup");
        }
        
        // BUG FIX: Dynamic Link Engine for multi-app capability
        let finalUpiLink = "";
        let gatewayLabel = "";

        const upiAddress = "hussain.abidur@ybl";
        const merchantName = encodeURIComponent("Namti Drug House");
        const note = encodeURIComponent("Medicine Bill");

        if (selectedGateway === "gpay") {
            gatewayLabel = "Google Pay";
            finalUpiLink = `https://gpay.app.goo.gl/pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR&tn=${note}`;
        } else if (selectedGateway === "phonepe") {
            gatewayLabel = "PhonePe";
            finalUpiLink = `phonepe://pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR&tn=${note}`;
        } else if (selectedGateway === "paytm") {
            gatewayLabel = "Paytm";
            finalUpiLink = `paytmmp://pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR&tn=${note}`;
        } else {
            gatewayLabel = "Any UPI App (GPay/PhonePe/Paytm)";
            // Universal standard UPI intent that opens the app choice selector on customer's phone
            finalUpiLink = `upi://pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR&tn=${note}`;
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

        const msg = `Hello ${customerName}, your order has been verified at Namti Drug House.\nTotal Bill Amount: Rs. ${billVal}\nDelivery Mode: ${mode}\n\n👉 Pay Securely via ${gatewayLabel} link:\n${finalUpiLink}`;
        window.location.href = `sms:+91${phoneText}?body=${encodeURIComponent(msg)}`;
    };

    // REJECT PROCESS FLOW
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

    // DELETE INDIVIDUAL LOG FLOW
    window.executeDeleteProcess = function(arrayIndex) {
        if (!confirm("Permanently delete this record?")) return;
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        currentOrders.splice(arrayIndex, 1);
        localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        loadSavedSystemOrders();
    };

    // FORM HANDLER BLOCK WITH FILE ENCODING ENGINE
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const photoFile = document.getElementById('prescription-photo').files[0];
            
            if (!photoFile) {
                alert("Please attach a Prescription photo to submit your request.");
                return;
            }

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

                loadSavedSystemOrders();
                if (paymentModalBox) paymentModalBox.style.display = 'flex';
                orderForm.reset();
            };
            
            fileEngineReader.readAsDataURL(photoFile);
        });
    }

    if (closeModalAction && paymentModalBox) {
        closeModalAction.addEventListener('click', () => { paymentModalBox.style.display = 'none'; });
    }

    loadSavedSystemOrders();
});
                
                          
