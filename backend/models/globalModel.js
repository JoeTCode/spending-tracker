import mongoose from 'mongoose';

const globalModelSchema = new mongoose.Schema({
    modelWeights: Array,
    date: Date,
});

export default mongoose.model('GlobalModel', globalModelSchema);