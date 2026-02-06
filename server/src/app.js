
import express from "express"
import cors from "cors";
import session from "express-session";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import oauthRoutes from "./routes/oauth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productRoutes from "./routes/product.routes.js";
import marketplaceRoutes from "./routes/marketplace.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import downloadRoutes from "./routes/download.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import bankRoutes from "./routes/bank.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import payoutWebhookRoutes from "./routes/payoutWebhook.routes.js";
import disputeRoutes from "./routes/dispute.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import buyerRoutes from "./routes/buyer.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import userRoutes from "./routes/user.routes.js";
import cartRoutes from "./routes/cart.routes.js";

const app = express();

// Trust proxy so OAuth callbacks use correct HTTPS URL on Render
app.set("trust proxy", 1);

// Support multiple frontend origins in comma-separated CLIENT_URL
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : undefined;

// Session middleware (required for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());


app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({extended: false}))


app.get("/", (req, res) => {
    res.send({
        "status": "ok",
    })
})

// Add test endpoint
app.post("/api/test", (req, res) => {
    res.json({ message: "Test endpoint working", body: req.body });
});

app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/webhooks", payoutWebhookRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chat", chatRoutes);


export default app;