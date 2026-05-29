'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cartAPI } from '@/lib/api';
import api from '@/lib/api';
import { getCookie } from '@/lib/cookies';
import { Loader, Plus, Minus, Trash2, ShoppingCart, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '@/app/dashboard/buyer/transactions/components/PageHeader';

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
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent("/cart");
      router.replace(`/login?next=${returnUrl}`);
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    fetchCart();

    // Load Razorpay checkout script
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [authChecked]);

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

      // Create ONE cart checkout order for all items
      const res = await api.post('/payments/cart-checkout');
      const { razorpayOrderId, key, amount, cartOrderId, itemCount, items } = res.data;

      console.log('🛒 Cart checkout:', { cartOrderId, itemCount, amount: amount / 100 });

      // Open single Razorpay payment modal
      await new Promise<void>((resolve, reject) => {
        const options = {
          key,
          amount,
          currency: 'INR',
          name: 'BitForge',
          description: `${itemCount} item${itemCount > 1 ? 's' : ''} - ${items.map((i: any) => i.productName).join(', ')}`,
          order_id: razorpayOrderId,
          handler: async function (response: any) {
            try {
              console.log(' Payment successful:', response);
              toast.success(`Payment successful! ${itemCount} item(s) purchased.`);

              // Cart will be cleared by webhook, but refresh UI
              await fetchCart();
              router.push('/dashboard/buyer/purchases');
              resolve();
            } catch (err) {
              console.error('Error after payment:', err);
              resolve();
            }
          },
          modal: {
            ondismiss: function () {
              toast.error('Payment cancelled');
              reject(new Error('Payment cancelled'));
            },
          },
          prefill: {
            name: '',
            email: '',
          },
          theme: {
            color: '#4f46e5', // indigo-600
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
        // Payment was cancelled
      });

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
    return calculateOriginalPrice() * 0.05; // 5% GST
  };

  const calculatePlatformFee = () => {
    return calculateOriginalPrice() * 0.02; // 2% Platform fee
  };

  const calculateFinalTotal = () => {
    return calculatePriceAfterDiscount() + calculateGST() + calculatePlatformFee();
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A101D] text-slate-900 dark:text-white pb-32 md:pb-8 overflow-x-hidden">
        <PageHeader
          title="Shopping Cart"
          backHref="/dashboard/buyer"
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-[#12141c]/60 border border-gray-100 dark:border-white/5 rounded-xl p-4 md:p-6 animate-pulse flex gap-3 md:gap-6">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-5 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/3" />
                    <div className="pt-2 flex justify-between items-center">
                      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-1/4" />
                      <div className="flex gap-2">
                        <div className="h-8 w-24 bg-gray-200 dark:bg-white/10 rounded" />
                        <div className="h-8 w-10 bg-gray-200 dark:bg-white/10 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white dark:bg-[#12141c]/60 border border-gray-100 dark:border-white/5 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-1/2 mb-6" />
                <div className="space-y-4 mb-6">
                  <div className="h-4 bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-white/10 rounded pt-4 border-t border-gray-200 dark:border-white/10" />
                </div>
                <div className="h-12 bg-gray-200 dark:bg-white/10 rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A101D] text-slate-900 dark:text-white pb-32 md:pb-8 overflow-x-hidden">
      {/* Header */}
      <PageHeader
        title="Shopping Cart"
        subtitle={`${cart?.totalItems || 0} item${cart?.totalItems !== 1 ? 's' : ''}`}
        backHref="/dashboard/buyer"
        rightSlot={
          cart && cart.items.length > 0 ? (
            <button
              onClick={clearCart}
              className="px-3 md:px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-all text-xs md:text-sm font-bold whitespace-nowrap"
            >
              Clear
            </button>
          ) : undefined
        }
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {!cart || cart.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#12141c]/60 border border-gray-100 dark:border-white/5 rounded-3xl p-8 md:p-12 text-center shadow-sm"
          >
            <ShoppingCart className="w-16 h-16 md:w-20 md:h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Your cart is empty</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mb-6">Add some amazing digital products to get started!</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center px-6 md:px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all text-sm md:text-base shadow-lg hover:shadow-indigo-500/25"
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
                    className="bg-white dark:bg-[#12141c]/80 border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all shadow-sm group"
                  >
                    <div className="flex gap-3 sm:gap-4 md:gap-5">
                      {/* Thumbnail */}
                      <div 
                        className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 bg-[#F7F7F7] dark:bg-[#0B1221] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden relative cursor-pointer flex items-center justify-center"
                        onClick={() => router.push(`/marketplace/${item.productId._id}`)}
                      >
                        {item.productId?.thumbnailUrl ? (
                          <img
                            src={item.productId.thumbnailUrl}
                            alt={item.productId.title}
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-2 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-white/10" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h3 
                            className="text-sm md:text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer tracking-tight"
                            onClick={() => router.push(`/marketplace/${item.productId._id}`)}
                          >
                            {item.productId?.title || 'Unknown Product'}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs mb-1.5 md:mb-2 line-clamp-2">
                            {item.productId?.description || 'No description available'}
                          </p>
                          <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] uppercase tracking-wider font-medium">
                            By {item.productId?.sellerId?.name || 'Unknown'}
                          </p>
                        </div>

                        {/* Mobile Layout: Price and Controls Stacked */}
                        <div className="space-y-2.5 md:space-y-3 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </div>

                            {item.productId?.discount && item.productId.discount > 0 && (
                              <div className="flex items-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                                  {item.productId.discount}% OFF
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 rounded-lg p-1 border border-gray-100 dark:border-white/10">
                              <button
                                onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                                disabled={updating === item.productId._id || item.quantity <= 1}
                                className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-transparent active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5 text-slate-700 dark:text-white" />
                              </button>
                              <span className="w-8 md:w-10 text-center text-slate-900 dark:text-white font-bold text-xs md:text-sm">
                                {updating === item.productId._id ? (
                                  <Loader className="w-3.5 h-3.5 animate-spin mx-auto" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                                disabled={updating === item.productId._id}
                                className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-transparent active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5 text-slate-700 dark:text-white" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.productId._id)}
                              disabled={removing === item.productId._id}
                              className="p-1.5 md:p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 active:bg-rose-200 border border-rose-100 dark:border-rose-500/20 text-rose-500 dark:text-rose-400 transition-all disabled:opacity-50 flex items-center gap-1.5"
                              aria-label="Remove item"
                            >
                              {removing === item.productId._id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 md:w-4 md:h-4" />
                                  <span className="hidden sm:inline text-xs font-bold">Remove</span>
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
              <div className="bg-white dark:bg-[#12141c]/80 border border-gray-100 dark:border-white/5 shadow-lg rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Order Summary</h2>

                <div className="space-y-3.5 mb-6">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
                    <span>Original Price ({cart.totalItems} items)</span>
                    <span className="line-through">₹{calculateOriginalPrice().toFixed(2)}</span>
                  </div>

                  {calculateTotalDiscount() > 0 && (
                    <>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        <span>Discount Amount</span>
                        <span>-₹{calculateTotalDiscount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-300 text-xs bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-2 font-bold">
                        <span>You Saved</span>
                        <span>₹{calculateTotalDiscount().toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="border-t border-gray-100 dark:border-white/10 pt-3">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm font-medium">
                      <span>Price After Discount</span>
                      <span>₹{calculatePriceAfterDiscount().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm font-medium">
                    <span>GST (5%)</span>
                    <span>+₹{calculateGST().toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm font-medium">
                    <span>Platform Fee (2%)</span>
                    <span>+₹{calculatePlatformFee().toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gray-100 dark:border-white/10 pt-3.5">
                    <div className="flex justify-between text-slate-900 dark:text-white text-xl font-bold">
                      <span>Final Total</span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">
                        ₹{calculateFinalTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.98] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
                >
                  {checkingOut ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>

                <Link
                  href="/marketplace"
                  className="block mt-4 text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition text-sm font-bold"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary - Mobile (Fixed Bottom) */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0A101D] border-t border-gray-200 dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-2xl w-screen"
              style={{ maxWidth: '100vw' }}
            >
              <div className="p-4 space-y-3 max-w-7xl mx-auto">
                {/* Collapsible Summary */}
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Amount</div>
                      <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 tracking-tight">
                        ₹{calculateFinalTotal().toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {calculateTotalDiscount() > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2 py-1 rounded-md">
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Saved ₹{calculateTotalDiscount().toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="text-slate-400 group-open:rotate-180 transition-transform bg-gray-50 dark:bg-white/5 p-1 rounded-full">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                      <span>Original Price ({cart.totalItems} items)</span>
                      <span className="line-through">₹{calculateOriginalPrice().toFixed(2)}</span>
                    </div>

                    {calculateTotalDiscount() > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Discount</span>
                        <span>-₹{calculateTotalDiscount().toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                      <span>Price After Discount</span>
                      <span>₹{calculatePriceAfterDiscount().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                      <span>GST (5%)</span>
                      <span>+₹{calculateGST().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                      <span>Platform Fee (2%)</span>
                      <span>+₹{calculatePlatformFee().toFixed(2)}</span>
                    </div>
                  </div>
                </details>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.98] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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





