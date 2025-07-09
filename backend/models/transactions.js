import mongoose from 'mongoose';

const transactionsSchema = new mongoose.Schema({
    uid: String, // auth0 user sub
    date: Date, // date of transaction
    amount: Number, // amount (in GBP) of transaction
    type: String, // debit, credit, etc.
    category: String, // category of transaction
    description: String, // extra info of transaction
});

transactionsSchema.index({ uid: 1, date: 1, amount: 1, description: 1 }, { unique: true });
export default mongoose.model('Transactions', transactionsSchema);