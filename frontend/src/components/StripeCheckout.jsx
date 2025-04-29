import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

// Stripe promise outside component to avoid recreating
let stripePromise = null;

const getStripePromise = async () => {
  if (!stripePromise) {
    try {
      // Fetch the publishable key from our payment service
      const response = await api.get('/payments/config');
      const { publishableKey } = response.data;
      
      stripePromise = loadStripe(publishableKey);
    } catch (error) {
      console.error('Error loading Stripe:', error);
    }
  }
  return stripePromise;
};

const PaymentForm = ({ 
  amount, 
  orderId, 
  onPaymentSuccess, 
  onPaymentError, 
  buttonText = 'Pay Now',
  isDisabled = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Create a payment intent on the server
      const paymentIntentResponse = await api.post('/payments/create-payment-intent', {
        amount,
        // If orderId is not provided, this is a cart payment (no order created yet)
        ...(orderId ? { orderId } : { cartPayment: true })
      });

      const { clientSecret, paymentId } = paymentIntentResponse.data;

      // 2. Confirm the payment on the client
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            // You can add billing details here
          }
        }
      });

      if (result.error) {
        setError(result.error.message);
        
        // Don't update any order - no order exists yet until payment is successful
        if (onPaymentError) {
          onPaymentError(result.error.message);
        }
      } else if (result.paymentIntent.status === 'succeeded') {
        // Payment succeeded on Stripe's end
        console.log("Payment succeeded on Stripe's end:", result.paymentIntent);
        
        try {
          // Send confirmation to our payment service
          const confirmResponse = await api.post(`/payments/confirm/${paymentId}`, {
            paymentIntentId: result.paymentIntent.id
          });
          
          console.log("Payment confirmation response:", confirmResponse.data);
          
          // Let the parent component handle order creation after successful payment
          if (onPaymentSuccess) {
            onPaymentSuccess(result.paymentIntent);
          }
        } catch (confirmError) {
          console.error("Error confirming payment with backend:", confirmError);
          // Even if our backend confirmation fails, the payment was still successful with Stripe
          // We should still consider it a success to avoid double charging the customer
          if (onPaymentSuccess) {
            onPaymentSuccess(result.paymentIntent);
          }
        }
      } else {
        console.log("Unexpected payment intent status:", result.paymentIntent.status);
        setError(`Unexpected payment status: ${result.paymentIntent.status}`);
        
        // Don't update any order - no order exists yet until payment is successful
        if (onPaymentError) {
          onPaymentError(`Unexpected payment status: ${result.paymentIntent.status}`);
        }
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.error || 'Payment processing failed. Please try again.');
      
      // Don't update any order - no order exists yet until payment is successful
      if (onPaymentError) {
        onPaymentError(err.response?.data?.error || 'Payment processing failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Card element styles
  const cardStyle = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ padding: '10px 0', marginBottom: '20px' }}>
        <CardElement options={cardStyle} />
      </div>
      
      {error && (
        <div style={{ 
          color: '#e53e3e', 
          backgroundColor: '#fed7d7', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '15px', 
          fontSize: '0.875rem' 
        }}>
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isLoading || isDisabled || !stripe}
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#4f46e5',
          color: 'white',
          fontWeight: '500',
          borderRadius: '0.375rem',
          border: 'none',
          cursor: isLoading || isDisabled || !stripe ? 'not-allowed' : 'pointer',
          width: '100%',
          opacity: isLoading || isDisabled || !stripe ? 0.7 : 1
        }}
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>
    </form>
  );
};

const StripeCheckout = ({ 
  amount, 
  orderId, 
  onPaymentSuccess, 
  onPaymentError, 
  buttonText,
  isDisabled
}) => {
  const [stripePromiseState, setStripePromiseState] = useState(null);

  useEffect(() => {
    const loadStripeJs = async () => {
      const stripeInstance = await getStripePromise();
      setStripePromiseState(stripeInstance);
    };
    
    loadStripeJs();
  }, []);

  if (!stripePromiseState) {
    return <div>Loading payment processor...</div>;
  }

  return (
    <Elements stripe={stripePromiseState}>
      <PaymentForm 
        amount={amount} 
        orderId={orderId} 
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        buttonText={buttonText}
        isDisabled={isDisabled}
      />
    </Elements>
  );
};

export default StripeCheckout; 