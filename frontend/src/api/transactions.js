import axios from 'axios';

// async function getTransactions(token) {
//     const res = await axios.get('http://localhost:5000/api/transactions/get', {
//         headers: {
//             "authorization": `Bearer ${token}`
//         }
//     });

//     return res.data; 
// };

async function uploadTransactions(data, token) {
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

export default uploadTransactions;
