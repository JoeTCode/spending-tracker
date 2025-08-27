import * as tf from '@tensorflow/tfjs';
import { getModelWeights } from '../api/globalModel';
import { createModel } from './model';

export async function getClientModel(token) {
    const models = await tf.io.listModels();
    let model;

    if (Object.keys(models).length === 0) {
        const weights = await getModelWeights(token);
        model = await saveClientModel(weights);
    } else {
        model = await tf.loadLayersModel('indexeddb://client-model');
    };

    model.compile({
        optimizer: 'adam',
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy']
    });

    return model;

    // // TEMP
    // const weights = await getModelWeights(token);
    // const model = createModel();
    // model.setWeights(weights);
    // model.compile({
    //     optimizer: 'adam',
    //     loss: 'sparseCategoricalCrossentropy',
    //     metrics: ['accuracy']
    // });
    // return model;
};

export async function saveClientModel(modelWeights) {
    const model = createModel();
    model.setWeights(modelWeights);
    await model.save('indexeddb://client-model');
    return model;
};