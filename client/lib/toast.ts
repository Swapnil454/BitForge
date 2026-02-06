import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
  return toast.success(message, {
    duration: 4000,
    style: {
      background: '#10B981',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

export const showError = (message: string) => {
  return toast.error(message, {
    duration: 5000,
    style: {
      background: '#EF4444',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      background: '#6366F1',
      color: '#fff',
    },
  });
};

export const showInfo = (message: string) => {
  return toast(message, {
    duration: 4000,
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  });
};