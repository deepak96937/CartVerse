// import cookieParser from "cookie-parser";
// import express from "express"
// import cors from "cors"
// import 'dotenv/config'
// import connectDB from "./configs/db.js";
// import userRouter from "./routes/UserRoute.js";
// import sellerRouter from "./routes/sellerRoute.js";
// import connectCloudinary from "./configs/cloudinary.js";
// import productRouter from "./routes/productRoute.js";
// import cartRouter from "./routes/cartRoute.js";
// import addressRouter from "./routes/addressRoute.js";
// import orderRouter from "./routes/OrderRoute.js";
// import { stripeWebhooks } from "./controllers/orderController.js";

// const app = express();
// const port = process.env.PORT || 4000;


// await connectCloudinary();

// // Allow multiple origins
// const allowedOrigins = ['http://localhost:5173']

// app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks)

// // Middleware congiguration
// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({ origin: allowedOrigins, credentials: true }))


// app.get("/", (req, res) => {
//     try {
//         res.send("This is wrokng good")
//     } catch (error) {
//         res.send(error.message)
//     }
// })

// app.use("/api/user", userRouter)
// app.use("/api/seller", sellerRouter)
// app.use("/api/product", productRouter)
// app.use("/api/cart", cartRouter)
// app.use("/api/address", addressRouter)
// app.use("/api/order", orderRouter)

// app.listen(port, () => {
//      connectDB();
//     console.log(`Server is running on http://localhost:${port}`);

// })




// server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import connectCloudinary from "./configs/cloudinary.js";

// Routers
import userRouter from "./routes/UserRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/OrderRoute.js";
import { stripeWebhooks } from "./controllers/orderController.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Connect to services
(async () => {
  try {
   
    await connectCloudinary();

    // Stripe webhook endpoint (must come before express.json)
    app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

    // Middleware
    app.use(express.json());
    app.use(cookieParser());

    // CORS setup
    const allowedOrigins = ['http://localhost:5173', 'https://green-cart-backend-ebon.vercel.app/'];
    app.use(cors({
      origin: allowedOrigins,
      credentials: true,
    }));

    // Routes
    app.get("/", (req, res) => {
      res.send("Server is working correctly.");
    });

    app.use("/api/user", userRouter);
    app.use("/api/seller", sellerRouter);
    app.use("/api/product", productRouter);
    app.use("/api/cart", cartRouter);
    app.use("/api/address", addressRouter);
    app.use("/api/order", orderRouter);

    // Start the server
    app.listen(port, () => {
        connectDB();
      console.log(`✅ Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1); // Exit on failure
  }
})();
