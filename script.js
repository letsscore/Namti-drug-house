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
        } catch(e) { console.log("Audio notification context blocked."); }
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'namti_orders') {
            window.loadSavedSystemOrders();
            playBeepNotification();
        }
    });

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
            if (billInput && statusField && statusField.textContent.includes("Paid")) {
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

        // CONTROL BUTTONS MATRIX BASED ON SYSTEM WORKFLOW STATE
        let actionButtons = '';
        if (!data.statusText || data.statusText === 'New Request') {
            actionButtons = `<button class="sms-trigger-btn" onclick="window.executeSmsProcess(${indexPointer}, this)">Confirm & Send UPI Link ✅</button>`;
        } else if (data.statusText.includes("Awaiting Payment")) {
            actionButtons = `<button class="paid-trigger-btn" style="background:#2563eb; color:white; border:none; padding:0.5rem; border-radius:6px; cursor:pointer;" onclick="window.markAsPaid(${indexPointer}, this)">Mark Paid 💰</button>`;
        } else if (data.statusText.includes("Paid")) {
            actionButtons = `<button class="receipt-trigger-btn" style="background:#7c3aed; color:white; border:none; padding:0.5rem; border-radius:6px; cursor:pointer;" onclick="window.generateAndOpenReceipt(${indexPointer}, this)">View & Share Receipt 📄</button>`;
        }

        row.innerHTML = `
            <td><strong>${data.name}</strong><br><small>${data.phone}</small></td>
            <td>${data.village}<br><small data-pin="${data.pincode}">PIN: ${data.pincode} | ${data.district}</small></td>
            <td><div style="max-height:60px; overflow-y:auto; font-size:0.85rem; color:#334155;">${data.medicines}</div>${prescriptionVisualControl}</td>
            <td><input type="number" class="bill-input" value="${data.bill || ''}" placeholder="₹" ${data.statusText && data.statusText.includes("Paid") ? 'disabled' : ''} oninput="window.calculateLiveRevenue()"></td>
            <td><span class="badge ${data.statusClass || 'badge-pending'} status-field">${data.statusText || 'New Request'}</span></td>
            <td>
                <div class="action-flex" style="flex-direction:column; gap:4px;">
                    ${actionButtons}
                    <div style="display:flex; gap:2px;">
                        <button class="reject-trigger-btn" onclick="window.executeRejectProcess(${indexPointer}, this)">Reject ❌</button>
                        <button class="delete-trigger-btn" onclick="window.executeDeleteProcess(${indexPointer})">🗑️</button>
                    </div>
                </div>
            </td>
        `;
        adminOrdersLog.appendChild(row);
    }

        // STAGE 1: CORRECTED ACTION HANDLER TO SEND 100% WORKING MULTI-APP UPI LINK
    window.executeSmsProcess = function(arrayIndex, buttonElement) {
        const rowItem = buttonElement.closest('tr');
        const phoneText = rowItem.cells[0].querySelector('small').textContent;
        const customerName = rowItem.cells[0].querySelector('strong').textContent;
        const billVal = parseFloat(rowItem.querySelector('.bill-input').value) || 0;
        
        if (!billVal) { alert("Please enter Bill Amount first!"); return; }

        const targetPin = rowItem.cells[1].querySelector('small').getAttribute('data-pin');
        let mode = (targetPin.trim() === "785684" && billVal >= 1999) ? "Home Delivery" : "Self Collection";
        
        const upiAddress = "hussain.abidur@ybl";
        const merchantName = encodeURIComponent("Namti Drug House");
        const transactionNote = encodeURIComponent("Medicine Bill");

        const finalUpiLink = `https://api.upi.link/pay?pa=${upiAddress}&pn=${merchantName}&am=${billVal}&cu=INR&tn=${transactionNote}`;

        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].bill = billVal;
            currentOrders[arrayIndex].statusText = "Awaiting Payment (" + mode + ")";
            currentOrders[arrayIndex].statusClass = "badge-pending";
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }

        const msg = `Hello ${customerName}, your order is verified at Namti Drug House. Total Bill: Rs. ${billVal}. Mode: ${mode}. Click this link to choose any UPI App to pay: ${finalUpiLink}`;
        
        window.location.href = `sms:+91${phoneText}?body=${encodeURIComponent(msg)}`;
        window.loadSavedSystemOrders();
    };

    // STAGE 2: OWNER RECEIVES NOTIFICATION/PAYMENT & UNLOCKS RECEIPT GENERATOR
    window.markAsPaid = function(arrayIndex, buttonElement) {
        if (!confirm("Confirm payment receipt? This will unlock the printable invoice layout.")) return;
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].statusText = "Paid & Verified Successfully";
            currentOrders[arrayIndex].statusClass = "badge-delivery";
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }
        window.loadSavedSystemOrders();
    };

    // STAGE 3: RECEIPT GENERATOR (ONLY WORKS AFTER PAYMENT STAGE)
    window.generateAndOpenReceipt = function(arrayIndex, buttonElement) {
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        const data = currentOrders[arrayIndex];
        
        if (!data) return;

        const uniqueId = "NDH-" + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('rec-id').textContent = uniqueId;
        document.getElementById('rec-name').textContent = data.name;
        document.getElementById('rec-phone').textContent = data.phone;
        document.getElementById('rec-addr').textContent = data.village;
        
        const printableArea = document.getElementById('printable-receipt');
        let dynamicAmtCheck = printableArea.querySelector('.receipt-amt-check');
        if(!dynamicAmtCheck) {
            dynamicAmtCheck = document.createElement('div');
            dynamicAmtCheck.className = "receipt-amt-check";
            printableArea.appendChild(dynamicAmtCheck);
        }
        dynamicAmtCheck.innerHTML = `<hr style="border:1px dashed #000; margin:8px 0;"><p><strong>TOTAL AMOUNT PAID: ₹${data.bill}</strong></p><p style="font-size:0.75rem;">Status: Electronic Verified Receipt</p>`;

        if (paymentModalBox) paymentModalBox.style.display = 'flex';
    };

    window.openInteractivePrescription = function(blobData) {
        const frame = document.getElementById('modal-target-image');
        const overlay = document.getElementById('prescription-preview-modal');
        if (frame && overlay) {
            frame.src = blobData;
            overlay.style.display = 'flex';
        }
    };

    window.executeRejectProcess = function(arrayIndex, buttonElement) {
        if (!confirm("Reject this order request?")) return;
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].statusText = "Rejected";
            currentOrders[arrayIndex].statusClass = "badge-rejected";
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }
        window.loadSavedSystemOrders();
    };

    window.executeDeleteProcess = function(arrayIndex) {
        if (!confirm("Permanently delete this record?")) return;
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        currentOrders.splice(arrayIndex, 1);
        localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        window.loadSavedSystemOrders();
    };

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
                    bill: "",
                    statusText: "New Request",
                    statusClass: "badge-pending"
                };

                const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
                currentOrders.unshift(orderData);
                localStorage.setItem('namti_orders', JSON.stringify(currentOrders));

                window.loadSavedSystemOrders();
                playBeepNotification();

                alert("✅ Your Order has been placed successfully!");
                orderForm.reset();
            };
            fileEngineReader.readAsDataURL(photoFile);
        });
    }

    // FUNCTION TO EXECUTE PRINT TO PDF/PRINTERS AND ALLOW SMS/WHATSAPP SHARING
    window.printReceipt = function() {
        const receiptContent = document.getElementById('printable-receipt').innerHTML;
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        
        // Modal logic captures active state and allows easy native sharing
        const originalBody = document.body.innerHTML;
        document.body.innerHTML = `<div style="padding:40px; font-family:monospace; width:320px; margin:0 auto; border:1px dashed #000;">${receiptContent}</div>`;
        window.print();
        location.reload(); 
    };

    if (closeModalAction && paymentModalBox) {
        closeModalAction.addEventListener('click', () => { paymentModalBox.style.display = 'none'; });
    }

    window.loadSavedSystemOrders();
});
    
        
      

                          
