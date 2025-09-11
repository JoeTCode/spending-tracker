import { useEffect, useState } from 'react';
import { getPayments } from '../db/db';
import { MONTHS } from '../utils/constants/constants';
import { NavBar } from '../components';

const Payments = () => {
    const [ payments, setPayments ] = useState([]);

    useEffect(() => {
        const retrievePayments = async () => {
            const payments = await getPayments('a');
            console.log(payments);
            setPayments(payments);
        };
        
        retrievePayments();
    }, []);
    
    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Header */}
            <h1 className="text-xl font-bold mb-6">Upcoming Payments</h1>
            <NavBar />
            {/* Table-like list */}
            <div className="space-y-3">
                {payments.map((payment, i) => {
                    return (
                        <div key={i} className='relative group'>
                            <div className="
                                flex flex-1 gap-x-10 lg:gap-x-5 xl:gap-x-10 items-center mx-1 p-1
                                cursor-pointer hover:bg-[#2a2730] hover:rounded-lg transition-colors duration-200"
                                onClick={async () => { 
                                    payment.last_reminder = new Date();
                                    await updatePayment(payment);
                                    setUpcomingPayments((prev) => {
                                        return prev.filter(val => val._id !== payment._id);
                                    });
                                }}
                            >
                                {/* date section */}
                                <div className='text-center group-hover:blur-xs'> 
                                    <div> {MONTHS[payment.last_reminder.getMonth()].substring(0, 3)} </div>
                                    <div className='text-2xl font-bold'> {payment.last_reminder.getDate()} </div>
                                </div>
                                {/* desc section */}
                                <div className='flex justify-between items-center w-full group-hover:blur-xs'>
                                    <div className=''> {payment.title} </div>
                                    <div className='text-xl font-bold'> {payment.amount.toFixed(2)} </div>
                                </div>
                            </div>
                        </div>
                        
                    );
                })}
            </div>
        </div>
  );
};

export default Payments;