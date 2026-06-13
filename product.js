require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

app.use(cors());
app.use(express.json());

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  category: String,
  description: String,
});

const Product = mongoose.model("Product", ProductSchema);

const CartSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  image: String,
  quantity: {
    type: Number,
    default: 1,
  },
});

const Cart = mongoose.model("Cart", CartSchema);

const OrderSchema = new mongoose.Schema({
  customer: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  items: Array,
  total: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", OrderSchema);

//razorpay

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});

//cart Item

app.post("/cart", async (req, res) => {
  try {
    const item = new Cart(req.body);

    const savedItem = await item.save();

    res.json(savedItem);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/cart", async (req, res) => {
  try {
    const cartItems = await Cart.find();

    res.json(cartItems);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.delete("/cart/:id", async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);

    res.json({
      message: "Item Removed",
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//History

app.post("/orders", async (req, res) => {
  try {
    const order = new Order(req.body);

    const savedOrder = await order.save();

    res.json(savedOrder);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

//razorpay API

app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Started on ${PORT}`);
});
