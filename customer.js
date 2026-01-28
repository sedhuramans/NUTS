// customer.js - Complete file with MongoDB integration

// API Base URL - Point to Node.js server
const API_BASE = 'http://localhost:3000';

// Create fallback image as data URL
function createFallbackImage(text = 'AS Nuts', width = 320, height = 250) {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="18" fill="#6c757d" text-anchor="middle" dy=".3em">${text}</text>
        <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" fill="#adb5bd" text-anchor="middle" dy=".3em">Image not available</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Storage Keys
const STORAGE_KEYS = {
    PRODUCTS: 'srs_cashews_products',
    ORDERS: 'srs_cashews_orders', 
    CART: 'keerthivasan_cashews_cart'
};

// Global data
let products = {};
let cart = {};
let currentSlide = 0;
let slideInterval;

// DOM elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const productsGrid = document.querySelector('.products-grid');
const cartItems = document.querySelector('.cart-items');
const emptyCartMessage = document.getElementById('empty-cart-message');
const subtotalElement = document.getElementById('subtotal');
const totalElement = document.getElementById('total');
const continueShoppingBtn = document.getElementById('continue-shopping');
const placeOrderBtn = document.getElementById('place-order');
const printSummaryBtn = document.getElementById('print-summary');
const notification = document.getElementById('notification');
const cartCount = document.querySelector('.cart-count');
const productSearch = document.getElementById('product-search');
const filterButtons = document.querySelectorAll('.filter-btn');
const categoryCards = document.querySelectorAll('.category-card');
const contactNav = document.getElementById('contact-nav');

// Mobile menu elements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navMenu = document.getElementById('nav-menu');

// Carousel elements
const carouselInner = document.querySelector('.carousel-inner');
const carouselItems = document.querySelectorAll('.carousel-item');
const prevButton = document.querySelector('.carousel-control.prev');
const nextButton = document.querySelector('.carousel-control.next');
const indicators = document.querySelectorAll('.carousel-indicator');

// Print bill elements
const printBill = document.getElementById('print-bill');
const billDate = document.getElementById('bill-date');
const billItems = document.getElementById('bill-items');
const billTotal = document.getElementById('bill-total');

// Order popup elements
const orderPopup = document.getElementById('order-popup');
const orderForm = document.getElementById('order-form');
const closePopup = document.querySelector('.close-popup');
const cancelOrder = document.getElementById('cancel-order');
const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
const upiDetails = document.getElementById('upi-details');
const popupOrderItems = document.getElementById('popup-order-items');
const popupTotal = document.getElementById('popup-total');

// Scroll variables
let lastScrollTop = 0;
const header = document.querySelector('header');
const scrollThreshold = 100;

// Initialize the website
async function init() {
    await loadProducts();
    loadCartFromStorage();
    setupOrderButtonAnimation();
    setupEventListeners();
    updateCartCount();
    startCarousel();
    setupCarouselTouch();
    showNotification('Welcome to Keerthivasan Cashews! Premium cashews from ramapuran, Tamil Nadu', false);
    
    // Set up storage listener for real-time updates
    window.addEventListener('storage', handleStorageUpdate);
}

// Handle storage updates from other tabs/windows
function handleStorageUpdate(event) {
    if (event.key === STORAGE_KEYS.PRODUCTS) {
        loadProducts();
        showNotification('Products updated!', false);
    }
}

// Load products from API (real-time from database)
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        
        if (response.ok) {
            const productsArray = await response.json();
            
            // Convert array to object with id as key
            products = {};
            productsArray.forEach(product => {
                products[product.id] = product;
            });
            
            renderProducts();
            showNotification('Products loaded from database!', false);
        } else {
            throw new Error('Failed to fetch products from server');
        }
    } catch (error) {
        // Fallback to local products if API fails
        loadLocalProducts();
        showNotification('Using offline products. Some items may not be current.', true);
    }
}

// Save products to localStorage
function saveProductsToStorage() {
    try {
        const productsArray = Object.values(products);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(productsArray));
    } catch (error) {
        console.error('Failed to save products to storage:', error);
    }
}

// Load cart from localStorage
function loadCartFromStorage() {
    try {
        const storedCart = localStorage.getItem(STORAGE_KEYS.CART);
        if (storedCart) {
            cart = JSON.parse(storedCart);
            updateCart();
        }
    } catch (error) {
        console.error('Failed to load cart from storage:', error);
        cart = {};
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (error) {
        console.error('Failed to save cart to storage:', error);
    }
}

// Save order to database via API
async function saveOrderToDB(orderData) {
    try {
        const response = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const result = await response.json();
            return result.order;
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save order');
        }
    } catch (error) {
        throw error;
    }
}

