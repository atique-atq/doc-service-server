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
    res.send('Doc service API Running');
})

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log('found you!');
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('docService').collection('services');
        const reviewCollection = client.db('docService').collection('reviews');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const size = parseInt(req.query.size);
            const query = {}
            const cursor = serviceCollection.find(query);
            let services = []
            if (size) {
                const totalCount = await serviceCollection.estimatedDocumentCount();
                const skipValue = totalCount - size;
                services = await cursor.skip(skipValue).limit(size).toArray();
            }
            else {
                services = await cursor.toArray();
            }
            res.send(services);
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        });

        app.post('/addService', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        // review api
        app.post('/review', async (req, res) => {
            const order = req.body;
            const result = await reviewCollection.insertOne(order);
            console.log('order:', result);
            res.send(result);
        });

        //get reviews for a specific service id
        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { serviceId: id };
            console.log(query);
            const cursor = reviewCollection.find(query).sort({ insertingTime: -1 });
            const reviews = await cursor.toArray();
            console.log(reviews);
            res.send(reviews);
        })

        //get reviews by id
        app.get('/reviewById/:_id', async (req, res) => {
            const id = req.params._id;
            console.log('id--', id);
            const query = { _id: ObjectId(id) };
            const review = await reviewCollection.findOne(query);
            console.log('single review', review);
            res.send(review);
        })

        //get reviews for a specific user
        app.get('/reviews', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' })
            }

            let query = {}
            if (req.query.email) {
                query = { userEmail: req.query.email }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        //delete review
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })

        //update review
        app.patch('/review/:id', async (req, res) => {
            const id = req.params.id;
            const newText = req.body.reviewText;
            const query = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    reviewText: newText,
                }
            }
            const result = await reviewCollection.updateOne(query, updatedDoc)
            res.send(result);
        })

    }
    finally {

    }

}

run().catch(err => console.error(err));

app.listen(port, () => {
    console.log('Doc Service Server Running on Port', port);
})
