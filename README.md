# trivia-app  
**Team ID:** `7444`  
**Team Name:** *Sigma Squad*  
- Si Wen Xuan, Terry  
- Toh Yi Zhong  

---

# Development

## 1. Clone the repository  
```bash
git clone https://github.com/tohyzhong/trivia-app.git
```  

---

## 2. Install required dependencies  
```bash
npm run setup
```  

---

## 3. Set up `.env` files in the root folder, frontend, and backend subfolders  

### Root  
```env
USER1 = <Username 1>  
PASSWORD1 = <Password for User1>  
USER2 = <Username 2>  
PASSWORD2 = <Password for User2>  
USER3 = <Username 3>  
PASSWORD3 = <Password for User3>  
```

### Frontend  
```env
VITE_API_URL = <Backend API URL> # (Testing: "http://localhost:8080")
```

### Backend  
```env
CONNECTION_STRING = <MongoDB Connection String>  
JWT_SECRET = <Any randomised string>  
FRONTEND_URL = <Link to development frontend URL> # (Testing: "http://localhost:5173")  
EMAIL_USER = <Email>  
EMAIL_PASS = <App password (16 characters)>  
STRIPE_SECRET_KEY = <Stripe Sandbox/Business Secret Key>  
STRIPE_WEBHOOK_SECRET = <Stripe Sandbox/Business Webhook Secret>  
NODE_ENV = "development"  
PORT = 8080  
```

---

## 4. Run the development server  
```bash
npm run dev
```

---

# Testing

## 1. Install Playwright (required for E2E Game Testing)  
```bash
npx playwright install
```  

---

## 2. Run unit tests for frontend and backend  
```bash
npm run test
```  

**Alternatively**, to open the Vitest UI:  
```bash
npm run test:ui
```

---

## 3. Run E2E Game Testing for both frontend and backend  
```bash
npm run test:pw
```

**Alternatively**, to open the Playwright UI:  
```bash
npm run test:pw:ui
```

To run tests in headed mode:  
```bash
npm run test:pw:headed
```