// Fallback to local products
function loadLocalProducts() {
    products = {
        // Premium Ramapuram Cashews
        batham: { 
            id: "batham",
            name: "Batham Cashew Nuts", 
            nameTamil: "பாதாம் முந்திரி",
            price: 140,
            description: "Premium Batham cashews with creamy texture and buttery flavor from ramapuran.",
            image: "https://m.media-amazon.com/images/I/71o-btxbBiL._AC_UF894,1000_QL80_.jpg",
            category: "cashews",
            badge: "ramapuran Special"
        },
        kaju: { 
            id: "kaju",
            name: "Jumbo Whole Cashews", 
            nameTamil: "காஜு முந்திரி",
            price: 130,
            description: "Extra large whole cashews with creamy texture and buttery flavor from ramapuran farms.",
            image: "https://rukminim2.flixcart.com/image/480/480/ks3jjbk0/nut-dry-fruit/4/s/c/1-premium-whole-cashew-nuts-w210-1-kg-1000-gm-big-size-jumbo-original-imag5qq8dfvfvgcj.jpeg?q=90",
            category: "cashews",
            badge: "Premium"
        },
        w180: { 
            id: "w180",
            name: "W-180 Premium Cashews", 
            nameTamil: "W-180 முந்திரி",
            price: 160,
            description: "The largest and most expensive grade, often called the 'King of Cashews'.",
            image: "https://palmtreeshopping.com/cdn/shop/files/CASHEW_W180_THUMBNAIL.png?v=1735376508",
            category: "cashews",
            badge: "Premium"
        },
        w210: { 
            id: "w210",
            name: "W-210 Cashews", 
            nameTamil: "W-210 முந்திரி",
            price: 150,
            description: "'Jumbo' size, slightly smaller than W-180 but still large and premium.",
            image: "https://5.imimg.com/data5/NV/LY/OR/SELLER-26605812/w210-cashew-nut-1000x1000.jpg",
            category: "cashews",
            badge: "Popular"
        },
        w240: { 
            id: "w240",
            name: "W-240 Cashews", 
            nameTamil: "W-240 முந்திரி",
            price: 140,
            description: "A mid-range, standard-sized cashew that offers a balance between size and price.",
            image: "https://5.imimg.com/data5/ANDROID/Default/2024/8/446625112/EK/XD/AB/130288969/product-jpeg-500x500.jpg",
            category: "cashews"
        },
        w320: { 
            id: "w320",
            name: "W-320 Cashews", 
            nameTamil: "W-320 முந்திரி",
            price: 130,
            description: "The most popular and widely available grade, larger than W-400 but more affordable than higher grades.",
            image: "https://5.imimg.com/data5/SELLER/Default/2020/8/NC/FS/FY/30563227/cashew-w320-500x500.jpg",
            category: "cashews"
        },
        
        // Other Nuts
        badam: { 
            id: "badam",
            name: "Premium California Almonds", 
            nameTamil: "பாதாம்",
            price: 120,
            description: "Large, crunchy California almonds with rich flavor and perfect texture.",
            image: "https://cdn.britannica.com/04/194904-050-1B92812A/Raw-Food-Almond-food-Nut-Snack.jpg",
            category: "nuts",
            badge: "Premium"
        },
        akhrot: { 
            id: "akhrot",
            name: "Premium Walnut Halves", 
            nameTamil: "அக்ரோட்",
            price: 110,
            description: "Fresh walnut halves with rich, earthy flavor and crisp texture.",
            image: "https://images.squarespace-cdn.com/content/v1/56968a5740667a086de661b9/1452716746154-37ZAQOIRP2SGG74534IX/WalnutHalves2.jpg?format=1500w",
            category: "nuts"
        },
        pista: { 
            id: "pista",
            name: "Iranian Pistachios", 
            nameTamil: "பிஸ்தா",
            price: 160,
            description: "Premium Iranian pistachios, naturally opened and lightly salted.",
            image: "https://iran-pistachio.com/wp-content/uploads/2018/11/iran-pistachio-slider-2-small.jpg",
            category: "nuts",
            badge: "Premium"
        },
        makhana: { 
            id: "makhana",
            name: "Roasted Fox Nuts", 
            nameTamil: "மகானா",
            price: 90,
            description: "Lightly roasted fox nuts, perfect for healthy snacking.",
            image: "https://www.mydiversekitchen.com/wp-content/uploads/2015/01/image.1024x1024.jpg",
            category: "nuts"
        },
        kishmish: { 
            id: "kishmish",
            name: "Black Raisins", 
            nameTamil: "கிஸ்மிஸ்",
            price: 60,
            description: "Sweet black raisins, perfect for cooking and snacking.",
            image: "https://nuttyyogi.com/cdn/shop/products/blackraisins.png?v=1680767584",
            category: "dryfruits"
        },
        
        // Dry Fruits
        dates: { 
            id: "dates",
            name: "Medjool Dates", 
            nameTamil: "பேரீச்சம் பழம்",
            price: 80,
            description: "Premium Medjool dates, naturally sweet and rich in fiber.",
            image: "https://cdn.shopify.com/s/files/1/0437/8953/files/Medjool_Dates_15_2048x2048.jpg?v=1745516427",
            category: "dryfruits",
            badge: "Healthy"
        },
        blackdates: { 
            id: "blackdates",
            name: "Black Dates", 
            nameTamil: "கரு பேரீச்சம் பழம்",
            price: 95,
            description: "Rich black dates with deep flavor and nutritional benefits.",
            image: "https://5.imimg.com/data5/SELLER/Default/2022/4/QL/VY/ON/15059881/black-dates.jpg",
            category: "dryfruits"
        },
        anjeer: { 
            id: "anjeer",
            name: "Dried Figs", 
            nameTamil: "அத்தி பழம்",
            price: 110,
            description: "Natural dried figs, rich in fiber and essential nutrients.",
            image: "https://images-cdn.ubuy.ae/647de208711e2c6fa754c6f0-premium-afghani-anjeer-dried-figs.jpg",
            category: "dryfruits"
        },
        apricot: { 
            id: "apricot",
            name: "Dried Apricots", 
            nameTamil: "சர்க்கரை பாதாமி",
            price: 85,
            description: "Sun-dried apricots with natural sweetness and chewy texture.",
            image: "https://rukminim2.flixcart.com/image/480/640/xif0q/nut-dry-fruit/v/o/r/200-premium-quality-dried-apricot-i-dry-fruits-apricots-i-pack-original-imahff8gtyth4fe3.jpeg?q=90",
            category: "dryfruits"
        },
        prune: { 
            id: "prune",
            name: "Dried Prunes", 
            nameTamil: "உலர்ந்த கொடிமுந்திரி",
            price: 75,
            description: "Natural dried prunes, great for digestive health.",
            image: "https://www.forksoverknives.com/uploads/2024/09/dried-plums-prunes.jpg?auto=webp",
            category: "dryfruits"
        },
        
        // Seeds
        pumpkineseeds: { 
            id: "pumpkineseeds",
            name: "Pumpkin Seeds", 
            nameTamil: "பூசணி விதைகள்",
            price: 70,
            description: "Roasted pumpkin seeds, rich in zinc and magnesium.",
            image: "https://rukminim2.flixcart.com/image/480/640/xif0q/nut-dry-fruit/v/s/w/1-pumpkeen-250g-flax-seed-250g-sunflower-250g-chai-seed-250g-4-original-imaguuvh3dsu3tqw.jpeg?q=90",
            category: "seeds",
            badge: "Popular"
        },
        sunflowerseeds: { 
            id: "sunflowerseeds",
            name: "Sunflower Seeds", 
            nameTamil: "சூரியகாந்தி விதைகள்",
            price: 55,
            description: "Raw sunflower seeds, packed with vitamin E and healthy fats.",
            image: "https://m.media-amazon.com/images/I/61EuHk70+oL._AC_UF894,1000_QL80_.jpg",
            category: "seeds"
        },
        flaxseeds: { 
            id: "flaxseeds",
            name: "Flax Seeds", 
            nameTamil: "அளசி விதைகள்",
            price: 65,
            description: "Organic flax seeds, excellent source of omega-3 fatty acids.",
            image: "https://rukminim2.flixcart.com/image/480/640/xif0q/plant-seed/b/j/k/150-ga-alsi-flax-seeds-dd-150g-garg-agri-original-imah889zfhhvjksa.jpeg?q=90",
            category: "seeds"
        },
        chia: { 
            id: "chia",
            name: "Chia Seeds", 
            nameTamil: "சியா விதைகள்",
            price: 90,
            description: "Premium chia seeds, high in fiber and antioxidants.",
            image: "https://media.post.rvohealth.io/wp-content/uploads/sites/3/2021/11/chia_seeds_GettyImages1282395572_Thumb-732x549.jpg",
            category: "seeds"
        },
        blacksesame: { 
            id: "blacksesame",
            name: "Black Sesame Seeds", 
            nameTamil: "கருப்பு எள்ளு",
            price: 50,
            description: "Natural sesame seeds, rich in calcium and antioxidants.",
            image: "https://m.media-amazon.com/images/I/61l2fI4cEzL._AC_UF1000,1000_QL80_.jpg",
            category: "seeds"
        },
        whitesesame: { 
            id: "whitesesame",
            name: "White Sesame Seeds", 
            nameTamil: "வெள்ளை எள்ளு",
            price: 50,
            description: "Natural sesame seeds, rich in calcium and antioxidants.",
            image: "https://rukminim2.flixcart.com/image/480/640/kgqvlow0/edible-seed/t/c/x/500-pouch-raw-shree-whole-original-imafww6ytwqgbcxq.jpeg?q=90",
            category: "seeds"
        },
        // Premium Category
        macadamia: { 
            id: "macadamia",
            name: "Hawaiian Macadamia Nuts", 
            nameTamil: "மக்கடாமியா",
            price: 200,
            description: "Rich, buttery Hawaiian macadamia nuts, lightly roasted.",
            image: "https://www.asiafarming.com/wp-content/uploads/2023/12/Macadamia-Nuts-Cultivation4-1024x682.jpg",
            category: "premium",
            badge: "Premium"
        },
        brazil: { 
            id: "brazil",
            name: "Brazil Nuts", 
            nameTamil: "பிரேசில் கொட்டை",
            price: 180,
            description: "Large Brazil nuts, excellent source of selenium.",
            image: "https://hodmedods.co.uk/cdn/shop/files/Brazil_Nuts_bowl_board_3x2_903c992b-0ab4-4196-9e20-c3453d3c7096_2000x.jpg?v=1731778883",
            category: "premium"
        },
        pecans: { 
            id: "pecans",
            name: "Pecan Nuts", 
            nameTamil: "பிகான் கொட்டை",
            price: 170,
            description: "Sweet and buttery pecan nuts, perfect for baking.",
            image: "https://media.post.rvohealth.io/wp-content/uploads/2020/08/pecans-732x549-thumbnail.jpg",
            category: "premium"
        }
    };
    renderProducts();
    saveProductsToStorage();
}

