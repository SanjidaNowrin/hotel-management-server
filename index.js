const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const cors = require("cors");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uj11r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    // connect to database
    const database = client.db("hotel-management");
    const roomsCollection = database.collection("rooms");
    const cartCollection = database.collection("cart");
    //get all rooms
    app.get("/rooms", async (req, res) => {
      const cursor = roomsCollection.find({});
      const rooms = await cursor.toArray();
      res.send(rooms);
    });
    // get according to id
    app.get("/room/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const room = await roomsCollection.findOne(query);
      res.json(room);
    });
    // add rooms post method
    app.post("/addRoom", async (req, res) => {
      const result = await roomsCollection.insertOne(req.body);
      console.log(result);
    });
    // post data in cart
    app.post("/room/add", async (req, res) => {
      const room = req.body;
      const result = await cartCollection.insertOne(room);
      res.json(result);
    });
    // get data from cart collection
    app.get("/cart", async (req, res) => {
      const cursor = cartCollection.find({});
      const cart = await cursor.toArray();
      res.send(cart);
    });
    //payment
    app.get("/payments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.findOne(query);
      res.json(result);
    });
    //update
    app.put("/payments/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment,
        },
      };
      const result = await cartCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    app.post("/payment", cors(), async (req, res) => {
      let { amount, id } = req.body;
      try {
        const payment = await stripe.paymentIntents.create({
          amount,
          currency: "USD",
          description: "Hotel Room",
          payment_method: id,
          confirm: true,
        });
        console.log("Payment", payment);
        res.json({
          message: "Payment successful",
          success: true,
        });
      } catch (error) {
        console.log("Error", error);
        res.json({
          message: "Payment failed",
          success: false,
        });
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From Hotel Management!");
});

app.listen(port, () => {
  console.log(`Hotel Management app listening on port :${port}`);
});
