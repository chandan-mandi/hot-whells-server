const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;

const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.islim.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    console.log('database connected');
    const database = client.db('Hot_Wheels');
    const carsCollection = database.collection('Available_Cars');
    const bookingCollection = database.collection('Car_Booking')
    const usersCollection = database.collection('User_Collection')
    const reviewCollection = database.collection('Review_Collection')
    // GET ALL CARS DATA
    app.get('/availableCars', async (req, res) => {
      const cursor = carsCollection.find({});
      const result = await cursor.toArray();
      res.json(result)
    })
    // GET SINGLE CAR DATA
    app.get('/availableCars/:id', async (req, res) => {
      const id = req.params.id;
      console.log('car id', id);
      const query = { _id: ObjectId(id) }
      const car = await carsCollection.findOne(query);
      res.json(car)
    })
    // POST BOOKING API
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      console.log('hit the post api', booking);
      const result = await bookingCollection.insertOne(booking)
      res.json(result)
    })
    // GET ALL BOOKING API
    app.get('/booking', async (req, res) => {
      const cursor = bookingCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    })
    // GET SINGLE BOOKING DETAILS API
    app.get('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const booking = await bookingCollection.findOne(query)
      res.send(booking)
    })
    // GET MY BOOKING
    app.get('/myBooking/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email : email};
      const myBooking = await bookingCollection.find(query).toArray();
      res.json(myBooking);
    })
    // UPDATE SINGLE BOOKING DETAILS API
    app.patch('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const updateBooking = req.body;
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updateBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc, options)
      res.json(result)
    })
    // POST METHOD USER DETAILS
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result)
      console.log(result);
    })
    // ADDED ADMIN ROLE
    // app.put('/users/admin')
    // 
  }
  catch {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})