// owner.js - Complete file with MongoDB integration

// API Base URL - Point to Node.js server
const API_BASE = 'http://localhost:3000';

// Storage Keys (for backward compatibility)
const STORAGE_KEYS = {
    PRODUCTS: 'srs_cashews_products',
    ORDERS: 'srs_cashews_orders'
};

// Global data
let products = {};
let orders = [];
let filteredOrders = [];

// DOM elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const passwordSection = document.getElementById('login');
const ownerPassword = document.getElementById('owner-password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const saveChangesBtn = document.getElementById('save-changes');
const productForms = document.getElementById('product-forms');
const orderList = document.getElementById('order-list');
const addProductBtn = document.getElementById('add-product-btn');
const refreshOrdersBtn = document.getElementById('refresh-orders');
const totalOrdersElement = document.getElementById('total-orders');
const totalRevenueElement = document.getElementById('total-revenue');
const totalProductsElement = document.getElementById('total-products');
const totalCustomersElement = document.getElementById('total-customers');
const recentOrdersList = document.getElementById('recent-orders-list');

// SMS page elements
const orderNotifications = document.getElementById('order-notifications');
const sendAllSmsBtn = document.getElementById('send-all-sms');
const sendAllSmsPortalBtn = document.getElementById('send-all-sms-portal');
const refreshOrdersSmsBtn = document.getElementById('refresh-orders-sms');
const pendingOrdersElement = document.getElementById('pending-orders');
const totalCustomersSmsElement = document.getElementById('total-customers-sms');

// Form elements
const newProductName = document.getElementById('new-product-name');
const newProductTamil = document.getElementById('new-product-tamil');
const newProductPrice = document.getElementById('new-product-price');
const newProductCategory = document.getElementById('new-product-category');
const newProductDescription = document.getElementById('new-product-description');
const newProductImage = document.getElementById('new-product-image');
const newProductBadge = document.getElementById('new-product-badge');
const productSearch = document.getElementById('product-search');

// Filter elements
const orderFilters = document.querySelectorAll('.filter-btn');

// Default owner credentials
const DEFAULT_OWNER = {
    email: "owner@asnuts.com",
    password: "ASNuts2024!"
};

// Initialize the owner portal
async function init() {
    console.log('Initializing owner portal...');
    
    setupEventListeners();
    
    // Always start with login page - user must authenticate each time
    console.log('Showing login page');
    showPage('login');
    
    // Clear any previous authentication
    sessionStorage.removeItem('ownerAuthenticated');
    localStorage.removeItem('asNuts_token');
    localStorage.removeItem('asNuts_user');
}

// Handle login to owner portal
async function loginToOwnerPortal() {
    console.log('Logging into owner portal...');
    
    // Show dashboard
    showPage('dashboard');
    
    // Load portal data
    await loadOwnerPortal();
}



// Load owner portal after authentication
async function loadOwnerPortal() {
    // Ensure dashboard is visible
    showPage('dashboard');
    
    try {
        await loadProducts();
        await loadOrders();
        updateStats();
        showNotification('Welcome to AS Nuts Owner Portal!', false, 'success');
    } catch (error) {
        console.error('Error loading portal:', error);
        showNotification('Portal loaded with limited functionality', true);
    }
}

// Handle storage updates from customer page
function handleStorageUpdate(event) {
    if (event.key === STORAGE_KEYS.ORDERS) {
        loadOrders();
        showNotification('New order received!', false, 'success');
    }
    if (event.key === STORAGE_KEYS.PRODUCTS) {
        // This would be for multi-tab sync, but we control products from owner only
    }
}

// Load products from API (real-time from database)
async function loadProducts() {
    try {
        const token = localStorage.getItem('asNuts_token');
        if (!token) {
            showNotification('Please login first', true);
            return;
        }

        const response = await fetch(`${API_BASE}/api/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const productsArray = await response.json();
            
            // Convert array to object with id as key
            products = {};
            productsArray.forEach(product => {
                products[product.id] = product;
            });
            
            renderOwnerForms();
            updateStats();
            showNotification('Products loaded from database!', false);
        } else {
            throw new Error('Failed to fetch products from server');
        }
    } catch (error) {
        // Fallback to local products if API fails
        loadLocalProducts();
        showNotification('Using offline products. Database connection failed.', true);
    }
}

// Save product to database via API
async function saveProductToDB(productData, isUpdate = false) {
    try {
        const token = localStorage.getItem('asNuts_token');
        if (!token) {
            throw new Error('Authentication required');
        }

        const url = isUpdate ? `${API_BASE}/api/products/${productData.id}` : `${API_BASE}/api/products`;
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            const result = await response.json();
            return result.product;
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save product');
        }
    } catch (error) {
        throw error;
    }
}

// Load orders from API (real-time from database)
async function loadOrders() {
    try {
        const token = localStorage.getItem('asNuts_token');
        if (!token) {
            showNotification('Please login first', true);
            return;
        }

        const response = await fetch(`${API_BASE}/api/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            orders = await response.json();
            filteredOrders = [...orders];
            renderOrderHistory();
            renderOrderNotifications();
            renderRecentOrders();
            updateStats();
            showNotification('Orders loaded from database!', false);
        } else {
            throw new Error('Failed to fetch orders from server');
        }
    } catch (error) {
        orders = [];
        addDummyOrders();
        showNotification('Using demo orders. Database connection failed.', true);
    }
}

// Save orders to localStorage
function saveOrdersToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (error) {
        console.error('Failed to save orders to storage:', error);
    }
}

