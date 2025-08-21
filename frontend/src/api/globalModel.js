import axios from 'axios';
import { getWeightsFromBuffer } from '../utils/model.js';
import { createModel } from '../utils/model.js';

export async function getModelWeights(token) {
    const res1 = await axios.get('http://localhost:5000/global-model/get-shapes', {
        headers: {
            "authorization": `Bearer ${token}`
        }
    });
    const { shapes, id } = res1.data;

    const res2 = await axios.get('http://localhost:5000/global-model/get-weights', {
        headers: {
            "authorization": `Bearer ${token}`
        },
        params: { id },
        responseType: 'arraybuffer'
    });

    const buffer = res2.data;
    const weights = await getWeightsFromBuffer(buffer, shapes);
    return weights;
};

export async function weightAverage(token, clientModelDeltas) {
    await axios.post(
        'http://localhost:5000/global-model/weight-average', 
        { clientModelDeltas },
        {
            headers: {
                "authorization": `Bearer ${token}`
            }
        }
    );
};

export async function devSaveModel(buffer, shapes) {
    const formData = new FormData();
    formData.append("weights", new Blob([buffer], { type: "application/octet-stream" }));
    formData.append("shapes", JSON.stringify(shapes));
    try {
        await axios.post(
            'http://localhost:5000/global-model/dev/save-model',
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );
    } catch (err) {
        console.error(err);
    };
};

export async function devGetModelWeights() {
    const res1 = await axios.get('http://localhost:5000/global-model/dev/get-shapes');
    const { shapes, id } = res1.data;

    const res2 = await axios.get('http://localhost:5000/global-model/dev/get-weights', {
        params: { id },
        responseType: 'arraybuffer'
    });

    const buffer = res2.data;
    const weights = await getWeightsFromBuffer(buffer, shapes);

    return weights;
};