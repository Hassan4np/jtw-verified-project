const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
var jwt = require('jsonwebtoken');
const cookiesParser = require('cookie-parser');
require("dotenv").config();
const port = process.env.PORT || 5001;

//middle were data bancend get koror jonno.
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));
app.use(express.json());
app.use(cookiesParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uruvxpx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifiedtoken = async(req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send({ status: 'unauthrize' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ message: 'yoour token is not ok' })
        } else {
            req.user = decoded;
            next()
        }

    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // const ServicesCollation = client.db("serviceDB").collection("service");
        const database = client.db("serviceDB");
        const ServicesCollation = database.collection("service");
        const databases = client.db("serviceDB");
        const BookingCollation = databases.collection("booking");
        try {
            app.post('/jwt', async(req, res) => {
                const user = req.body;
                console.log(user)
                const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '1h'
                })
                res
                    .cookie('token', token, {
                        httpOnly: true,
                        secure: false
                    })
                    .send(user)
            })
        } catch (error) {
            console.log(error)
        }


        app.get('/service', async(req, res) => {
            const cours = ServicesCollation.find();
            const result = await cours.toArray();
            res.send(result)
        });
        app.put('/service/:id', async(req, res) => {
            const data = req.body;
            const id = req.params.id;
            const quarys = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const update = {
                $set: {
                    title: data.title,
                    price: data.price,
                    img: data.img,
                    description: data.description
                }
            };
            console.log(id, data)
            const result = await ServicesCollation.updateOne(quarys, update, options);
            res.send(result)
            console.log(id, data)
        })
        app.get('/service/:id', async(req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) };
            const options = {
                projection: { title: 1, img: 1, price: 1, description: 1 },
            };
            const result = await ServicesCollation.findOne(quary, options);
            res.send(result)
        });
        app.post('/booking', async(req, res) => {
            const data = req.body;
            // console.log(data)
            const result = await BookingCollation.insertOne(data);
            res.send(result)
        });
        app.get('/booking', verifiedtoken, async(req, res) => {
            console.log(req.query.email);
            // console.log('toktok tokenr', req.cookies)
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'auth token is not user' })
            };

            let query = {}
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await BookingCollation.find(query).toArray();
            res.send(result)
        })

        app.delete('/booking/:id', verifiedtoken, async(req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) }
            const result = await BookingCollation.deleteOne(quary);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Hassaaaaaaaaaaaaaaaaaaaaaaaaaaaaannnnnnnnnnnnnnnnnn')
})

app.listen(port, () => {
    console.log(`
Example app listening on port ${port}
`)
})