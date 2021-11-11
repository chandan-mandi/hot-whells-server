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
    // GET ALL CARS DATA
    app.get('/availableCars', async(req, res) => {
      const cursor = carsCollection.find({});
      const result = await cursor.toArray();
      res.json(result)
    })
    // GET SINGLE CAR DATA
    app.get('/availableCars/:id', async(req, res) => {
      const id = req.params.id;
      console.log('car id', id);
      const query = {_id: ObjectId(id)}
      const car = await carsCollection.findOne(query);
      res.json(car)
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