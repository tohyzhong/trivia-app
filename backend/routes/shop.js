import express from "express";
import Profile from "../models/Profile.js";
import authenticate from "./authMiddleware.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

router.post("/create-checkout-session", authenticate, async (req, res) => {
  const { amount } = req.body;
  const username = req.user.username;

  const topUpOptions = {
    100: { price: 149 },
    500: { price: 499 },
    1000: { price: 799 }
  };

  if (!topUpOptions[amount]) {
    return res.status(400).json({ message: "Invalid top-up amount." });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "sgd",
          product_data: {
            name: `${amount} Coins Top-up`
          },
          unit_amount: topUpOptions[amount].price
        },
        quantity: 1
      }
    ],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/?shopSuccess=1`,
    cancel_url: `${process.env.FRONTEND_URL}/play`,
    metadata: {
      username,
      amount
    }
  });

  res.json({ url: session.url });
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const amount = parseInt(session.metadata.amount);
      const username = session.metadata.username;

      await Profile.findOneAndUpdate(
        { username },
        { $inc: { currency: amount } }
      );
    }

    res.status(200).json({ received: true });
  }
);

router.post("/buy-powerup", authenticate, async (req, res) => {
  try {
    const username = req.user.username;
    const { powerupName } = req.body;

    const powerupMap = {
      "Hint Boost": "hintBoosts",
      "Time Freeze": "timeFreezes",
      "Double Points": "doublePoints"
    };

    const powerupField = powerupMap[powerupName];
    if (!powerupField) {
      return res.status(400).json({ message: "Invalid power-up." });
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      {
        username,
        $expr: { $gte: ["$currency", 40] }
      },
      {
        $inc: {
          currency: -40,
          [`powerups.${powerupField}`]: 1
        }
      },
      { new: true }
    );

    if (!updatedProfile)
      return res.status(400).json({ message: "Not enough currency." });

    return res.status(200).json({
      message: `${powerupName} purchased successfully.`,
      currency: updatedProfile.currency,
      powerups: updatedProfile.powerups
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error purchasing power-up." });
  }
});

export default router;