// CAROUSEL FUNCTIONS (keep existing)
function startCarousel() {
    slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % carouselItems.length;
    updateCarousel();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    carouselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// PRODUCT FUNCTIONS - UPDATED WITH BILINGUAL NAMES
function renderProducts(filter = 'all', searchTerm = '') {
    productsGrid.innerHTML = '';
    
    let filteredProducts = {};
    
    for (const productId in products) {
        const product = products[productId];
        
        if (filter !== 'all' && product.category !== filter) {
            continue;
        }
        
        if (searchTerm && 
            !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !product.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !(product.nameTamil && product.nameTamil.toLowerCase().includes(searchTerm.toLowerCase()))) {
            continue;
        }
        
        filteredProducts[productId] = product;
    }
    
    for (const productId in filteredProducts) {
        const product = filteredProducts[productId];
        const cartQuantity = cart[productId] ? cart[productId].quantity : 0;
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFTIE51dHM8L3RleHQ+PC9zdmc+'"
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
            </div>
            <div class="product-info">
                <div class="product-name-bilingual">
                    <h4>${product.name} / ${product.nameTamil}</h4>
                </div>
                <p class="product-description">${product.description}</p>
                <div class="product-price">₹${product.price} / 50g</div>
                
                <div class="quantity-label">Quantity (50g increments)</div>
                
                <div class="quantity-container">
                    <div class="quantity-selector">
                        <button class="quantity-btn minus" data-product="${productId}" ${cartQuantity === 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="text" class="quantity-input" data-product="${productId}" value="${cartQuantity}" readonly>
                        <button class="quantity-btn plus" data-product="${productId}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="add-to-cart-btn" data-product="${productId}" ${cartQuantity === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                        ${cartQuantity > 0 ? 'Update Cart' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
    }
    
    if (Object.keys(filteredProducts).length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-products" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <i class="fas fa-search" style="font-size: 4rem; color: #475569; margin-bottom: 1rem;"></i>
                <h3 style="color: #94a3b8; margin-bottom: 1rem;">No products found</h3>
                <p style="color: #64748b;">Try adjusting your search or filter criteria</p>
            </div>
        `;
    }
    
    setupProductEventListeners();
}

function setupProductEventListeners() {
    // Quantity minus buttons
    const minusBtns = document.querySelectorAll('.quantity-btn.minus');
    minusBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-product');
            updateQuantity(productId, false);
        });
    });
    
    // Quantity plus buttons
    const plusBtns = document.querySelectorAll('.quantity-btn.plus');
    plusBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-product');
            updateQuantity(productId, true);
        });
    });
    
    // Add to cart buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-product');
            addToCart(productId);
        });
    });
}

// UPDATED QUANTITY AND CART FUNCTIONS WITH STORAGE
function updateQuantity(productId, isPlus) {
    const quantityInput = document.querySelector(`.quantity-input[data-product="${productId}"]`);
    const minusBtn = document.querySelector(`.quantity-btn.minus[data-product="${productId}"]`);
    const addToCartBtn = document.querySelector(`.add-to-cart-btn[data-product="${productId}"]`);
    
    let quantity = parseInt(quantityInput.value) || 0;
    
    if (isPlus) {
        quantity++;
    } else if (quantity > 0) {
        quantity--;
    }
    
    quantityInput.value = quantity;
    
    // Update button states
    if (quantity === 0) {
        minusBtn.disabled = true;
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        addToCartBtn.classList.remove('added');
    } else {
        minusBtn.disabled = false;
        addToCartBtn.disabled = false;
        
        // Check if this product is already in cart
        if (cart[productId] && cart[productId].quantity === quantity) {
            addToCartBtn.innerHTML = '<i class="fas fa-check"></i> In Cart';
            addToCartBtn.classList.add('added');
        } else {
            addToCartBtn.innerHTML = cart[productId] ? '<i class="fas fa-shopping-cart"></i> Update Cart' : '<i class="fas fa-shopping-cart"></i> Add to Cart';
            addToCartBtn.classList.remove('added');
        }
    }
}

function addToCart(productId) {
    const quantityInput = document.querySelector(`.quantity-input[data-product="${productId}"]`);
    const addToCartBtn = document.querySelector(`.add-to-cart-btn[data-product="${productId}"]`);
    
    const quantity = parseInt(quantityInput.value);
    
    if (quantity <= 0) {
        showNotification('Please select a quantity greater than 0.', true);
        return;
    }
    
    const product = products[productId];
    const totalPrice = product.price * quantity;
    
    if (cart[productId]) {
        cart[productId].quantity = quantity;
        cart[productId].total = totalPrice;
    } else {
        cart[productId] = {
            name: product.name,
            nameTamil: product.nameTamil,
            price: product.price,
            quantity: quantity,
            total: totalPrice,
            productId: productId
        };
    }
    
    // Update the add to cart button to show "In Cart"
    addToCartBtn.innerHTML = '<i class="fas fa-check"></i> In Cart';
    addToCartBtn.classList.add('added');
    
    updateCart();
    saveCartToStorage();
    showNotification(`${quantity} × 50g of ${product.name} ${cart[productId] ? 'updated in' : 'added to'} cart!`);
    
    updateCartCount();
}

function updateCartQuantity(productId, isPlus) {
    if (isPlus) {
        cart[productId].quantity += 1;
        cart[productId].total += cart[productId].price;
    } else if (cart[productId].quantity > 1) {
        cart[productId].quantity -= 1;
        cart[productId].total -= cart[productId].price;
    } else {
        removeFromCart(productId);
        return;
    }
    
    // Update the product card quantity if it exists
    const quantityInput = document.querySelector(`.quantity-input[data-product="${productId}"]`);
    const addToCartBtn = document.querySelector(`.add-to-cart-btn[data-product="${productId}"]`);
    const minusBtn = document.querySelector(`.quantity-btn.minus[data-product="${productId}"]`);
    
    if (quantityInput) {
        quantityInput.value = cart[productId].quantity;
        
        // Update button states
        if (cart[productId].quantity === 0) {
            if (minusBtn) minusBtn.disabled = true;
            if (addToCartBtn) {
                addToCartBtn.disabled = true;
                addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                addToCartBtn.classList.remove('added');
            }
        } else {
            if (minusBtn) minusBtn.disabled = false;
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.innerHTML = '<i class="fas fa-check"></i> In Cart';
                addToCartBtn.classList.add('added');
            }
        }
    }
    
    updateCart();
    saveCartToStorage();
}

function removeFromCart(productId) {
    // Update the product card if it exists
    const quantityInput = document.querySelector(`.quantity-input[data-product="${productId}"]`);
    const addToCartBtn = document.querySelector(`.add-to-cart-btn[data-product="${productId}"]`);
    const minusBtn = document.querySelector(`.quantity-btn.minus[data-product="${productId}"]`);
    
    if (quantityInput) {
        quantityInput.value = 0;
        
        if (minusBtn) minusBtn.disabled = true;
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            addToCartBtn.classList.remove('added');
        }
    }
    
    delete cart[productId];
    updateCart();
    saveCartToStorage();
    showNotification('Item removed from cart.', true);
}

function updateCart() {
    cartItems.innerHTML = '';
    
    if (Object.keys(cart).length === 0) {
        emptyCartMessage.style.display = 'block';
        cartItems.appendChild(emptyCartMessage);
    } else {
        emptyCartMessage.style.display = 'none';
        
        for (const productId in cart) {
            const item = cart[productId];
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item cart-item-add';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    ${item.nameTamil ? `<p class="product-name-tamil">${item.nameTamil}</p>` : ''}
                    <p>₹${item.price} per 50g</p>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-quantity">
                        <button class="cart-quantity-btn minus" data-product="${productId}">-</button>
                        <span class="cart-quantity-value">${item.quantity} × 50g</span>
                        <button class="cart-quantity-btn plus" data-product="${productId}">+</button>
                    </div>
                    <div class="cart-item-total">₹${item.total.toFixed(2)}</div>
                    <button class="remove-item" data-product="${productId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            cartItems.appendChild(cartItem);
        }
        
        const cartQuantityBtns = document.querySelectorAll('.cart-quantity-btn');
        cartQuantityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-product');
                const isPlus = btn.classList.contains('plus');
                updateCartQuantity(productId, isPlus);
            });
        });
        
        const removeBtns = document.querySelectorAll('.remove-item');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-product');
                removeFromCart(productId);
            });
        });
    }
    
    updateCartTotal();
    updateCartCount();
}

function updateCartTotal() {
    let subtotal = 0;
    
    for (const productId in cart) {
        subtotal += cart[productId].total;
    }
    
    const shipping = 50;
    const total = subtotal + shipping;
    
    subtotalElement.textContent = subtotal.toFixed(2);
    totalElement.textContent = total.toFixed(2);
}

function updateCartCount() {
    let totalItems = 0;
    
    for (const productId in cart) {
        totalItems += cart[productId].quantity;
    }
    
    cartCount.textContent = totalItems;
}

// SCROLL FUNCTIONALITY
function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
        // Scroll down - hide header
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scroll up - show header
        header.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop;
}

// ORDER POPUP FUNCTIONS (keep existing, but they now use localStorage)
function placeOrder() {
    if (Object.keys(cart).length === 0) {
        showNotification('Your cart is empty. Add some premium Panruti products first!', true);
        return;
    }
    
    // Update popup order summary
    updatePopupOrderSummary();
    
    // Show the popup
    orderPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updatePopupOrderSummary() {
    popupOrderItems.innerHTML = '';
    let total = 0;
    
    for (const productId in cart) {
        const item = cart[productId];
        const orderItem = document.createElement('div');
        orderItem.className = 'popup-order-item';
        orderItem.innerHTML = `
            <span>${item.name} (${item.quantity} × 50g)</span>
            <span>₹${item.total.toFixed(2)}</span>
        `;
        popupOrderItems.appendChild(orderItem);
        total += item.total;
    }
    
    // Add shipping cost
    const shipping = 50;
    total += shipping;
    
    const shippingItem = document.createElement('div');
    shippingItem.className = 'popup-order-item';
    shippingItem.innerHTML = `
        <span>Shipping</span>
        <span>₹${shipping.toFixed(2)}</span>
    `;
    popupOrderItems.appendChild(shippingItem);
    
    popupTotal.textContent = total.toFixed(2);
    
    // Update UPI amount display
    const upiAmountElement = document.getElementById('upi-amount');
    if (upiAmountElement) {
        upiAmountElement.textContent = total.toFixed(2);
    }
    
    // Generate QR code with the total amount
    generateQRCode(total.toFixed(2));
}

async function confirmOrder(formData) {
    const orderData = {
        customerName: formData.get('customer-name'),
        customerPhone: formData.get('customer-phone'),
        customerAddress: formData.get('customer-address'),
        customerPincode: formData.get('customer-pincode'),
        customerPlace: formData.get('customer-place'),
        paymentMethod: formData.get('payment-method'),
        date: new Date().toISOString(),
        items: [],
        total: parseFloat(popupTotal.textContent),
        status: 'pending',
        source: 'AS Nuts Website'
    };
    
    // Add cart items to order data
    for (const productId in cart) {
        const item = cart[productId];
        orderData.items.push({
            name: item.name,
            nameTamil: item.nameTamil,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            productId: productId
        });
    }
    
    try {
        // Save order to database
        await saveOrderToDB(orderData);
        
        // Clear cart
        cart = {};
        updateCart();
        saveCartToStorage();
        
        // Show appropriate success message
        if (orderData.paymentMethod === 'cod') {
            showNotification(`Order placed successfully, ${orderData.customerName}! Your order will be delivered to ${orderData.customerPlace}. We will contact you on ${orderData.customerPhone}. Payment: Cash on Delivery`);
        } else {
            showNotification(`Order confirmed! Payment details received. Thank you for choosing AS Nuts!`);
        }
        
        // Close popup
        closeOrderPopup();
        
    } catch (error) {
        showNotification('Failed to place order. Please call us directly at +91 9840694616', true);
    }
}

function closeOrderPopup() {
    orderPopup.classList.remove('active');
    document.body.style.overflow = '';
    orderForm.reset();
    upiDetails.style.display = 'none';
}

// PRINT FUNCTION (keep existing)
function printOrderSummary() {
    if (Object.keys(cart).length === 0) {
        showNotification('Your cart is empty. Add some premium Panruti products first!', true);
        return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Keerthivasan Cashews - Order Bill</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: black;
                    background: white;
                    margin: 0;
                    padding: 20px;
                }
                .print-bill {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 2px solid black;
                }
                .bill-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid black;
                    padding-bottom: 15px;
                }
                .bill-header h2 {
                    margin: 0 0 5px 0;
                    color: black;
                    font-size: 24px;
                }
                .bill-header p {
                    margin: 5px 0;
                    color: black;
                }
                .bill-date {
                    color: #666;
                    font-size: 14px;
                }
                .bill-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding-bottom: 8px;
                    border-bottom: 1px dashed #ccc;
                    color: black;
                }
                .bill-item-name {
                    flex: 2;
                }
                .bill-item-quantity {
                    flex: 1;
                    text-align: center;
                }
                .bill-item-price {
                    flex: 1;
                    text-align: right;
                }
                .bill-divider {
                    height: 2px;
                    background: black;
                    margin: 15px 0;
                }
                .bill-total {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    font-size: 18px;
                    color: black;
                    margin-bottom: 20px;
                }
                .bill-footer {
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }
                .bill-footer p {
                    margin: 5px 0;
                }
                @media print {
                    body { margin: 0; }
                    .print-bill { border: none; box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="print-bill">
                <div class="bill-header">
                    <h2>KEERTHIVASAN CASHEWS</h2>
                    <p>Premium Cashews from ramapuran, Tamil Nadu</p>
                    <div class="bill-date">${new Date().toLocaleString()}</div>
                </div>
                
                <div class="bill-items">
                    ${generateBillItems()}
                </div>
                
                <div class="bill-divider"></div>
                
                <div class="bill-total">
                    <span>TOTAL:</span>
                    <span>₹${calculateTotal().toFixed(2)}</span>
                </div>
                
                <div class="bill-footer">
                    <p>Thank you for choosing Keerthivasan Cashews!</p>
                    <p>From ramapuran with Love ❤️</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    };
}

function generateBillItems() {
    let itemsHtml = '';
    for (const productId in cart) {
        const item = cart[productId];
        itemsHtml += `
            <div class="bill-item">
                <div class="bill-item-name">${item.name}</div>
                <div class="bill-item-quantity">${item.quantity} × 50g</div>
                <div class="bill-item-price">₹${item.total.toFixed(2)}</div>
            </div>
        `;
    }
    
    // Add shipping
    const shipping = 50;
    itemsHtml += `
        <div class="bill-item">
            <div class="bill-item-name">Shipping</div>
            <div class="bill-item-quantity"></div>
            <div class="bill-item-price">₹${shipping.toFixed(2)}</div>
        </div>
    `;
    
    return itemsHtml;
}

function calculateTotal() {
    let total = 0;
    for (const productId in cart) {
        total += cart[productId].total;
    }
    return total + 50; // Add shipping
}

// NOTIFICATION FUNCTION
function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = 'notification';
    
    if (isError) {
        notification.classList.add('error');
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// PAGE NAVIGATION
function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const activePage = document.getElementById(pageId);
    activePage.classList.add('active');
    
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Scroll to footer function
function scrollToFooter() {
    const footer = document.getElementById('contact-footer');
    footer.scrollIntoView({ behavior: 'smooth' });
}

// EVENT LISTENERS SETUP
function setupEventListeners() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const navUl = navMenu.querySelector('ul');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navUl.classList.toggle('active');
            
            // Create overlay if it doesn't exist
            let overlay = document.querySelector('.mobile-menu-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'mobile-menu-overlay';
                document.body.appendChild(overlay);
                
                // Close menu when clicking overlay
                overlay.addEventListener('click', () => {
                    mobileMenuBtn.classList.remove('active');
                    navUl.classList.remove('active');
                    overlay.classList.remove('active');
                });
            }
            
            overlay.classList.toggle('active');
        });
    }
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('data-page')) {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                showPage(pageId);
                
                // Close mobile menu after navigation
                if (mobileMenuBtn && navMenu) {
                    mobileMenuBtn.classList.remove('active');
                    navUl.classList.remove('active');
                    const overlay = document.querySelector('.mobile-menu-overlay');
                    if (overlay) overlay.classList.remove('active');
                }
            }
        });
    });
    
    // Contact navigation
    contactNav.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToFooter();
    });
    
    // Category cards
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.getAttribute('data-filter');
            showPage('products');
            
            // Set active filter
            setTimeout(() => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');
                renderProducts(filter, productSearch.value);
            }, 100);
        });
    });
    
    // Carousel controls
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);
    
    // Carousel indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Product search and filter
    productSearch.addEventListener('input', () => {
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        renderProducts(activeFilter, productSearch.value);
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.getAttribute('data-filter');
            renderProducts(filter, productSearch.value);
        });
    });
    
    // Cart actions
    continueShoppingBtn.addEventListener('click', () => {
        showPage('products');
    });
    
    placeOrderBtn.addEventListener('click', placeOrder);
    printSummaryBtn.addEventListener('click', printOrderSummary);
    
    // Order popup events
    closePopup.addEventListener('click', closeOrderPopup);
    cancelOrder.addEventListener('click', closeOrderPopup);
    
    // Close popup when clicking outside
    orderPopup.addEventListener('click', (e) => {
        if (e.target === orderPopup) {
            closeOrderPopup();
        }
    });
    
    // Payment method change
    paymentMethods.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const confirmBtn = document.getElementById('confirm-order');
            
            if (e.target.value === 'online') {
                upiDetails.style.display = 'block';
                // Disable confirm button for online payment until screenshot is uploaded
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Upload Screenshot to Confirm';
                
                // Generate QR code when online payment is selected
                const total = document.getElementById('popup-total').textContent;
                if (total && total !== '0.00') {
                    generateQRCode(total);
                    document.getElementById('upi-amount').textContent = total;
                }
            } else {
                upiDetails.style.display = 'none';
                // Enable confirm button for COD
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Order';
            }
            
            // Reset screenshot upload state when payment method changes
            resetScreenshotUpload();
        });
    });
    
    // Order form submission
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(orderForm);
        confirmOrder(formData);
    });
    
    // Scroll behavior for header
    window.addEventListener('scroll', handleScroll);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC key to close notification and popup
        if (e.key === 'Escape') {
            notification.classList.remove('show');
            if (orderPopup.classList.contains('active')) {
                closeOrderPopup();
            }
        }
        
        // Ctrl+P for print summary
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            printOrderSummary();
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        init();
    } catch (error) {
        showNotification('Website initialization error. Please refresh the page.', true);
    }
});

// UPI Payment Functions
function generateQRCode(amount) {
    const upiId = 'keerthivasan98406@okhdfcbank';
    const merchantName = 'AS Nuts';
    const transactionNote = 'Nuts Order Payment';
    
    // UPI URL format for QR code
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    // Generate QR code using QR Server API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
    
    const qrContainer = document.getElementById('qr-code-container');
    qrContainer.innerHTML = `
        <img src="${qrApiUrl}" alt="UPI QR Code" style="border: 2px solid var(--accent-gold); border-radius: 8px;">
        <p class="qr-instruction">Scan with any UPI app to pay ₹${amount}</p>
    `;
}

function payWithUPI(app) {
    const amount = document.getElementById('popup-total').textContent;
    const upiId = 'keerthivasan98406@okhdfcbank';
    const merchantName = 'AS Nuts';
    const transactionNote = 'Nuts Order Payment';
    
    // UPI deep link format
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    // App-specific deep links
    const appUrls = {
        phonepe: `phonepe://pay?${upiUrl.split('?')[1]}`,
        paytm: `paytmmp://pay?${upiUrl.split('?')[1]}`,
        googlepay: `tez://upi/pay?${upiUrl.split('?')[1]}`,
        bhim: `bhim://pay?${upiUrl.split('?')[1]}`
    };
    
    // Try to open the specific app, fallback to generic UPI
    const appUrl = appUrls[app] || upiUrl;
    
    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = appUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show notification
    showNotification(`Opening ${app.charAt(0).toUpperCase() + app.slice(1)} for payment of ₹${amount}...`);
    
    // If app doesn't open, show fallback message
    setTimeout(() => {
        showNotification('If the app didn\'t open, please copy the UPI ID and pay manually', false);
    }, 3000);
}

// Export functions for global access
window.copyUPI = function() {
    const upiId = 'keerthivasan98406@okhdfcbank';
    navigator.clipboard.writeText(upiId).then(() => {
        showNotification('UPI ID copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = upiId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('UPI ID copied to clipboard!');
    });
};

window.payWithUPI = payWithUPI;


// Add this function to handle the order confirmation button animation
function setupOrderButtonAnimation() {
    const orderButton = document.getElementById('place-order');
    
    orderButton.addEventListener('click', function(e) {
        if (Object.keys(cart).length === 0) {
            showNotification('Your cart is empty. Add some premium ramapuran products first!', true);
            return;
        }
        
        if (!orderButton.classList.contains('animate')) {
            // Start animation
            orderButton.classList.add('animate');
            
            // After animation completes, show the order popup
            setTimeout(() => {
                placeOrder();
                orderButton.classList.remove('animate');
            }, 3000); // Show popup after 3 seconds (during animation)
        }
    });
}

// Screenshot Upload Functions
document.addEventListener('DOMContentLoaded', function() {
    const screenshotInput = document.getElementById('payment-screenshot');
    const screenshotPreview = document.getElementById('screenshot-preview');
    const previewImage = document.getElementById('preview-image');
    const whatsappBtn = document.getElementById('whatsapp-send-btn');
    
    if (screenshotInput) {
        screenshotInput.addEventListener('change', handleScreenshotUpload);
    }
});

function handleScreenshotUpload(event) {
    try {
        const file = event.target.files[0];
        if (file) {
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', true);
            return;
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('File size should be less than 5MB', true);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImage = document.getElementById('preview-image');
            const screenshotPreview = document.getElementById('screenshot-preview');
            const confirmBtn = document.getElementById('confirm-order');
            const processSteps = document.getElementById('process-steps');
            
            previewImage.src = e.target.result;
            screenshotPreview.style.display = 'block';
            processSteps.style.display = 'block';
            
            // Enable confirm order button with WhatsApp action
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Order';
            confirmBtn.classList.add('whatsapp-ready');
            
            // Store the image data for WhatsApp sending
            window.paymentScreenshot = {
                file: file,
                dataUrl: e.target.result
            };
            
            showNotification('✅ Screenshot uploaded! Click "Confirm Order" to send order details to WhatsApp and download the screenshot for sharing.', false, 'success');
        };
        reader.readAsDataURL(file);
        }
    } catch (error) {
        console.error('Error handling screenshot upload:', error);
        showNotification('Error uploading screenshot. Please try again.', true);
    }
}

function removeScreenshot() {
    const screenshotInput = document.getElementById('payment-screenshot');
    const screenshotPreview = document.getElementById('screenshot-preview');
    const confirmBtn = document.getElementById('confirm-order');
    
    screenshotInput.value = '';
    screenshotPreview.style.display = 'none';
    
    // Disable confirm order button again
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Upload Screenshot to Confirm';
    confirmBtn.classList.remove('whatsapp-ready');
    
    // Clear stored image data
    window.paymentScreenshot = null;
    
    showNotification('Screenshot removed. Please upload payment screenshot to confirm order.', false);
}

function sendToWhatsApp() {
    if (!window.paymentScreenshot) {
        showNotification('Please upload a screenshot first', true);
        return;
    }
    
    // Get order details
    const customerName = document.getElementById('customer-name')?.value || 'Customer';
    const total = document.getElementById('popup-total')?.textContent || '0';
    const orderItems = [];
    
    // Get cart items for the message
    for (const productId in cart) {
        const item = cart[productId];
        orderItems.push(`${item.name} - ${item.quantity} × 50g = ₹${item.total}`);
    }
    
    // Create WhatsApp message
    const message = `🛒 *AS Nuts Order Payment*
    
👤 *Customer:* ${customerName}
💰 *Total Amount:* ₹${total}

📦 *Items:*
${orderItems.join('\n')}

💳 *Payment Screenshot:* I will send the screenshot in the next message
📱 *UPI ID:* keerthivasan98406@okhdfcbank

✅ Payment completed via UPI. Please confirm order processing.

Thank you for choosing AS Nuts! 🥜`;
    
    // Encode message for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '919840694616'; // Your WhatsApp number
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Download screenshot for easy sharing
    downloadScreenshot();
    
    // Show clear instructions
    setTimeout(() => {
        showNotification('📱 WhatsApp opened! Now please attach and send the downloaded screenshot image in the chat.', false, 'success');
    }, 1000);
}

function downloadScreenshot() {
    if (!window.paymentScreenshot) return;
    
    try {
        const customerName = document.getElementById('customer-name')?.value || 'Customer';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        const link = document.createElement('a');
        link.download = `AS-Nuts-Payment-${customerName}-${timestamp}.jpg`;
        link.href = window.paymentScreenshot.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show notification with clear instructions
        setTimeout(() => {
            showNotification('📥 Screenshot downloaded to your device! Please attach this image in the WhatsApp chat that just opened.', false, 'success');
        }, 500);
        
    } catch (error) {
        // Download not supported on this device
        // Fallback: Show instructions to manually save the image
        showNotification('Please manually save the screenshot image and send it in WhatsApp chat.', false);
    }
}

function resetScreenshotUpload() {
    const screenshotInput = document.getElementById('payment-screenshot');
    const screenshotPreview = document.getElementById('screenshot-preview');
    
    if (screenshotInput) {
        screenshotInput.value = '';
    }
    if (screenshotPreview) {
        screenshotPreview.style.display = 'none';
    }
    
    // Clear stored image data
    window.paymentScreenshot = null;
}

// Save order to localStorage for owner to see
async function saveOrderToOwner(orderData) {
    try {
        // Get existing orders from localStorage
        const existingOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
        
        // Add new order with unique ID
        orderData.id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        existingOrders.push(orderData);
        
        // Save back to localStorage
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(existingOrders));
        
        // Trigger storage event for owner portal (if open in another tab)
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEYS.ORDERS,
            newValue: localStorage.getItem(STORAGE_KEYS.ORDERS)
        }));
        
        // Order saved successfully
        return true;
    } catch (error) {
        console.error('Failed to save order:', error);
        throw error;
    }
}

