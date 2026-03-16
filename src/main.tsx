import React from 'react'
import ReactDOM from 'react-dom/client'
import { MainRouter } from './components/MainRouter.tsx'
import axios from 'axios'
import './index.css'

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(`API Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MainRouter />
    </React.StrictMode>,
)
