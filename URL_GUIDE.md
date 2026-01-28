# SRS Cashews - URL Navigation Guide

## 🌐 **Website URLs**

### **Customer Website:**
- **Login Page:** `.vscode/index.html`
- **Customer Store:** `.vscode/customer.html`

### **Owner Portal:**
- **Owner Dashboard:** `.vscode/owner.html`

## 🔄 **URL Switching**

Now you can easily switch between customer and owner by changing the URL:

### **From Customer to Owner:**
- Change: `customer.html` → `owner.html`
- Example: `file:///path/.vscode/customer.html` → `file:///path/.vscode/owner.html`

### **From Owner to Customer:**
- Change: `owner.html` → `customer.html`
- Example: `file:///path/.vscode/owner.html` → `file:///path/.vscode/customer.html`

## 🔐 **Access Credentials**

### **Customer Login:**
- Email: `demo@srscashews.com`
- Password: `demo123`

### **Owner Portal:**
- Password: `srs123` (pre-filled for convenience)

## 📁 **File Structure**

```
.vscode/
├── index.html      (Login Page)
├── customer.html   (Customer Store)
├── owner.html      (Owner Portal)
├── customer.js     (Customer Logic)
├── owner.js        (Owner Logic)
├── login.js        (Login Logic)
├── customer.css    (Customer Styles - in root)
├── owner.css       (Owner Styles)
└── login.css       (Login Styles)
```

## ✅ **What's Fixed:**

1. **Same Directory:** All main files now in `.vscode/` directory
2. **URL Switching:** Easy switching between `customer.html` and `owner.html`
3. **Pre-filled Password:** Owner password is pre-filled for convenience
4. **Proper Linking:** All CSS and JS files correctly linked
5. **Navigation:** Clean navigation between pages

## 🚀 **How to Use:**

1. **Start with Login:** Open `.vscode/index.html`
2. **Go to Store:** Login redirects to `customer.html`
3. **Access Owner:** Change URL to `owner.html`
4. **Switch Back:** Change URL back to `customer.html`

**No more navigation links needed - just change the URL!**