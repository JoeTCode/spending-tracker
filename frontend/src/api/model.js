import axios from 'axios';
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

const createEmbeddingsArray = (embeddings) => {
    // Convert flat Float32Array into nested JS array
    const embeddingsArray = [];
    for (let i = 0; i < embeddings.ort_tensor.dims[0]; i++) {
        const start = i * embeddings.ort_tensor.dims[1];
        const end = start + embeddings.ort_tensor.dims[1];
        embeddingsArray.push(Array.from(embeddings.ort_tensor.cpuData.slice(start, end)));
    };

    return embeddingsArray;
};

export const getPredictions = async (descriptions, accessToken) => {
    // const embeddings = await extractor(descriptions, { pooling: 'mean', normalize: true });
    // const embeddingsArray = createEmbeddingsArray(embeddings);

    try {
        const res = await axios.post("http://127.0.0.1:8000/predict", 
            { predict_data: {
                    // embeddings: embeddingsArray,
                    descriptions: descriptions
            }},
            { headers: {
                    "authorization": `Bearer ${accessToken}`
            }}
        );

        return res;
    } 

    catch (err) {
        console.error(err);
    };
};

export const trainModel = async (descriptions, categories, accessToken) => {
    const embeddings = await extractor(descriptions, { pooling: 'mean', normalize: true });
    const embeddingsArray = createEmbeddingsArray(embeddings);

    const arr = [];
    for (let i = 0; i < embeddingsArray.length; i++) {
        arr.push({ embedding: embeddingsArray[i], category: categories[i] });
    };

    try {
        const tempRoute = "http://localhost:8000/train";
        const route = "http://127.0.0.1:8000/train";
        console.log('TEMP ROUTE', tempRoute);
        
        const res = await axios.post(tempRoute, 
            {train_data: {
                embeddings: embeddingsArray,
                categories: categories
            }},
            { headers: {
                    "authorization": `Bearer ${accessToken}`
            }}
        );

        return res;
    } 

    catch (err) {
        console.error(err);
    };
};