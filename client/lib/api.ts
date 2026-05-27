
import axios from "axios";
import { getCookie, removeCookie } from "./cookies";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = getCookie('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        // Don't set Content-Type for FormData (let browser set it)
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = (error.response?.data?.message || '').toLowerCase();
        const requestUrl = error.config?.url || '';

        if (status === 401) {
            const ignorePaths = [
                '/users/change-password',
                '/users/reset-password',
                '/users/request-password-reset',
                '/reports/my-reports'
            ];

            const isIgnoredRoute = ignorePaths.some((path) => requestUrl.includes(path));
            const looksLikeTokenIssue =
                message.includes('token') ||
                message.includes('jwt') ||
                message.includes('unauthorized');

            if (!isIgnoredRoute && looksLikeTokenIssue) {
                if (typeof window !== 'undefined') {
                    removeCookie('token');
                    removeCookie('user');
                    window.location.href = '/login';
                }
            } else {
                // Let caller handle non-token 401 errors (e.g., wrong password)
                return Promise.reject(error);
            }
        }

        // Global Ban/Delete Interceptor
        if (status === 403) {
            const accountStatus = error.response?.data?.accountStatus;
            if (accountStatus === 'banned') {
                if (typeof window !== 'undefined') {
                    const reason = error.response?.data?.bannedReason || 'Terms of service violation';
                    window.dispatchEvent(new CustomEvent('account-banned', { detail: { reason } }));
                }
            } else if (accountStatus === 'deleted') {
                if (typeof window !== 'undefined') {
                    const email = error.response?.data?.email || '';
                    window.dispatchEvent(new CustomEvent('account-deleted', { detail: { email } }));
                }
            }
        }

        return Promise.reject(error);
    }
);

// Auth API functions
export const authAPI = {
    login: async (loginId: string, password: string) => {
        const response = await api.post('/auth/login', { loginId, password });
        return response.data;
    },
    
    register: async (name: string, email: string, password: string, role: string = 'buyer') => {
        const response = await api.post('/auth/register', { name, email, password, role });
        return response.data;
    },
    
    verifyOtp: async (email: string, otp: string) => {
        const response = await api.post('/auth/verify-otp', { email, otp });
        return response.data;
    },
    
    resendOtp: async (email: string) => {
        const response = await api.post('/auth/resend-otp', { email });
        return response.data;
    },
    
    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    
    resetPassword: async (email: string, otp: string, newPassword: string) => {
        const response = await api.post('/auth/reset-password', { email, otp, newPassword });
        return response.data;
    }
};


