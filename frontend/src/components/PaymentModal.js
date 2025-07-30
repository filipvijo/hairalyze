import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ onSuccess, onCancel, isLoading, setIsLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    try {
      // Get Supabase authentication token
      console.log('🔧 Getting Supabase token for payment...');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const token = session.access_token;
      const userId = currentUser?.id;

      console.log('🔧 Payment debug:', {
        hasUser: !!currentUser,
        hasToken: !!token,
        userId: userId,
        tokenLength: token ? token.length : 0
      });

      // Create payment intent
      const fullUrl = 'http://localhost:5000/api/create-payment-intent';
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-ID': userId
        },
      });

      console.log('💳 Payment response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Payment error response:', errorText);
        throw new Error(`Failed to create payment intent: ${response.status} ${errorText}`);
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        // Payment succeeded
        console.log('Payment successful:', result.paymentIntent);
        onSuccess(result.paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Pay $5.00'}
        </button>
      </div>
    </form>
  );
};

const PaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSuccess = (paymentIntent) => {
    onSuccess(paymentIntent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Payment
          </h2>
          <p className="text-gray-600">
            Secure payment for your personalized hair analysis
          </p>
          <div className="mt-4 p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg">
            <div className="text-3xl font-bold text-primary">$5.00</div>
            <div className="text-sm text-gray-600">One-time payment</div>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            onSuccess={handleSuccess}
            onCancel={onClose}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </Elements>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>🔒 Your payment information is secure and encrypted</p>
          <p>Powered by Stripe</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
