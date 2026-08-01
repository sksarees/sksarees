// SK Sarees - Main Application Logic

// Mock Product Database (Usually from Firebase)
const products = [
    {
        id: "SK101",
        name: "Kanchipuram Pure Silk Bridal Saree",
        price: 24500,
        oldPrice: 32000,
        category: "Silk",
        image: "https://images.unsplash.com/photo-1610189013444-933fb0122e23?q=80&w=500&h=667&fit=crop",
        badge: "HOT",
        badgeType: "badge-offer"
    },
    {
        id: "SK102",
        name: "Handwoven Cotton Linen",
        price: 3200,
        oldPrice: 4500,
        category: "Cotton",
        image: "https://images.unsplash.com/photo-1583391733958-d25e07fac092?q=80&w=500&h=667&fit=crop",
        badge: "NEW",
        badgeType: "badge-new"
    },
    {
        id: "SK103",
        name: "Mysore Crepe Soft Silk",
        price: 8900,
        oldPrice: 11000,
        category: "Soft Silk",
        image: "https://images.unsplash.com/photo-1605915239019-3c3d526fb517?q=80&w=500&h=667&fit=crop",
        badge: null
    },
    {
        id: "SK104",
        name: "Designer Georgette Party Wear",
        price: 5400,
        oldPrice: 7200,
        category: "Party Wear",
        image: "https://images.unsplash.com/photo-1589465885857-44edb59bbff2?q=80&w=500&h=667&fit=crop",
        badge: "20% OFF",
        badgeType: "badge-offer"
    },
    {
        id: "SK105",
        name: "Banarasi Brocade Silk",
        price: 14500,
        oldPrice: 18000,
        category: "Silk",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&h=667&fit=crop",
        badge: null
    },
    {
        id: "SK106",
        name: "Chettinad Cotton Daily Wear",
        price: 1450,
        oldPrice: 1999,
        category: "Cotton",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=500&h=667&fit=crop",
        badge: "BESTSELLER",
        badgeType: "badge-offer"
    },
    {
        id: "SK107",
        name: "Tussar Silk with Zari Border",
        price: 6700,
        oldPrice: 8500,
        category: "Silk",
        image: "https://images.unsplash.com/photo-1610189013444-933fb0122e23?q=80&w=500&h=667&fit=crop",
        badge: null
    },
    {
        id: "SK108",
        name: "Kalamkari Printed Saree",
        price: 2100,
        oldPrice: 2800,
        category: "Printed",
        image: "https://images.unsplash.com/photo-1583391733958-d25e07fac092?q=80&w=500&h=667&fit=crop",
        badge: "NEW",
        badgeType: "badge-new"
    }
];

// State
let cart = [];
const BUSINESS_WHATSAPP = "919876543210"; // Without '+'
const UPI_ID = "sksarees@ybl";
const UPI_NAME = "SKSarees";

// DOM Elements
const gridContainer = document.getElementById('trending-grid');
const cartBadges = document.querySelectorAll('.badge');
const cartOverlay = document.getElementById('cart-overlay');
const cartSidebar = document.getElementById('cart-sidebar');
const cartTriggers = document.querySelectorAll('.cart-trigger');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartDiscountEl = document.getElementById('cart-discount');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutBtn = document.getElementById('close-checkout');
const confirmOrderBtn = document.getElementById('confirm-order-btn');
const payOptions = document.querySelectorAll('input[name="payment"]');
const upiSection = document.getElementById('upi-section');
const dynamicQr = document.getElementById('dynamic-qr');
const finalPayAmount = document.getElementById('final-pay-amount');

// Initialize
function init() {
    if(document.getElementById('trending-grid')) {
        renderProducts(gridContainer, products);
    }
    if(document.getElementById('related-grid')) {
        const relatedGrid = document.getElementById('related-grid');
        // Get 4 random products or top 4 for related
        const relatedProducts = products.slice(1, 5);
        renderProducts(relatedGrid, relatedProducts);
    }
    loadCart();
    attachEventListeners();
    startFlashTimer();
}

