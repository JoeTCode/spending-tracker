import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

mongoose.connect("mongodb+srv://joejoe98t:6AL1fNc8HG8W@cluster0.iyofak5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
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

app.get('/api/transactions/get', checkJwt, (req, res) => {
    const uid = req.auth.payload.sub;
    res.json({ uid });
})

app.post('/api/transactions/upload', checkJwt, (req, res) => {
    const uid = req.auth.payload.sub;
    console.log(req.body)
    
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});