// Export functions for global access
window.removeScreenshot = removeScreenshot;
window.sendToWhatsApp = sendToWhatsApp;
window.resetScreenshotUpload = resetScreenshotUpload;

// Utility Functions
function showNotification(message, isError = false, type = 'info') {
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${isError ? 'error' : type}`;
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 4000);
}

function setupOrderButtonAnimation() {
    // Add any order button animations here if needed
    console.log('Order button animation setup complete');
}

function updateCartCount() {
    if (!cartCount) return;
    
    const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Add animation when count changes
    if (totalItems > 0) {
        cartCount.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 200);
    }
}

function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation active states
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
        // Scrolling down - hide header
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up - show header
        header.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

function renderProducts() {
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    Object.values(products).forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', product.category);
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='${createFallbackImage(product.name)}'">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-tamil">${product.nameTamil || ''}</p>
            <p class="product-description">${product.description}</p>
            <div class="product-price">₹${product.price} <span>per 50g</span></div>
            <button class="btn btn-primary add-to-cart" onclick="addToCart('${product.id}')">
                <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
        </div>
    `;
    
    return card;
}

function addToCart(productId) {
    if (!products[productId]) return;
    
    if (cart[productId]) {
        cart[productId].quantity += 1;
        cart[productId].total = cart[productId].quantity * cart[productId].price;
    } else {
        const product = products[productId];
        cart[productId] = {
            id: productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            total: product.price,
            image: product.image
        };
    }
    
    saveCartToStorage();
    updateCartCount();
    updateCart();
    showNotification(`${products[productId].name} added to cart!`, false, 'success');
}

