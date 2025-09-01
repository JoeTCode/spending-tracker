import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../db/db.js';

const UpcomingPayments = () => {
    const [ recurringPayments, setRecurringPayments ] = useState([]);
    const [ upcomingPayments, setUpcomingPayments ] = useState([]);

    useEffect(() => {
        const getRecurringPayments = async () => {
            // const recurringPayments = await getPayments();
            // setRecurringPayments([]);
        };

        getRecurringPayments();
    }, []);

    useEffect(() => {
        const getUpcomingPayments = () => {
            setUpcomingPayments([]);
        };

        getUpcomingPayments();
    }, [recurringPayments]);

    return (
        // <div className='rounded-lg bg-[#1a1818] shadow-lg m-15 p-5  max-w-100'>
        <div className='rounded-lg bg-[#1a1818] shadow-lg p-5 max-w-150'>
            <div className='float-right'>+ Add payment</div>
            {upcomingPayments.length > 0 ? (
                <div>Upcoming Payments:</div>
            ) : (
                <div>
                    <div>Upcoming payments:</div>
                    <div className='mt-5 '>No payments found</div>
                </div>
                
            )}
        </div>
       
    );
};

export default UpcomingPayments;