import * as tf from '@tensorflow/tfjs';
import { pipeline } from '@huggingface/transformers';
import { CATEGORIES, IDX_TO_LABELS, LABELS_TO_IDX } from './constants/constants';
import fs from 'fs';

const BERT_DIM = 384;
const NUM_LABELS = CATEGORIES.length;

function createModel(input=BERT_DIM, num_classes=NUM_LABELS) {
    const model = tf.sequential();

    model.add(tf.layers.dense({ inputShape: [input], units: 256, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: num_classes, activation: 'softmax' }));

    model.compile({
        optimizer: 'adam',
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy']
    });

    return model;
};

async function train(model, transactions, labels, epochs=10) {
    const labels_idx = labels.map(label => LABELS_TO_IDX[label]);
    // Create a feature-extraction pipeline
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // Compute sentence embeddings
    // const sentences = ['This is an example sentence', 'Each sentence is converted'];
    const embeddingsArray = await extractor(transactions, { pooling: 'mean', normalize: true });
    // Convert flat array to tensor
    const embeddings = tf.tensor2d(embeddingsArray.ort_tensor.cpuData, embeddingsArray.ort_tensor.dims, tf.float32);

    await model.fit(embeddings, tf.tensor1d(labels_idx, 'float32'), { epochs });

    return model;
};

async function predict(model, transactions) {
    // Create a feature-extraction pipeline
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // Compute sentence embeddings
    const embeddingsArray = await extractor(transactions, { pooling: 'mean', normalize: true });
    // Convert flat array to tensor
    const embeddings = tf.tensor2d(embeddingsArray.ort_tensor.cpuData, embeddingsArray.ort_tensor.dims, tf.float32);
    const predictions = await model.predict(embeddings);
    return predictions;
};

// export { createModel, train, predict };

async function test() {
    const trainJSON = JSON.parse(fs.readFileSync('../data/train.json', 'utf-8'));
    const testJSON = JSON.parse(fs.readFileSync('../data/test.json', 'utf-8'));
    // console.log(Object.values(trainJSON['Memo']))

    let trainStart = new Date();
    const model = await train(createModel(), Object.values(trainJSON['Memo']), Object.values(trainJSON['Category']));
    const trainDif =new Date() - trainStart;
    const predStart = new Date();
    const predictions = await predict(model, Object.values(testJSON['Memo']));
    const predDif = new Date() - predStart
    const classIndices = predictions.argMax(-1);  // pick highest-probability index per row
    const indicesArray = await classIndices.array(); // convert to plain JS array

    const predcitedLabels = indicesArray.map(idx => IDX_TO_LABELS[idx]);
    console.log(predcitedLabels);
    console.log(`${trainDif/1000} seconds taken to train on ${Object.values(trainJSON['Memo']).length} rows `);
    console.log(`${predDif/1000} seconds taken to perform inference on ${Object.values(testJSON['Memo']).length} rows `);
};

export { createModel, train, predict };