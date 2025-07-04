const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  product_name: String,
  product_id: String,
  product_price: String,
  product_image: String,
  addedBy: [String],
});

const WishlistSchema = new mongoose.Schema({
  wishlistName: String,
  updatedDate: String,
  products: [ProductSchema],
});

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  wishlist: [WishlistSchema],
});

module.exports = mongoose.model("User", UserSchema);
