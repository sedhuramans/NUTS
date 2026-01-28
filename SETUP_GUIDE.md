# AS Nuts Website - MongoDB Integration Setup Guide

## 🎉 Setup Complete!

Your AS Nuts website has been successfully configured with MongoDB integration for real-time user registration, login, and product management.

## ✅ What's Been Implemented

### 1. Environment Variables (.env)
- MongoDB connection string stored securely
- JWT secret for authentication
- Server configuration

### 2. Database Integration
- **User Registration & Login**: Users are now stored in MongoDB
- **Real-time Product Management**: Products are managed through the database
- **Order Management**: Orders are saved to the database
- **Authentication**: JWT-based authentication system

### 3. API Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/products` - Get all products
- `POST /api/products` - Add new product (Owner only)
- `PUT /api/products/:id` - Update product (Owner only)
- `DELETE /api/products/:id` - Delete product (Owner only)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders (Owner only)

### 4. Updated Frontend
- **Login System**: Now uses API instead of localStorage
- **Customer Page**: Loads products from database in real-time
- **Owner Portal**: Manages products through database API
- **Real-time Updates**: Products and orders sync across all users

## 🚀 How to Run

1. **Start the Server**:
   ```bash
   npm start
   ```

2. **Access the Website**:
   - Main site: http://localhost:3000
   - Customer page: http://localhost:3000/customer
   - Owner portal: http://localhost:3000/owner

## 👥 User Roles

### Customer Users
- Register with any email
- Login and browse products
- Add products to cart
- Place orders

### Owner Users
- Register with email: `owner@asnuts.com`
- Access owner portal for product management
- View and manage orders
- Add/edit/delete products in real-time

## 🔐 Authentication Flow

1. **Registration**: Users register and are stored in MongoDB
2. **Login**: Returns JWT token for authenticated requests
3. **Owner Access**: Users with `owner@asnuts.com` get owner role
4. **Protected Routes**: Owner-only endpoints require valid JWT token

## 📊 Database Collections

### Users Collection
- name, email, password (hashed), role, createdAt

### Products Collection
- id, name, nameTamil, price, description, image, category, badge, createdAt, updatedAt

### Orders Collection
- id, customerName, customerPhone, customerAddress, items[], total, status, createdAt

## 🔄 Real-time Features

- **Product Updates**: When owner adds/updates products, they appear immediately for customers
- **Order Management**: Orders are instantly available in owner portal
- **Cross-tab Sync**: Changes sync across multiple browser tabs

## 🛡️ Security Features

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Environment variables for sensitive data
- Input validation and sanitization
- Role-based access control

## 📱 Testing the System

1. **Register a Customer**:
   - Go to main page
   - Click "Sign Up"
   - Register with any email

2. **Register as Owner**:
   - Use email: `owner@asnuts.com`
   - Use any password
   - You'll get owner role automatically

3. **Test Product Management**:
   - Login as owner
   - Add/edit products in owner portal
   - Check customer page to see real-time updates

4. **Test Orders**:
   - Login as customer
   - Add products to cart and place order
   - Check owner portal to see the order

## 🔧 Configuration

All sensitive configuration is in `.env` file:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 3000)

## 📝 Notes

- The system automatically creates owner role for `owner@asnuts.com`
- All passwords are securely hashed
- JWT tokens expire after 24 hours
- MongoDB connection is established on server start
- Real-time updates work across all connected clients

## 🎯 Next Steps

Your website is now fully functional with:
- ✅ Secure user authentication
- ✅ Real-time product management
- ✅ Database-driven orders
- ✅ Owner/customer role separation
- ✅ Environment-based configuration

The system is ready for production use!