const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
var admin = require("firebase-admin");

const Razorpay = require("razorpay");
const sha256 = require("crypto-js/sha256");
const crypto = require('crypto');

const { MongoClient } = require('mongodb');
const { urlencoded } = require('express');
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

var serviceAccount = require("./hot-wheels-d4134-firebase-adminsdk-f5v62-c50b59d616.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.islim.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const instance = new Razorpay({
  key_id: `${process.env.RAZOR_PAY_KEY_ID}`,
  key_secret: `${process.env.RAZOR_PAY_KEY_SECRET}`,
});

async function verifyToken(req, res, next) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    const idToken = req.headers.authorization.split('Bearer ')[1]
    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken)
      req.decodedUserEmail = decodedUser.email
    } catch (error) {

    }
  }
  next();
}

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
    app.post('/availableCars', async (req, res) => {
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
    app.put('/availableCars/:id', async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
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
    app.delete('/deletedCar/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
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
    app.get('/myBooking/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.decodedUserEmail === email) {
        const query = { email: email };
        const myBooking = await bookingCollection.find(query).toArray();
        res.json(myBooking);
      } else {
        res.status(401).json({message: 'User Not Authorize'})
      }
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
    app.delete('/deletedBooking/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
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
    app.put('/users', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user }
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      res.json(result)
    })
    // USER COLLECTION ADDED ADMIN ROLE / UPDATE ROLE FOR ADMIN
    app.put('/users/admin', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email }
      const updateDoc = { $set: { role: 'admin' } }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result)
    })
    // ADMIN ROLE FINDER
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let isAdmin = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    })
    // REVIEW POST API 
    app.post('/review', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result)
    })
    // GET ALL REVIEWS 
    app.get('/review', async (req, res) => {
      const cursor = reviewCollection.find({});
      const result = await cursor.toArray();
      res.json(result)
    })
     // RAZOR PAY BY CHANDAN
     app.post("/createOrder", async (req, res) => {
      // STEP 1:
      const orderDetails = req.body;
      const { amount, currency, receipt, notes } = await orderDetails;
      console.log(orderDetails)

      try {
        // STEP 2:    
        instance.orders.create({ amount, currency, receipt, notes }, async function (err, order) {
          //STEP 3 & 4: 
          if (err) {
            return res.status(500).json({
              message: "Something Went Wrong",
            });
          }
          console.log(order)
          return res.status(200).json(order);
        }
        )
      } catch (err) {
        return res.status(500).json({
          message: "Something Went Wrong",
        });
      }
    })
    // VERIFY ORDER CREATED BY CHANDAN
    app.post('/verifyOrder', async (req, res) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.body;
      console.log("sign", req.body)
      const key_secret = process.env.RAZOR_PAY_KEY_SECRET;
      let hmac = crypto.createHmac('sha256', key_secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest('hex');

      if (razorpay_signature === generated_signature) {
        res.json({ success: true, message: "Payment has been verified" })
      }
      else
        res.json({ success: false, message: "Payment verification failed" })
    });
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