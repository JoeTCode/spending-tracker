import * as tf from '@tensorflow/tfjs';
import { pipeline } from '@huggingface/transformers';
import { CATEGORIES, IDX_TO_LABELS, LABELS_TO_IDX } from './constants/constants.js';
import fs from 'fs';
import { devGetModelWeights, devSaveModel } from '../api/globalModel.js';

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

async function train(model, descriptions, labels, epochs=10) {
    const labels_idx = labels.map(label => LABELS_TO_IDX[label]);
    // Create a feature-extraction pipeline
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // Compute sentence embeddings
    // const sentences = ['This is an example sentence', 'Each sentence is converted'];
    const embeddingsArray = await extractor(descriptions, { pooling: 'mean', normalize: true });
    // Convert flat array to tensor
    const embeddings = tf.tensor2d(embeddingsArray.ort_tensor.cpuData, embeddingsArray.ort_tensor.dims, tf.float32);

    // Convert labels to tensor (as int32 for classification)
    const labelTensor = tf.tensor1d(labels_idx, 'float32');

    // Train & capture history
    const history = await model.fit(embeddings, labelTensor, {
        epochs,
        batchSize: 32,
        validationSplit: 0.2,  // optional: 20% for validation
        shuffle: true,
        verbose: 1             // shows progress in console
    });

    console.log("Training history:", history.history);
    labelTensor.dispose();
    embeddings.dispose();
    return model;
};


function formatMemo(memo) {
    let formattedMemo = String(memo).split('\t')[0].trim();
    formattedMemo = formattedMemo.replace(/\s+/g, ' ').trim();
    return formattedMemo;
}

async function predict(model, descriptions, returnConfScores=false) {
    // Create a feature-extraction pipeline
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const formattedDescriptions = descriptions.map(t => formatMemo(t));
    // Compute sentence embeddings
    const embeddingsArray = await extractor(formattedDescriptions, { pooling: 'mean', normalize: true });
    // Convert flat array to tensor
    const embeddings = tf.tensor2d(embeddingsArray.ort_tensor.cpuData, embeddingsArray.ort_tensor.dims, tf.float32);
    const predictions = model.predict(embeddings);
    
    if (returnConfScores === true) {
        const maxProbs = predictions.max(-1)
        const maxProbsArray = await maxProbs.array();

        const classIndices = predictions.argMax(-1);
        const indicesArray = await classIndices.array(); // Convert to plain JS array
        const predictedLabels = indicesArray.map(idx => IDX_TO_LABELS[idx]);
        return [predictedLabels, maxProbsArray];
    };

    const classIndices = predictions.argMax(-1);  // Pick highest-probability index per row
    const indicesArray = await classIndices.array(); // Convert to plain JS array
    const predictedLabels = indicesArray.map(idx => IDX_TO_LABELS[idx]);
    return predictedLabels;
};

const getDeltas = (trainedModelWeights, globalModelWeights) => {
    const deltas = [];
    for (let i = 0; i < trainedModelWeights.length; i ++) {
        const cw = trainedModelWeights[i];
        const gw = globalModelWeights[i];
        const delta = cw.sub(gw);
        deltas.push(delta);
        cw.dispose();
        gw.dispose();
    };

    return deltas;
};

// Convert model weights to a flat array of bytes
async function getBufferFromWeights(weightTensors) {
    const arrays = await Promise.all(weightTensors.map(t => t.data())); // Float32Array
    const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);

    // Combine into single Float32Array
    const combined = new Float32Array(totalLength);
    let offset = 0;
    const shapes = [];

    for (let i = 0; i < arrays.length; i++) {
        combined.set(arrays[i], offset);
        offset += arrays[i].length;
        shapes.push(weightTensors[i].shape); // store original shape
    }

    // Convert to Buffer and return buffer and shapes
    return [combined.buffer, shapes];
};

async function getWeightsFromBuffer(buffer, shapes) {

    let floatArray;

    if (buffer instanceof ArrayBuffer) {
        // Plain ArrayBuffer (from MongoDB): just wrap
        console.log('array buffer')
        floatArray = new Float32Array(buffer);
    } else {
        console.log('non array buffer')
        try {
            const arrayBuffer = buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength
            );
            
            floatArray = new Float32Array(arrayBuffer)
        } catch (err) {
            throw new Error('Invalid buffer type, must be ArrayBuffer');
        };
    };

    // Split back into tensors
    const tensors = [];
    let offset = 0;

    for (const shape of shapes) {
        const size = shape.reduce((a, b) => a * b, 1);
        const slice = floatArray.subarray(offset, offset + size);
        tensors.push(tf.tensor(slice, shape));
        offset += size;
    }

    return tensors;
};

function accuracy(predictions, target) {
    let correct = 0;
    let count = 0;

    for (let i = 0; i < predictions.length; i++) {
        count += 1;
        if (predictions[i] === target[i]) {
            correct += 1;
        }
    }

    return correct/count;
};

