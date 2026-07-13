// 1. GLOBAL SCOPE ENGINE FOR VIEW SWITCHING WITH LOCKS
window.ViewManager = {
    switchToStaff: function() {
        const customerView = document.getElementById('customer-view');
        const staffDashboard = document.getElementById('staff-dashboard');
        if (customerView && staffDashboard) {
            customerView.classList.remove('active-view');
            staffDashboard.classList.add('active-view');
            localStorage.setItem('namti_current_view', 'staff');
            window.scrollTo(0, 0);
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

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-submission-form');
    const adminOrdersLog = document.getElementById('admin-orders-log');
    const paymentModalBox = document.getElementById('payment-modal-box');
    const closeModalAction = document.getElementById('close-modal-action');

    // DYNAMIC HEALTH QUOTES ROTATOR ENGINE
    const healthQuotes = [
        `"Your health is your greatest wealth. We care for your speedy recovery."`,
        `"Medicines cure diseases, but only pharmacists can optimize your therapy."`,
        `"Good health and good sense are two of life's greatest blessings."`,
        `"To ensure good health: eat lightly, breathe deeply, live moderately, and cultivate cheerfulness."`,
        `"Namti Drug House: Committed to your wellness, every single day."`
    ];
    let currentQuoteIndex = 0;
    setInterval(() => {
        currentQuoteIndex = (currentQuoteIndex + 1) % healthQuotes.length;
        const quoteEl = document.getElementById('dynamic-quote');
        if(quoteEl) quoteEl.textContent = healthQuotes[currentQuoteIndex];
    }, 7000); // Har 7 seconds mein badlega

    // STATE VIEW SYNC RESCUE LOCK
    const lastView = localStorage.getItem('namti_current_view');
    if (lastView === 'staff') { window.ViewManager.switchToStaff(); } 
    else { window.ViewManager.switchToCustomer(); }

    // DATA RESTORATION FROM MEMORY
    const savedOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
    savedOrders.forEach(orderData => { renderOrderRow(orderData, false); });
    calculateLiveRevenue();

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
            revenueDisplay.textContent = `Total Successful Orders: ₹ ${currentDayTotal.toFixed(2)}`;
        }
    };

    function renderOrderRow(data, shouldSave = true) {
        if (!adminOrdersLog) return;
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><strong>${data.name}</strong><br><small>${data.phone}</small></td>
            <td>${data.village}<br><small data-pin="${data.pincode}">PIN: ${data.pincode} | ${data.district}</small></td>
            <td>${data.medicines}<br>${data.photoHTML}</td>
            <td><input type="number" class="bill-input" value="${data.bill || ''}" placeholder="₹" oninput="calculateLiveRevenue()"></td>
            <td><span class="badge ${data.statusClass} status-field">${data.statusText}</span></td>
            <td><button class="sms-trigger-btn">Process Order 💬</button></td>
        `;
        
        adminOrdersLog.insertBefore(newRow, adminOrdersLog.firstChild);
        attachSmsAction(newRow);

        if (shouldSave) {
            const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
            currentOrders.unshift(data);
            localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
        }
    }

    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const photoFile = document.getElementById('prescription-photo').files[0];
            let photoHTML = `<span style="color:gray; font-size:0.8rem;">No Photo</span>`;
            if (photoFile) photoHTML = `<span style="color:green; font-size:0.8rem; font-weight:700;">📄 Attached</span>`;

            const orderData = {
                name: document.getElementById('cust-name').value,
                phone: document.getElementById('cust-phone').value,
                village: document.getElementById('cust-village').value,
                pincode: document.getElementById('cust-pincode').value,
                district: document.getElementById('cust-district').value,
                medicines: document.getElementById('medicine-details').value,
                photoHTML: photoHTML,
                statusText: "New Request",
                statusClass: "badge-pending"
            };

            renderOrderRow(orderData);
            if (paymentModalBox) paymentModalBox.style.display = 'flex';
            orderForm.reset();
        });
    }

    if (closeModalAction && paymentModalBox) {
        closeModalAction.addEventListener('click', () => { paymentModalBox.style.display = 'none'; });
    }

    function attachSmsAction(rowItem) {
        const btn = rowItem.querySelector('.sms-trigger-btn');
        if (!btn) return;
        
        btn.addEventListener('click', () => {
            const phoneText = rowItem.cells[0].querySelector('small').textContent;
            const customerName = rowItem.cells[0].querySelector('strong').textContent;
            const billVal = parseFloat(rowItem.querySelector('.bill-input').value) || 0;
            
            if (!billVal) { alert("Please enter Bill Amount first!"); return; }

            const targetPin = rowItem.cells[1].querySelector('small').getAttribute('data-pin');
            let mode = (targetPin === "785684" && billVal >= 1999) ? "Home Delivery" : "Self Collection";
            
            const statusField = rowItem.querySelector('.status-field');
            if (statusField) {
                statusField.textContent = "Confirmed: " + mode;
                statusField.className = "badge status-field " + (mode === "Home Delivery" ? "badge-delivery" : "badge-pickup");
            }
            
            const currentOrders = JSON.parse(localStorage.getItem('namti_orders') || '[]');
            const rowIndex = Array.from(adminOrdersLog.children).indexOf(rowItem);
            if (currentOrders[rowIndex]) {
                currentOrders[rowIndex].bill = billVal;
                currentOrders[rowIndex].statusText = "Confirmed: " + mode;
                currentOrders[rowIndex].statusClass = (mode === "Home Delivery" ? "badge-delivery" : "badge-pickup");
                localStorage.setItem('namti_orders', JSON.stringify(currentOrders));
            }

            calculateLiveRevenue();

            const msg = `Hello ${customerName}, order verified at Namti Drug House.\nTotal Bill: Rs. ${billVal}\nMode: ${mode}\n\n👉 Pay Securely via Link:\nhttps://gpay.app.goo.gl/pay?pa=hussain.abidur@ybl&pn=Namti%20Drug%20House&am=${billVal}&cu=INR&tn=Medicine`;
            window.location.href = `sms:+91${phoneText}?body=${encodeURIComponent(msg)}`;
        });
    }
});
                                                                             
                          
