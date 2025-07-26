document.addEventListener('DOMContentLoaded', function() {
    // Cart functionality
    const cart = [];
    const cartModal = document.querySelector('.cart-modal');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCount = document.getElementById('cart-count');
    const totalAmount = document.getElementById('total-amount');
    const checkoutBtn = document.getElementById('checkout-whatsapp');
    const closeBtn = document.querySelector('.close');
    
    // Open cart when cart icon is clicked
    document.querySelector('.cart').addEventListener('click', function() {
        updateCartModal();
        cartModal.style.display = 'flex';
    });
    
    // Close cart modal
    closeBtn.addEventListener('click', function() {
        cartModal.style.display = 'none';
    });
    
    // Close when clicking outside modal
    window.addEventListener('click', function(event) {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            const productPrice = parseFloat(this.getAttribute('data-price'));
            
            // Check if product already in cart
            const existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    quantity: 1
                });
            }
            
            updateCartCount();
        });
    });
    
    // Update cart count
    function updateCartCount() {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Update cart modal
    function updateCartModal() {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
            totalAmount.textContent = '0.00';
            return;
        }
        
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)} each</p>
                </div>
                <div class="cart-item-controls">
                    <button class="decrease">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase">+</button>
                    <span class="remove-item" data-id="${item.id}">&times;</span>
                </div>
                <div class="cart-item-total">
                    $${itemTotal.toFixed(2)}
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItemElement);
            
            // Add event listeners for the buttons we just created
            cartItemElement.querySelector('.decrease').addEventListener('click', () => {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                    updateCartModal();
                }
                updateCartCount();
            });
            
            cartItemElement.querySelector('.increase').addEventListener('click', () => {
                item.quantity += 1;
                updateCartModal();
                updateCartCount();
            });
            
            cartItemElement.querySelector('.remove-item').addEventListener('click', () => {
                const index = cart.findIndex(cartItem => cartItem.id === item.id);
                if (index !== -1) {
                    cart.splice(index, 1);
                    updateCartModal();
                    updateCartCount();
                }
            });
        });
        
        totalAmount.textContent = total.toFixed(2);
    }
    
    // WhatsApp checkout
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        // Replace with your WhatsApp number (include country code, remove +)
        const whatsappNumber = '1234567890'; 
        
        // Create order message
        let message = 'Hello! I would like to place an order:\n\n';
        
        cart.forEach(item => {
            message += `${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        
        message += `\nTotal: $${totalAmount.textContent}\n\n`;
        message += 'Please confirm my order. Thank you!';
        
        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Open WhatsApp with the message
        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    });
});
