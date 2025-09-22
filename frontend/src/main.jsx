import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css';
import { Login, Upload, Dashboard, Transactions } from './pages';
import ProtectedRoute from './components/ProtectedRoute';
import { UploadProvider } from './components/upload/UploadContext';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Auth0Provider
            domain="dev-jco6fy6pebxlsglc.us.auth0.com"
            clientId="Hp1O9MWjmz4GJ5sNCR26ISBdxzujrhSb"
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: "http://localhost:5000",
                scope: "read:current_user"
            }}
        >
            <BrowserRouter>
            <Routes>
                <Route path='/login' element={<Login />} />
                <Route
                    path='/'
                    element={
                        <ProtectedRoute>
                            <UploadProvider>
                                <Upload />
                            </UploadProvider>
                        </ProtectedRoute>
                    } 
                />
                <Route
                    path='/dashboard'
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route
                    path='/transactions'
                    element={
                        <ProtectedRoute>
                            <Transactions />
                        </ProtectedRoute>
                    }
                />
            </Routes>
            </BrowserRouter>
        </Auth0Provider>
    </StrictMode>
)
