import mongoose from 'mongoose';

const globalModelSchema = new mongoose.Schema({
    weights: { type: Buffer, required: true },
    shapes: { type: [[Number]], required: true }, // array of weight shapes
    date: { type: Date, default: Date.now },
});

export default mongoose.model('GlobalModel', globalModelSchema);