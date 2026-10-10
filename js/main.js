// js/main.js

// Cart state management using localStorage
let cart = JSON.parse(localStorage.getItem('prakash_cart')) || [];

// Save cart to local storage and update icon count
function saveCart() {
    localStorage.setItem('prakash_cart', JSON.stringify(cart));
    updateCartIcon();
}

function updateCartIcon() {
    const cartCounts = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCounts.forEach(el => el.textContent = totalItems);
}

// Add to Cart Function
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    alert(`${product.name} added to cart!`);
}

// Generate Product HTML Card
function createProductCard(product) {
    return `
        <div class="product-card">
            <a href="product.html?id=${product.id}">
                <img src="${product.image}" alt="${product.name}">
            </a>
            <div class="product-info">
                <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
                <p class="price">₹${product.price}</p>
                <button class="btn primary-btn w-100" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `;
}

// Initialize Page specific logic
document.addEventListener('DOMContentLoaded', () => {
    updateCartIcon();

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if(menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // --- HOME PAGE LOGIC ---
    const featuredContainer = document.getElementById('featured-products');
    if (featuredContainer) {
        // Display first 4 products on home page
        const featuredProducts = products.slice(0, 4);
        featuredContainer.innerHTML = featuredProducts.map(createProductCard).join('');
    }

    // --- SHOP PAGE LOGIC ---
    const allProductsContainer = document.getElementById('all-products');
    if (allProductsContainer) {
        allProductsContainer.innerHTML = products.map(createProductCard).join('');
    }

    // --- PRODUCT DETAIL PAGE LOGIC ---
    const productDetailContainer = document.getElementById('product-detail-container');
    if (productDetailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        const product = products.find(p => p.id === productId);

        if (product) {
            document.title = `${product.name} | Prakash Decor`;
            productDetailContainer.innerHTML = `
                <div class="product-detail-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <p class="detail-price">₹${product.price}</p>
                    <p class="description">${product.description}</p>
                    
                    <div class="features">
                        <p>✓ Handcrafted & Premium Quality</p>
                        <p>✓ Fast Festive Delivery</p>
                        <p>✓ Cash on Delivery Available</p>
                    </div>

                    <button class="btn primary-btn detail-btn" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            `;
        } else {
            productDetailContainer.innerHTML = `<p>Product not found. <a href="shop.html">Return to Shop</a></p>`;
        }
    }

    // --- CART PAGE LOGIC ---
    renderCart();
});

// Cart Page Rendering & Logic
function renderCart() {
    const cartContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total-amount');
    
    if (!cartContainer) return; // Not on cart page

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-cart">Your cart is empty. <a href="shop.html">Shop Now</a></p>';
        document.getElementById('checkout-form-container').style.display = 'none';
        cartTotalEl.textContent = '₹0';
        return;
    }

    document.getElementById('checkout-form-container').style.display = 'block';
    let total = 0;
    
    cartContainer.innerHTML = cart.map((item, index) => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-control">
                        <button onclick="updateQty(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQty(${index}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    cartTotalEl.textContent = `₹${total}`;
}

function updateQty(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

// Checkout to WhatsApp Logic
function submitOrder(event) {
    event.preventDefault();
    if(cart.length === 0) return alert("Cart is empty!");

    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const address = document.getElementById('c-address').value;

    let total = 0;
    let orderDetails = cart.map(item => {
        total += item.price * item.quantity;
        return `${item.quantity}x ${item.name} (₹${item.price})`;
    }).join('\n');

    const whatsappMessage = `*NEW ORDER - PRAKASH DECOR* 🪔\n\n*Customer Details:*\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n*Order Items:*\n${orderDetails}\n\n*Total Amount:* ₹${total}\n\nPayment Preference: Online UPI / COD`;

    // Replace with your actual WhatsApp Number (Format: 91XXXXXXXXXX)
    const sellerWhatsAppNumber = "919000000000"; 
    
    const whatsappUrl = `https://wa.me/${sellerWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Clear cart and redirect
    cart = [];
    saveCart();
    window.open(whatsappUrl, '_blank');
    window.location.href = "index.html"; // Redirect back home
}