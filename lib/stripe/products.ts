import { stripe, MEMORIAL_PRODUCT } from './client';

/**
 * Ensure product and price exist in Stripe
 * Run this during deployment or setup
 */
export async function ensureProductExists() {
  try {
    // Check if product exists
    let product;
    try {
      product = await stripe.products.retrieve(MEMORIAL_PRODUCT.productId);
    } catch (error) {
      // Create product if it doesn't exist
      product = await stripe.products.create({
        id: MEMORIAL_PRODUCT.productId,
        name: MEMORIAL_PRODUCT.name,
        description: MEMORIAL_PRODUCT.description,
        default_price_data: {
          currency: MEMORIAL_PRODUCT.currency,
          unit_amount: MEMORIAL_PRODUCT.amount,
        },
        metadata: {
          type: 'memorial',
          platform: 'gathermemorials',
        },
      });
    }

    // Check if price exists
    let price;
    try {
      price = await stripe.prices.retrieve(MEMORIAL_PRODUCT.priceId);
    } catch (error) {
      // Create price if it doesn't exist
      price = await stripe.prices.create({
        id: MEMORIAL_PRODUCT.priceId,
        product: product.id,
        currency: MEMORIAL_PRODUCT.currency,
        unit_amount: MEMORIAL_PRODUCT.amount,
        metadata: {
          product_type: 'memorial',
        },
      });
    }

    return { product, price };
  } catch (error) {
    console.error('Error ensuring product exists:', error);
    throw error;
  }
}

/**
 * Create a payment intent for a memorial
 */
export async function createPaymentIntent(
  memorialId: string,
  userId: string,
  userEmail: string
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: MEMORIAL_PRODUCT.amount,
      currency: MEMORIAL_PRODUCT.currency,
      metadata: {
        memorial_id: memorialId,
        user_id: userId,
        product_type: 'memorial',
      },
      receipt_email: userEmail,
      description: MEMORIAL_PRODUCT.description,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}