// Render Products
function renderProducts(container, data) {
    container.innerHTML = '';
    data.forEach(product => {
        const badgeHTML = product.badge ? `<div class="product-badges"><span class="badge-tag ${product.badgeType}">${product.badge}</span></div>` : '';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrap">
                ${badgeHTML}
                <button class="wishlist-btn"><i class="far fa-heart"></i></button>
                <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy" onclick="window.location.href='product.html'" style="cursor:pointer">
            </div>
            <div class="product-info">
                <h3 class="product-title" onclick="window.location.href='product.html'" style="cursor:pointer">${product.name}</h3>
                <div class="product-price-row">
                    <span class="price-current">₹${product.price.toLocaleString('en-IN')}</span>
                    ${product.oldPrice ? `<span class="price-old">₹${product.oldPrice.toLocaleString('en-IN')}</span>` : ''}
                </div>
                <button class="btn-add-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Cart Logic
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    
    saveCart();
    updateCartUI();
    toggleCart(true);
}

function updateQty(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    // Update badges
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadges.forEach(badge => {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });

    // Render items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>Your cart is empty.</p>
                <button class="btn btn-primary mt-3" onclick="toggleCart(false)">Continue Shopping</button>
            </div>
        `;
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = '0.5';
    } else {
        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="cart-qty-ctrl">
                            <button onclick="updateQty('${item.id}', -1)">-</button>
                            <span>${item.qty}</span>
                            <button onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(el);
        });
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
    }

    // Update Totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const oldTotal = cart.reduce((sum, item) => sum + ((item.oldPrice || item.price) * item.qty), 0);
    const discount = oldTotal - subtotal;
    
    cartSubtotalEl.innerText = \`₹\${oldTotal.toLocaleString('en-IN')}\`;
    cartDiscountEl.innerText = \`-₹\${discount.toLocaleString('en-IN')}\`;
    cartTotalEl.innerText = \`₹\${subtotal.toLocaleString('en-IN')}\`;
}

function saveCart() { localStorage.setItem('skCart', JSON.stringify(cart)); }
function loadCart() {
    const saved = localStorage.getItem('skCart');
    if (saved) cart = JSON.parse(saved);
    updateCartUI();
}

// UI Toggles
function toggleCart(show) {
    if (show) {
        cartOverlay.classList.add('active');
        cartSidebar.classList.add('active');
    } else {
        cartOverlay.classList.remove('active');
        cartSidebar.classList.remove('active');
    }
}

function toggleCheckoutModal(show) {
    if (show) {
        if (cart.length === 0) return alert("Cart is empty!");
        toggleCart(false);
        checkoutModal.classList.add('active');
        
        // Setup UPI Dynamic QR
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        finalPayAmount.innerText = \`₹\${totalAmount.toLocaleString('en-IN')}\`;
        
        const upiString = \`upi://pay?pa=\${UPI_ID}&pn=\${UPI_NAME}&am=\${totalAmount}&cu=INR\`;
        dynamicQr.src = \`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(upiString)}\`;
        
    } else {
        checkoutModal.classList.remove('active');
    }
}

// Event Listeners
function attachEventListeners() {
    cartTriggers.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); toggleCart(true); }));
    closeCartBtn.addEventListener('click', () => toggleCart(false));
    cartOverlay.addEventListener('click', () => toggleCart(false));
    
    checkoutBtn.addEventListener('click', () => toggleCheckoutModal(true));
    closeCheckoutBtn.addEventListener('click', () => toggleCheckoutModal(false));
    
    // Payment Method Toggle
    payOptions.forEach(opt => {
        opt.addEventListener('change', (e) => {
            if(e.target.value === 'upi') {
                upiSection.classList.add('active');
                confirmOrderBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Confirm & Send via WhatsApp';
            } else {
                upiSection.classList.remove('active');
                confirmOrderBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Place COD Order via WhatsApp';
            }
        });
    });

    // Final Checkout Submission
    confirmOrderBtn.addEventListener('click', submitOrderViaWhatsApp);
}

// WhatsApp Checkout Formatting
function submitOrderViaWhatsApp() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const payMethod = document.querySelector('input[name="payment"]:checked').value;
    
    if (!name || !phone || !address) {
        return alert("Please fill in all delivery details.");
    }
    
    let text = \`*New Order - SK Sarees*%0A%0A\`;
    text += \`*Customer Details:*%0AName: \${name}%0APhone: \${phone}%0AAddress: \${address}%0A%0A*Order Items:*%0A\`;
    
    let total = 0;
    cart.forEach((item, index) => {
        text += \`\${index+1}. \${item.name} (x\${item.qty}) - ₹\${(item.price * item.qty).toLocaleString('en-IN')}%0A\`;
        total += (item.price * item.qty);
    });
    
    text += \`%0A*Grand Total: ₹\${total.toLocaleString('en-IN')}*%0A\`;
    
    if(payMethod === 'upi') {
        text += \`Payment Method: *UPI / Online*%0A_(Please attach payment screenshot below)_\`;
    } else {
        text += \`Payment Method: *Cash on Delivery (COD)*\`;
    }
    
    const waUrl = \`https://wa.me/\${BUSINESS_WHATSAPP}?text=\${text}\`;
    
    // Clear cart after checkout initiation (optional)
    cart = [];
    saveCart();
    updateCartUI();
    toggleCheckoutModal(false);
    
    window.open(waUrl, '_blank');
}

// Flash Sale Timer Simulator
function startFlashTimer() {
    const timerEl = document.getElementById('timer');
    if(!timerEl) return;
    
    let hours = 4, mins = 19, secs = 59;
    setInterval(() => {
        secs--;
        if (secs < 0) { secs = 59; mins--; }
        if (mins < 0) { mins = 59; hours--; }
        if (hours < 0) { hours = 0; mins = 0; secs = 0; }
        
        const h = String(hours).padStart(2, '0');
        const m = String(mins).padStart(2, '0');
        const s = String(secs).padStart(2, '0');
        timerEl.innerText = \`\${h}:\${m}:\${s}\`;
    }, 1000);
}

// Run
document.addEventListener('DOMContentLoaded', init);