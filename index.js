const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;

const { MongoClient } = require('mongodb');
const { urlencoded } = require('express');
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
    // POST A CAR DATA , DETAILS
    app.post('/availableCars', async(req,res) => {
      const carDetails = req.body;
      const result = await carsCollection.insertOne(carDetails);
      res.send(result)
    })
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
    // UPDATE SINGLE CAR DETAILS
    app.put('/availableCars/:id', async(req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;
      const filter = {_id: ObjectId(id)};
      const options = {upsert: true};
      const updateDoc = {
          $set: {
              name: updatedCar.name,
              mileage: updatedCar.mileage,
              price: updatedCar.price,
              img: updatedCar.img,
              details: updatedCar.details
          },
      };
      const result = await carsCollection.updateOne(filter, updateDoc, options)
      // res.send('updating not dationg')
      res.json(result)
  })
    // DELETE SINGLE CAR DATA
    app.delete('/deletedCar/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)}
      const result = await carsCollection.deleteOne(query)
      res.json(result)
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
    // DELETE SINGLE BOOKING DATA
    app.delete('/deletedBooking/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.json(result)
    })
    // POST METHOD USER DETAILS
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result)
    })
    // USERS DATA UPDATE API
    app.put('/users', async(req, res) => {
      const user = req.body;
      const filter = {email: user.email};
      const options = {upsert: true};
      const updateDoc = {$set: user}
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      res.json(result)
    })
    // USER COLLECTION ADDED ADMIN ROLE / UPDATE ROLE FOR ADMIN
    app.put('/users/admin', async(req, res) => {
      const user = req.body;
      const filter = {email: user.email}
      const updateDoc = {$set: {role: 'admin'}}
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result)
    })
    // ADMIN ROLE FINDER
    app.get('/users/:email', async(req,res) => {
      const email = req.params.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query)
      let isAdmin = false;
      if(user?.role === 'admin'){
        isAdmin = true;
      }
      res.json({admin: isAdmin});
    })
    // REVIEW POST API 
    app.post('/review', async(req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result)
    })
    // GET ALL REVIEWS 
    app.get('/review', async(req,res) => {
      const cursor = reviewCollection.find({});
      const result = await cursor.toArray();
      res.json(result)
    })

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