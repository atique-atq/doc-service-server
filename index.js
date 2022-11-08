const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

//mongoDb uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mzfy2kt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.get('/', (req, res) => {
    res.send('News API Running');
})

async function run() {
    try {
        const serviceCollection = client.db('docService').collection('services');
        const orderCollection = client.db('docService').collection('orders');

        app.get('/services', async (req, res) => {
            const size = parseInt(req.query.size);
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = size ? await cursor.limit(size).toArray() : await cursor.toArray();
            res.send(services);
        });
    }
    finally {

    }

}

run().catch(err => console.error(err));

app.listen(port, () => {
    console.log('Doc Service Server Running on Port', port);
})
