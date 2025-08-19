import axios from 'axios';

export async function getModel(token) {
    const weights = await axios.get('http://localhost:5000/global-model/get-weights', {
        headers: {
            "authorization": `Bearer ${token}`
        }
    });

    return weights;
};

export async function weightAverage(token, clientModelWeights) {
    await axios.post(
        'http://localhost:5000/global-model/weight-average', 
        { clientModelWeights },
        {
            headers: {
                "authorization": `Bearer ${token}`
            }
        }
    );
};