// Admin API functions
export const adminAPI = {
    getDashboardStats: async () => {
        const response = await api.get('/admin/dashboard-stats');
        return response.data;
    },

    getAllTransactions: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        type?: string;
        status?: string;
        sortBy?: string;
        dateRange?: string;
        startDate?: string;
        endDate?: string;
        userId?: string;
    }) => {
        const response = await api.get('/admin/transactions', { params });
        return response.data;
    },

    bulkMarkTransactionsReviewed: async (ids: string[]) => {
        const response = await api.post('/admin/transactions/bulk-review', { ids });
        return response.data;
    },

    getPendingSellers: async () => {
        const response = await api.get('/admin/sellers/pending');
        return response.data;
    },
    
    approveSeller: async (id: string) => {
        const response = await api.post(`/admin/sellers/${id}/approve`);
        return response.data;
    },
    
    rejectSeller: async (id: string, reason: string) => {
        const response = await api.post(`/admin/sellers/${id}/reject`, { reason });
        return response.data;
    },
    
    getPendingProducts: async (params?: { page?: number; limit?: number; search?: string; category?: string; sort?: string; status?: string }) => {
        const response = await api.get('/admin/products/pending', { params });
        return response.data;
    },

    getProductStats: async () => {
        const response = await api.get('/admin/products/stats');
        return response.data;
    },
    
    approveProduct: async (id: string, adminNote?: string) => {
        const response = await api.post(`/admin/products/${id}/approve`, { adminNote });
        return response.data;
    },

    pendingProduct: async (id: string, adminNote?: string) => {
        const response = await api.post(`/admin/products/${id}/pending`, { adminNote });
        return response.data;
    },
    
    rejectProduct: async (id: string, reasons: string[], adminNote?: string) => {
        const response = await api.post(`/admin/products/${id}/reject`, { reasons, adminNote });
        return response.data;
    },

    requestProductChanges: async (id: string, reasons: string[], adminNote?: string) => {
        const response = await api.post(`/admin/products/${id}/request-changes`, { reasons, adminNote });
        return response.data;
    },

    getPendingProductChanges: async () => {
        const response = await api.get('/admin/products/changes/pending');
        return response.data;
    },

    approveProductChange: async (id: string) => {
        const response = await api.post(`/admin/products/${id}/changes/approve`);
        return response.data;
    },

    rejectProductChange: async (id: string, reason: string) => {
        const response = await api.post(`/admin/products/${id}/changes/reject`, { reason });
        return response.data;
    },
    
    getPendingPayouts: async () => {
        const response = await api.get('/admin/payouts/pending');
        return response.data;
    },

    getAllPayouts: async (params?: { status?: string; page?: number; limit?: number; search?: string; sort?: "newest" | "oldest" }) => {
        const response = await api.get('/admin/payouts/all', { params });
        return response.data;
    },

    getPayoutAnalytics: async (params?: { range?: string }) => {
        const response = await api.get('/admin/payouts/analytics', { params });
        return response.data;
    },
    
    approvePayout: async (id: string, paymentData: { utrNumber: string; paymentDate: string; paymentMode: string; proofImageUrl?: string; adminNote?: string }) => {
        const response = await api.post(`/admin/payouts/${id}/approve`, paymentData);
        return response.data;
    },
    
    rejectPayout: async (id: string, reasons: string[], message: string) => {
        const response = await api.post(`/admin/payouts/${id}/reject`, { reasons, message });
        return response.data;
    },

    uploadPayoutProof: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('proof', file);
        const response = await api.post(`/admin/payouts/${id}/proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    
    getAllDisputes: async (params?: { page?: number; limit?: number; search?: string; status?: string; sort?: string }) => {
        const response = await api.get('/admin/disputes', { params });
        return response.data;
    },

    getDisputeAnalytics: async (params?: { range?: string }) => {
        const response = await api.get('/admin/disputes/analytics', { params });
        return response.data;
    },
    
    approveRefund: async (disputeId: string) => {
        const response = await api.post(`/admin/disputes/${disputeId}/refund`);
        return response.data;
    },
    
    rejectDispute: async (disputeId: string, reason: string) => {
        const response = await api.post(`/admin/disputes/${disputeId}/reject`, { reason });
        return response.data;
    },
    
    getGSTReport: async () => {
        const response = await api.get('/admin/reports/gst');
        return response.data;
    },

    getPendingSellerDeletions: async () => {
        const response = await api.get('/admin/sellers/deletions/pending');
        return response.data;
    },

    approveSellerDeletion: async (id: string) => {
        const response = await api.post(`/admin/sellers/${id}/deletions/approve`);
        return response.data;
    },

    rejectSellerDeletion: async (id: string, reason: string) => {
        const response = await api.post(`/admin/sellers/${id}/deletions/reject`, { reason });
        return response.data;
    },

    getAllUsers: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        sort?: string;
        isVerified?: string;
    }) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    updateUserProfile: async (id: string, name: string, profilePictureUrl?: string) => {
        const response = await api.put(`/admin/users/${id}/profile`, { name, profilePictureUrl });
        return response.data;
    },

    deleteUser: async (id: string) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },

    suspendUser: async (id: string, reason: string) => {
        const response = await api.post(`/admin/users/${id}/suspend`, { reason });
        return response.data;
    },

    getUserById: async (id: string) => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },

    unbanUser: async (id: string) => {
        const response = await api.post(`/admin/users/${id}/unban`);
        return response.data;
    },

    updateUserLimit: async (id: string, productLimit: number) => {
        const response = await api.put(`/admin/users/${id}/limit`, { productLimit });
        return response.data;
    },

    getAllProducts: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        category?: string;
        sortBy?: string;
    }) => {
        const response = await api.get('/admin/products/all', { params });
        return response.data;
    },

    getProductDetails: async (id: string) => {
        const response = await api.get(`/admin/products/${id}/details`);
        return response.data;
    },

    getProductAnalytics: async (params?: { range?: string }) => {
        const response = await api.get("/admin/products/analytics", { params });
        return response.data;
    },

    getProductReport: async () => {
        const response = await api.get("/admin/products/report", { responseType: 'blob' });
        return response.data;
    },

    editProduct: async (id: string, updateData: any) => {
        const response = await api.put(`/admin/products/${id}/edit`, updateData);
        return response.data;
    },

    deleteProduct: async (id: string, deleteReason: string) => {
        const response = await api.delete(`/admin/products/${id}/delete`, { data: { deleteReason } });
        return response.data;
    },

    // Trust & Security APIs
    getMalwareFlaggedProducts: async (severity?: 'all' | 'high' | 'medium' | 'low') => {
        const response = await api.get('/admin/security/malware/flagged', {
            params: { severity }
        });
        return response.data;
    },

    getMalwareStats: async () => {
        const response = await api.get('/admin/security/malware/stats');
        return response.data;
    },

    getMalwareScans: async (params?: { cursor?: string; limit?: number }) => {
        const response = await api.get('/admin/security/malware/scans', { params });
        return response.data;
    },

    getMalwareScanDetails: async (scanId: string) => {
        const response = await api.get(`/admin/security/malware/scans/${scanId}`);
        return response.data;
    },

    whitelistMalwareScan: async (scanId: string) => {
        const response = await api.post(`/admin/security/malware/scans/${scanId}/whitelist`);
        return response.data;
    },

    notifySellerThreat: async (scanId: string) => {
        const response = await api.post(`/admin/security/malware/scans/${scanId}/notify`);
        return response.data;
    },

    takedownMaliciousProduct: async (scanId: string) => {
        const response = await api.post(`/admin/security/malware/scans/${scanId}/remove`);
        return response.data;
    },

    rescanMalware: async (scanId: string) => {
        const response = await api.post(`/admin/security/malware/scans/${scanId}/rescan`);
        return response.data;
    },

    getContentReviewQueue: async (severity?: 'all' | 'high' | 'medium' | 'low', cursor?: string, limit?: number) => {
        const response = await api.get('/admin/security/content-review/queue', {
            params: { severity, cursor, limit }
        });
        return response.data;
    },

    resolveContentReview: async (productId: string, action: 'approve' | 'reject', reason?: string) => {
        const response = await api.post(`/admin/security/content-review/${productId}/resolve`, {
            action,
            reason
        });
        return response.data;
    },

    getPendingIdentityVerifications: async (cursor?: string, limit?: number) => {
        const response = await api.get('/admin/security/identity/pending', {
            params: { cursor, limit }
        });
        return response.data;
    },

    verifySellerIdentity: async (sellerId: string, verified: boolean, notes?: string) => {
        const response = await api.post(`/admin/security/identity/${sellerId}/verify`, {
            verified,
            notes
        });
        return response.data;
    },

    viewIdentityDocument: async (publicId: string) => {
        const response = await api.get('/admin/security/identity/document/view', { 
            params: { publicId },
            responseType: 'blob' 
        });
        return response.data;
    },
};

// Seller API functions
export const sellerAPI = {
    getDashboardStats: async () => {
        const response = await api.get('/seller/dashboard-stats');
        return response.data;
    },
    
    getEarnings: async () => {
        const response = await api.get('/seller/earnings');
        return response.data;
    },
    
    requestWithdrawal: async (amount: number) => {
        const response = await api.post('/seller/withdraw', { amount });
        return response.data;
    },
    
    cancelPayoutRequest: async (payoutId: string) => {
        const response = await api.delete(`/seller/withdraw/${payoutId}`);
        return response.data;
    },
    
    getTransactions: async (params?: {
        page?: number;
        limit?: number;
        status?: "all" | "completed" | "pending" | "cancelled";
        search?: string;
    }) => {
        const response = await api.get('/seller/transactions', { params });
        return response.data;
    },

    getAllSales: async (params?: {
        page?: number;
        limit?: number;
        status?: "all" | "paid" | "failed" | "created";
        search?: string;
    }) => {
        const response = await api.get('/seller/sales', { params });
        return response.data;
    },

    getGrowthAnalytics: async () => {
        const response = await api.get('/seller/growth-analytics');
        return response.data;
    }
};

// Product API functions
export const productAPI = {
    createProduct: async (productData: any) => {
        const response = await api.post('/products', productData);
        return response.data;
    },
    
    getMyProducts: async () => {
        const response = await api.get('/products/mine');
        return response.data;
    },
    
    uploadProductFile: async (formData: FormData) => {
        const response = await api.post('/products/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

// Marketplace API functions
export const marketplaceAPI = {
    getAllProducts: async (params?: {
        page?: number;
        limit?: number;
        category?: string;
        sort?: "newest" | "trending" | "rating" | "price_asc" | "price_desc";
        search?: string;
    }) => {
        const response = await api.get('/marketplace', { params });
        return response.data;
    },
    
    getProductById: async (id: string) => {
        const response = await api.get(`/marketplace/${id}`);
        return response.data;
    }
};

// Payment API functions
export const paymentAPI = {
    createOrder: async (productId: string) => {
        const response = await api.post('/payments/create-order', { productId });
        return response.data;
    },
    
    cartCheckout: async () => {
        const response = await api.post('/payments/cart-checkout');
        return response.data;
    },
    
    getMyOrders: async () => {
        const response = await api.get('/payments/my-orders');
        return response.data;
    }
};

// Buyer API functions
export const buyerAPI = {
    getStats: async () => {
        const response = await api.get('/buyer/stats');
        return response.data;
    },
    
    getSpendingOverTime: async () => {
        const response = await api.get('/buyer/spending-over-time');
        return response.data;
    },
    
    getWishlistCount: async () => {
        const response = await api.get('/buyer/wishlist-count');
        return response.data;
    },

    getAllTransactions: async (params?: {
        page?: number;
        limit?: number;
        status?: "all" | "paid" | "created" | "failed";
        sortBy?: "newest" | "oldest";
        search?: string;
    }) => {
        const response = await api.get('/buyer/transactions', { params });
        return response.data;
    },

    getTransactionDetails: async (orderId: string) => {
        const response = await api.get(`/buyer/transactions/${orderId}`);
        return response.data;
    },

    getAllPurchases: async (params?: {
        page?: number;
        limit?: number;
        sortBy?: "newest" | "oldest";
        search?: string;
    }) => {
        const response = await api.get('/buyer/purchases', { params });
        return response.data;
    },

    getPurchaseDetails: async (purchaseId: string) => {
        const response = await api.get(`/buyer/purchases/${purchaseId}`);
        return response.data;
    },

    // Get purchased product details (works for soft-deleted products)
    getPurchasedProduct: async (productId: string) => {
        const response = await api.get(`/buyer/purchased-product/${productId}`);
        return response.data;
    },

    getMyDisputes: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get('/disputes/my', { params });
        return response.data;
    },

    getDownloadInfo: async (orderId: string) => {
        const response = await api.get(`/download/${orderId}/info`);
        return response.data;
    }
};

    // Chat / Help Center API functions
    export const chatAPI = {
        getSupportThread: async () => {
            const response = await api.get('/chat/support-thread');
            return response.data;
        },

        sendSupportMessage: async (message: string, attachments?: any[]) => {
            const response = await api.post('/chat/support-thread', { message, attachments });
            return response.data;
        },

        uploadAttachment: async (formData: FormData) => {
            const response = await api.post('/chat/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        },

        deleteMessages: async (messageIds: string[]) => {
            const response = await api.delete('/chat/messages', { data: { messageIds } });
            return response.data;
        },

        adminGetConversations: async () => {
            const response = await api.get('/chat/conversations');
            return response.data;
        },

        adminGetThread: async (userId: string) => {
            const response = await api.get(`/chat/thread/${userId}`);
            return response.data;
        },

        adminSendMessage: async (userId: string, message: string, attachments?: any[]) => {
            const response = await api.post(`/chat/thread/${userId}`, { message, attachments });
            return response.data;
        },

        adminDeleteMessages: async (messageIds: string[]) => {
            const response = await api.delete('/chat/admin/messages', { data: { messageIds } });
            return response.data;
        },

        adminClearThread: async (userId: string) => {
            const response = await api.delete(`/chat/admin/thread/${userId}`);
            return response.data;
        },

        adminClearAllChats: async () => {
            const response = await api.delete('/chat/admin/all');
            return response.data;
        },

        getUnreadCount: async () => {
            const response = await api.get('/chat/unread-count');
            return response.data;
        },

        markAllAsRead: async () => {
            const response = await api.post('/chat/mark-read', {});
            return response.data;
        },

        adminMarkThreadAsRead: async (userId: string) => {
            const response = await api.post(`/chat/thread/${userId}/mark-read`, {});
            return response.data;
        },
    };

// Cart API functions
export const cartAPI = {
    getCart: async () => {
        const response = await api.get('/cart');
        return response.data;
    },

    getCartCount: async () => {
        const response = await api.get('/cart/count');
        return response.data;
    },

    addToCart: async (productId: string, quantity: number = 1) => {
        const response = await api.post('/cart/add', { productId, quantity });
        return response.data;
    },

    updateCartItem: async (productId: string, quantity: number) => {
        const response = await api.put('/cart/update', { productId, quantity });
        return response.data;
    },

    removeFromCart: async (productId: string) => {
        const response = await api.delete(`/cart/remove/${productId}`);
        return response.data;
    },

    clearCart: async () => {
        const response = await api.delete('/cart/clear');
        return response.data;
    }
};

// Notification API functions
type NotificationQueryOptions = {
    limit?: number;
    skip?: number;
    page?: number;
};

export const notificationAPI = {
    getNotifications: async (
        limitOrOptions: number | NotificationQueryOptions = 10,
        skip = 0
    ) => {
        const params =
            typeof limitOrOptions === "number"
                ? { limit: limitOrOptions, skip }
                : limitOrOptions;

        const response = await api.get('/notifications', { params });
        return response.data;
    },
    
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },
    
    markAsRead: async (notificationId: string) => {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    },
    
    markAllAsRead: async () => {
        const response = await api.patch('/notifications/all/mark-as-read');
        return response.data;
    },
    
    deleteNotification: async (notificationId: string) => {
        const response = await api.delete(`/notifications/${notificationId}`);
        return response.data;
    },

    getPreferences: async () => {
        const response = await api.get("/notifications/preferences");
        return response.data;
    },

    updatePreferences: async (payload: {
        browserPushEnabled?: boolean;
        marketingEnabled?: boolean;
        securityEnabled?: boolean;
        transactionEnabled?: boolean;
        chatEnabled?: boolean;
        moderationEnabled?: boolean;
    }) => {
        const response = await api.patch("/notifications/preferences", payload);
        return response.data;
    },

    registerPushToken: async (payload: {
        token: string;
        deviceId?: string;
        platform?: string;
        browserName?: string;
    }) => {
        const response = await api.post("/notifications/push-token", payload);
        return response.data;
    },

    unregisterPushToken: async (token: string) => {
        const response = await api.delete("/notifications/push-token", {
            data: { token },
        });
        return response.data;
    },

    sendHeartbeat: async () => {
        const response = await api.post("/notifications/heartbeat", {});
        return response.data;
    }
};


// Public contact API
export const contactAPI = {
    submitMessage: async (payload: { name: string; email: string; type: string; message: string }) => {
        const response = await api.post('/contact', payload);
        return response.data;
    }
};

// Promotion API functions
export const promotionAPI = {
    createSellerPromotion: async (formData: FormData) => {
        const response = await api.post('/seller/promotions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    getSellerPromotions: async (params?: { status?: string }) => {
        const response = await api.get('/seller/promotions', { params });
        return response.data;
    },

    getSellerPromotion: async (id: string) => {
        const response = await api.get(`/seller/promotions/${id}`);
        return response.data;
    },

    cancelSellerPromotion: async (id: string) => {
        const response = await api.patch(`/seller/promotions/${id}/cancel`);
        return response.data;
    },

    uploadSellerPaymentProof: async (id: string, formData: FormData) => {
        const response = await api.post(`/seller/promotions/${id}/payment-proof`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    createPromotionPaymentOrder: async (id: string) => {
        const response = await api.post(`/seller/promotions/${id}/create-payment-order`);
        return response.data;
    },

    verifySellerPromotionPayment: async (id: string, payload: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) => {
        const response = await api.post(`/seller/promotions/${id}/verify-payment`, payload);
        return response.data;
    },

    getAdminPromotions: async (params?: { status?: string; placement?: string }) => {
        const response = await api.get('/admin/promotions', { params });
        return response.data;
    },

    getAdminPromotion: async (id: string) => {
        const response = await api.get(`/admin/promotions/${id}`);
        return response.data;
    },

    approvePromotion: async (id: string, payload: {
        amount: number;
        approvedDurationDays?: number;
        priority?: number;
        placement?: string;
        maxImpressions?: number;
        adminNote?: string;
        heroBgColor?: string;
        heroTextColor?: string;
        heroTitleColor?: string;
        heroSubtitleColor?: string;
        heroButtonBgColor?: string;
        heroButtonTextColor?: string;
        heroFontFamily?: string;
        heroLayout?: string;
    }) => {
        const response = await api.patch(`/admin/promotions/${id}/approve`, payload);
        return response.data;
    },

    rejectPromotion: async (id: string, payload: { rejectedReason: string; adminNote?: string }) => {
        const response = await api.patch(`/admin/promotions/${id}/reject`, payload);
        return response.data;
    },

    verifyPromotionPayment: async (id: string, payload?: {
        paymentMethod?: string;
        transactionId?: string;
        adminNote?: string;
    }) => {
        const response = await api.patch(`/admin/promotions/${id}/verify-payment`, payload || {});
        return response.data;
    },

    pausePromotion: async (id: string, payload?: { adminNote?: string }) => {
        const response = await api.patch(`/admin/promotions/${id}/pause`, payload || {});
        return response.data;
    },

    resumePromotion: async (id: string, payload?: { adminNote?: string }) => {
        const response = await api.patch(`/admin/promotions/${id}/resume`, payload || {});
        return response.data;
    },

    updatePromotionPriority: async (id: string, priority: number) => {
        const response = await api.patch(`/admin/promotions/${id}/priority`, { priority });
        return response.data;
    },

    updatePromotionStyle: async (id: string, payload: { 
        heroBgColor?: string, 
        heroTextColor?: string, 
        heroLayout?: string,
        heroTitleColor?: string,
        heroSubtitleColor?: string,
        heroButtonBgColor?: string,
        heroButtonTextColor?: string,
        heroFontFamily?: string
    }) => {
        const response = await api.patch(`/admin/promotions/${id}/style`, payload);
        return response.data;
    },

    getAdSettings: async () => {
        const response = await api.get('/admin/ad-settings');
        return response.data;
    },

    updateAdSettings: async (payload: {
        marketplaceHeroMaxAds: number;
        autoRotate: boolean;
        defaultDurationDays: number;
        minimumPrice: number;
        maximumActiveAdsPerSeller: number;
    }) => {
        const response = await api.put('/admin/ad-settings', payload);
        return response.data;
    },

    getActivePromotions: async (placement: string = 'MARKETPLACE_HERO') => {
        const response = await api.get('/promotions/active', {
            params: { placement }
        });
        return response.data;
    },

    trackPromotionImpression: async (id: string) => {
        const response = await api.post(`/promotions/${id}/impression`);
        return response.data;
    },

    trackPromotionClick: async (id: string) => {
        const response = await api.post(`/promotions/${id}/click`);
        return response.data;
    },
};



// User API functions
export const userAPI = {
    updatePreferences: async (payload: { theme?: string, browserPushEnabled?: boolean }) => {
        const response = await api.patch('/users/preferences', payload);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },
    
    updateProfile: async (formData: FormData) => {
        const response = await api.patch('/users/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },
    
    changePassword: async (oldPassword: string, newPassword: string, confirmPassword: string) => {
        const response = await api.post('/users/change-password', {
            oldPassword,
            newPassword,
            confirmPassword,
        });
        return response.data;
    },
    
    requestPasswordReset: async (email: string) => {
        const response = await api.post('/users/request-password-reset', { email });
        return response.data;
    },
    
    resetPassword: async (email: string, otp: string, newPassword: string, confirmPassword: string) => {
        const response = await api.post('/users/reset-password', {
            email,
            otp,
            newPassword,
            confirmPassword,
        });
        return response.data;
    },

    uploadIdentityDocuments: async (formData: FormData) => {
        const response = await api.post('/users/identity/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    getIdentityStatus: async () => {
        const response = await api.get('/users/identity/status');
        return response.data;
    },

    requestAccountDeletion: async () => {
        const response = await api.post('/users/request-account-deletion');
        return response.data;
    },

    confirmAccountDeletion: async (otp: string, reason: string) => {
        const response = await api.post('/users/confirm-account-deletion', { otp, reason });
        return response.data;
    },

    requestReactivationOtp: async (email: string) => {
        const response = await api.post('/users/request-reactivation-otp', { email });
        return response.data;
    },

    reactivateAccount: async (email: string, otp: string) => {
        const response = await api.post('/users/reactivate-account', { email, otp });
        return response.data;
    },
};

// Report API functions
export const reportAPI = {
    submitReport: async (formData: FormData) => {
        const response = await api.post('/reports', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    getMyReports: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get('/reports/my-reports', { params });
        return response.data;
    },

    getAllReports: async (params?: { page?: number; limit?: number; status?: string }) => {
        const response = await api.get('/reports/admin', { params });
        return response.data;
    },

    updateReportStatus: async (id: string, data: { status: string; adminNotes?: string }) => {
        const response = await api.patch(`/reports/admin/${id}/status`, data);
        return response.data;
    }
};

// Review API functions
export const reviewAPI = {
    getProductReviews: async (productId: string, page: number = 1, limit: number = 10) => {
        const response = await api.get(`/reviews/product/${productId}`, {
            params: { page, limit }
        });
        return response.data;
    },

    createReview: async (data: { productId: string; orderId: string; rating: number; comment?: string }) => {
        const response = await api.post('/reviews', data);
        return response.data;
    },

    updateReview: async (reviewId: string, data: { rating: number; comment?: string }) => {
        const response = await api.patch(`/reviews/${reviewId}`, data);
        return response.data;
    },

    deleteReview: async (reviewId: string) => {
        const response = await api.delete(`/reviews/${reviewId}`);
        return response.data;
    },

    canReview: async (productId: string, orderId?: string) => {
        const response = await api.get(`/reviews/can-review/${productId}`);
        return response.data;
    },

    addSellerResponse: async (reviewId: string, text: string) => {
        const response = await api.post(`/reviews/${reviewId}/response`, { text });
        return response.data;
    }
};

export default api;

// Search API functions
export const searchAPI = {
    getSuggestions: async (q: string): Promise<{ suggestions: { text: string; category: string }[] }> => {
        const response = await api.get('/marketplace/search/suggestions', { params: { q } });
        return response.data;
    },

    getHistory: async (): Promise<{ history: { query: string; searchedAt: string }[] }> => {
        const response = await api.get('/marketplace/search/history');
        return response.data;
    },

    saveHistory: async (query: string): Promise<void> => {
        await api.post('/marketplace/search/history', { query });
    },

    deleteHistoryItem: async (query: string): Promise<void> => {
        await api.delete('/marketplace/search/history/' + encodeURIComponent(query));
    },

    clearHistory: async (): Promise<void> => {
        await api.delete('/marketplace/search/history/all');
    },
};
