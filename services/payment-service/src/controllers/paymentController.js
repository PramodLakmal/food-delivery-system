const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');

// @desc    Get payment config (publishable key)
// @route   GET /api/payments/config
// @access  Public
exports.getPaymentConfig = async (req, res) => {
  res.status(200).json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
};

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId, cartPayment, amount, currency = 'usd' } = req.body;

    // Validate required fields - either orderId or cartPayment flag must be present
    if ((!orderId && !cartPayment) || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either orderId or cartPayment flag, and amount'
      });
    }

    // Create a unique identifier for cart payments
    const paymentIdentifier = orderId || `cart_${req.user.id}_${Date.now()}`;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        paymentIdentifier,
        userId: req.user.id,
        isCartPayment: cartPayment ? 'true' : 'false'
      }
    });

    // Create payment record in database
    const payment = await Payment.create({
      orderId: orderId || null, // Set orderId to null for cart payments
      userId: req.user.id,
      amount,
      currency,
      paymentMethod: 'card',
      status: 'pending',
      isCartPayment: !!cartPayment,
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret
    });

    res.status(201).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating payment intent'
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm/:paymentId
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide paymentIntentId'
      });
    }

    // Retrieve payment from database
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to confirm this payment'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment status in database
      payment.status = 'completed';
      payment.receiptUrl = paymentIntent.charges.data[0]?.receipt_url || '';
      await payment.save();

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        payment
      });
    } else {
      // Update payment status in database
      payment.status = 'failed';
      await payment.save();

      return res.status(400).json({
        success: false,
        error: 'Payment failed',
        paymentIntentStatus: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    console.error('Payment ID:', req.params.paymentId);
    console.error('Payment Intent ID:', req.body.paymentIntentId);
    
    res.status(500).json({
      success: false,
      error: 'Error confirming payment',
      message: error.message
    });
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error retrieving payment:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving payment'
    });
  }
};

// @desc    Get payments by order ID
// @route   GET /api/payments/order/:orderId
// @access  Private
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.getPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found for this order'
      });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error retrieving payment by order ID:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving payment'
    });
  }
};

// @desc    Process Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
exports.processWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    // req.body is already raw with our updated middleware
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);
        await handleSucceededPayment(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`Payment intent failed: ${failedPayment.id}`);
        await handleFailedPayment(failedPayment);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Helper function to handle succeeded payment
const handleSucceededPayment = async (paymentIntent) => {
  try {
    const { orderId, userId } = paymentIntent.metadata;

    // Find payment by Stripe payment intent ID
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (payment) {
      // Update payment status
      payment.status = 'completed';
      payment.receiptUrl = paymentIntent.charges.data[0]?.receipt_url || '';
      await payment.save();

      // TODO: Notify order service about payment completion
      // You can implement a notification mechanism to the order service
      // to update the order status based on successful payment
    }
  } catch (error) {
    console.error('Error handling succeeded payment webhook:', error);
  }
};

// Helper function to handle failed payment
const handleFailedPayment = async (paymentIntent) => {
  try {
    // Find payment by Stripe payment intent ID
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (payment) {
      // Update payment status
      payment.status = 'failed';
      await payment.save();

      // TODO: Notify order service about payment failure
    }
  } catch (error) {
    console.error('Error handling failed payment webhook:', error);
  }
}; 