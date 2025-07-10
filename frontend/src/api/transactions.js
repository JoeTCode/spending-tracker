import axios from 'axios';

async function getTransactions(token, rangeType, selectedMonth=null) {
    const res = await axios.get(`http://localhost:5000/api/transactions/get?rangeType=${rangeType}&selectedMonth=${selectedMonth}`, {
        headers: {
            "authorization": `Bearer ${token}`
        }
    });

    return res.data; 
};

async function uploadTransactions(token, data) {
    await axios.post(
        'http://localhost:5000/api/transactions/upload', 
        { data },
        {
            headers: {
                "authorization": `Bearer ${token}`
            }
        }
    );
};

async function updateTransactions(token, data) {
    await axios.put(
        'http://localhost:5000/api/transactions/update', 
        { data },
        {
            headers: {
                "authorization": `Bearer ${token}`
            }
        }
    );
};

async function deleteTransaction(token, data) {
    await axios.delete(
        'http://localhost:5000/api/transactions/delete', 
        {
            headers: {
                "authorization": `Bearer ${token}`
            },
            data: data
        }
    );
};

export { getTransactions, uploadTransactions, updateTransactions, deleteTransaction }
