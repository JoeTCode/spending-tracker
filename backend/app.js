import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import cors from 'cors';
import mongoose from 'mongoose';
import Transactions from './models/transactions.js';
const app = express();
const port = 5000;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

mongoose.connect("mongodb+srv://joejoe98t:6AL1fNc8HG8W@cluster0.iyofak5.mongodb.net/spending-tracker-db?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => {
        console.log('Successfully connected to the database')
    })
    .catch(err => {
        console.log('Error connecting to the database', err);
    });


const checkJwt = auth({
  audience: 'http://localhost:5000',
  issuerBaseURL: 'https://dev-jco6fy6pebxlsglc.us.auth0.com/',
  tokenSigningAlg: 'RS256'
});

app.get('/api/transactions/get', checkJwt, async (req, res) => {
    // d, w, m, q, y, a, vm
    // d = default (last 7 days), w = calendar week, m = calendar month, q = last 3 calendar months, y = calendar year
    // a = all, vm = variable month
    // const rangeType = req.body.rangeType

    const uid = req.auth.payload.sub;
    const rangeType = req.query?.rangeType;
    const selectedMonth = req.query?.selectedMonth;

    let transactions;
    
    switch (rangeType) {
        case 'd':
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            weekAgo.setHours(0, 0, 0, 0);
            
            const end = new Date(today);
            end.setHours(23, 59, 59, 999);

            transactions = await Transactions.find({
                uid: uid,
                date: { $gte: weekAgo, $lte: end }
            }).select('-__v');
            return res.send({ transactions });

        case 'm':
            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);
            transactions = await Transactions.find({
                uid: uid,
                date: { $gte: thisMonth }
            }).select('-__v');
            return res.send({ transactions });

        case 'a':
            transactions = await Transactions.find({
                uid: uid,
            }).select('-__v');
            return res.send({ transactions });

        case 'vm':
            const monthStart = new Date();
            monthStart.setMonth(selectedMonth);
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1)

            transactions = await Transactions.find({
                uid: uid,
                date: { $gte: monthStart, $lte: monthEnd }
            }).select('-__v');
            return res.send({ transactions });

        case 'y':
            const yearStart = new Date();
            yearStart.setMonth(0);
            yearStart.setDate(1);
            yearStart.setHours(0, 0, 0, 0);

            const yearEnd = new Date(yearStart);
            yearEnd.setFullYear(yearEnd.getFullYear() + 1);

            transactions = await Transactions.find({
                uid: uid,
                date: { $gte: yearStart, $lte: yearEnd }
            }).select('-__v');
            return res.send({ transactions });
    };
});

app.post('/api/transactions/upload', checkJwt, async (req, res) => {
    const uid = req.auth.payload.sub;
    const transactions = req.body.data.slice(1);

    const filtered = transactions.filter(row => {
        return row.length == 6
    });

    // format the transactions data and create the document to be inserted to the database
    const document = filtered.map(row => {
        const [ d, m, y ] = row[1].split('/');
        const formatted_date = `${y}-${m}-${d}`;
        return {
            uid: uid,
            date: new Date(formatted_date),
            amount: parseFloat(row[3]),
            type: row[4],
            category: '',
            description: row[5].split('\t')[0].trim()
        };
    });

    try {
        await Transactions.insertMany(document, { ordered: false })
        res.sendStatus(200);
    } catch (err) {
        if (err.code === 11000) {
            console.warn('Skipped duplicate values');
            res.sendStatus(200);
        } else {
            console.error(err);
            res.status(500).send('Failed to insert transactions');
        };
    };
});

app.put('/api/transactions/update', checkJwt, async (req, res) => {
    const transaction = req.body.data;
    try {

        await Transactions.updateOne({ _id: transaction._id }, transaction);
        return res.sendStatus(200);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error updating transaction');
    };
});

app.delete('/api/transactions/delete', checkJwt, async (req, res) => {
    const deletedRow = req.body;
    try {
        await Transactions.deleteOne({ _id: deletedRow._id });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Error deleting transaction');
    };
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});