async function test0() {
    const trainJSON = JSON.parse(fs.readFileSync('../data/train.json', 'utf-8'));
    const testJSON = JSON.parse(fs.readFileSync('../data/test.json', 'utf-8'));
    // console.log(Object.values(trainJSON['Memo']))

    let trainStart = new Date();
    // const model = await train(createModel(), Object.values(trainJSON['Memo']), Object.values(trainJSON['Category']));

    const weights = await devGetModelWeights();
    const model = createModel();
    model.summary();
    model.setWeights(weights);
    const trainedModel = await train(model, Object.values(trainJSON['Memo']), Object.values(trainJSON['Category']));
    // const modelWeights = model.getWeights();
    // const [ buffer, shapes ] = await getBufferFromWeights(modelWeights);
    // if (!buffer || !shapes) {
    //     throw new Error("Invalid value for Buffer or Shapes");
    // }
    // await devSaveModel(buffer, shapes);

    const trainDif = new Date() - trainStart;
    const predStart = new Date();
    const predictions = await predict(trainedModel, Object.values(testJSON['Memo']));
    const predDif = new Date() - predStart
    
    console.log(predictions);
    console.log(`${trainDif/1000} seconds taken to train on ${Object.values(trainJSON['Memo']).length} rows `);
    console.log(`${predDif/1000} seconds taken to perform inference on ${Object.values(testJSON['Memo']).length} rows `);
};

async function test1() {
    const trainJSON = JSON.parse(fs.readFileSync('../data/train.json', 'utf-8'));
    const testJSON = JSON.parse(fs.readFileSync('../data/test.json', 'utf-8'));
    // const weights = await devGetModelWeights();
    const model = createModel();
    const trainedModel = await train(model, Object.values(trainJSON['Memo']), Object.values(trainJSON['Category']));
    const predictions = await predict(trainedModel, Object.values(testJSON['Memo']));
    console.log(`Default MLP score: ${accuracy(predictions, testJSON['Category']) * 100}%`);

    const trainedWeights = trainedModel.getWeights();
    const [ buffer, shapes ] = await getBufferFromWeights(trainedWeights);
    console.log(buffer);
    const convertedWeights = await getWeightsFromBuffer(buffer, shapes);
    model.setWeights(convertedWeights);
    
    const new_predictions = await predict(model, Object.values(testJSON['Memo']));
    console.log(`Weights converted from buffer MLP score: ${accuracy(new_predictions, testJSON['Category']) * 100}%`);
};

async function saveModelDev() {
    const trainJSON = JSON.parse(fs.readFileSync('../data/train.json', 'utf-8'));
    const testJSON = JSON.parse(fs.readFileSync('../data/test.json', 'utf-8'));
    // const weights = await devGetModelWeights();
    const model = createModel();
    const trainedModel = await train(model, Object.values(trainJSON['Memo']), Object.values(trainJSON['Category']));
    const predictions = await predict(trainedModel, Object.values(testJSON['Memo']));
    console.log(`Default MLP score: ${accuracy(predictions, testJSON['Category']) * 100}%`);
    const trainedWeights = trainedModel.getWeights();
    const [ buffer, shapes ] = await getBufferFromWeights(trainedWeights);
    // await devSaveModel(buffer, shapes);
    // console.log('Send save request!');
};

async function testModelAvg() {
    const trainJSON = JSON.parse(fs.readFileSync('../data/train.json', 'utf-8'));
    const testJSON = JSON.parse(fs.readFileSync('../data/test.json', 'utf-8'));

    const globalModelWeights = await devGetModelWeights();
    const globalModel = createModel();
    globalModel.setWeights(globalModelWeights);

    const model = createModel();
    model.setWeights(globalModelWeights);
    // train on unseen test data
    const trainedModel = await train(model, Object.values(testJSON['Memo']), Object.values(testJSON['Category']));
    const trainedModelWeights = trainedModel.getWeights();

    function getDeltas(trainedModelWeights, globalModelWeights) {
        const trainedDeltas = [];

        for (let i = 0; i < globalModelWeights.length; i ++ ) {
            const gw = globalModelWeights[i];
            const cw = trainedModelWeights[i];
            const delta = cw.sub(gw);
            trainedDeltas.push(delta);
        };

        return trainedDeltas;
    };

    function fedAvg(globalModelWeights, deltas, eta=1) {
        const newGlobalWeights = [];

        for (let i = 0; i < globalModelWeights.length; i++) {
            const gw = globalModelWeights[i];
            const d = deltas[i];
            const updated = gw.add(d.mul(eta));
            newGlobalWeights.push(updated);
        };

        return newGlobalWeights;
    };

    const deltas = getDeltas(trainedModelWeights, globalModelWeights);
    const newGlobalModelWeights = fedAvg(globalModelWeights, deltas);
    const newGlobalModel = createModel();
    newGlobalModel.setWeights(newGlobalModelWeights);

    const predictions = await predict(newGlobalModel, Object.values(testJSON['Memo']));
    console.log(`newGlobalModel MLP score: ${accuracy(predictions, testJSON['Category']) * 100}%`);
};

async function test2() {
    const MINIMUM_CONF_SCORE = 0.7;

    const trainJSON = JSON.parse(fs.readFileSync('../data/train.json', 'utf-8'));
    const testJSON = JSON.parse(fs.readFileSync('../data/test.json', 'utf-8'));

    const globalModelWeights = await devGetModelWeights();
    const globalModel = createModel();
    globalModel.setWeights(globalModelWeights);
    const [predictions, scores] = await predict(globalModel, Object.values(testJSON['Memo']), true);

    // let count = 0;
    // for (let i = 0; i < predictions.length; i ++) {
    //     if (scores[i] < 0.7) {
    //         console.log(`${predictions[i]} - Conf: ${scores[i]}`)
    //         count += 1;
    //     }
    // }

    // console.log(`${count}/${Object.values(testJSON['Memo']).length} predictions with score less than ${MINIMUM_CONF_SCORE}:`);
};


export { createModel, train, predict, accuracy, getDeltas, getWeightsFromBuffer, getBufferFromWeights };