import React, { useState, useEffect } from 'react';
import Plus from '../../assets/icons/plus.svg?react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MONTHS } from '../../utils/constants/constants.js';
import Tick from '../../assets/icons/tick-svgrepo-com.svg?react';
import { db, getPayments, updatePayment, deletePayment } from '../../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import MarkAsRead from "../../assets/icons/approved-check-mark-svgrepo-com.svg?react";
import Trash from "../../assets/icons/trash-svgrepo-com.svg?react";

const options = ["Weekly", "Bi-Weekly", "Monthly", "Bi-Monthly",  "Quarterly", "Yearly"];

const CustomCalendar = ({ selectedDate, value, onClick, ref }) => {
    if (!selectedDate) {
        return;
    }
    const dateObj = new Date(selectedDate);
    const date = dateObj.getDate();
    const month = MONTHS[dateObj.getMonth()];

    return (
        <button onClick={onClick} ref={ref} className='cursor-pointer flex flex-col w-full'>         
            <span className='text-gray-400'> {month.substring(0, 3)} </span>
            <span className='text-2xl font-bold'> {date} </span>
        </button>
    );
};

const AddPaymentButton = ({ setShowForm }) => {
    return (
        <div
            className="
                mt-2 py-1 w-full 
                bg-[#1f1d22] rounded-lg 
                text-white flex justify-center 
                cursor-pointer 
                transition-all duration-200 ease-in-out 
                hover:bg-[#2a272e] hover:scale-105 hover:shadow-lg
            "
            onClick={() => {
                setShowForm(true);
            }}
            >
            <Plus className="w-10 h-10 text-gray-200" />
        </div>
    );
};

const PaymentRow = ({ paymentData, handleDeletePayment, onUpdate }) => {
    const [ localPaymentData, setlocalPaymentData ] = useState({
        _id: paymentData._id,
        title: paymentData.title,
        date: paymentData.last_reminder,
        amount: paymentData.amount,
        interval: paymentData.interval
    });

    return (
        <div className='bg-[#1a1818] w-[450px] sm:w-[500px] rounded-lg h-32 p-1' onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-1 items-center justify-between">
                <div className='flex flex-1 w-full'>
                    
                    {/* Date section */}
                    <div className='grid grid-cols-1 w-30 mr-5'>
                        {/* Date picker */}
                        <DatePicker 
                            selected={localPaymentData.date}
                            onChange={(date) => {
                                setlocalPaymentData((prev) => ({ ...prev, date: date }));
                                onUpdate(localPaymentData._id, { last_reminder: date });
                            }}
                            customInput={<CustomCalendar selectedDate={localPaymentData.date}/>}
                        />

                        {/* Interval selector */}
                        <select
                            value={localPaymentData.interval}
                            className="w-20 ml-2 py-2 px-1 cursor-pointer rounded-lg bg-[#1a1818] text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            onChange={(e) => {
                                setlocalPaymentData(prev => ({ ...prev, interval: e.target.value }));
                                onUpdate(localPaymentData._id, { interval: e.target.value });
                            }}
                        >
                            {options.map((opt, idx) => (
                                <option key={idx} value={opt} className='text-sm'>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                            
                    {/* Description */}
                    <div className='flex items-center w-full ml-8'>
                        <input
                            type="text"
                            name="title"
                            value={localPaymentData.title}
                            onChange={(e) => { 
                                setlocalPaymentData(prev => ({ ...prev, title: e.target.value }));
                                onUpdate(localPaymentData._id, { title: e.target.value });
                            }}
                            placeholder="Title"
                            className="w-30 sm:w-40 rounded p-1 text-lg font-semibold"
                        />
                        <input
                            type="number"
                            name="amount"
                            value={localPaymentData.amount}
                            onChange={(e) => {
                                setlocalPaymentData(prev => ({ ...prev, amount: e.target.value }));
                                onUpdate(localPaymentData._id, { amount: e.target.value });
                            }}
                            placeholder="11.99"
                            className="w-20 sm:w-24 rounded font-bold text-2xl p-1"
                        />
                    </div>
                </div>
                <div>
                    <Trash 
                        className="
                            h-30 w-10 bg-[#141212] text-white rounded-lg font-bold cursor-pointer p-2
                            hover:bg-black hover:scale-110 hover:shadow-lg transition-transform duration-200"
                        onClick={async () => {
                            handleDeletePayment(localPaymentData);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

const PaymentsList = ({ setShowAllPayments }) => {
    const [ allPayments, setAllPayments ] = useState([]);
    const handleUpdatePaymentLocal = (id, updatedFields) => {
        setAllPayments(prev =>
            prev.map(p => (p._id === id ? { ...p, ...updatedFields } : p))
        );
    };

    useEffect(() => {
        const payments = async () => {
            const allPayments = await getPayments('a');
            setAllPayments(allPayments);
        };

        payments();
    }, []);

    const saveAllPayments = async () => {
        for (const p of allPayments) {
            await updatePayment(p);
        };
    };

    const handleDeletePayment = async (payment) => {
        await deletePayment(payment);
        setAllPayments(prev => prev.filter(p => p  ._id !== payment._id));
    };

    return (
        <div onClick={async () => {
            await saveAllPayments();
            setShowAllPayments(false);
        }}>
            <div className='fixed inset-0 backdrop-blur-md z-998'></div>
            <div className="fixed inset-0 grid place-items-center z-999">
                <div className='h-64 overflow-y-auto'>
                    {allPayments.length === 0 ? (
                        <div>
                            No payments found
                        </div>) : (
                            <div className='bg-[#1a1818] rounded-lg p-2 text-center'>
                                <p>All payments</p>
                                {allPayments.map(payment => {
                                    return (
                                        <PaymentRow 
                                            key={payment._id}
                                            paymentData={payment}
                                            handleDeletePayment={handleDeletePayment}
                                            onUpdate={handleUpdatePaymentLocal}
                                        />
                                    );
                                })}
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

const CreatePayment = ({ setShowForm }) => {
    const [ newPayment, setNewPayment ] = useState({
        title: "",
        date: new Date(),
        amount: 0,
        interval: "Monthly"
    });

    const savePayment = async () => {
        setShowForm(false);
        const dbObj = { 
            _id: uuidv4(),
            last_reminder: new Date(newPayment.date ?? selectedDate), 
            title: newPayment.title, 
            amount: parseFloat(newPayment.amount), 
            interval: newPayment.interval || selected
        };
        await db.recurringPayments.add(dbObj);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-999">
             <div className='bg-[#1a1818] w-[450px] sm:w-[500px] rounded-lg p-1' onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-1 items-center justify-between">
                    <div className='flex flex-1 w-full'>
                        <div className='grid grid-cols-1 w-30 mr-5'>
                            <DatePicker 
                                selected={newPayment.date}
                                onChange={(date) => {
                                    setNewPayment(prev => ({ ...prev, date: date }));
                                }}
                                customInput={<CustomCalendar selectedDate={newPayment.date}/>}
                            />
                            <select
                                value={newPayment.interval}
                                onChange={(e) => {
                                    setNewPayment(prev => ({ ...prev, interval: e.target.value}))
                                }}
                                className="w-20 ml-2 py-2 px-1 cursor-pointer rounded-lg bg-[#1a1818] text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                {options.map((opt, idx) => (
                                    <option key={idx} value={opt} className='text-sm'>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className='flex items-center w-full ml-8'>
                            <input
                                type="text"
                                name="title"
                                defaultValue={newPayment.title}
                                onChange={(e) => setNewPayment(prev => ({ ...prev, title: e.target.value}))}
                                placeholder="Title"
                                className="w-30 sm:w-40 rounded p-1 text-lg font-semibold"
                            />
                            <input
                                type="number"
                                name="amount"
                                defaultValue={newPayment.amount}
                                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value}))}
                                placeholder="11.99"
                                className="w-20 sm:w-24 rounded font-bold text-2xl p-1"
                            />
                        </div>
                    </div>
            
                    <Tick
                        onClick={savePayment}
                        className="h-30 w-10 bg-green-600 text-white rounded-lg font-bold cursor-pointer p-2
                                    hover:bg-green-700 hover:scale-110 hover:shadow-lg transition-transform duration-200"
                    />
                </div>
            </div>
        </div>
       
    );
};

const UpcomingPayments = ({ setPaymentCount, showAllPayments, setShowAllPayments }) => {
    const [ upcomingPayments, setUpcomingPayments ] = useState([]);
    const [ showForm, setShowForm ] = useState(false);
    // const [ allPayments, setAllPayments ] = useState([]);

    useEffect(() => {
        const getUpcomingPayments = async () => {
            const payments = await getPayments('d');
            setUpcomingPayments(payments);
        };

        getUpcomingPayments();
    }, [showForm]);

    useEffect(() => {
        setPaymentCount(upcomingPayments.length);
    }, [upcomingPayments]);

    useEffect(() => {
        const retrievePayments = async () => {
            const payments = await getPayments('d');
            setUpcomingPayments(payments);
        };
        
        retrievePayments();
    }, [showAllPayments]);

    return (
        // <div className='rounded-lg bg-[#1a1818] shadow-lg m-15 p-5  max-w-100'>
        <div className='rounded-lg bg-[#1a1818] shadow-lg p-5 h-full sm:h-[200px]'>
            {showForm && (
                <div className='' onClick={() => setShowForm(false)}>
                    <div className='fixed inset-0 backdrop-blur-md z-998'></div>
                    <CreatePayment setShowForm={setShowForm}/>
                </div>
            )}

            {upcomingPayments.length === 0 && (
                <div className='flex flex-col text-center justify-between h-full'>
                    <div>No upcoming payments</div>
                    <AddPaymentButton setShowForm={setShowForm}/>
                </div>
            )}

            {upcomingPayments.length > 0 && (
                <div className='flex flex-col text-center justify-between h-full'>
                    <div className="h-64 overflow-y-auto">
                        {upcomingPayments.map((payment, i) => {
                            return (
                                <div key={i} className='relative group'>
                                    <div className="
                                        flex flex-1 gap-x-10 lg:gap-x-5 xl:gap-x-10 items-center mx-1 p-1
                                        cursor-pointer hover:bg-[#2a2730] hover:rounded-lg hover:select-none transition-colors duration-200"
                                        onClick={async () => { 
                                            payment.last_reminder = new Date();
                                            await updatePayment(payment);
                                            setUpcomingPayments((prev) => {
                                                return prev.filter(val => val._id !== payment._id);
                                            });
                                        }}
                                    >
                                        <div className='text-center group-hover:blur-xs'> 
                                            <div> {MONTHS[payment.last_reminder.getMonth()].substring(0, 3)} </div>
                                            <div className='text-2xl font-bold'> {payment.last_reminder.getDate()} </div>
                                        </div>
                                        <div className='flex justify-between items-center w-full group-hover:blur-xs'>
                                            <div className=''> {payment.title} </div>
                                            <div className='text-xl font-bold'> {payment.amount.toFixed(2)} </div>
                                        </div>

                                        <div className="hidden group-hover:flex absolute inset-0 items-center justify-center pointer-events-none">
                                            <MarkAsRead className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                </div>
                                
                            );
                        })}
                    </div>
                    <AddPaymentButton setShowForm={setShowForm}/>
                </div>
            )}

            {showAllPayments && (
                <>
                    <PaymentsList setShowAllPayments={setShowAllPayments}/>
                </>
            )}

        </div>
       
    );
};

export default UpcomingPayments;