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
        const reviewCollection = client.db('docService').collection('reviews');

        app.get('/services', async (req, res) => {
            const size = parseInt(req.query.size);
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = size ? await cursor.limit(size).toArray() : await cursor.toArray();
            res.send(services);
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        });

        // review api
        app.post('/review', async (req, res) => {
            const order = req.body;
            console.log('req is: ...', order);
            const result = await reviewCollection.insertOne(order);
            console.log('order:', result);
            res.send(result);
        });

        //get reviews for a specific service id
        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            console.log('----', id);
            const query = { serviceId: id };
            console.log(query);
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            console.log(reviews);
            res.send(reviews);
        })

    }
    finally {

    }

}

run().catch(err => console.error(err));

app.listen(port, () => {
    console.log('Doc Service Server Running on Port', port);
})
