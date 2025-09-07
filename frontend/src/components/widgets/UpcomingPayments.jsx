import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../db/db.js';
import Plus from '../../assets/icons/plus.svg?react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MONTHS } from '../../utils/constants/constants.js';
import Tick from '../../assets/icons/tick-svgrepo-com.svg?react';
import { db, getPayments } from '../../db/db.js';
import { v4 as uuidv4 } from 'uuid';

const CustomCalendar = ({ setNewPayment, value, onClick, ref }) => {
    if (!value) {
        const today = new Date();
        const month = MONTHS[today.getMonth()];
        return (
            <button onClick={onClick} ref={ref} className='cursor-pointer flex flex-col w-full'>
                <span className='text-gray-400'> {month.substring(0, 3)} </span>
                <span className='text-2xl font-bold'> {today.getDate()} </span>
            </button>
        );
    };

    const dateObj = new Date(value);
    console.log(dateObj);
    
    setNewPayment(prev => {
        prev.date = dateObj;
        return prev;
    });
    
    const date = dateObj.getDate();
    const month = MONTHS[dateObj.getMonth()];
    return (
        <button onClick={onClick} ref={ref} className='cursor-pointer flex flex-col w-full'>         
            <span className='text-gray-400'> {month.substring(0, 3)} </span>
            <span className='text-2xl font-bold'> {date} </span>
        </button>
    );
};

const UpcomingPayments = () => {
    const [ recurringPayments, setRecurringPayments ] = useState([]);
    const [ upcomingPayments, setUpcomingPayments ] = useState([]);
    const [ showForm, setShowForm ] = useState(false);
    const [newPayment, setNewPayment] = useState({
        title: "",
        date: new Date(),
        amount: 0,
        interval: "Monthly"
    });

    const [ selectedDate, setSelectedDate ] = useState(null);

    const handleChange = (e) => {
        setSelected(e.target.value)
        setNewPayment(prev => {
            prev.interval = e.target.value;
            return prev;
        });
    };

    const options = ["Weekly", "Bi-Weekly", "Monthly", "Bi-Monthly",  "Quarterly", "Yearly"];
    const [selected, setSelected] = useState("Monthly");

    const handleInputChange = (e) => {
        setNewPayment(prev => {
            prev[e.target.name] = e.target.value;
            return prev;
        });
    };

    const savePayment = async () => {
        console.log(newPayment);
        setShowForm(false);
        console.log('newPayment.date)', newPayment.date);
        const dbObj = { 
            _id: uuidv4(),
            last_reminder: new Date(newPayment.date ?? Date.now()), 
            title: newPayment.title, 
            amount: parseFloat(newPayment.amount), 
            interval: newPayment.interval || selected
        };
        console.log('Object to save: ', dbObj)
        await db.recurringPayments.add(dbObj);

        setNewPayment({
            title: "",
            date: new Date(),
            amount: 0,
            interval: "Monthly"
        });
    };

    useEffect(() => {
        const getUpcomingPayments = async () => {
            const payments = await getPayments('d');
            console.log('payments', payments);
            setUpcomingPayments(payments);
        };

        getUpcomingPayments();
    }, [showForm]);

    return (
        // <div className='rounded-lg bg-[#1a1818] shadow-lg m-15 p-5  max-w-100'>
        <div className='rounded-lg bg-[#1a1818] shadow-lg p-5 h-full sm:h-[200px]'>
            {showForm && (
                <div className='' onClick={() => setShowForm(false)}>
                    <div className='fixed inset-0 backdrop-blur-md z-998'></div>
                    <div>
                        <div className='bg-[#1a1818] absolute w-[450px] sm:w-[500px] rounded-lg h-32 right-0 top-0 m-auto bottom-0 left-0 z-999 p-1' onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-1 items-center justify-between">
                                <div className='flex flex-1 w-full'>
                                    <div className='grid grid-cols-1 w-30 mr-5'>
                                        <DatePicker 
                                            selected={selectedDate}
                                            onChange={(date) => setSelectedDate(date)}
                                            customInput={<CustomCalendar setNewPayment={setNewPayment}/>}
                                        />
                                        <select
                                            value={selected}
                                            onChange={handleChange}
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
                                            onChange={handleInputChange}
                                            placeholder="Title"
                                            className="w-30 sm:w-40 rounded p-1 text-lg font-semibold"
                                        />
                                        <input
                                            type="number"
                                            name="amount"
                                            defaultValue={newPayment.amount}
                                            onChange={handleInputChange}
                                            placeholder="11.99"
                                            className="w-20 sm:w-24 rounded font-bold text-2xl p-1"
                                        />
                                    </div>
                                </div>
                        
                                {/* <Tick className="w-8 h-8 sm:w-10 sm:h-8 p-1 bg-green-600 text-white rounded-full font-bold cursor-pointer" onClick={savePayment} /> */}
                                <Tick
                                    onClick={savePayment}
                                    className="h-30 w-10 bg-green-600 text-white rounded-lg font-bold cursor-pointer p-2
                                                hover:bg-green-700 hover:scale-110 hover:shadow-lg transition-transform duration-200"
                                />
                            </div>
                            {/* <div>Monthly</div> */}
                        </div>
                    </div>
                </div>
                
            )}
            {upcomingPayments.length === 0 && (
                <div className='flex flex-col text-center justify-between h-full'>
                    <div>No upcoming payments</div>
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
                            setNewPayment({
                                title: "",
                                date: new Date(),
                                amount: 0,
                                interval: "Monthly"
                            });
                        }}
                        >
                        <Plus className="w-10 h-10 text-gray-200" />
                    </div>
                </div>
            )}
            {upcomingPayments.length > 0 && (
                <div className='flex flex-col text-center justify-between h-full'>
                    <div className="h-64 overflow-y-auto">
                        {upcomingPayments.map((payment, i) => {
                            return (
                                <div className='flex flex-1 gap-x-10 items-center mx-5'>
                                    <div className='text-center'> 
                                        <div> {MONTHS[payment.last_reminder.getMonth()].substring(0, 3)} </div>
                                        <div className='text-2xl font-bold'> {payment.last_reminder.getDate()} </div>
                                    </div>
                                    <div className='flex justify-between items-center w-full'>
                                        <div className=''> {payment.title} </div>
                                        <div className='text-xl font-bold'> {payment.amount.toFixed(2)} </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
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
                            setNewPayment({
                                title: "",
                                date: new Date(),
                                amount: 0,
                                interval: "Monthly"
                            });
                        }}
                        >
                        <Plus className="w-10 h-10 text-gray-200" />
                    </div>
                </div>
            )}
        </div>
       
    );
};

export default UpcomingPayments;