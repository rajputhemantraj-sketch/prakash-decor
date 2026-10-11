let cart = JSON.parse(localStorage.getItem('prakash_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('prakash_wishlist')) || [];
let currentCategory = 'all';

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
    updateWishlistCount();
}

function updateWishlistCount() {
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
    return `
        <div class="product-card">
            <button class="card-wishlist-btn" onclick="toggleWishlist(${product.id})" title="Wishlist">
                ${isWishlisted ? '❤️' : '🤍'}
            </button>
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

document.addEventListener('DOMContentLoaded', () => {
    updateCartIcon();
    updateWishlistCount();
    initParticles();
    initCountdown();

    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    renderProducts();

    // Product Detail Page Logic
    const detailContainer = document.getElementById('product-detail-container');
    if (detailContainer) {
        const productId = parseInt(new URLSearchParams(window.location.search).get('id'));
        const product = products.find(p => p.id === productId);

        if (product) {
            document.title = `${product.name} | Prakash Decor`;
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
                    <div class="b2g1-callout">🪔 Diwali Offer: BUY 2 GET 1 FREE</div>
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

function changeMainImage(newSrc, thumb) {
    document.getElementById('main-product-image').src = newSrc;
    document.querySelectorAll('.thumb').forEach(el => el.classList.remove('active'));
    thumb.classList.add('active');
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Your cart is empty. <a href="index.html#shop">Shop Now</a></p>';
        document.getElementById('checkout-form-container').style.display = 'none';
        return;
    }

    document.getElementById('checkout-form-container').style.display = 'block';

    let flatCart = [];
    cart.forEach(item => {
        for (let i = 0; i < item.quantity; i++) flatCart.push(item);
    });
    flatCart.sort((a, b) => b.price - a.price);

    let subtotal = 0;
    let b2g1Discount = 0;
    flatCart.forEach((item, index) => {
        subtotal += item.price;
        if ((index + 1) % 3 === 0) b2g1Discount += item.price;
    });

    let itemsForFree = 3 - (totalCount % 3);
    let progressHtml = '';
    if (itemsForFree < 3) {
        progressHtml = `<div class="cart-progress">Add ${itemsForFree} more item(s) to get 1 FREE Diya!</div>`;
    } else {
        progressHtml = `<div class="cart-progress">🎉 B2G1 Free Diya Unlocked!</div>`;
    }

    let finalPayable = subtotal - b2g1Discount;
    let deliveryFee = finalPayable >= 599 ? 0 : 50;

    // 7. Automatic Free Gift Condition (11 Free Diyas for ₹1000+)
    let freeGiftUnlocked = finalPayable >= 1000;
    const giftLine = document.getElementById('free-gift-line');
    if (giftLine) {
        giftLine.style.display = freeGiftUnlocked ? 'flex' : 'none';
    }

    let giftBannerHtml = '';
    if (freeGiftUnlocked) {
        giftBannerHtml = `<div class="cart-gift-banner">🎁 Congratulations! 11 Free 2" Diyas will be included in your package!</div>`;
    } else {
        let needed = 1000 - finalPayable;
        giftBannerHtml = `<div class="cart-progress" style="background:#e8f4fd; color:#0d47a1; border-color:#bbdefb;">Add ₹${needed} more to get 11 Free 2" Diyas!</div>`;
    }

    let itemsHtml = cart.map((item, index) => `
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
    `).join('');

    container.innerHTML = progressHtml + giftBannerHtml + itemsHtml;

    document.getElementById('summary-subtotal').textContent = `₹${subtotal}`;
    document.getElementById('summary-discount').textContent = `- ₹${b2g1Discount}`;
    document.getElementById('summary-delivery').textContent = deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`;
    document.getElementById('summary-total').textContent = `₹${finalPayable + deliveryFee}`;
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

function submitOrder(event) {
    event.preventDefault();
    if (cart.length === 0) return;

    let flatCart = [];
    cart.forEach(item => {
        for (let i = 0; i < item.quantity; i++) flatCart.push(item);
    });
    flatCart.sort((a, b) => b.price - a.price);

    let subtotal = 0;
    let b2g1Discount = 0;
    flatCart.forEach((item, index) => {
        subtotal += item.price;
        if ((index + 1) % 3 === 0) b2g1Discount += item.price;
    });

    let finalPayable = subtotal - b2g1Discount;
    let deliveryFee = finalPayable >= 599 ? 0 : 50;
    let hasFreeGift = finalPayable >= 1000;

    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const address = document.getElementById('c-address').value;

    let orderItems = cart.map(item => `${item.quantity}x ${item.name} (₹${item.price})`).join('\n');
    let giftText = hasFreeGift ? `\n🎁 *FREE GIFT INCLUDED:* 11 Pcs 2" Diyas (₹0)` : '';

    let message = `*NEW DIWALI ORDER - PRAKASH DECOR* 🪔\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}\n\n*Items:*\n${orderItems}${giftText}\n\n*Subtotal:* ₹${subtotal}\n*B2G1 Discount:* -₹${b2g1Discount}\n*Delivery:* ${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}\n*Total to Pay:* ₹${finalPayable + deliveryFee}\n\n_(Note: 5% Instant Discount applies if paying via UPI/Prepaid)_`;

    window.open(`https://wa.me/919000000000?text=${encodeURIComponent(message)}`, '_blank');
    cart = [];
    saveCart();
    window.location.href = "index.html";
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