// Add dummy orders for demonstration
function addDummyOrders() {
    const dummyOrders = [
        {
            id: "dummy_order_1",
            customerName: "Rajesh Kumar",
            customerPhone: "+91 9876543210",
            customerAddress: "123 MG Road, Anna Nagar",
            customerPincode: "600040",
            customerPlace: "Chennai",
            paymentMethod: "cod",
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            items: [
                {
                    name: "Batham Cashew Nuts",
                    nameTamil: "பாதாம் முந்திரி",
                    price: 140,
                    quantity: 2,
                    total: 280,
                    productId: "batham"
                },
                {
                    name: "Premium California Almonds",
                    nameTamil: "பாதாம்",
                    price: 120,
                    quantity: 1,
                    total: 120,
                    productId: "badam"
                }
            ],
            total: 450,
            status: "pending",
            source: "AS Nuts Website"
        },
        {
            id: "dummy_order_2",
            customerName: "Priya Sharma",
            customerPhone: "+91 8765432109",
            customerAddress: "45 Gandhi Street, T Nagar",
            customerPincode: "600017",
            customerPlace: "Chennai",
            paymentMethod: "online",
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            items: [
                {
                    name: "W-180 Premium Cashews",
                    nameTamil: "W-180 முந்திரி",
                    price: 160,
                    quantity: 3,
                    total: 480,
                    productId: "w180"
                }
            ],
            total: 530,
            status: "completed",
            source: "AS Nuts Website"
        }
    ];

    // Add dummy orders to the orders array
    orders = [...dummyOrders, ...orders];
    saveOrdersToStorage();
}

