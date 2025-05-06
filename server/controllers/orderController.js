import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Stripe from "stripe";
import User from "../models/User.js"

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

// Stripe Webhooks to Verify Payment Action : /stripe
export const stripeWebhooks = async () => {
    //Stripe Gateway Initialized
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const sig = request.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (error) {
        Response.status(400).send(`Webhook Error: ${error.message}`)
    }

    //Handle the event
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentintent = event.data.object;
            const paymentIntentId = paymentintent.id;

            //Getting Session Metadata
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });
            const { orderId, userId } = session.data[0].metadata;

            //Mrk Payment as Paid
            await Order.findByIdAndUpdate(orderId, { isPaid: true })
            //Clear user Cart
            await User.findByIdAndUpdate(userId, { cartItems: {} })
            break;
        }

        case "payment_intent.failed": {
            const paymentintent = event.data.object;
            const paymentIntentId = paymentintent.id;

            //Getting Session Metadata
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });
            const { orderId } = session.data[0].metadata;

            await Order.findOneAndDelete(orderId)
            break
        }



        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
    }
    Response.json({ received: true })
}

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
