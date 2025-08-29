import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import cors from 'cors';
import mongoose from 'mongoose';
import Transactions from './models/transactions.js';
import GlobalModel from './models/globalModel.js';
import * as tf from '@tensorflow/tfjs';
import multer from 'multer';

const CATEGORIES = ["Groceries", "Housing & Bills", "Finance & Fees", "Transport", "Income", "Shopping", "Eating Out", "Entertainment", "Health & Fitness", "Transfer", "Other / Misc"];
const CATEGORIES_SET = new Set(CATEGORIES);

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const upload = multer();

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
            break;

        case 'm':
            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);
            transactions = await Transactions.find({
                uid: uid,
                date: { $gte: thisMonth }
            }).select('-__v');
            break;

        case 'a':
            transactions = await Transactions.find({
                uid: uid,
            }).select('-__v');
            break;

        case 'vm':
            const monthStart = new Date();
            monthStart.setMonth(selectedMonth);
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1)

            transactions = await Transactions.find({
                uid: uid,
                date: { $gte: monthStart, $lt: monthEnd }
            }).select('-__v');
            break;

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
            break;
    };

    const response = [];
    for (let tx of transactions) {
        response.push(
            {
                _id: tx['_id'],
                date: new Date(tx['date']).toISOString().split('T')[0],
                amount: tx['amount'],
                type: tx['type'],
                category: tx['category'],
                description: tx['description']
            }
        );
    };

    // transactions = transactions.map(({ is_trainable, trained, date, ...rest }) => ({
    //     ...rest,
    //     date: date.toISOString().split('T')[0]
    // }))

    return res.send({ transactions: response })
});

app.post('/api/transactions/upload', checkJwt, async (req, res) => {
    const uid = req.auth.payload.sub;
    const transactions = req.body.data.slice(1);

    // format the transactions data and create the document to be inserted to the database
    const document = transactions.map((row, i) => {
        const [ d, m, y ] = row["date"].split('/');
        const formatted_date = `${y}-${m}-${d}`;

        return {
            uid: uid,
            date: new Date(formatted_date),
            amount: parseFloat(row["amount"]),
            type: row["Subcategory"],
            category: row["category"],
            description: row["memo"]
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
        if (CATEGORIES_SET.has(transaction["Category"])) {
            await Transactions.updateOne({ _id: transaction._id }, { ...transaction, trained: false });
        } else {
            await Transactions.updateOne({ _id: transaction._id }, transaction);
        };
        
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

async function getWeightsFromBuffer(buffer, shapes) {
    // doc = MongoDB document with weights + shapes
    // const buffer = doc.weights; // Buffer 
    const floatArray = new Float32Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.length / 4
    );

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
}

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
    return [Buffer.from(combined.buffer), shapes];
};


async function getLatestGlobalModelValues(clientModelDate=null, id=null) {
    let doc;

    if (id) {
        // get latest global model weights
        doc = await GlobalModel
            .findOne({ '_id': id })
    } else {
        // get latest global model weights
        doc = await GlobalModel
            .findOne()
            .sort({ date: -1 }); // -1 = descending, 1 = ascending
    }

    if (!doc) {
        throw new Error('No global model found');
    };   
    
    console.log(doc);

    return [doc._id, doc.weights, doc.shapes];
};

app.get('/global-model/get-shapes', checkJwt, async (req, res) => {
    try {
        const clientModelDate = req.query.clientDate;
        const [ id, buffer, shapes ] = await getLatestGlobalModelValues();
        res.status(200).json({ shapes, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch global model shapes" });
    }
});

// TO-DO: MAKE SECURE - ONLY SERVER ACCESS NOT USER/NON-USER ACCESS
app.get('/global-model/get-weights', checkJwt, async (req, res) => {
    // MongoDB stores Buffer as ArrayBuffer
    try {
        const clientModelDate = req.query?.clientDate; 
        const doc_id = req.query.id;
        if (!doc_id) {
            throw new Error("doc_id not provided");
        };

        const [ id, buffer, shapes ] = await getLatestGlobalModelValues(doc_id);
        res.set("Content-Type", "application/octet-stream");
        res.status(200).send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch global model weights" });
    };
});

// adds client deltas to global weights, and saves to db - returns nothing
app.post('/global-model/weight-average', checkJwt, upload.single("weights"), async (req, res) => {
    const clientBuffer = req.file.buffer;
    const clientShapes = JSON.parse(req.body.shapes);
    const clientModelDeltas = await getWeightsFromBuffer(clientBuffer, clientShapes);

    function weightAverage(globalWeights, clientDeltas, eta=1) {
        const newWeights = [];

        for (let i = 0; i < globalWeights.length; i++) {
            const gw = globalWeights[i];
            const cw = clientDeltas[i];
            const updated = gw.add(cw.mul(eta));
            newWeights.push(updated);
        };

        return newWeights;
    };

    const [ id, buffer, shapes ] = await getLatestGlobalModelValues();
    const globalModelWeights = await getWeightsFromBuffer(buffer, shapes);

    try {
        const newWeights = weightAverage(globalModelWeights, clientModelDeltas);

        try {
            const [ buffer, shapes ] = await getBufferFromWeights(newWeights);
            await GlobalModel.create({ weights: buffer, shapes: shapes });
        } catch (err) {
            console.error(err);
        };

        res.status(200);

    } catch (err) {
        res.status(500).json({ error: "Failed to generate and or insert new model weights"});
    };
});

// DEV ROUTES

app.post('/global-model/dev/save-model', upload.single("weights"), async (req, res) => {
    const buffer = req.file.buffer;
    const shapes = JSON.parse(req.body.shapes);

    try {
        const doc = new GlobalModel({
            weights: buffer, // raw bytes
            shapes,
        });
        await doc.save();
        res.status(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("DEV: Failed to save model weights to DB.")
    };
});


app.get('/global-model/dev/get-shapes', async (req, res) => {
    try {
        const [ id, buffer, shapes ] = await getLatestGlobalModelValues();
        res.status(200).json({ shapes, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch global model shapes" });
    }
});


app.get('/global-model/dev/get-weights', async (req, res) => {
    try {
        const doc_id = req.query.id;
        if (!doc_id) {
            throw new Error("doc_id not provided");
        };

        const [ id, buffer, shapes ] = await getLatestGlobalModelValues(doc_id);
        console.log('BACKEND BUFFER TYPE', buffer);
        res.set("Content-Type", "application/octet-stream");
        res.status(200).send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch global model weights" });
    };
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});