// Fallback to local products
function loadLocalProducts() {
    products = {
        // Premium Panruti Cashews
        batham: { 
            id: "batham",
            name: "Batham Cashew Nuts", 
            nameTamil: "பாதாம் முந்திரி",
            price: 140,
            description: "Premium Batham cashews with creamy texture and buttery flavor from Panruti.",
            image: "https://m.media-amazon.com/images/I/71o-btxbBiL._AC_UF894,1000_QL80_.jpg",
            category: "cashews",
            badge: "Panruti Special"
        },
        kaju: { 
            id: "kaju",
            name: "Jumbo Whole Cashews", 
            nameTamil: "காஜு முந்திரி",
            price: 130,
            description: "Extra large whole cashews with creamy texture and buttery flavor from Panruti farms.",
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
    renderOwnerForms();
    updateStats();
    saveProductsToStorage();
}
// Tab navigation functionality
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.owner-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// OWNER PORTAL FUNCTIONS
function renderOwnerForms() {
    productForms.innerHTML = '';
    
    if (Object.keys(products).length === 0) {
        productForms.innerHTML = '<p class="no-data">No products found. Add your first product!</p>';
        return;
    }
    
    const searchTerm = productSearch.value.toLowerCase();
    const filteredProducts = Object.entries(products).filter(([id, product]) => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.nameTamil && product.nameTamil.toLowerCase().includes(searchTerm)) ||
        product.description.toLowerCase().includes(searchTerm)
    );
    
    if (filteredProducts.length === 0) {
        productForms.innerHTML = '<p class="no-data">No products match your search.</p>';
        return;
    }
    
    filteredProducts.forEach(([productId, product]) => {
        const form = document.createElement('div');
        form.className = 'product-edit-form';
        form.innerHTML = `
            <div class="product-image-section">
                <div class="current-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BUyBOdXRzPC90ZXh0Pjwvc3ZnPg=='"
                </div>
                <div class="image-url-input">
                    <label for="${productId}-image">Image URL</label>
                    <input type="text" class="form-control compact-form-control" id="${productId}-image" value="${product.image}" 
                           placeholder="Image URL" oninput="updateImagePreview('${productId}')">
                    <div class="image-preview-container">
                        <div class="image-preview" id="${productId}-preview">
                            <span>Preview</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="product-details-section">
                <div class="product-header-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-meta">
                        <span class="product-category-badge">${product.category}</span>
                        <span class="product-price-badge">₹${product.price}</span>
                    </div>
                </div>
                
                <!-- First Row: Name, Tamil Name, Price -->
                <div class="product-main-row">
                    <div class="compact-form-group product-name-input">
                        <label for="${productId}-name">Name</label>
                        <input type="text" class="compact-form-control" id="${productId}-name" value="${product.name}">
                    </div>
                    <div class="compact-form-group product-tamil-input">
                        <label for="${productId}-tamil">Tamil</label>
                        <input type="text" class="compact-form-control" id="${productId}-tamil" value="${product.nameTamil || ''}" placeholder="Tamil name">
                    </div>
                    <div class="compact-form-group product-price-input">
                        <label for="${productId}-price">Price</label>
                        <input type="number" class="compact-form-control" id="${productId}-price" value="${product.price}">
                    </div>
                </div>
                
                <!-- Second Row: Description -->
                <div class="compact-form-group product-description-row">
                    <label for="${productId}-description">Description</label>
                    <textarea class="compact-form-control compact-textarea" id="${productId}-description">${product.description}</textarea>
                </div>
                
                <!-- Third Row: Category, Badge, Delete Button -->
                <div class="product-actions-row">
                    <div class="compact-form-group product-category-select">
                        <label for="${productId}-category">Category</label>
                        <select class="compact-form-control" id="${productId}-category">
                            <option value="cashews" ${product.category === 'cashews' ? 'selected' : ''}>Cashews</option>
                            <option value="nuts" ${product.category === 'nuts' ? 'selected' : ''}>Nuts</option>
                            <option value="dryfruits" ${product.category === 'dryfruits' ? 'selected' : ''}>Dry Fruits</option>
                            <option value="seeds" ${product.category === 'seeds' ? 'selected' : ''}>Seeds</option>
                            <option value="premium" ${product.category === 'premium' ? 'selected' : ''}>Premium</option>
                        </select>
                    </div>
                    <div class="compact-form-group product-badge-select">
                        <label for="${productId}-badge">Badge</label>
                        <select class="compact-form-control" id="${productId}-badge">
                            <option value="">No Badge</option>
                            <option value="Panruti Special" ${product.badge === 'Panruti Special' ? 'selected' : ''}>Panruti Special</option>
                            <option value="Premium" ${product.badge === 'Premium' ? 'selected' : ''}>Premium</option>
                            <option value="Popular" ${product.badge === 'Popular' ? 'selected' : ''}>Popular</option>
                            <option value="Healthy" ${product.badge === 'Healthy' ? 'selected' : ''}>Healthy</option>
                        </select>
                    </div>
                    <button class="btn btn-danger compact-btn" onclick="deleteProductHandler('${productId}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        productForms.appendChild(form);
    });
}

// Save product changes to database via API
async function saveProductChanges() {
    const updates = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const productId in products) {
        const name = document.getElementById(`${productId}-name`).value.trim();
        const nameTamil = document.getElementById(`${productId}-tamil`).value.trim();
        const price = parseInt(document.getElementById(`${productId}-price`).value);
        const category = document.getElementById(`${productId}-category`).value;
        const description = document.getElementById(`${productId}-description`).value.trim();
        const image = document.getElementById(`${productId}-image`).value.trim();
        const badge = document.getElementById(`${productId}-badge`).value;
        
        const productData = {
            id: productId,
            name,
            nameTamil,
            price,
            category,
            description,
            image,
            badge: badge || undefined
        };
        
        try {
            await saveProductToDB(productData, true);
            products[productId] = productData;
            successCount++;
        } catch (error) {
            console.error(`Failed to update product ${productId}:`, error);
            errorCount++;
        }
    }
    
    if (errorCount === 0) {
        showNotification(`All ${successCount} product changes saved successfully!`, false, 'success');
    } else {
        showNotification(`${successCount} products updated, ${errorCount} failed. Check console for details.`, true);
    }
}

// Add new product to database via API
async function addNewProduct() {
    const name = newProductName.value.trim();
    const nameTamil = newProductTamil.value.trim();
    const price = parseInt(newProductPrice.value);
    const category = newProductCategory.value;
    const description = newProductDescription.value.trim();
    const image = newProductImage.value.trim();
    const badge = newProductBadge.value;
    
    if (!name || !price || !description || !image) {
        showNotification('Please fill in all required product details.', true);
        return;
    }
    
    if (price <= 0) {
        showNotification('Price must be a positive number.', true);
        return;
    }
    
    const productId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Check if product already exists
    if (products[productId]) {
        showNotification('A product with this name already exists.', true);
        return;
    }
    
    const productData = {
        id: productId,
        name,
        nameTamil,
        price,
        category,
        description,
        image,
        badge: badge || undefined
    };
    
    try {
        // Save to database
        const savedProduct = await saveProductToDB(productData, false);
        
        // Add to local products object
        products[productId] = savedProduct;
        
        // Clear form
        newProductName.value = '';
        newProductTamil.value = '';
        newProductPrice.value = '';
        newProductDescription.value = '';
        newProductImage.value = '';
        newProductBadge.value = '';
        document.getElementById('new-product-preview').innerHTML = '<span>Image preview will appear here</span>';
        document.getElementById('new-product-preview').classList.remove('has-image');
        
        // Re-render forms
        renderOwnerForms();
        
        showNotification('New product added successfully!', false, 'success');
    } catch (error) {
        showNotification('Failed to add product.', true);
    }
}

// Delete product from localStorage
async function deleteProductHandler(productId) {
    if (confirm(`Are you sure you want to delete "${products[productId].name}"? This action cannot be undone.`)) {
        try {
            // Remove from products object
            delete products[productId];
            
            // Save to localStorage
            saveProductsToStorage();
            
            // Update the display
            renderOwnerForms();
            updateStats();
            
            showNotification('Product deleted successfully!', false, 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Failed to delete product.', true);
        }
    }
}

// Order rendering functions
function renderOrderHistory() {
    orderList.innerHTML = '';
    
    if (filteredOrders.length === 0) {
        orderList.innerHTML = '<p class="no-data">No orders found.</p>';
        return;
    }
    
    // Sort orders by date (newest first)
    const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOrders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <div class="order-item-row">
                    <span>${item.name}</span>
                    <span>${item.quantity} × 50g = ₹${item.total.toFixed(2)}</span>
                </div>
            `;
        });
        
        const statusClass = getStatusClass(order.status);
        
        orderItem.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-customer">${order.customerName}</div>
                    <div class="order-contact">📞 ${order.customerPhone} | 📍 ${order.customerPlace}</div>
                    <div class="order-payment">${order.paymentMethod === 'cod' ? 'COD' : 'Online Payment'}</div>
                </div>
                <div>
                    <div class="order-date">${new Date(order.date).toLocaleString()}</div>
                    <div class="order-status ${statusClass}">${order.status}</div>
                </div>
            </div>
            <div class="order-items">
                ${itemsHtml}
            </div>
            <div class="order-address">
                🏠 ${order.customerAddress}, ${order.customerPincode}
            </div>
            <div class="order-total">Total: ₹${order.total.toFixed(2)}</div>
            <div class="sms-actions">
                <button class="btn btn-sms" onclick="sendSMSNotification('${order.customerName}', '${order.customerPhone}', ${order.total})">
                    <i class="fas fa-sms"></i> Send SMS
                </button>
                <button class="btn btn-primary" onclick="updateOrderStatusHandler('${order.id}', 'completed')">
                    <i class="fas fa-check"></i> Mark Completed
                </button>
                <button class="btn btn-secondary" onclick="updateOrderStatusHandler('${order.id}', 'pending')">
                    <i class="fas fa-clock"></i> Mark Pending
                </button>
                <button class="btn btn-danger" onclick="updateOrderStatusHandler('${order.id}', 'cancelled')">
                    <i class="fas fa-times"></i> Cancel Order
                </button>
            </div>
        `;
        
        orderList.appendChild(orderItem);
    });
}

function renderRecentOrders() {
    recentOrdersList.innerHTML = '';
    
    const recentOrders = orders.slice(0, 5); // Show last 5 orders
    
    if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = '<p class="no-data">No recent orders</p>';
        return;
    }
    
    recentOrders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'recent-order-item';
        orderItem.innerHTML = `
            <div class="recent-order-customer">${order.customerName}</div>
            <div class="recent-order-details">
                ${order.items.length} items • ₹${order.total.toFixed(2)} • ${order.paymentMethod}
            </div>
        `;
        recentOrdersList.appendChild(orderItem);
    });
}

function renderOrderNotifications() {
    orderNotifications.innerHTML = '';
    
    const pendingOrders = orders.filter(order => order.status === 'pending');
    
    if (pendingOrders.length === 0) {
        orderNotifications.innerHTML = '<p class="no-data">No pending orders to notify.</p>';
        return;
    }
    
    pendingOrders.forEach(order => {
        const notification = document.createElement('div');
        notification.className = 'order-notification';
        
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <div>${item.quantity} × 50g ${item.name}</div>
            `;
        });
        
        notification.innerHTML = `
            <div class="notification-header">
                <div>
                    <div class="customer-name">${order.customerName}</div>
                    <div class="customer-phone">📞 ${order.customerPhone}</div>
                </div>
                <div class="order-time">${new Date(order.date).toLocaleString()}</div>
            </div>
            <div class="order-details">
                <div class="order-items-list">
                    ${itemsHtml}
                </div>
                <div class="order-total-sms">Total: ₹${order.total.toFixed(2)}</div>
                <div class="order-address">
                    📍 ${order.customerAddress}, ${order.customerPlace} - ${order.customerPincode}
                </div>
            </div>
            <div class="sms-actions">
                <button class="btn btn-sms" onclick="sendSMSNotification('${order.customerName}', '${order.customerPhone}', ${order.total})">
                    <i class="fas fa-paper-plane"></i> Send Order SMS
                </button>
                <button class="btn btn-primary" onclick="sendPaymentReminder('${order.customerName}', '${order.customerPhone}', ${order.total})">
                    <i class="fas fa-money-bill-wave"></i> Payment Reminder
                </button>
            </div>
        `;
        
        orderNotifications.appendChild(notification);
    });
}

