import axios from 'axios';

export const getPredictions = async (descriptions) => {
    try {
        const res = await axios.post("http://127.0.0.1:8000/predict", {
            transactions: descriptions
        });

        return res;
    } 

    catch (err) {
        console.error(err);
    };
};

export const trainModel = async (descriptions, categories) => {
    const arr = [];
    for (let i = 0; i < descriptions.length; i++) {
        arr.push({ description: descriptions[i], category: categories[i] });
    };

    try {
        const res = await axios.post("http://127.0.0.1:8000/train", {
            train_transactions: arr
        });

        return res;
    } 

    catch (err) {
        console.error(err);
    };
};