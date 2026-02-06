'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cartAPI } from '@/lib/api';
import api from '@/lib/api';
import { Loader, Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface CartItem {
  _id: string;
  productId: {
    _id: string;
    title: string;
    description: string;
    price: number;
    discount?: number;
    thumbnailUrl: string;
    sellerId: {
      _id: string;
      name: string;
      email: string;
    };
  };
  quantity: number;
  price: number;
  addedAt: string;
}

interface Cart {
  _id: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCart();

    // Load Razorpay checkout script
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartAPI.getCart();
      setCart(data.cart);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(productId);
      const data = await cartAPI.updateCartItem(productId, newQuantity);
      setCart(data.cart);
      toast.success('Cart updated');
    } catch (error: any) {
      console.error('Error updating cart:', error);
      toast.error(error.response?.data?.message || 'Failed to update cart');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setRemoving(productId);
      const data = await cartAPI.removeFromCart(productId);
      setCart(data.cart);
      toast.success('Item removed from cart');
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    } finally {
      setRemoving(null);
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
      const data = await cartAPI.clearCart();
      setCart(data.cart);
      toast.success('Cart cleared');
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setCheckingOut(true);

      // Create payment orders for all cart items
      const orderPromises = cart.items.map(async (item) => {
        try {
          const res = await api.post('/payments/create-order', {
            productId: item.productId._id,
          });
          return {
            ...res.data,
            productTitle: item.productId.title,
            productId: item.productId._id,
          };
        } catch (error) {
          console.error('Error creating order for product:', item.productId.title, error);
          throw error;
        }
      });

      const orders = await Promise.all(orderPromises);

      // Process payments sequentially
      let successfulPayments = 0;
      
      for (const order of orders) {
        await new Promise<void>((resolve, reject) => {
          const options = {
            key: order.key,
            amount: order.amount,
            currency: 'INR',
            name: 'BitForge',
            description: order.productTitle,
            order_id: order.razorpayOrderId,
            handler: async function (response: any) {
              try {
                toast.success(`Payment successful for ${order.productTitle}`);
                // Remove item from cart after successful payment
                await cartAPI.removeFromCart(order.productId);
                successfulPayments++;
                resolve();
              } catch (err) {
                console.error('Error removing from cart:', err);
                resolve(); // Continue even if removal fails
              }
            },
            modal: {
              ondismiss: function () {
                toast.error(`Payment cancelled for ${order.productTitle}`);
                reject(new Error('Payment cancelled'));
              },
            },
          } as any;

          if (!(window as any).Razorpay) {
            toast.error('Payment gateway not loaded. Please refresh.');
            reject(new Error('Razorpay not loaded'));
            return;
          }

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }).catch(() => {
          // Payment was cancelled, continue to next item
        });
      }

      if (successfulPayments > 0) {
        toast.success(`Successfully purchased ${successfulPayments} item(s)!`);
        // Refresh cart
        await fetchCart();
        router.push('/dashboard/buyer');
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast.error(error.response?.data?.message || 'Failed to process checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  const calculateOriginalPrice = () => {
    return cart?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  };

  const calculateTotalDiscount = () => {
    return cart?.items.reduce((sum, item) => {
      const product = item.productId;
      if (product && product.discount && product.discount > 0) {
        const discountAmount = (item.price * item.quantity * product.discount) / 100;
        return sum + discountAmount;
      }
      return sum;
    }, 0) || 0;
  };

  const calculatePriceAfterDiscount = () => {
    return calculateOriginalPrice() - calculateTotalDiscount();
  };

  const calculateGST = () => {
    return calculatePriceAfterDiscount() * 0.05; // 5% GST
  };

  const calculatePlatformFee = () => {
    return calculatePriceAfterDiscount() * 0.02; // 2% Platform fee
  };

  const calculateFinalTotal = () => {
    return calculatePriceAfterDiscount() + calculateGST() + calculatePlatformFee();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-lg">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 pb-32 md:pb-8 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 left-0 right-0 z-40 bg-gradient-to-b from-black via-slate-900/95 to-slate-900/80 backdrop-blur-md border-b border-white/10 w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.push('/dashboard/buyer')}
                className="p-2 md:p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 md:w-5 md:h-5 text-white" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 md:gap-3 truncate">
                  <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 flex-shrink-0" />
                  <span className="truncate">Shopping Cart</span>
                </h1>
                <p className="text-white/60 text-xs md:text-sm mt-0.5 md:mt-1">
                  {cart?.totalItems || 0} item{cart?.totalItems !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {cart && cart.items.length > 0 && (
              <button
                onClick={clearCart}
                className="px-3 md:px-4 py-2 bg-red-600/20 hover:bg-red-600/30 active:scale-95 border border-red-500/30 text-red-400 rounded-lg transition-all text-xs md:text-sm font-semibold whitespace-nowrap flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {!cart || cart.items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-8 md:p-12 text-center"
          >
            <ShoppingCart className="w-16 h-16 md:w-20 md:h-20 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-white/60 text-sm md:text-base mb-6">Add some amazing digital products to get started!</p>
            <Link
              href="/marketplace"
              className="inline-block px-6 md:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-95 text-white font-semibold rounded-lg transition-all text-sm md:text-base"
            >
              Browse Marketplace
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.items.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 hover:bg-white/[0.07] active:bg-white/[0.08] transition-all"
                  >
                    <div className="flex gap-3 md:gap-6">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/10 shadow-lg hover:border-purple-500/30 transition-all group">
                        {item.productId?.thumbnailUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={item.productId.thumbnailUrl}
                              alt={item.productId.title}
                              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden w-full h-full flex items-center justify-center text-4xl md:text-5xl">
                              📦
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                            <div className="text-center">
                              <div className="text-4xl md:text-5xl mb-1">📦</div>
                              <div className="text-xs text-white/50 font-medium">No Image</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-xl font-bold text-white mb-1 md:mb-2 line-clamp-2">
                          {item.productId?.title || 'Unknown Product'}
                        </h3>
                        <p className="text-white/60 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2">
                          {item.productId?.description || 'No description available'}
                        </p>
                        <p className="text-white/50 text-xs md:text-sm mb-3 md:mb-4">
                          Seller: <span className="text-white/70">{item.productId?.sellerId?.name || 'Unknown'}</span>
                        </p>
                        
                        {/* Mobile Layout: Price and Controls Stacked */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xl md:text-2xl font-bold text-green-400">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </div>
                            
                            {item.productId?.discount && item.productId.discount > 0 && (
                              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">
                                <span className="text-xs font-semibold text-green-400">
                                  {item.productId.discount}% OFF
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1 border border-white/10">
                              <button
                                onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                                disabled={updating === item.productId._id || item.quantity <= 1}
                                className="w-9 h-9 md:w-10 md:h-10 rounded bg-white/10 hover:bg-white/20 active:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span className="w-12 md:w-14 text-center text-white font-bold text-sm md:text-base">
                                {updating === item.productId._id ? (
                                  <Loader className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                                disabled={updating === item.productId._id}
                                className="w-9 h-9 md:w-10 md:h-10 rounded bg-white/10 hover:bg-white/20 active:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.productId._id)}
                              disabled={removing === item.productId._id}
                              className="p-2.5 md:p-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 active:bg-red-600/40 border border-red-500/30 text-red-400 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                              aria-label="Remove item"
                            >
                              {removing === item.productId._id ? (
                                <Loader className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                  <span className="hidden sm:inline text-sm font-semibold">Remove</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary - Desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>Original Price ({cart.totalItems} items)</span>
                    <span className="line-through">₹{calculateOriginalPrice().toFixed(2)}</span>
                  </div>
                  
                  {calculateTotalDiscount() > 0 && (
                    <>
                      <div className="flex justify-between text-green-400 text-sm font-semibold">
                        <span>Discount Amount</span>
                        <span>-₹{calculateTotalDiscount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-300 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                        <span>You Saved</span>
                        <span className="font-bold">₹{calculateTotalDiscount().toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between text-white/70 text-sm">
                      <span>Price After Discount</span>
                      <span>₹{calculatePriceAfterDiscount().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>GST (5%)</span>
                    <span>+₹{calculateGST().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>Platform Fee (2%)</span>
                    <span>+₹{calculatePlatformFee().toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between text-white text-lg font-bold">
                      <span>Final Total</span>
                      <span className="text-green-400">₹{calculateFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-[0.98] text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-purple-500/50"
                >
                  {checkingOut ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>

                <Link
                  href="/marketplace"
                  className="block mt-4 text-center text-purple-400 hover:text-purple-300 transition text-sm font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary - Mobile (Fixed Bottom) */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-900 via-slate-900/98 to-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-2xl w-screen"
              style={{ maxWidth: '100vw' }}
            >
              <div className="p-4 space-y-3">
                {/* Collapsible Summary */}
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <div>
                      <div className="text-xs text-white/60 mb-1">Total Amount</div>
                      <div className="text-2xl font-bold text-green-400">
                        ₹{calculateFinalTotal().toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {calculateTotalDiscount() > 0 && (
                        <div className="bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">
                          <span className="text-xs font-semibold text-green-400">
                            Saved ₹{calculateTotalDiscount().toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="text-purple-400 group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </div>
                  </summary>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Original Price ({cart.totalItems} items)</span>
                      <span className="line-through">₹{calculateOriginalPrice().toFixed(2)}</span>
                    </div>
                    
                    {calculateTotalDiscount() > 0 && (
                      <div className="flex justify-between text-green-400 font-semibold">
                        <span>Discount</span>
                        <span>-₹{calculateTotalDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-white/70">
                      <span>Price After Discount</span>
                      <span>₹{calculatePriceAfterDiscount().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-white/70">
                      <span>GST (5%)</span>
                      <span>+₹{calculateGST().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-white/70">
                      <span>Platform Fee (2%)</span>
                      <span>+₹{calculatePlatformFee().toFixed(2)}</span>
                    </div>
                  </div>
                </details>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-[0.98] text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg"
                >
                  {checkingOut ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Proceed to Checkout
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}