function updateCart() {
    if (!cartItems) return;
    
    const cartItemsContainer = cartItems;
    cartItemsContainer.innerHTML = '';
    
    if (Object.keys(cart).length === 0) {
        emptyCartMessage.style.display = 'block';
        return;
    }
    
    emptyCartMessage.style.display = 'none';
    
    let subtotal = 0;
    
    Object.values(cart).forEach(item => {
        subtotal += item.total;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='${createFallbackImage(item.name)}'">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price} per 50g</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="decreaseQuantity('${item.id}')">-</button>
                <span>${item.quantity}</span>
                <button onclick="increaseQuantity('${item.id}')">+</button>
            </div>
            <div class="cart-item-total">₹${item.total}</div>
            <button class="remove-item" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Update totals
    if (subtotalElement) subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `₹${(subtotal + 50).toFixed(2)}`;
}

function increaseQuantity(productId) {
    if (cart[productId]) {
        cart[productId].quantity += 1;
        cart[productId].total = cart[productId].quantity * cart[productId].price;
        saveCartToStorage();
        updateCartCount();
        updateCart();
    }
}

function decreaseQuantity(productId) {
    if (cart[productId] && cart[productId].quantity > 1) {
        cart[productId].quantity -= 1;
        cart[productId].total = cart[productId].quantity * cart[productId].price;
        saveCartToStorage();
        updateCartCount();
        updateCart();
    }
}

function removeFromCart(productId) {
    if (cart[productId]) {
        delete cart[productId];
        saveCartToStorage();
        updateCartCount();
        updateCart();
        showNotification('Item removed from cart', false);
    }
}

function filterProducts(searchTerm) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent.toLowerCase();
        const productDescription = card.querySelector('.product-description').textContent.toLowerCase();
        
        if (productName.includes(searchTerm.toLowerCase()) || 
            productDescription.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterProductsByCategory(category) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function showOrderPopup() {
    if (!orderPopup) return;
    
    // Update order summary in popup
    updateOrderSummary();
    
    orderPopup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideOrderPopup() {
    if (!orderPopup) return;
    
    orderPopup.style.display = 'none';
    document.body.style.overflow = '';
}

function updateOrderSummary() {
    if (!popupOrderItems || !popupTotal) return;
    
    popupOrderItems.innerHTML = '';
    let total = 0;
    
    Object.values(cart).forEach(item => {
        total += item.total;
        
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <span>${item.name} × ${item.quantity}</span>
            <span>₹${item.total}</span>
        `;
        
        popupOrderItems.appendChild(orderItem);
    });
    
    popupTotal.textContent = `₹${(total + 50).toFixed(2)}`;
    
    // Update UPI amount
    const upiAmount = document.getElementById('upi-amount');
    if (upiAmount) {
        upiAmount.textContent = (total + 50).toFixed(2);
    }
}

function handlePaymentMethodChange(e) {
    if (!upiDetails) return;
    
    if (e.target.value === 'online') {
        upiDetails.style.display = 'block';
        updateOrderSummary(); // Update UPI amount
    } else {
        upiDetails.style.display = 'none';
    }
}

function handleOrderSubmission(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const orderData = {
        customerName: formData.get('customer-name'),
        phone: formData.get('customer-phone'),
        address: formData.get('customer-address'),
        pincode: formData.get('customer-pincode'),
        place: formData.get('customer-place'),
        paymentMethod: formData.get('payment-method'),
        items: Object.values(cart),
        total: Object.values(cart).reduce((sum, item) => sum + item.total, 0) + 50,
        timestamp: new Date().toISOString()
    };
    
    // Save order
    saveOrderToOwner(orderData);
    
    // Clear cart
    cart = {};
    saveCartToStorage();
    updateCartCount();
    updateCart();
    
    // Hide popup
    hideOrderPopup();
    
    // Show success message
    showNotification('Order placed successfully! We will contact you soon.', false, 'success');
    
    // Redirect to home page
    showPage('home');
}

function printBillSummary() {
    if (!printBill) return;
    
    // Update bill content
    updateBillContent();
    
    // Show print bill
    printBill.style.display = 'block';
    
    // Print
    window.print();
    
    // Hide print bill after printing
    setTimeout(() => {
        printBill.style.display = 'none';
    }, 1000);
}

function updateBillContent() {
    if (!billItems || !billDate) return;
    
    // Update date
    billDate.textContent = new Date().toLocaleDateString();
    
    // Update items
    billItems.innerHTML = '';
    let total = 0;
    
    Object.values(cart).forEach(item => {
        total += item.total;
        
        const billItem = document.createElement('div');
        billItem.className = 'bill-item';
        billItem.innerHTML = `
            <span>${item.name}</span>
            <span>${item.quantity} × ₹${item.price}</span>
            <span>₹${item.total}</span>
        `;
        
        billItems.appendChild(billItem);
    });
    
    // Add shipping
    const shippingItem = document.createElement('div');
    shippingItem.className = 'bill-item';
    shippingItem.innerHTML = `
        <span>Shipping</span>
        <span></span>
        <span>₹50</span>
    `;
    billItems.appendChild(shippingItem);
    
    // Add total
    const totalItem = document.createElement('div');
    totalItem.className = 'bill-item bill-total';
    totalItem.innerHTML = `
        <span><strong>Total</strong></span>
        <span></span>
        <span><strong>₹${(total + 50).toFixed(2)}</strong></span>
    `;
    billItems.appendChild(totalItem);
}

// Make functions globally accessible
window.addToCart = addToCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeFromCart = removeFromCart;

// Carousel Functionality
function startCarousel() {
    if (!carouselInner || carouselItems.length === 0) return;
    
    // Auto-slide every 5 seconds
    slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
    
    // Pause on hover
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        carousel.addEventListener('mouseleave', () => {
            slideInterval = setInterval(() => {
                nextSlide();
            }, 5000);
        });
    }
}

function nextSlide() {
    if (!carouselInner || carouselItems.length === 0) return;
    
    currentSlide = (currentSlide + 1) % carouselItems.length;
    updateCarousel();
}

function previousSlide() {
    if (!carouselInner || carouselItems.length === 0) return;
    
    currentSlide = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
    updateCarousel();
}

function goToSlide(index) {
    if (!carouselInner || carouselItems.length === 0) return;
    
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    if (!carouselInner || carouselItems.length === 0) return;
    
    // Update carousel position
    const translateX = -currentSlide * 100;
    carouselInner.style.transform = `translateX(${translateX}%)`;
    
    // Update active states
    carouselItems.forEach((item, index) => {
        item.classList.toggle('active', index === currentSlide);
    });
    
    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

// Touch/Swipe support for mobile
function setupCarouselTouch() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;
    
    let startX = 0;
    let endX = 0;
    let isDragging = false;
    
    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        clearInterval(slideInterval); // Pause auto-slide during touch
    }, { passive: true });
    
    carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        endX = e.touches[0].clientX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const threshold = 50; // Minimum swipe distance
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left - next slide
            } else {
                previousSlide(); // Swipe right - previous slide
            }
        }
        
        // Resume auto-slide
        slideInterval = setInterval(() => {
            nextSlide();
        }, 5000);
    }, { passive: true });
    
    // Mouse drag support for desktop
    let mouseDown = false;
    let mouseStartX = 0;
    let mouseEndX = 0;
    
    carousel.addEventListener('mousedown', (e) => {
        mouseDown = true;
        mouseStartX = e.clientX;
        clearInterval(slideInterval);
        e.preventDefault();
    });
    
    carousel.addEventListener('mousemove', (e) => {
        if (!mouseDown) return;
        mouseEndX = e.clientX;
    });
    
    carousel.addEventListener('mouseup', () => {
        if (!mouseDown) return;
        mouseDown = false;
        
        const threshold = 50;
        const diff = mouseStartX - mouseEndX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                previousSlide();
            }
        }
        
        slideInterval = setInterval(() => {
            nextSlide();
        }, 5000);
    });
    
    carousel.addEventListener('mouseleave', () => {
        mouseDown = false;
        slideInterval = setInterval(() => {
            nextSlide();
        }, 5000);
    });
}

// Mobile Menu Functionality
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle active classes
            mobileMenuBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on nav links
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu on window resize if it gets too wide
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Enhanced Event Listeners Setup
function setupEventListeners() {
    // Setup mobile menu
    setupMobileMenu();
    
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) {
                showPage(page);
            }
        });
    });

    // Contact navigation
    if (contactNav) {
        contactNav.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('contact-footer').scrollIntoView({ 
                behavior: 'smooth' 
            });
        });
    }

    // Continue shopping button
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            showPage('products');
        });
    }

    // Place order button
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
            if (Object.keys(cart).length === 0) {
                showNotification('Your cart is empty!', true);
                return;
            }
            showOrderPopup();
        });
    }

    // Print summary button
    if (printSummaryBtn) {
        printSummaryBtn.addEventListener('click', () => {
            if (Object.keys(cart).length === 0) {
                showNotification('Your cart is empty!', true);
                return;
            }
            printBillSummary();
        });
    }

    // Product search
    if (productSearch) {
        productSearch.addEventListener('input', (e) => {
            filterProducts(e.target.value);
        });
    }

    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            filterProductsByCategory(filter);
        });
    });

    // Category cards
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.getAttribute('data-filter');
            showPage('products');
            
            setTimeout(() => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                const targetButton = document.querySelector(`[data-filter="${filter}"]`);
                if (targetButton) {
                    targetButton.classList.add('active');
                }
                filterProductsByCategory(filter);
            }, 300);
        });
    });

    // Carousel controls
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            previousSlide();
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            nextSlide();
        });
    }

    // Carousel indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // Order popup close
    if (closePopup) {
        closePopup.addEventListener('click', hideOrderPopup);
    }

    if (cancelOrder) {
        cancelOrder.addEventListener('click', hideOrderPopup);
    }

    // Click outside popup to close
    if (orderPopup) {
        orderPopup.addEventListener('click', (e) => {
            if (e.target === orderPopup) {
                hideOrderPopup();
            }
        });
    }

    // Payment method change
    paymentMethods.forEach(method => {
        method.addEventListener('change', handlePaymentMethodChange);
    });

    // Order form submission
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmission);
    }

    // Scroll header hide/show
    window.addEventListener('scroll', handleScroll);
    
    // Handle storage changes
    window.addEventListener('storage', handleStorageUpdate);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
    setupEventListeners();
});

// Hidden owner access - Add this for easy access
// You can access owner portal by typing "owner" in browser console
// or by visiting: customer.html?owner=AS123
window.ownerAccess = function() {
    const password = prompt("Enter Owner Password:");
    if (password === 'AS123') {
        window.location.href = 'owner.html?password=AS123';
    } else {
        alert("Incorrect password!");
    }
};

// Check for owner access in URL
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const ownerParam = urlParams.get('owner');
    
    if (ownerParam === 'AS123') {
        // Redirect to owner portal
        window.location.href = 'owner.html?password=AS123';
    }
});

// Console message for owner access
console.log('🔐 Owner Access: Type ownerAccess() in console or visit customer.html?owner=AS123');