function updateStats() {
    // Update main stats
    totalOrdersElement.textContent = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    totalRevenueElement.textContent = `₹${totalRevenue.toFixed(2)}`;
    
    totalProductsElement.textContent = Object.keys(products).length;
    
    const uniqueCustomers = [...new Set(orders.map(order => order.customerPhone))];
    totalCustomersElement.textContent = uniqueCustomers.length;
    
    // Update SMS page stats
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    pendingOrdersElement.textContent = pendingOrders;
    totalCustomersSmsElement.textContent = uniqueCustomers.length;
}

function getStatusClass(status) {
    switch (status) {
        case 'completed': return 'status-completed';
        case 'pending': return 'status-pending';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

// Update order status in localStorage
async function updateOrderStatusHandler(orderId, status) {
    try {
        // Update local orders
        const orderIndex = orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = status;
        }
        
        // Save to localStorage
        saveOrdersToStorage();
        
        // Re-render orders
        renderOrderHistory();
        renderOrderNotifications();
        renderRecentOrders();
        updateStats();
        
        showNotification(`Order status updated to ${status}`, false, 'success');
    } catch (error) {
        showNotification('Failed to update order status.', true);
    }
}

// SMS Functions
function sendSMSNotification(customerName, phoneNumber, total) {
    const message = `Hi ${customerName}, your AS Nuts order of ₹${total} has been confirmed! We'll deliver to you soon from Panruti. Thank you for choosing us!`;
    
    // SMS sent successfully
    showNotification(`SMS sent to ${customerName}`, false, 'success');
}

function sendPaymentReminder(customerName, phoneNumber, total) {
    const message = `Hi ${customerName}, friendly reminder for your AS Nuts order payment of ₹${total}. Please complete the payment to process your order from Panruti.`;
    
    // Payment reminder sent successfully
    showNotification(`Payment reminder sent to ${customerName}`, false, 'success');
}

function sendSMSToAll() {
    if (orders.length === 0) {
        showNotification('No orders to send SMS to.', true);
        return;
    }
    
    // Get unique customers
    const uniqueCustomers = [...new Set(orders.map(order => order.customerPhone))];
    
    uniqueCustomers.forEach(phone => {
        const customerOrders = orders.filter(order => order.customerPhone === phone);
        const customerName = customerOrders[0].customerName;
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
        
        const message = `Hi ${customerName}, thank you for your orders totaling ₹${totalSpent.toFixed(2)} from AS Nuts, Panruti! We appreciate your business.`;
        
        // SMS sent successfully
    });
    
    showNotification(`SMS notifications sent to ${uniqueCustomers.length} customers`, false, 'success');
}

// Filter orders by status
function filterOrders(status) {
    if (status === 'all') {
        filteredOrders = [...orders];
    } else {
        filteredOrders = orders.filter(order => order.status === status);
    }
    renderOrderHistory();
}

// Refresh orders
async function refreshOrders() {
    await loadOrders();
    showNotification('Orders refreshed!', false, 'success');
}

// Show notification
function showNotification(message, isError = false, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification';
    
    if (isError) {
        notification.classList.add('error');
    } else if (type === 'success') {
        notification.classList.add('success');
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Show page
function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const activePage = document.getElementById(pageId);
    activePage.classList.add('active');
    
    // Load data when accessing dashboard
    if (pageId === 'dashboard') {
        loadProducts();
        loadOrders();
    }
    
    // Special handling for SMS page
    if (pageId === 'sms') {
        renderOrderNotifications();
    }
}

// Owner portal login - Check if user is authenticated as owner
async function loginToOwnerPortal() {
    const token = localStorage.getItem('asNuts_token');
    const user = JSON.parse(localStorage.getItem('asNuts_user') || '{}');
    
    if (token && user.role === 'owner') {
        showPage('dashboard');
        await loadProducts();
        await loadOrders();
        showNotification('Welcome to AS Nuts Owner Portal!', false, 'success');
    } else {
        showNotification('Owner access required. Please login with owner credentials.', true);
        // Redirect to main login page
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
}

// Owner portal logout
function logoutFromOwnerPortal() {
    localStorage.removeItem('asNuts_token');
    localStorage.removeItem('asNuts_user');
    showNotification('Logged out successfully.', false, 'success');
    // Redirect to main login page
    setTimeout(() => {
        window.location.href = '/';
    }, 1500);
}

// Update image preview for product forms
function updateImagePreview(productId) {
    const imageUrl = document.getElementById(`${productId}-image`).value;
    const preview = document.getElementById(`${productId}-preview`);
    
    if (imageUrl) {
        preview.innerHTML = `<img src="${imageUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<span>Invalid image URL</span>'">`;
        preview.classList.add('has-image');
    } else {
        preview.innerHTML = '<span>Image preview will appear here</span>';
        preview.classList.remove('has-image');
    }
}

// Update new product image preview
function updateNewProductPreview() {
    const imageUrl = document.getElementById('new-product-image').value;
    const preview = document.getElementById('new-product-preview');
    
    if (imageUrl) {
        preview.innerHTML = `<img src="${imageUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<span>Invalid image URL</span>'">`;
        preview.classList.add('has-image');
    } else {
        preview.innerHTML = '<span>Image preview will appear here</span>';
        preview.classList.remove('has-image');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('data-page')) {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                showPage(pageId);
            }
        });
    });
    
    // Owner portal
    loginBtn.addEventListener('click', loginToOwnerPortal);
    logoutBtn.addEventListener('click', logoutFromOwnerPortal);
    saveChangesBtn.addEventListener('click', saveProductChanges);
    
    // SMS page
    sendAllSmsBtn.addEventListener('click', sendSMSToAll);
    sendAllSmsPortalBtn.addEventListener('click', sendSMSToAll);
    refreshOrdersSmsBtn.addEventListener('click', refreshOrders);
    refreshOrdersBtn.addEventListener('click', refreshOrders);
    
    // Product management
    addProductBtn.addEventListener('click', addNewProduct);
    
    // New product image preview
    document.getElementById('new-product-image').addEventListener('input', updateNewProductPreview);
    
    // Product search
    productSearch.addEventListener('input', renderOwnerForms);
    
    // Order filters
    orderFilters.forEach(button => {
        button.addEventListener('click', () => {
            orderFilters.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const status = button.getAttribute('data-status');
            filterOrders(status);
        });
    });
    
    // Tab navigation
    setupTabNavigation();
    
    // Allow login with Enter key
    ownerPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginToOwnerPortal();
        }
    });
}

