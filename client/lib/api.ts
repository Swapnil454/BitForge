
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
                '/users/request-password-reset'
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

    getAllTransactions: async () => {
        const response = await api.get('/admin/transactions');
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
    
    getPendingProducts: async () => {
        const response = await api.get('/admin/products/pending');
        return response.data;
    },
    
    approveProduct: async (id: string) => {
        const response = await api.post(`/admin/products/${id}/approve`);
        return response.data;
    },
    
    rejectProduct: async (id: string, reason: string) => {
        const response = await api.post(`/admin/products/${id}/reject`, { reason });
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
    
    approvePayout: async (id: string) => {
        const response = await api.post(`/admin/payouts/${id}/approve`);
        return response.data;
    },
    
    rejectPayout: async (id: string, reason: string) => {
        const response = await api.post(`/admin/payouts/${id}/reject`, { reason });
        return response.data;
    },
    
    getOpenDisputes: async () => {
        const response = await api.get('/admin/disputes/open');
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

    getAllUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    updateUserProfile: async (id: string, name: string, profilePictureUrl?: string) => {
        const response = await api.put(`/admin/users/${id}/profile`, { name, profilePictureUrl });
        return response.data;
    },

    deleteUser: async (id: string, reason: string) => {
        const response = await api.delete(`/admin/users/${id}`, { data: { reason } });
        return response.data;
    },

    getAllProducts: async () => {
        const response = await api.get('/admin/products/all');
        return response.data;
    },

    getProductDetails: async (id: string) => {
        const response = await api.get(`/admin/products/${id}/details`);
        return response.data;
    },

    editProduct: async (id: string, updateData: any) => {
        const response = await api.put(`/admin/products/${id}/edit`, updateData);
        return response.data;
    },

    deleteProduct: async (id: string, deleteReason: string) => {
        const response = await api.delete(`/admin/products/${id}/delete`, { data: { deleteReason } });
        return response.data;
    }
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
    
    getTransactions: async () => {
        const response = await api.get('/seller/transactions');
        return response.data;
    },

    getAllSales: async () => {
        const response = await api.get('/seller/sales');
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
    getAllProducts: async () => {
        const response = await api.get('/marketplace');
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

    getAllTransactions: async () => {
        const response = await api.get('/buyer/transactions');
        return response.data;
    },

    getTransactionDetails: async (orderId: string) => {
        const response = await api.get(`/buyer/transactions/${orderId}`);
        return response.data;
    },

    getAllPurchases: async () => {
        const response = await api.get('/buyer/purchases');
        return response.data;
    },

    getPurchaseDetails: async (purchaseId: string) => {
        const response = await api.get(`/buyer/purchases/${purchaseId}`);
        return response.data;
    }
};

    // Chat / Help Center API functions
    export const chatAPI = {
        getSupportThread: async () => {
            const response = await api.get('/chat/support-thread');
            return response.data;
        },

        sendSupportMessage: async (message: string) => {
            const response = await api.post('/chat/support-thread', { message });
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

        adminSendMessage: async (userId: string, message: string) => {
            const response = await api.post(`/chat/thread/${userId}`, { message });
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
export const notificationAPI = {
    getNotifications: async (limit = 10, skip = 0) => {
        const response = await api.get(`/notifications?limit=${limit}&skip=${skip}`);
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
    }
};



// User API functions
export const userAPI = {
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

    requestAccountDeletion: async () => {
        const response = await api.post('/users/request-account-deletion');
        return response.data;
    },

    confirmAccountDeletion: async (otp: string, reason: string) => {
        const response = await api.post('/users/confirm-account-deletion', { otp, reason });
        return response.data;
    }
};

export default api;