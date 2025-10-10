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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Close from './assets/icons/close-x-svgrepo-com.svg?react';
import { Footer } from './components';

const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

createRoot(document.getElementById('root')).render(
    <StrictMode>
            <Auth0Provider
                domain="dev-jco6fy6pebxlsglc.us.auth0.com"
                clientId="Hp1O9MWjmz4GJ5sNCR26ISBdxzujrhSb"
                authorizationParams={{
                    redirect_uri: window.location.origin,
                    audience: "http://localhost:5000",
                    scope: "profile"
                }}
            >
                <InternalAuthProvider>
                    {isDarkMode ? (
                            <ToastContainer
                                position="bottom-right"
                                autoClose={3000}
                                toastClassName={() =>
                                    "p-4 bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow-lg flex"
                                }
                                bodyClassName="text-sm font-medium"
                                progressClassName="bg-purple-500 dark:bg-purple-300"
                                closeButton={({ closeToast }) => (
                                    <Close 
                                        onClick={closeToast}
                                        className='
                                            relative bottom-[9px] left-[10px] h-4 w-4 text-gray-500 dark:text-gray-300 hover:text-gray-700
                                            dark:hover:text-gray-500 cursor-pointer duration-300 ease-out
                                        '
                                    />

                                )}
                            />       
                        ) :
                        <ToastContainer position='bottom-right autoClose={3000}'/>
                    }
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
                                            <Footer />
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
                                        <Footer />
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
                                        <Footer />
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
