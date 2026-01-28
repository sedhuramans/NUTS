# SRS Cashews - Default Login Credentials

## 🔐 Customer Login Credentials

Use these credentials to test the customer login system:

### Option 1 - Demo Account
- **Email:** `demo@keerthivasan.com`
- **Password:** `demo123`
- **Name:** Demo User

### Option 2 - Test Account  
- **Email:** `test@gmail.com`
- **Password:** `test123`
- **Name:** Test Customer

### Option 3 - Keerthivasan Account
- **Email:** `customer@keerthivasan.com`
- **Password:** `srs2024`
- **Name:** Keerthivasan Customer

---

## 👨‍💼 Owner Portal Credentials

For accessing the owner/admin dashboard:

- **Password:** `srs123`

---

## 📝 How to Use

### Customer Login:
1. Open `index.html` in your browser
2. Use any of the customer credentials above
3. After successful login, you'll be redirected to `customer.html`

### Owner Portal:
1. Open `owner.html` in your browser
2. Enter the owner password: `srs123`
3. Access the admin dashboard to manage products and orders

### Registration:
- You can also create new accounts using the registration form
- All user data is stored in browser's localStorage

---

## 🔧 Technical Notes

- Default users are automatically created when you first visit the login page
- All authentication data is stored locally in the browser
- No server-side authentication required
- Passwords are stored in plain text for demo purposes

## 🐛 Troubleshooting

### If Login Shows "Invalid Email/Password":

1. **Clear Browser Storage:**
   - Open browser Developer Tools (F12)
   - Go to Application/Storage tab
   - Clear localStorage for your site
   - Refresh the page

2. **Test Login Functionality:**
   - Open `test-login.html` in your browser
   - This will test the login system independently
   - Check browser console for any errors

3. **Verify File Paths:**
   - Make sure you're opening `.vscode/index.html` for login
   - Customer page is at `.vscode/customer.html`
   - Owner portal is at `owner.html` (root directory)

### If Owner Portal Link Doesn't Work:

1. **Check File Structure:**
   - `owner.html` should be in root directory
   - Customer files should be in `.vscode/` directory

2. **Direct Access:**
   - Try opening `owner.html` directly in browser
   - Enter password: `srs123`

---

## 🌐 File Structure

- **Login Page:** `.vscode/index.html`
- **Customer Page:** `.vscode/customer.html`  
- **Owner Portal:** `owner.html`
- **Login Logic:** `.vscode/login.js`
- **Owner Logic:** `owner.js`