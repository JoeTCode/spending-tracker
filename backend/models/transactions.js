import mongoose from 'mongoose';

const transactionsSchema = new mongoose.Schema({
    uid: { type: String, required: true }, // auth0 user sub
    date: { type: Date, required: true }, // date of transaction
    amount: { type: Number, required: true }, // amount (in GBP) of transaction
    type: { type: String, required: true }, // debit, credit, etc.
    category: { type: String, required: true }, // category of transaction
    description: { type: String, required: true }, // extra info of transaction
    is_trainable: {type: Boolean, default: true},
    trained: {type: Boolean, default: false},
});

transactionsSchema.index({ uid: 1, date: 1, amount: 1, description: 1 }, { unique: true });
export default mongoose.model('Transactions', transactionsSchema);