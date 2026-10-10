// js/main.js

let cart = JSON.parse(localStorage.getItem('prakash_cart')) || [];

function saveCart() {
    localStorage.setItem('prakash_cart', JSON.stringify(cart));
    updateCartIcon();
}

function updateCartIcon() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = totalItems);
}

function addToCart(productId, isCombo = false) {
    let product;
    if (isCombo) {
        product = { id: 'combo_' + productId, name: "Shubh Deepawali Combo Pack", price: 1299, image: "images/1.jpeg" };
    } else {
        product = products.find(p => p.id === productId);
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) { existingItem.quantity += 1; } 
    else { cart.push({ ...product, quantity: 1 }); }
    
    saveCart();
    alert(`${product.name} added to cart!`);
    if(document.getElementById('cart-items-container')) renderCart();
}

function createProductCard(product) {
    return `
        <div class="product-card">
            <div class="promo-badge">BUY 2 GET 1 FREE</div>
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

document.addEventListener('DOMContentLoaded', () => {
    updateCartIcon();
    initParticles();
    initCountdown();

    const featuredContainer = document.getElementById('featured-products');
    if (featuredContainer) featuredContainer.innerHTML = products.slice(0, 4).map(createProductCard).join('');

    const allProductsContainer = document.getElementById('all-products');
    if (allProductsContainer) allProductsContainer.innerHTML = products.map(createProductCard).join('');

    const productDetailContainer = document.getElementById('product-detail-container');
    if (productDetailContainer) {
        const productId = parseInt(new URLSearchParams(window.location.search).get('id'));
        const product = products.find(p => p.id === productId);

        if (product) {
            document.title = `${product.name} | Prakash Decor`;
            
            let extraImagesHTML = '';
            if (product.extraImages && product.extraImages.length > 0) {
                extraImagesHTML = `
                    <div class="thumbnail-gallery">
                        <img src="${product.image}" class="thumb active" onclick="changeMainImage(this.src, this)">
                        ${product.extraImages.map(img => `<img src="${img}" class="thumb" onclick="changeMainImage(this.src, this)">`).join('')}
                    </div>
                `;
            }

            productDetailContainer.innerHTML = `
                <div class="product-detail-image">
                    <img id="main-product-image" src="${product.image}" alt="${product.name}">
                    ${extraImagesHTML}
                </div>
                <div class="product-detail-info">
                    <div class="b2g1-callout">🪔 Diwali Offer: BUY 2 GET 1 FREE</div>
                    <h1>${product.name}</h1>
                    <p class="detail-price">₹${product.price}</p>
                    <p class="description">${product.description}</p>
                    <button class="btn primary-btn w-100" onclick="addToCart(${product.id})">Add to Cart</button>
                    
                    <div class="combo-pack">
                        <h3>🎁 Shubh Deepawali Combo Pack</h3>
                        <p>Om Diya Platter + 50 Pure Cotton Wicks + Decorative Gift Box</p>
                        <p class="combo-price">₹1299 <span>₹1449</span></p>
                        <button class="btn primary-btn" style="background:var(--primary-red); color:var(--primary-gold);" onclick="addToCart(${product.id}, true)">Add Combo to Cart</button>
                    </div>
                </div>
            `;
        }
    }

    renderCart();
});

function changeMainImage(newSrc, thumbElement) {
    document.getElementById('main-product-image').src = newSrc;
    document.querySelectorAll('.thumb').forEach(el => el.classList.remove('active'));
    thumbElement.classList.add('active');
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty. <a href="shop.html">Shop Now</a></p>';
        document.getElementById('checkout-form-container').style.display = 'none';
        return;
    }

    document.getElementById('checkout-form-container').style.display = 'block';
    
    // Flat array for B2G1 calculation
    let flatCart = [];
    cart.forEach(item => {
        for(let i=0; i<item.quantity; i++) flatCart.push(item);
    });
    
    // Sort descending by price to deduct cheapest items
    flatCart.sort((a,b) => b.price - a.price);
    
    let subtotal = 0;
    let b2g1Discount = 0;
    
    flatCart.forEach((item, index) => {
        subtotal += item.price;
        if ((index + 1) % 3 === 0) b2g1Discount += item.price; // Every 3rd item is free
    });

    let html = '';
    const itemsNeededForNextFree = 3 - (totalItems % 3);
    if (itemsNeededForNextFree < 3) {
        html += `<div class="cart-progress">Add ${itemsNeededForNextFree} more item(s) to unlock another FREE Diya!</div>`;
    } else {
        html += `<div class="cart-progress">You've unlocked a FREE item!</div>`;
    }

    html += cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details"><h4>${item.name}</h4><p>₹${item.price}</p></div>
            <div class="cart-item-actions">
                <div class="qty-control">
                    <button onclick="updateQty(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQty(${index}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;

    let finalTotal = subtotal - b2g1Discount;
    document.getElementById('summary-subtotal').textContent = `₹${subtotal}`;
    document.getElementById('summary-discount').textContent = `- ₹${b2g1Discount}`;
    document.getElementById('summary-total').textContent = `₹${finalTotal}`;
}

function updateQty(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart(); renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart(); renderCart();
}

function submitOrder(event) {
    event.preventDefault();
    if(cart.length === 0) return;

    let flatCart = [];
    cart.forEach(item => { for(let i=0; i<item.quantity; i++) flatCart.push(item); });
    flatCart.sort((a,b) => b.price - a.price);
    
    let subtotal = 0;
    let b2g1Discount = 0;
    flatCart.forEach((item, index) => {
        subtotal += item.price;
        if ((index + 1) % 3 === 0) b2g1Discount += item.price;
    });
    
    let finalTotal = subtotal - b2g1Discount;

    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const address = document.getElementById('c-address').value;

    let orderDetails = cart.map(item => `${item.quantity}x ${item.name} (₹${item.price})`).join('\n');
    let message = `*NEW DIWALI ORDER* 🪔\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}\n\n*Items:*\n${orderDetails}\n\n*Subtotal:* ₹${subtotal}\n*B2G1 Discount:* -₹${b2g1Discount}\n*Total to Pay:* ₹${finalTotal}\n\n_(Note: 5% Extra Discount applies if paying via UPI/Prepaid)_`;

    window.open(`https://wa.me/919000000000?text=${encodeURIComponent(message)}`, '_blank');
    cart = []; saveCart(); window.location.href = "index.html";
}

// --- Particle Engine (Floating Embers) ---
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particlesArray = [];
    for (let i = 0; i < 50; i++) {
        particlesArray.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedY: Math.random() * -1 - 0.5,
            opacity: Math.random()
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(p => {
            ctx.fillStyle = `rgba(255, 191, 0, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.speedY;
            if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// --- Countdown Timer ---
function initCountdown() {
    const diwaliDate = new Date("Nov 1, 2026 00:00:00").getTime();
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = diwaliDate - now;
        if (distance < 0) { clearInterval(interval); return; }
        
        if(document.getElementById('days')) {
            document.getElementById('days').innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
            document.getElementById('hours').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            document.getElementById('mins').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            document.getElementById('secs').innerText = Math.floor((distance % (1000 * 60)) / 1000);
        }
    }, 1000);
}