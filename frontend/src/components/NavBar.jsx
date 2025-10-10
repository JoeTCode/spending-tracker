import { useState, useRef, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import Dashboard from '../assets/icons/dashboard-svgrepo-com.svg?react';
import Home from '../assets/icons/home-03-svgrepo-com.svg?react';
import Transactions from '../assets/icons/transaction-svgrepo-com.svg?react';
import { useInternalAuth } from './useInternalAuth';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../axios/api';
import { db } from '../db/db';
import Profile from '../assets/icons/profile-round-1342-svgrepo-com.svg?react';
import Logo from '../../public/track-your-transactions-logo.svg?react';

const Sidebar = () => {
    const [ open, setOpen ] = useState(false);
    const [ openModal, setOpenModal ] = useState(false);
    const { logout, user } = useInternalAuth();
    const { isAuthenticated, user: auth0User, getAccessTokenSilently } = useAuth0();
    const profileRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            // If click is outside both the button and menu
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                profileRef.current &&
                !profileRef.current.contains(e.target)
            ) {
                setOpen(false);
            };
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div>  
            <div
                className="fixed top-0 w-full border-b-1 border-neutral-300/80 backdrop-blur-lg bg-white/70 dark:border-none dark:backdrop-blur-none dark:bg-dark dark:text-white p-2 sm:pl-6 pl-2 
                transition-transform duration-300 z-40"
            >
                <div className='flex items-center justify-center sm:justify-between'>
                    <div className='hidden font-semibold sm:flex sm:justify-center sm:items-center sm:gap-x-2'>
                        <Logo className='h-7 w-7' />
                        <span>TrackYourTransactions</span>
                    </div>
                    <nav className="flex gap-x-5 sm:gap-x-5 md:gap-x-10">
                        <NavLink 
                            to="/" 
                            className={({ isActive }) =>
                                `flex gap-x-2 items-center sm:rounded-lg sm:py-2 sm:px-4 
                                ${isActive ? "underline underline-offset-5 dark:decoration-dark-purple decoration-[2px] sm:no-underline sm:bg-neutral-200/80 dark:sm:bg-black text-black dark:text-white" : "sm:hover:bg-neutral-200/80 dark:sm:hover:bg-black"}`
                            }
                        >
                            <Home className="w-5 h-5" />
                            <span className="flex-1">Upload</span>
                        </NavLink>

                        <NavLink 
                            to="/dashboard" 
                            className={({ isActive }) =>
                                `flex gap-x-2 items-center sm:rounded-lg sm:py-2 sm:px-4 
                                ${isActive ? "underline underline-offset-5 dark:decoration-dark-purple decoration-[2px] sm:no-underline sm:bg-neutral-200/80 dark:sm:bg-black text-black dark:text-white" : "sm:hover:bg-neutral-200/80 dark:sm:hover:bg-black"}`
                            }
                        >
                            <Dashboard className="w-5 h-5" />
                            <span className="flex-1">Dashboard</span>
                        </NavLink>

                        <NavLink 
                            to="/transactions" 
                            className={({ isActive }) =>
                                `flex gap-x-2 items-center sm:rounded-lg sm:py-2 sm:px-4 
                                ${isActive ? "underline underline-offset-5 dark:decoration-dark-purple decoration-[2px] sm:no-underline sm:bg-neutral-200/80 dark:sm:bg-black text-black dark:text-white" : "sm:hover:bg-neutral-200/80 dark:sm:hover:bg-black"}`
                            }
                        >
                            <Transactions className="w-5 h-5" />
                            <span className="flex-1">Transactions</span>
                        </NavLink>

                        <div className='flex justify-center items-center align-center content-center'>
                            <div 
                                className='cursor-pointer flex gap-x-2 items-center sm:rounded-lg sm:py-2 sm:px-4 sm:hover:bg-neutral-200/80 dark:sm:hover:bg-black'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen((prev) => !prev);
                                }}
                                ref={profileRef}
                            >
                                <Profile className='w-5 h-5' />
                                Profile
                            </div>
                            {open && (
                                <div ref={menuRef} className='flex flex-col absolute top-11 sm:top-15 right-1 rounded-sm w-60 sm:w-80 h-40 p-4 bg-neutral-100 dark:bg-dark'>
                                    <div className='mb-4'>Hello, {isAuthenticated ? auth0User.name.slice(0, 30) : user.username.slice(0, 30)}</div>
                                    <hr className='text-neutral-500 dark:text-neutral-400'></hr>
                                    <div>
                                        <span
                                            className='my-1 text-neutral-400 hover:text-red-500 text-sm cursor-pointer'
                                            onClick={() => {
                                                setOpenModal(true);
                                                setOpen(false);
                                            }}
                                        >Delete Account</span>
                                    </div>
                                    <hr className='text-neutral-500 dark:text-neutral-400'></hr>
                                    <button
                                        onClick={logout}
                                        className="mt-6 mx-10 bg-dark hover:bg-dark-light h-8 sm:py-0 sm:px-3 rounded cursor-pointer text-white dark:bg-purple dark:hover:bg-dark-purple"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
            {openModal && (
                <div className='flex flex-col justify-between z-999 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  bg-neutral-100 dark:bg-dark w-80 h-40 p-4 rounded-sm border border-neutral-300 dark:border-neutral-700 border-offset-2'>
                    <div>
                        <h2>Confirm account deletion</h2>
                        <h3 className='text-sm text-neutral-400'>Your account and all of its associated data will be deleted.</h3>
                    </div>

                    <div className='flex justify-between'>
                        <button
                            className='px-2 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-darker dark:hover:bg-black cursor-pointer'
                            onClick={() => setOpenModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className='text-red-500 px-2 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-darker dark:hover:bg-black cursor-pointer'
                            onClick={async () => {
                                const token = isAuthenticated ? await getAccessTokenSilently() : '';

                                try {
                                    await api.delete('/delete', {
                                        headers: {
                                            "Authorization": `Bearer: ${token}`
                                        }
                                    });
                                    await db.delete();
                                    localStorage.clear()
                                    logout();
                                } 
                                
                                catch (err) {
                                    console.error(err);
                                    localStorage.clear()
                                    logout();
                                }
                            }}
                        >
                            Confirm
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};


export default Sidebar;
