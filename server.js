require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('.vscode'));
app.use(express.static('.'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Create default owner user if it doesn't exist
    await createDefaultOwner();
})
.catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'owner'], default: 'customer' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nameTamil: { type: String },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    badge: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerPincode: { type: String, required: true },
    customerPlace: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    items: [{
        name: String,
        nameTamil: String,
        price: Number,
        quantity: Number,
        total: Number,
        productId: String
    }],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    source: { type: String, default: 'AS Nuts Website' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Create default owner user
async function createDefaultOwner() {
    try {
        const ownerEmail = process.env.OWNER_EMAIL || 'owner@asnuts.com';
        const ownerPassword = process.env.OWNER_PASSWORD || 'ASNuts2024!';
        
        // Check if owner already exists
        const existingOwner = await User.findOne({ email: ownerEmail });
        
        if (!existingOwner) {
            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(ownerPassword, saltRounds);
            
            // Create owner user
            const owner = new User({
                name: 'AS Nuts Owner',
                email: ownerEmail,
                password: hashedPassword,
                role: 'owner'
            });
            
            await owner.save();
            console.log('✅ Default owner user created:', ownerEmail);
        } else {
            // Update existing owner with correct password and role
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(ownerPassword, saltRounds);
            
            await User.findOneAndUpdate(
                { email: ownerEmail },
                { 
                    password: hashedPassword,
                    role: 'owner',
                    name: 'AS Nuts Owner'
                }
            );
            console.log('✅ Owner user updated with new credentials:', ownerEmail);
        }
    } catch (error) {
        console.error('❌ Error creating default owner:', error);
    }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: email === 'owner@asnuts.com' ? 'owner' : 'customer'
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Add new product (Owner only)
app.post('/api/products', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can add products' });
        }

        const productData = req.body;
        productData.updatedAt = new Date();

        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            message: 'Product added successfully',
            product
        });
    } catch (error) {
        console.error('Add product error:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Product with this ID already exists' });
        } else {
            res.status(500).json({ error: 'Failed to add product' });
        }
    }
});

// Update product (Owner only)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can update products' });
        }

        const productData = req.body;
        productData.updatedAt = new Date();

        const product = await Product.findOneAndUpdate(
            { id: req.params.id },
            productData,
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (Owner only)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can delete products' });
        }

        const product = await Product.findOneAndDelete({ id: req.params.id });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Create order
app.post('/api/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get orders (Owner only)
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can view orders' });
        }

        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Handle DevTools requests (prevents 404 errors)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(404).json({ error: 'DevTools endpoint not available' });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '.vscode', 'index.html'));
});

app.get('/customer', (req, res) => {
    res.sendFile(path.join(__dirname, '.vscode', 'customer.html'));
});

app.get('/owner', (req, res) => {
    res.sendFile(path.join(__dirname, '.vscode', 'owner.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AS Nuts server running on http://localhost:${PORT}`);
});