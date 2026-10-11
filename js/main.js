// js/main.js
let cart = JSON.parse(localStorage.getItem('prakash_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('prakash_wishlist')) || [];
let currentCategory = 'all';

// Replace with your Razorpay hosted page link when ready
const RAZORPAY_PAGE_URL = "https://pages.razorpay.com/pl_YOUR_PAGE_ID/view";
// Business WhatsApp Number (digits only, with country code)
const SELLER_WHATSAPP = "911135995194";

function saveCart() {
    localStorage.setItem('prakash_cart', JSON.stringify(cart));
    updateCartIcon();
}

function updateCartIcon() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = totalItems);
}

function saveWishlist() {
    localStorage.setItem('prakash_wishlist', JSON.stringify(wishlist));
    const el = document.getElementById('wishlist-count');
    if (el) el.textContent = wishlist.length;
}

function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(productId);
    }
    saveWishlist();
    renderProducts();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    alert(`${product.name} added to cart!`);
    if (document.getElementById('cart-items-container')) renderCart();
}

function createProductCard(product) {
    const isWishlisted = wishlist.includes(product.id);
    const badgeText = product.price >= 500 ? "BUY 2 GET 1 FREE" : "MIN. CART ₹599";
    return `
        <div class="product-card">
            <button class="card-wishlist-btn" onclick="toggleWishlist(${product.id})" title="Wishlist">
                ${isWishlisted ? '❤️' : '🤍'}
            </button>
            <div class="promo-badge">${badgeText}</div>
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

function renderProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }
    container.innerHTML = filtered.map(createProductCard).join('');
}

function filterCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => 
        b.getAttribute('onclick') && b.getAttribute('onclick').includes(category)
    );
    if (activeBtn) activeBtn.classList.add('active');
    renderProducts();
}

// Discount & Cart Calculation
function calculateCartTotals() {
    let eligibleB2G1 = [];
    let subtotal = 0;

    cart.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
            subtotal += item.price;
            // B2G1 applicable only on products >= ₹500
            if (item.price >= 500) {
                eligibleB2G1.push(item);
            }
        }
    });

    eligibleB2G1.sort((a, b) => b.price - a.price);

    let b2g1Discount = 0;
    eligibleB2G1.forEach((item, index) => {
        if ((index + 1) % 3 === 0) {
            b2g1Discount += item.price; // 3rd item free
        }
    });

    let finalPayable = subtotal - b2g1Discount;
    let deliveryFee = finalPayable >= 599 ? 0 : 50;
    let orderTotal = finalPayable + deliveryFee;
    let prepaidTotal = Math.round(orderTotal * 0.95); // 5% prepaid discount

    // Minimum cart requirement: if contains items < 500, payable must be >= 599
    const hasItemsBelow500 = cart.some(item => item.price < 500);
    const meetsMinimum = !hasItemsBelow500 || finalPayable >= 599;

    return {
        subtotal,
        b2g1Discount,
        deliveryFee,
        orderTotal,
        prepaidTotal,
        finalPayable,
        hasGift: finalPayable >= 1000,
        eligibleB2G1Count: eligibleB2G1.length,
        meetsMinimum,
        amountNeededForMin: 599 - finalPayable
    };
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Your cart is empty. <a href="index.html#shop">Shop Now</a></p>';
        document.getElementById('checkout-form-container').style.display = 'none';
        return;
    }

    document.getElementById('checkout-form-container').style.display = 'block';

    const totals = calculateCartTotals();

    // B2G1 Progress
    let b2g1ProgressHtml = '';
    let b2g1Remainder = totals.eligibleB2G1Count % 3;
    if (totals.eligibleB2G1Count > 0) {
        if (b2g1Remainder !== 0) {
            b2g1ProgressHtml = `<div class="cart-progress">Add ${3 - b2g1Remainder} more premium plate(s) (₹500+) to unlock 1 FREE!</div>`;
        } else {
            b2g1ProgressHtml = `<div class="cart-progress">🎉 B2G1 Free Diya Plate Unlocked!</div>`;
        }
    }

    // Min Order Value Warning
    let minOrderHtml = '';
    const payOnlineBtn = document.getElementById('btn-pay-online');
    const payCodBtn = document.getElementById('btn-pay-cod');

    if (!totals.meetsMinimum) {
        minOrderHtml = `<div class="min-order-alert">⚠️ Minimum cart value is ₹599 for standard festive diyas. Please add ₹${totals.amountNeededForMin} more to proceed to checkout.</div>`;
        if (payOnlineBtn) payOnlineBtn.disabled = true;
        if (payCodBtn) payCodBtn.disabled = true;
    } else {
        if (payOnlineBtn) payOnlineBtn.disabled = false;
        if (payCodBtn) payCodBtn.disabled = false;
    }

    // Free 11-Diya Gift (₹1000+)
    let giftHtml = '';
    const giftLine = document.getElementById('free-gift-line');
    if (giftLine) giftLine.style.display = totals.hasGift ? 'flex' : 'none';

    if (totals.hasGift) {
        giftHtml = `<div class="cart-gift-banner">🎁 Congratulations! 11 Free 2" Diyas will be included in your package!</div>`;
    } else if (totals.meetsMinimum) {
        let neededForGift = 1000 - totals.finalPayable;
        giftHtml = `<div class="cart-progress" style="background:#e8f4fd; color:#0d47a1; border-color:#bbdefb;">Add ₹${neededForGift} more to get 11 Free 2" Diyas!</div>`;
    }

    let itemsHtml = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>₹${item.price} ${item.price >= 500 ? '<span style="color:#2e7d32; font-size:0.8rem;">(Eligible for B2G1)</span>' : ''}</p>
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
    `).join('');

    container.innerHTML = minOrderHtml + b2g1ProgressHtml + giftHtml + itemsHtml;

    document.getElementById('summary-subtotal').textContent = `₹${totals.subtotal}`;
    document.getElementById('summary-discount').textContent = `- ₹${totals.b2g1Discount}`;
    document.getElementById('summary-delivery').textContent = totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee}`;
    document.getElementById('summary-total').textContent = `₹${totals.orderTotal}`;
    document.getElementById('summary-prepaid-total').textContent = `₹${totals.prepaidTotal}`;
}

function updateQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart();
    renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function validateCustomerForm() {
    const totals = calculateCartTotals();
    if (!totals.meetsMinimum) {
        alert(`Minimum order value must be at least ₹599 to checkout. Please add ₹${totals.amountNeededForMin} more!`);
        return null;
    }

    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const address = document.getElementById('c-address').value.trim();

    if (!name || !phone || !address) {
        alert("Please fill in your name, phone number, and complete delivery address.");
        return null;
    }
    return { name, phone, address };
}

function handleOnlinePayment() {
    const customer = validateCustomerForm();
    if (!customer) return;

    const totals = calculateCartTotals();
    localStorage.setItem('prakash_last_order', JSON.stringify({
        customer,
        items: cart,
        total: totals.prepaidTotal,
        paymentMethod: 'Prepaid Razorpay'
    }));

    window.location.href = `${RAZORPAY_PAGE_URL}?amount=${totals.prepaidTotal}&name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}`;
}

function handleCodWhatsApp() {
    const customer = validateCustomerForm();
    if (!customer) return;

    const totals = calculateCartTotals();
    let orderItems = cart.map(item => `${item.quantity}x ${item.name} (₹${item.price})`).join('\n');
    let giftText = totals.hasGift ? `\n🎁 *FREE GIFT INCLUDED:* 11 Pcs 2" Diyas (₹0)` : '';

    let message = `*NEW COD ORDER - PRAKASH DECOR* 🪔\n\n*Name:* ${customer.name}\n*Phone:* ${customer.phone}\n*Address:* ${customer.address}\n\n*Items:*\n${orderItems}${giftText}\n\n*Subtotal:* ₹${totals.subtotal}\n*B2G1 Discount:* -₹${totals.b2g1Discount}\n*Delivery:* ${totals.deliveryFee === 0 ? 'FREE' : '₹' + totals.deliveryFee}\n*Total to Pay on Delivery:* ₹${totals.orderTotal}\n\n*Payment Mode:* Cash on Delivery (COD)\n*Address:* Prakash Decor, Uttam Nagar, New Delhi 110059`;

    window.open(`https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
    cart = [];
    saveCart();
    window.location.href = "index.html";
}

function changeMainImage(newSrc, thumb) {
    document.getElementById('main-product-image').src = newSrc;
    document.querySelectorAll('.thumb').forEach(el => el.classList.remove('active'));
    thumb.classList.add('active');
}

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.5 + 1,
            speedY: Math.random() * -0.8 - 0.3,
            opacity: Math.random() * 0.7 + 0.3
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.fillStyle = `rgba(255, 191, 0, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.speedY;
            if (p.y < 0) {
                p.y = canvas.height;
                p.x = Math.random() * canvas.width;
            }
        });
        requestAnimationFrame(animate);
    }
    animate();
}

function initCountdown() {
    const diwaliDate = new Date("Nov 1, 2026 00:00:00").getTime();
    setInterval(() => {
        const now = new Date().getTime();
        const diff = diwaliDate - now;
        if (diff < 0) return;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (document.getElementById('days')) {
            document.getElementById('days').textContent = d;
            document.getElementById('hours').textContent = h;
            document.getElementById('mins').textContent = m;
            document.getElementById('secs').textContent = s;
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartIcon();
    const wEl = document.getElementById('wishlist-count');
    if (wEl) wEl.textContent = wishlist.length;

    initParticles();
    initCountdown();

    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    renderProducts();

    const detailContainer = document.getElementById('product-detail-container');
    if (detailContainer) {
        const productId = parseInt(new URLSearchParams(window.location.search).get('id'));
        const product = products.find(p => p.id === productId);

        if (product) {
            document.title = `${product.name} | Prakash Decor`;
            const promoNotice = product.price >= 500 
                ? '<div class="b2g1-callout">🪔 Diwali Offer: BUY 2 GET 1 FREE</div>'
                : '<div class="b2g1-callout" style="background:#4a2800; color:#ffd54f;">⚡ Min. Cart Value: ₹599</div>';

            let extraHTML = '';
            if (product.extraImages && product.extraImages.length > 0) {
                extraHTML = `
                    <div class="thumbnail-gallery">
                        <img src="${product.image}" class="thumb active" onclick="changeMainImage(this.src, this)">
                        ${product.extraImages.map(img => `<img src="${img}" class="thumb" onclick="changeMainImage(this.src, this)">`).join('')}
                    </div>
                `;
            }

            detailContainer.innerHTML = `
                <div class="product-detail-image">
                    <img id="main-product-image" src="${product.image}" alt="${product.name}">
                    ${extraHTML}
                </div>
                <div class="product-detail-info">
                    ${promoNotice}
                    <h1>${product.name}</h1>
                    <p class="price" style="font-size:1.8rem; margin:10px 0;">₹${product.price}</p>
                    <div class="description">${product.description}</div>
                    <button class="btn primary-btn w-100" style="margin-top:20px;" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            `;
        }
    }

    renderCart();
});