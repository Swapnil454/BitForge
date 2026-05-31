import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
  return toast.success(message, {
    duration: 3000,
  });
};

export const showError = (message: string) => {
  return toast.error(message, {
    duration: 3500,
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const showInfo = (message: string) => {
  return toast(message, {
    duration: 3000,
    icon: 'ℹ️',
  });
};