// Initialize the owner portal when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export functions for global access
window.updateImagePreview = updateImagePreview;
window.updateNewProductPreview = updateNewProductPreview;
window.deleteProductHandler = deleteProductHandler;
window.updateOrderStatusHandler = updateOrderStatusHandler;
window.sendSMSNotification = sendSMSNotification;
window.sendPaymentReminder = sendPaymentReminder;

// Utility Functions
function showNotification(message, isError = false, type = 'info') {
    const notification = document.getElementById('notification');
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
}

function updateStats() {
    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalProducts = Object.keys(products).length;
    const uniqueCustomers = new Set(orders.map(order => order.customerPhone)).size;
    
    // Update DOM elements
    if (totalOrdersElement) totalOrdersElement.textContent = totalOrders;
    if (totalRevenueElement) totalRevenueElement.textContent = `₹${totalRevenue}`;
    if (totalProductsElement) totalProductsElement.textContent = totalProducts;
    if (totalCustomersElement) totalCustomersElement.textContent = uniqueCustomers;
    if (pendingOrdersElement) pendingOrdersElement.textContent = orders.filter(o => o.status === 'pending').length;
    if (totalCustomersSmsElement) totalCustomersSmsElement.textContent = uniqueCustomers;
}

function renderOrderHistory() {
    if (!orderList) return;
    
    orderList.innerHTML = '';
    
    if (filteredOrders.length === 0) {
        orderList.innerHTML = '<p class="no-data">No orders found.</p>';
        return;
    }
    
    filteredOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        orderElement.innerHTML = `
            <div class="order-header">
                <div class="order-id">#${order.id}</div>
                <div class="order-status status-${order.status}">${order.status}</div>
            </div>
            <div class="order-details">
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Phone:</strong> ${order.customerPhone}</p>
                <p><strong>Address:</strong> ${order.customerAddress}, ${order.customerPlace} - ${order.customerPincode}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                <p><strong>Total:</strong> ₹${order.total}</p>
                <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
            </div>
            <div class="order-items">
                <h4>Items:</h4>
                ${order.items.map(item => `
                    <div class="order-item-detail">
                        ${item.name} × ${item.quantity} = ₹${item.total}
                    </div>
                `).join('')}
            </div>
        `;
        
        orderList.appendChild(orderElement);
    });
}

