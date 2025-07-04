const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Helper: find user by email or create new user doc if not exists
async function findOrCreateUser(email) {
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ email, wishlist: [] });
    await user.save();
  }
  return user;
}

// 1. findWishlistsByEmail
router.get("/wishlists/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.json(user?.wishlist || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. createWishlistByEmail
router.post("/wishlists/:email", async (req, res) => {
  try {
    const { name, date } = req.body;
    const user = await findOrCreateUser(req.params.email);
    const newWishlist = {
      wishlistName: name,
      updatedDate: date,
      products: [],
    };
    user.wishlist.push(newWishlist);
    await user.save();
    res.status(201).json(newWishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. updateWishlistByEmail
router.put("/wishlists/:email/:id", async (req, res) => {
  try {
    const { email, id } = req.params;
    const updatedWishlist = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const wishlist = user.wishlist.id(id);
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.set(updatedWishlist);
    await user.save();

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. getProductsFromWishlist
router.get("/products/:email/:id", async (req, res) => {
  try {
    const { email, id } = req.params;
    const user = await User.findOne({ email });
    const wishlist = user?.wishlist.id(id);
    res.json(wishlist?.products || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. addProductsToWishlist
router.post("/products/:email/:id", async (req, res) => {
  try {
    const { email, id } = req.params;
    const product = req.body;

    const user = await User.findOne({ email });
    const wishlist = user?.wishlist.id(id);
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.products.push(product);
    await user.save();

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. deleteProductFromWishlist
// DELETE /api/products/:email/:wishlistId/:productMongoId
router.delete('/products/:email/:wishlistId/:productMongoId', async (req, res) => {
  const { email, wishlistId, productMongoId } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wishlist = user.wishlist.find(w => w._id.toString() === wishlistId);
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    // Filter out the product using the MongoDB _id
    wishlist.products = wishlist.products.filter(
      product => product._id.toString() !== productMongoId
    );

    await user.save();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: 'Server error' });
  }
});


// 7. updateProductFromWishlist
router.put("/products/:email/:id/:pro_id", async (req, res) => {
  try {
    const { email, id, pro_id } = req.params;
    const updatedProduct = req.body;

    const user = await User.findOne({ email });
    const wishlist = user?.wishlist.id(id);
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    const product = wishlist.products.id(pro_id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.set(updatedProduct);
    await user.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add current user's email to addedBy of someone else's product
router.post("/products/:email/:id/:productid/add", async (req, res) => {
  try {
    const { email, id, productid } = req.params;
    const { userEmail } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const wishlist = user.wishlist.id(id);
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    const product = wishlist.products.id(productid);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!product.addedBy.includes(userEmail)) {
      product.addedBy.push(userEmail);
      await user.save();
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 9. DELETE wishlist by id
router.delete("/wishlists/:email/:id", async (req, res) => {
  try {
    const { email, id } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const originalLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter(w => w._id.toString() !== id);
    if (user.wishlist.length === originalLength) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    await user.save();
    res.json({ message: "Wishlist deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
