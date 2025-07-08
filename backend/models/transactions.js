import mongoose from 'mongoose';

const transactionsSchema = new mongoose.Schema({
    userId: String,
    date: Date,
    amount: Number,
    type: String,
    category: String,
    description: String,
});

export default mongoose.model('Transactions', transactionsSchema);