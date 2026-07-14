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

    // STRICT VIEW PERSISTENCE
    const lastView = localStorage.getItem('namti_current_view') || 'customer';
    const customerView = document.getElementById('customer-view');
    const staffDashboard = document.getElementById('staff-dashboard');
    
    if (lastView === 'staff' && customerView && staffDashboard) {
        customerView.classList.remove('active-view');
        staffDashboard.classList.add('active-view');
    } else if (customerView && staffDashboard) {
        staffDashboard.classList.remove('active-view');
        customerView.classList.add('active-view');
    }

    // AUDIO CONTEXT NOTIFICATION ENGINE FOR INSTANT OVER-THE-AIR REFRESH
    let audioContext;
    function playBeepNotification() {
        try {
            if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let osc = audioContext.createOscillator();
            let gain = audioContext.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, audioContext.currentTime); 
            gain.gain.setValueAtTime(0.4, audioContext.currentTime); 
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start();
            osc.stop(audioContext.currentTime + 0.25);
        } catch(e) { console.log("Audio notification blocked."); }
    }

    // 1. FIXED MEDICAL INVENTIONS / QUOTATIONS VIEW LOGIC (No Loading Loop)
    const medicalInventionsContainer = document.getElementById('medical-inventions-container') || document.querySelector('.medical-quotation-box');
    if (medicalInventionsContainer) {
        const innovationsList = [
            "Penicillin discovery by Alexander Fleming (1928) revolutionized antibiotic treatments worldwide.",
            "The X-Ray system developed by Wilhelm Röntgen (1895) unlocked internal diagnostics infrastructure.",
            "Insulin extraction by Banting & Best (1921) transformed chronic diabetes healthcare frameworks."
        ];
        const randomQuote = innovationsList[Math.floor(Math.random() * innovationsList.length)];
        medicalInventionsContainer.innerHTML = `<div style="padding:12px; background:#f1f5f9; border-left:4px solid #0f172a; margin:10px 0; border-radius:4px;"><p style="font-style:italic; color:#334155; font-size:0.9rem; margin:0;">📢 <strong>Medical Fact:</strong> ${randomQuote}</p></div>`;
    }

    // INTER-TAB STORAGE TRIGGER
    window.addEventListener('storage', (e) => {
        if (e.key === 'namti_orders') {
            window.loadSavedSystemOrders();
            playBeepNotification();
        }
    });

    // POLLING MONITOR ENGINE (Tracks changes every 2 seconds for instantaneous UI reflection)
    let lastStateTracker = localStorage.getItem('namti_orders') || '[]';
    setInterval(() => {
        const currentState = localStorage.getItem('namti_orders') || '[]';
        if (currentState !== lastStateTracker) {
            lastStateTracker = currentState;
            window.loadSavedSystemOrders();
            playBeepNotification();
        }
    }, 2000);

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

        let actionButtons = '';
        let rowBlinkStyle = '';

        if (!data.statusText || data.statusText === 'New Request') {
            actionButtons = `<button class="sms-trigger-btn" onclick="window.executeSmsProcess(${indexPointer}, this)">Confirm & Send UPI QR ✅</button>`;
        } else if (data.statusText.includes("Awaiting Payment")) {
            // Check if customer submitted transaction verification details
            if (data.utrNumber) {
                rowBlinkStyle = 'background-color: #fef08a; animation: pulse 2s infinite;'; // Bright yellow blink indicator
                actionButtons = `
                    <div style="background:#fff; border:1px solid #e2e8f0; padding:6px; border-radius:6px; margin-bottom:4px; font-size:0.8rem; text-align:left;">
                        <strong>UTR:</strong> ${data.utrNumber}<br><strong>Amt Paid:</strong> ₹${data.submittedAmount}
                    </div>
                    <button class="paid-trigger-btn" style="background:#16a34a; color:white; border:none; padding:0.5rem; border-radius:6px; cursor:pointer; width:100%; font-weight:bold;" onclick="window.markAsPaid(${indexPointer}, this)">Verify & Send Receipt SMS 📄</button>
                `;
            } else {
                actionButtons = `<small style="color:#64748b; display:block; margin-bottom:4px;">Waiting for Customer Action...</small>
                                 <button class="paid-trigger-btn" style="background:#2563eb; color:white; border:none; padding:0.5rem; border-radius:6px; cursor:pointer;" onclick="window.markAsPaid(${indexPointer}, this)">Manual Mark Paid 💰</button>`;
            }
        } else if (data.statusText.includes("Paid")) {
            actionButtons = `<button class="receipt-trigger-btn" style="background:#7c3aed; color:white; border:none; padding:0.5rem; border-radius:6px; cursor:pointer;" onclick="window.generateAndOpenReceipt(${indexPointer}, this)">View & Print Receipt 🖨️</button>`;
        }

        if(rowBlinkStyle) { row.style = rowBlinkStyle; }
        const displayMedicines = data.medicines ? data.medicines.replace(/\n/g, '<br>') : 'No written description';

        row.innerHTML = `
            <td><strong>${data.name}</strong><br><small>${data.phone}</small></td>
            <td>${data.village}<br><small data-pin="${data.pincode}">PIN: ${data.pincode} | ${data.district}</small></td>
            <td><div style="max-height:80px; overflow-y:auto; font-size:0.85rem; color:#334155; line-height: 1.4;">${displayMedicines}</div>${prescriptionVisualControl}</td>
            <td><input type="number" class="bill-input" value="${data.bill || ''}" placeholder="₹" ${data.statusText && data.statusText.includes("Paid") ? 'disabled' : ''} oninput="window.calculateLiveRevenue()"></td>
            <td><span class="badge ${data.statusClass || 'badge-pending'} status-field">${data.statusText || 'New Request'}</span></td>
            <td>
                <div class="action-flex" style="flex-direction:column; gap:4px;">
                    ${actionButtons}
                    <div style="display:flex; gap:2px; margin-top:2px;">
                        <button class="reject-trigger-btn" onclick="window.executeRejectProcess(${indexPointer}, this)">Reject ❌</button>
                        <button class="delete-trigger-btn" onclick="window.executeDeleteProcess(${indexPointer})">🗑️</button>
                    </div>
                </div>
            </td>
        `;
        adminOrdersLog.appendChild(row);
    }

    // STAGE 1: SYSTEM INVOICE OUTBOUND INTERFACE WITH CUSTOMER PAYMENT ACTION WEB-FORM LINK
    window.executeSmsProcess = function(arrayIndex, buttonElement) {
        const rowItem = buttonElement.closest('tr');
        const phoneText = rowItem.cells[0].querySelector('small').textContent.trim();
        const customerName = rowItem.cells[0].querySelector('strong').textContent;
        const billVal = parseFloat(rowItem.querySelector('.bill-input').value) || 0;
        
        if (!billVal) { alert("Please enter Bill Amount first!"); return; }

        const targetPin = rowItem.cells[1].querySelector('small').getAttribute('data-pin');
        let mode = (targetPin.trim() === "785684" && billVal >= 1999) ? "Home Delivery" : "Self Collection";
        
        const upiId = "hussain.abidur@ybl";
        const merchantName = "Namti Drug House";

        const upiRawPayload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${billVal}&cu=INR&tn=MedicineBill`;
        const qrScreenUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiRawPayload)}`;

        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].bill = billVal;
            currentOrders[arrayIndex].statusText = "Awaiting Payment (" + mode + ")";
            currentOrders[arrayIndex].statusClass = "badge-pending";
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }

        // Direct standard system browser gateway URL where customer logs transaction ID to trigger instant portal popups
        const smsMsg = `Hello ${customerName},\nYour invoice is ready at Namti Drug House.\nNet Payable: Rs. ${billVal}\n\n👉 Click link to scan QR and instantly update payment status to staff:\n${qrScreenUrl}\n\nThank you!`;
        
        window.location.href = `sms:+91${phoneText}?body=${encodeURIComponent(smsMsg)}`;
        window.loadSavedSystemOrders();
    };

    // STAGE 2: VERIFICATION COMPLETE AND DISPATCH RECEIPT OUTBOUND SMS PIPELINE
    window.markAsPaid = function(arrayIndex, buttonElement) {
        if (!confirm("Confirm payment receipt? This will lock data logs and prepare the SMS receipt transmission flow.")) return;
        
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        if (currentOrders[arrayIndex]) {
            currentOrders[arrayIndex].statusText = "Paid & Verified Successfully";
            currentOrders[arrayIndex].statusClass = "badge-delivery";
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
            
            const customerPhone = currentOrders[arrayIndex].phone;
            const customerName = currentOrders[arrayIndex].name;
            const absoluteBill = currentOrders[arrayIndex].bill;

            // Triggering the instant post-payment confirmation message pipeline 
            setTimeout(() => {
                const receiptSmsMsg = `Dear ${customerName},\nYour payment of Rs. ${absoluteBill} has been successfully verified at Namti Drug House. Your order is processed.\nReceipt ID: NDH-${Math.floor(1000 + Math.random() * 9000)}\n\nThank you for choosing us!`;
                window.location.href = `sms:+91${customerPhone}?body=${encodeURIComponent(receiptSmsMsg)}`;
            }, 800);
        }
        window.loadSavedSystemOrders();
    };

    // CUSTOMER ENTRY HOOK BACKWARD MAPPING INTERFACE (Simulates consumer logging UTR into portal from browser setup)
    window.submitCustomerUtrLog = function(targetPhone, transactionId, amountPaid) {
        const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
        const index = currentOrders.findIndex(order => order.phone.trim() === targetPhone.trim());
        if(index !== -1) {
            currentOrders[index].utrNumber = transactionId;
            currentOrders[index].submittedAmount = amountPaid;
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
            window.loadSavedSystemOrders();
            playBeepNotification();
        }
    };

    // STAGE 3: INVOICE PRINT PIPELINE
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

    window.printReceipt = function() {
        const receiptContent = document.getElementById('printable-receipt').innerHTML;
        const originalBody = document.body.innerHTML;
        
        document.body.innerHTML = `<div style="padding:40px; font-family:monospace; width:320px; margin:0 auto; border:1px dashed #000;">${receiptContent}</div>`;
        window.print();
        
        document.body.innerHTML = originalBody;
        localStorage.setItem('namti_current_view', 'staff');
        location.reload(); 
    };

    if (closeModalAction && paymentModalBox) {
        closeModalAction.addEventListener('click', () => { paymentModalBox.style.display = 'none'; });
    }

    window.loadSavedSystemOrders();
});
                          
        
      

                          
