// Created in ml api

import mongoose from 'mongoose';
const { Schema } = mongoose;

const userModelsSchema = new Schema({
    uid: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        sparse: true,
    },
    auth0Uid: {
        type: String,
        unique: true,
        sparse: true
    },
    modelBlob: {
        type: Buffer,
    },
});

export default mongoose.model('UserModels', userModelsSchema, 'user_models');