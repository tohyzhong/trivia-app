# trivia-app
Team ID: <7444><br />
Team Name: Sigma Squad<br />
Si Wen Xuan, Terry<br />
Toh Yi Zhong<br />


# Development

1. Clone the repository
```bash
git clone https://github.com/tohyzhong/trivia-app.git
```

2. Install required dependencies 
```bash
npm run setup
```

3. Set up `.env` files in both the frontend and backend subfolders
### Frontend
```env
VITE_API_URL = <Backend API URL> (Testing: "http://localhost:8080")
```
### Backend
```env
CONNECTION_STRING = <MongoDB Connection String>
JWT_SECRET = <Any randomised string>
FRONTEND_URL = <Link to development frontend URL> (Testing: "http://localhost:5173")
EMAIL_USER = <Email>
EMAIL_PASS = <App password (16 characters)>
STRIPE_SECRET_KEY = <Stripe Sandbox/Business Secret Key>
STRIPE_WEBHOOK_SECRET = <Stripe Sandbox/Business Webhook Secret>
NODE_ENV = "development"
PORT = 8080
```
4. Run the development server
```bash
npm run dev
```

# Testing
1. Run the following command on the root folder
```bash
npm run test
```
2. Alternatively, to open the Vitest UI, run the following command
```bash
npm run test:ui
```
