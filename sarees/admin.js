// SK Sarees - Admin Logic

// Mock Recent Orders Data (Would come from Firebase in production)
const recentOrders = [
    { id: '#ORD-7023', customer: 'Priya Sharma', date: '2026-08-01 10:30 AM', amount: 24500, payment: 'UPI', status: 'pending' },
    { id: '#ORD-7022', customer: 'Anjali Desai', date: '2026-08-01 09:15 AM', amount: 6700, payment: 'COD', status: 'shipped' },
    { id: '#ORD-7021', customer: 'Kavita Iyer', date: '2026-07-31 04:45 PM', amount: 14500, payment: 'UPI', status: 'delivered' },
    { id: '#ORD-7020', customer: 'Meera Reddy', date: '2026-07-31 02:20 PM', amount: 3200, payment: 'UPI', status: 'delivered' },
    { id: '#ORD-7019', customer: 'Roshni Patel', date: '2026-07-31 11:10 AM', amount: 8900, payment: 'COD', status: 'cancelled' },
];

const statusClasses = {
    'pending': 'status-pending',
    'shipped': 'status-shipped',
    'delivered': 'status-delivered',
    'cancelled': 'status-cancelled'
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Toggle Mobile
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-sidebar');

    menuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    // 2. Render Orders Table
    renderOrders();

    // 3. Initialize Charts
    initCharts();
});

function renderOrders() {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    recentOrders.forEach(order => {
        const tr = document.createElement('tr');
        
        // Generate Dropdown options
        const statuses = ['pending', 'shipped', 'delivered', 'cancelled'];
        let optionsHTML = '';
        statuses.forEach(s => {
            const selected = s === order.status ? 'selected' : '';
            optionsHTML += \`<option value="\${s}" \${selected}>\${s.charAt(0).toUpperCase() + s.slice(1)}</option>\`;
        });

        tr.innerHTML = \`
            <td><strong>\${order.id}</strong></td>
            <td>\${order.customer}</td>
            <td>\${order.date}</td>
            <td><strong>₹\${order.amount.toLocaleString('en-IN')}</strong></td>
            <td><span style="font-size:0.8rem; background:#eee; padding:2px 6px; border-radius:4px;">\${order.payment}</span></td>
            <td>
                <select class="status-select \${statusClasses[order.status]}" onchange="updateStatus(this, '\${order.id}')">
                    \${optionsHTML}
                </select>
            </td>
            <td>
                <button class="action-btn" title="View Details"><i class="fas fa-eye"></i></button>
            </td>
        \`;
        tbody.appendChild(tr);
    });
}

// Simulate Firebase Realtime Update
window.updateStatus = function(selectElement, orderId) {
    const newStatus = selectElement.value;
    
    // Update visual class
    selectElement.className = \`status-select \${statusClasses[newStatus]}\`;
    
    // Show Toast (Simulating DB Write Success)
    showToast(\`Order \${orderId} marked as \${newStatus}\`);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    msgEl.innerText = message;
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Chart.js Setup
function initCharts() {
    // Sales Chart
    const ctxSales = document.getElementById('salesChart').getContext('2d');
    new Chart(ctxSales, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [45000, 52000, 38000, 65000, 48000, 89000, 124500],
                borderColor: '#800000',
                backgroundColor: 'rgba(128, 0, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                x: { grid: { display: false } }
            }
        }
    });

    // Category Chart
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: ['Pure Silk', 'Soft Silk', 'Cotton', 'Party Wear'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: ['#800000', '#D4AF37', '#1565c0', '#4caf50'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}