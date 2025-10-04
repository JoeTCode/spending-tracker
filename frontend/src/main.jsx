import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css';
import { Login, Upload, Dashboard, Transactions, Register } from './pages';
import ProtectedRoute from './components/ProtectedRoute';
import { UploadProvider } from './components/upload/UploadContext';
import { PageProvider } from "./pages/PageContext";
import { InternalAuthProvider } from './components/useInternalAuth';

createRoot(document.getElementById('root')).render(
    <StrictMode>
            <Auth0Provider
                domain="dev-jco6fy6pebxlsglc.us.auth0.com"
                clientId="Hp1O9MWjmz4GJ5sNCR26ISBdxzujrhSb"
                authorizationParams={{
                    redirect_uri: window.location.origin,
                    audience: "http://localhost:5000",
                    scope: ""
                }}
            >
                <InternalAuthProvider>
                    <BrowserRouter>
                    <Routes>
                        <Route path='/login' element={<Login />} />
                        <Route path='/register' element={<Register />} />
                        <Route
                            path='/'
                            element={
                                <ProtectedRoute>
                                    <PageProvider>
                                        <UploadProvider>
                                            <Upload />
                                        </UploadProvider>
                                    </PageProvider>
                                </ProtectedRoute>
                            } 
                        />
                        
                        <Route
                            path='/dashboard'
                            element={
                                <ProtectedRoute>
                                    <PageProvider>
                                        <Dashboard />
                                    </PageProvider>
                                </ProtectedRoute>
                            } 
                        />
                        <Route
                            path='/transactions'
                            element={
                                <ProtectedRoute>
                                    <PageProvider>
                                        <Transactions />
                                    </PageProvider>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                    </BrowserRouter>
                </InternalAuthProvider>
            </Auth0Provider>
    </StrictMode>
)
