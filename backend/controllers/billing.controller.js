import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { invoices } });
  } catch (error) {
    logger.error(`getInvoices error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const planCosts = {
      starter: 29,
      professional: 79,
      enterprise: 249
    };

    const planCredits = {
      starter: 500,
      professional: 2000,
      enterprise: 10000
    };

    if (!planCosts[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan selected' });
    }

    const price = planCosts[plan];
    const newCredits = planCredits[plan];

    // Simulate Stripe/Razorpay Checkout completion
    const stripeSubscriptionId = `sub_mock_${Math.random().toString(36).substring(2, 12)}`;
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`;

    // Create Subscription
    const subscription = await Subscription.create({
      user: user._id,
      plan,
      status: 'active',
      amount: price,
      stripeSubscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Update User model fields
    user.subscription = {
      plan,
      status: 'active',
      currentPeriodEnd: subscription.currentPeriodEnd
    };
    user.aiCredits += newCredits;
    await user.save();

    // Create Invoice
    const invoice = await Invoice.create({
      user: user._id,
      subscription: subscription._id,
      invoiceNumber,
      amount: price,
      status: 'paid',
      paymentMethod: 'stripe',
      paidAt: new Date()
    });

    logger.info(`Simulated subscription completed for ${user.email}. Plan: ${plan}, Credits added: ${newCredits}`);

    res.status(200).json({
      success: true,
      message: `Checkout session completed. Upgraded to ${plan}!`,
      data: {
        subscription,
        invoice,
        credits: user.aiCredits
      }
    });
  } catch (error) {
    logger.error(`createCheckoutSession error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
