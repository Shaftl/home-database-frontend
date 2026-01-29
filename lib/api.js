// frontend/lib/api.js
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// axios instance (primary)
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send cookies (refresh token)
});

let currentAccessToken = null;
let isRefreshing = false;
let failedQueue = [];

// helper to process queued requests while refreshing
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

export const setAccessToken = (token) => {
  currentAccessToken = token;
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

// request interceptor: attach token if present
api.interceptors.request.use(
  (config) => {
    if (currentAccessToken)
      config.headers["Authorization"] = `Bearer ${currentAccessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// response interceptor: if 401 try refresh once and retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // only attempt refresh for 401 and if we haven't retried this request
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // queue the request until token refresh done
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest._retry = true;
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // call refresh endpoint (will send cookie)
        const refreshRes = await axios.post(
          `${API_BASE}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshRes.data.accessToken;
        // update local token store
        setAccessToken(newToken);
        processQueue(null, newToken);
        isRefreshing = false;

        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // refresh failed — clear queued requests with error and clear token
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);

        // IMPORTANT: do NOT perform a direct navigation here.
        // Let application-level auth logic (initAuth / logout handlers / pages)
        // detect auth failure and navigate to /login in a controlled manner.
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
