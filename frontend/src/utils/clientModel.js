import * as tf from '@tensorflow/tfjs';
import { getModel } from '../api/globalModel';
import { createModel } from './model';

export async function getClientModel(token) {
    const models = await tf.io.listModels();

    if (Object.keys(models).length === 0) {
        const globalModel = await getModel(token);
        const model = createModel();
        model.setWeights(globalModel);
        await model.save('indexeddb://client-model');
        return model;
    } else {
        const clientModel = await tf.loadLayersModel('indexeddb://client-model');
        return clientModel;
    };
};

export async function saveClientModel(modelWeights) {
    const model = createModel();
    model.setWeights(modelWeights);
    await model.save('indexeddb://client-model');
    return model;
};