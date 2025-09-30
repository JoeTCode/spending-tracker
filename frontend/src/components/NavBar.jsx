import React, { useState } from 'react';
import { NavLink, useNavigate } from "react-router-dom";
// import { Menu, X } from 'lucide-react'; // icons
import Dashboard from '../assets/icons/dashboard-svgrepo-com.svg?react';
import Home from '../assets/icons/home-03-svgrepo-com.svg?react';
import Transactions from '../assets/icons/transaction-svgrepo-com.svg?react';
import { useInternalAuth } from './useInternalAuth';

const Sidebar = () => {
    const [ open, setOpen ] = useState(true);
    const navigate = useNavigate();
    const { logout } = useInternalAuth();

    // const handleLogout = async () => {
    //     try {
    //         await logout();
    //     } catch (err) {
    //         console.error("An error occurred on logout");
    //     } finally {
    //         navigate("/login");
    //     };
    // };

    return (
        <div>  
            <div
                className={`fixed top-0 w-full bg-[#1a1818] text-white p-2 sm:px-6 sm:py-2 
                transition-transform duration-300 z-40
                ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className='flex items-center justify-center sm:justify-between'>
                    <div className='hidden font-semibold sm:block'>Track your transactions</div>
                    <nav className="flex gap-x-5 sm:gap-x-5 md:gap-x-10">
                        <NavLink 
                            to="/" 
                            className={({ isActive }) =>
                                `flex gap-x-2 items-center sm:rounded-lg sm:py-2 sm:px-4 
                                ${isActive ? "underline underline-offset-5 decoration-[#5055a7] decoration-[2px] sm:no-underline sm:bg-black text-white" : "sm:hover:bg-black"}`
                            }
                        >
                            <Home className="w-5 h-5" />
                            <span className="flex-1">Upload</span>
                        </NavLink>

                        <NavLink 
                            to="/dashboard" 
                            className={({ isActive }) =>
                                `flex gap-x-2 items-center sm:rounded-lg sm:py-2 sm:px-4 
                                ${isActive ? "underline underline-offset-5 decoration-[#5055a7] decoration-[2px] sm:no-underline sm:bg-black text-white" : "sm:hover:bg-black"}`
                            }
                        >
                            <Dashboard className="w-5 h-5" />
                            <span className="flex-1">Dashboard</span>
                        </NavLink>

                        <NavLink 
                            to="/transactions" 
                            className={({ isActive }) =>
                                `flex gap-x-2 items-center sm:rounded-lg sm:py-2 sm:px-4 
                                ${isActive ? "underline underline-offset-5 decoration-[#5055a7] decoration-[2px] sm:no-underline sm:bg-black text-white" : "sm:hover:bg-black"}`
                            }
                        >
                            <Transactions className="w-5 h-5" />
                            <span className="flex-1">Transactions</span>
                        </NavLink>
                        
                        <button
                            // onClick={() =>
                            //     logout({
                            //         logoutParams: { returnTo: "http://localhost:5173/login" },
                            //     })
                            // }
                            onClick={logout}
                            className="bg-[#747bff] px-1 sm:px-3 py-1 rounded cursor-pointer hover:bg-[#5055a7]"
                        >
                            Log Out
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};


export default Sidebar;
