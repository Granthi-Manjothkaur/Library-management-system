import axios from 'axios';
const api = axios.create({
  baseURL: 'https://library-management-system-1-fl4d.onrender.com/api',
  timeout: 15000
});
// Attach the JWT token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is no longer valid, log the user out.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLogin) {
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Turns any error into a readable message.
export const getErrorMessage = (err) => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ERR_NETWORK' || !err.response) return 'Cannot reach the server. Is the backend running?';
  return 'Something went wrong. Please try again.';
};

export default api;