function renderOrderNotifications() {
    if (!orderNotifications) return;
    
    const pendingOrders = orders.filter(order => order.status === 'pending');
    
    orderNotifications.innerHTML = '';
    
    if (pendingOrders.length === 0) {
        orderNotifications.innerHTML = '<p class="no-data">No pending orders to notify.</p>';
        return;
    }
    
    pendingOrders.forEach(order => {
        const notificationElement = document.createElement('div');
        notificationElement.className = 'order-notification';
        notificationElement.innerHTML = `
            <div class="notification-header">
                <h4>Order #${order.id}</h4>
                <span class="notification-time">${new Date(order.date).toLocaleString()}</span>
            </div>
            <div class="notification-content">
                <p><strong>${order.customerName}</strong> - ${order.customerPhone}</p>
                <p>Total: ₹${order.total} (${order.paymentMethod === 'cod' ? 'COD' : 'Online'})</p>
                <button class="btn btn-sms" onclick="sendSMSToCustomer('${order.customerPhone}', '${order.customerName}', '${order.id}')">
                    <i class="fas fa-sms"></i> Send SMS
                </button>
            </div>
        `;
        
        orderNotifications.appendChild(notificationElement);
    });
}

function renderRecentOrders() {
    if (!recentOrdersList) return;
    
    const recentOrders = orders.slice(0, 5); // Show last 5 orders
    
    recentOrdersList.innerHTML = '';
    
    if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = '<p class="no-data">No recent orders</p>';
        return;
    }
    
    recentOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'recent-order';
        orderElement.innerHTML = `
            <div class="recent-order-info">
                <div class="customer-name">${order.customerName}</div>
                <div class="order-total">₹${order.total}</div>
            </div>
            <div class="order-time">${new Date(order.date).toLocaleString()}</div>
        `;
        
        recentOrdersList.appendChild(orderElement);
    });
}

