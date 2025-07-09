import axios from 'axios';

async function getTransactions(token, rangeType) {
    const res = await axios.get(`http://localhost:5000/api/transactions/get?rangeType=${rangeType}`, {
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
            },
            timeout: 2000
        }
    );
};

export { getTransactions, uploadTransactions, updateTransactions }
