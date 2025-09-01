import React, { useState, useEffect, useRef } from 'react';
import { getTransactions } from '../../db/db.js';
import EditableGrid from '../EditableGrid.jsx';

const MostRecentTransactions = () => {
    const [ recentTransactions, setRecentTransactions ] = useState([]);
    const [ headers, setHeaders ] = useState([]);
    const gridRef = useRef();

    useEffect(() => {
        const getRecentTransactions = async () => {
            const tx = await getTransactions('latest-n', null, 3);
            setRecentTransactions(tx);
        };

        getRecentTransactions();
    }, []);

    useEffect(() => {

        if (!recentTransactions || recentTransactions.length === 0) return;

        const hdrs = [];
        const keys = Object.keys(recentTransactions[0]);

        for (let hdr of keys) {
            if (hdr === '_id' || hdr === 'type') continue;
            const obj = {};

            if (hdr === 'date') {
                obj['field'] = hdr;
                obj['width'] = 110;
            }
            else if (hdr === 'amount') {
                obj['field'] = hdr;
                obj['width'] = 90;
            }
            else if (hdr === 'category') {
                obj['field'] = hdr;
                obj['width'] = 120;
            }
            else if (hdr === 'description') {
                obj['field'] = hdr;
                obj['width'] = 150;
            }
            else {
                obj['field'] = hdr;
            }
            
            hdrs.push(obj);
        };
        
        setHeaders(hdrs);
        console.log(hdrs);
        console.log(recentTransactions);
    }, [recentTransactions]);

    return (
        <div className='max-h-45 max-w-120'>
            {recentTransactions.length > 0 ? (
                <EditableGrid 
                    gridRef={gridRef} rowData={recentTransactions} colNames={headers} onCellChange={null}
                />
            ) : (
                <div> No transactions found </div>
            )}
            
        </div>
        
    );
};

export default MostRecentTransactions;