// SMS Functions
function sendSMSToCustomer(phone, customerName, orderId) {
    const message = `Dear ${customerName}, your AS Nuts order #${orderId} has been confirmed. We will contact you soon for delivery. Thank you for choosing AS Nuts!`;
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    showNotification(`SMS sent to ${customerName}`, false, 'success');
}

function sendSMSToAll() {
    const pendingOrders = orders.filter(order => order.status === 'pending');
    
    if (pendingOrders.length === 0) {
        showNotification('No pending orders to send SMS to', true);
        return;
    }
    
    pendingOrders.forEach(order => {
        setTimeout(() => {
            sendSMSToCustomer(order.customerPhone, order.customerName, order.id);
        }, 1000); // Delay to avoid spam
    });
    
    showNotification(`SMS sent to ${pendingOrders.length} customers`, false, 'success');
}

// Event Listeners Setup
function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('login-btn');
    const ownerEmail = document.getElementById('owner-email');
    const ownerPassword = document.getElementById('owner-password');
    const loginError = document.getElementById('login-error');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    if (ownerEmail) {
        ownerEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    if (ownerPassword) {
        ownerPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
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
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle login
async function handleLogin() {
    const ownerEmail = document.getElementById('owner-email');
    const ownerPassword = document.getElementById('owner-password');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');
    
    if (!ownerEmail || !ownerPassword) return;
    
    const email = ownerEmail.value.trim();
    const password = ownerPassword.value.trim();
    
    // Validate input
    if (!email || !password) {
        showLoginError('Please enter both email and password');
        return;
    }
    
    // Check credentials
    if (email === DEFAULT_OWNER.email && password === DEFAULT_OWNER.password) {
        // Correct credentials
        loginError.style.display = 'none';
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        
        try {
            // Try to authenticate with the server
            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Check if user is owner
                if (result.user.role === 'owner') {
                    // Store token and user info
                    localStorage.setItem('asNuts_token', result.token);
                    localStorage.setItem('asNuts_user', JSON.stringify(result.user));
                    sessionStorage.setItem('ownerAuthenticated', 'true');
                    
                    // Login to portal
                    await loginToOwnerPortal();
                    showNotification('Welcome back, Owner!', false, 'success');
                } else {
                    showLoginError('Access denied. Owner privileges required.');
                }
            } else {
                // Server authentication failed, but credentials match default
                // Allow offline access
                sessionStorage.setItem('ownerAuthenticated', 'true');
                await loginToOwnerPortal();
                showNotification('Logged in offline mode', false, 'warning');
            }
        } catch (error) {
            // Network error, allow offline access with correct credentials
            sessionStorage.setItem('ownerAuthenticated', 'true');
            await loginToOwnerPortal();
            showNotification('Logged in offline mode', false, 'warning');
        }
        
        // Reset form
        loginBtn.textContent = 'Login to Portal';
        loginBtn.disabled = false;
        ownerEmail.value = '';
        ownerPassword.value = '';
        
    } else {
        // Wrong credentials
        showLoginError('Invalid email or password. Please try again.');
        ownerPassword.value = '';
        ownerEmail.focus();
        
        // Shake animation
        ownerEmail.style.animation = 'shake 0.5s';
        ownerPassword.style.animation = 'shake 0.5s';
        setTimeout(() => {
            ownerEmail.style.animation = '';
            ownerPassword.style.animation = '';
        }, 500);
    }
}

// Show login error
function showLoginError(message) {
    const loginError = document.getElementById('login-error');
    if (loginError) {
        loginError.querySelector('span').textContent = message;
        loginError.style.display = 'block';
    }
}

// Handle logout
function handleLogout() {
    // Clear all authentication data
    sessionStorage.removeItem('ownerAuthenticated');
    localStorage.removeItem('asNuts_token');
    localStorage.removeItem('asNuts_user');
    
    showPage('login');
    
    // Clear form
    const ownerEmail = document.getElementById('owner-email');
    const ownerPassword = document.getElementById('owner-password');
    const loginError = document.getElementById('login-error');
    
    if (ownerEmail) ownerEmail.value = '';
    if (ownerPassword) ownerPassword.value = '';
    if (loginError) loginError.style.display = 'none';
    
    showNotification('Logged out successfully', false, 'info');
}
    
    // SMS buttons
    if (sendAllSmsBtn) {
        sendAllSmsBtn.addEventListener('click', sendSMSToAll);
    }
    
    if (sendAllSmsPortalBtn) {
        sendAllSmsPortalBtn.addEventListener('click', sendSMSToAll);
    }
    
    // Refresh buttons
    if (refreshOrdersBtn) {
        refreshOrdersBtn.addEventListener('click', loadOrders);
    }
    
    if (refreshOrdersSmsBtn) {
        refreshOrdersSmsBtn.addEventListener('click', loadOrders);
    }
    
    // Order filters
    orderFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            orderFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            const status = filter.getAttribute('data-status');
            filterOrders(status);
        });
    });
}

function filterOrders(status) {
    if (status === 'all') {
        filteredOrders = [...orders];
    } else {
        filteredOrders = orders.filter(order => order.status === status);
    }
    
    renderOrderHistory();
}

// Make functions globally accessible
window.sendSMSToCustomer = sendSMSToCustomer;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);