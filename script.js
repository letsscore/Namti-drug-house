document.addEventListener('DOMContentLoaded', () => {
    // Views
    const customerView = document.getElementById('customer-view');
    const employeeDashboard = document.getElementById('employee-dashboard');

    // Navigation links/Buttons
    const staffLoginLnk = document.getElementById('staff-login-lnk');
    const logoutBtn = document.getElementById('logout-btn');

    // Dashboard tabs switching
    const tabOrders = document.getElementById('tab-orders');
    const tabInventory = document.getElementById('tab-inventory');
    const ordersPanel = document.getElementById('orders-panel');
    const inventoryPanel = document.getElementById('inventory-panel');

    // Forms & Logs
    const refillForm = document.getElementById('refill-form');
    const ordersLog = document.getElementById('orders-log');

    // --- VIEW CONTROLLER LOGIC ---
    // Handle Staff Gateway Authorization
    staffLoginLnk.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Simple client gate token password setup for demo purposes
        const passcode = prompt("Enter Namti Drug House Employee Security Passcode:");
        
        if(passcode === "namti123") {
            customerView.classList.add('hidden-view');
            employeeDashboard.classList.remove('hidden-view');
        } else if (passcode !== null) {
            alert("Unauthorized Access. Invalid Pin Code.");
        }
    });

    // Handle Dashboard Exit
    logoutBtn.addEventListener('click', () => {
        employeeDashboard.classList.add('hidden-view');
        customerView.classList.remove('hidden-view');
    });

    // --- DASHBOARD TAB CONTROLLER ---
    tabOrders.addEventListener('click', () => {
        tabOrders.classList.add('active-tab');
        tabInventory.classList.remove('active-tab');
        ordersPanel.classList.remove('hidden-panel');
        inventoryPanel.classList.add('hidden-panel');
    });

    tabInventory.addEventListener('click', () => {
        tabInventory.classList.add('active-tab');
        tabOrders.classList.remove('active-tab');
        inventoryPanel.classList.remove('hidden-panel');
        ordersPanel.classList.add('hidden-panel');
    });

    // --- LIVE SIMULATION SYSTEM ---
    // Intercept customer upload, and push it directly into the dashboard row stack!
    refillForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const fileInput = document.getElementById('prescription-file');
        const filename = fileInput.files[0] ? fileInput.files[0].name : "prescription.jpg";

        // Create new interactive dynamic row object inside the internal tracking dashboard
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>Just Now</td>
            <td><strong>${name}</strong></td>
            <td>${phone}</td>
            <td><a href="#" class="view-link" style="color:#14b8a6; font-weight:600;">${filename}</a></td>
            <td><span class="status-badge pending">New Order Received</span></td>
        `;

        // Prepend new upload entries to the top of list
        ordersLog.insertBefore(newRow, ordersLog.firstChild);

        alert(`Success! Prescription submitted. Show the owner the 'Staff Login' tab to see it live!`);
        refillForm.reset();
    });
});
      
