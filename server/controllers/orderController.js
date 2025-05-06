// import Order from "../models/Order.js";
// import Product from "../models/Product.js";
// import stripe from "stripe"

// //Place Order COD : /api/order/cod
// export const placeOrderCOD = async (req, res) => {
//     try {
//         const { userId, items, address } = req.body;

//         if (!address || items.length === 0) {
//             return res.json({ success: false, message: "Invalid Data" });
//         }

//         //Calculate Amount Using Items
//         let amount = await items.reduce(async (acc, item) => {
//             const product = await Product.findById(item.product);
//             return (await acc) + product.offerPrice * item.quantity;
//         }, 0);

//         //Add Tax Charge (2%)
//         amount += Math.floor(amount * 0.02);
//         await Order.create({
//             userId,
//             items,
//             amount,
//             address,
//             paymentType: "COD",
//         });

//         return res.json({ success: true, message: "Order Placed Successfully" });
//     } catch (error) {
//         return res.json({ success: false, message: error.message });
//     }
// };

// //Place Order Setipe : /api/order/stripe
// export const placeOrderStripe = async (req, res) => {
//     try {
//         const { userId, items, address } = req.body;
//         const { origin } = req.headers;


//         if (!address || items.length === 0) {
//             return res.json({ success: false, message: "Invalid Data" });
//         }

//         let productData = [];


//         //Calculate Amount Using Items
//         let amount = await items.reduce(async (acc, item) => {
//             const product = await Product.findById(item.product);
//             productData.push({
//                 name: product.name,
//                 price: product.offerPrice,
//                 quanitity: item.quantity,
//             })
//             return (await acc) + product.offerPrice * item.quantity;
//         }, 0);

//         //Add Tax Charge (2%)
//         amount += Math.floor(amount * 0.02);
//         const order = await Order.create({
//             userId,
//             items,
//             amount,
//             address,
//             paymentType: "Online",
//         });

//         //Stripoe GateWay Initialize
//         const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

//         //Create line items for stripe
//         const line_items = productData.map((item) => {
//             return {
//                 price_data: {
//                     currency: "usd",
//                     product_data: {
//                         name: item.name,
//                     },
//                     unit_amount: Math.floor(item.price + item.price * 0.02) * 100,
//                 },
//                 quantity: item.quantity,
//             }
//         })

//         //Create session
//         const session = await stripeInstance.checkout.sessions.create({
//             line_items,
//             mode: "payment",
//             success_url: `${origin}/loader?next=my-orders`,
//             cancel_url: `${origin}/cart`,
//             metadata: {
//                 orderId: order._id.toString(),
//                 userId,
//             }
//         })

//         return res.json({ success: true, url:session.url });
//     } catch (error) {
//         return res.json({ success: false, message: error.message });
//     }
// };

// // Get Orders by User Id: /api/order/user
// export const getUserOrders = async (req, res) => {
//     try {
//         const userId = req.userId;

//         const orders = await Order.find({
//             userId,
//             $or: [{ paymentType: "COD" }, { isPaid: true }]
//         }).populate("items.product address").sort({ createdAt: -1 })
//         res.json({ success: true, orders })
//     } catch (error) {
//         res.json({ success: false, message: error.message });
//     }
// };

// //Get All Orders (for seller /adimin): /api/order/seller
// export const getAllOrders = async (req, res) => {
//     try {
//         const orders = await Order.find({
//             $or: [{ paymentType: "COD" }, { isPaid: true }]
//         }).populate("items.product address").sort({ createdAt: -1 });
//         res.json({ success: true, orders })
//     } catch (error) {
//         res.json({ success: false, message: error.message });
//     }
// }



import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Stripe from "stripe";

// COD Order
export const placeOrderCOD = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" });
        }

        let amount = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) continue;
            amount += product.offerPrice * item.quantity;
        }

        amount += Math.floor(amount * 0.02); // Tax

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
        });

        return res.json({ success: true, message: "Order Placed Successfully" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Stripe Order
export const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        const { origin } = req.headers;

        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        let amount = 0;
        const productData = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            amount += product.offerPrice * item.quantity;

            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            });
        }

        amount += Math.floor(amount * 0.02); // Tax

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
        });

        const line_items = productData.map((item) => ({
            price_data: {
                currency: "usd",
                product_data: { name: item.name },
                unit_amount: Math.floor(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId,
            },
        });

        return res.json({ success: true, url: session.url });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Get User Orders
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }],
        })
            .populate("items.product address")
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get All Orders (for Admin)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }],
        })
            .populate("items.product address")
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
