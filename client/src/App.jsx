import OrderTracking from "./OrderTracking";
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLogin, AdminDashboard } from "./Admin";
import "./App.css";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Storefront() {
  const [selectedCategory, setSelectedCategory] = useState("সব পণ্য");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [deliveryZone, setDeliveryZone] = useState("inside");
  const [orderPlaced, setOrderPlaced] = useState(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
const [placingOrder, setPlacingOrder] = useState(false);
const [checkoutError, setCheckoutError] = useState("");
  const deliveryFee = deliveryZone === "inside" ? 70 : 120;

  const categories = [
    "সব পণ্য",
    "শাড়ি",
    "থ্রি-পিস",
    "কুর্তি",
    "গাউন",
  ];

  // Load products from backend
  useEffect(() => {
     fetch(`${API_BASE_URL}/api/products`)      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        return response.json();
      })
      .then((data) => {
        setProducts(data.products);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setApiError(
          "পণ্য লোড করা যাচ্ছে না। Backend Server চালু আছে কি?"
        );
        setLoading(false);
      });
  }, []);

  // Search and category filter
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "সব পণ্য" ||
      product.category === selectedCategory;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Open product details
 function openProduct(product) {
  setSelectedProduct(product);

  const galleryImages =
    product.images?.length > 0
      ? product.images
      : [product.image];

  setSelectedImage(galleryImages[0]);

  setSelectedSize(product.sizes[0]);
  setSelectedColor(product.colors[0]);
  setQuantity(1);
}

  // Add product to cart
  function addToCart() {
    const existingItem = cart.find(
      (item) =>
        item.id === selectedProduct.id &&
        item.size === selectedSize &&
        item.color === selectedColor
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item === existingItem
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...selectedProduct,
          size: selectedSize,
          color: selectedColor,
          quantity,
        },
      ]);
    }

    setSelectedProduct(null);
    setShowCart(true);
  }

  // Update cart quantity
  function updateCartQuantity(index, change) {
    setCart((currentCart) =>
      currentCart
        .map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: item.quantity + change,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // Remove product from cart
  function removeFromCart(index) {
    setCart((currentCart) =>
      currentCart.filter((_, i) => i !== index)
    );
  }

  // Cart calculations
  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
const productImages = selectedProduct
  ? selectedProduct.images?.length > 0
    ? selectedProduct.images
    : [selectedProduct.image].filter(Boolean)
  : [];
  return (
    <div className="af-app">

      {/* Top Bar */}
      <div className="af-topbar">
        সারা বাংলাদেশে ডেলিভারি সুবিধা রয়েছে
      </div>

      {/* Header */}
      <header className="af-header">
        <a className="af-logo" href="#home">
  {storeSettings.logoUrl ? (
    <img
      src={storeSettings.logoUrl}
      alt={storeSettings.storeName}
      className="af-header-logo"
    />
  ) : (
    storeSettings.storeName
  )}
</a>

        <nav className="af-nav">
          <a href="#home">হোম</a>
          <a href="#products">পণ্যসমূহ</a>
          <a href="#about">আমাদের সম্পর্কে</a>
          <a href="/track-order">Track Order</a>
        </nav>
<a href="/admin/login" className="af-admin-link">
  Admin Login
</a>
        <button
          className="af-cart-button"
          onClick={() => setShowCart(true)}
        >
          🛒 Cart ({cartCount})
        </button>
      </header>

      {/* Hero Section */}
      <section className="af-hero" id="home">
        <div>
          <p>NEW COLLECTION</p>

          <h1>আপনার সৌন্দর্যে নতুন মাত্রা</h1>

          <p>
            পছন্দের পোশাক খুঁজে নিন Aklima Fashion House-এ।
          </p>

          <a href="#products" className="af-shop-button">
            এখনই শপিং করুন
          </a>
        </div>
      </section>

      {/* Products Section */}
      <main className="af-main" id="products">

        <h2>আমাদের কালেকশন</h2>

        {/* Search */}
        <input
          className="af-search"
          type="text"
          placeholder="পণ্যের নাম দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Categories */}
        <div className="af-categories">
          {categories.map((category) => (
            <button
              key={category}
              className={
                selectedCategory === category ? "active" : ""
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading and Error */}
        {loading && <p>পণ্য লোড হচ্ছে...</p>}

        {apiError && (
          <p className="af-empty">{apiError}</p>
        )}

        {/* Product Cards */}
        <div className="af-products-grid">

          {!loading &&
            !apiError &&
            filteredProducts.map((product) => (
              <article
                className="af-product-card"
                key={product.id}
              >
                <img
                  src={product.image}
                  alt={product.name}
                />

                <div className="af-product-info">
                  <p>{product.category}</p>

                  <h3>{product.name}</h3>

                  <strong>
                    ৳ {product.price.toLocaleString("en-BD")}
                  </strong>

                  <button onClick={() => openProduct(product)}>
                    বিস্তারিত দেখুন
                  </button>
                </div>
              </article>
            ))}

        </div>

        {!loading &&
          !apiError &&
          filteredProducts.length === 0 && (
            <p className="af-empty">
              কোনো পণ্য পাওয়া যায়নি।
            </p>
          )}

      </main>

      {/* Footer */}
      <footer className="af-footer" id="about">

        <h2>{storeSettings.storeName}</h2>

        <p>আপনার পছন্দ, আমাদের অনুপ্রেরণা।</p>
      </footer>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div
          className="af-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className="af-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="af-close"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>

          <div className="af-gallery">
  
<div className="af-gallery-main">
  {productImages.length > 1 && (
    <>
      <button
        type="button"
        className="af-gallery-arrow af-gallery-prev"
        onClick={() => {
          const index = productImages.indexOf(selectedImage);
          const previousIndex =
            (index - 1 + productImages.length) % productImages.length;
          setSelectedImage(productImages[previousIndex]);
        }}
        aria-label="Previous image"
      >
        &#10094;
      </button>

      <button
        type="button"
        className="af-gallery-arrow af-gallery-next"
        onClick={() => {
          const index = productImages.indexOf(selectedImage);
          const nextIndex = (index + 1) % productImages.length;
          setSelectedImage(productImages[nextIndex]);
        }}
        aria-label="Next image"
      >
        &#10095;
      </button>
    </>
  )}

  <img
    src={selectedImage || selectedProduct.image}
    alt={selectedProduct.name}
  />
</div>
  {productImages.length > 1 && (
    <div className="af-gallery-thumbnails">
      {productImages.map((image, index) => (
        <button
          type="button"
          key={`${image}-${index}`}
          className={
            selectedImage === image ? "active" : ""
          }
          onClick={() => setSelectedImage(image)}
        >
          <img
            src={image}
            alt={`${selectedProduct.name} ${index + 1}`}
          />
        </button>
      ))}
    </div>
  )}
</div>
            <div className="af-modal-info">
              <p>{selectedProduct.category}</p>

              <h2>{selectedProduct.name}</h2>

              <h3>
                ৳ {selectedProduct.price.toLocaleString("en-BD")}
              </h3>

              <p>{selectedProduct.description}</p>

              {/* Size Selection */}
              <label>Size নির্বাচন করুন</label>

              <div className="af-options">
                {selectedProduct.sizes.map((size) => (
                  <button
                    key={size}
                    className={
                      selectedSize === size ? "chosen" : ""
                    }
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Color Selection */}
              <label>Color নির্বাচন করুন</label>

              <div className="af-options">
                {selectedProduct.colors.map((color) => (
                  <button
                    key={color}
                    className={
                      selectedColor === color ? "chosen" : ""
                    }
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>

              {/* Quantity */}
              <label>Quantity</label>

              <div className="af-quantity">
                <button
                  onClick={() =>
                    setQuantity(Math.max(1, quantity - 1))
                  }
                >
                  −
                </button>

                <span>{quantity}</span>

                <button
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                className="af-add-button"
                onClick={addToCart}
              >
                Add to Cart — ৳{" "}
                {(
                  selectedProduct.price * quantity
                ).toLocaleString("en-BD")}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Shopping Cart */}
      {showCart && (
        <div
          className="af-overlay"
          onClick={() => setShowCart(false)}
        >
          <section
            className="af-cart-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="af-close"
              onClick={() => setShowCart(false)}
            >
              ✕
            </button>

            <h2>তোমার Shopping Cart</h2>

            {cart.length === 0 ? (
              <p className="af-empty">
                তোমার Cart এখনো খালি।
              </p>
            ) : (
              <>
                {cart.map((item, index) => (
                  <div
                    className="af-cart-item"
                    key={`${item.id}-${item.size}-${item.color}`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                    />

                    <div>
                      <h3>{item.name}</h3>

                      <p>
                        Size: {item.size} | Color: {item.color}
                      </p>

                      <strong>
                        ৳{" "}
                        {(
                          item.price * item.quantity
                        ).toLocaleString("en-BD")}
                      </strong>

                      <div className="af-quantity">
                        <button
                          onClick={() =>
                            updateCartQuantity(index, -1)
                          }
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            updateCartQuantity(index, 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="af-remove"
                        onClick={() => removeFromCart(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="af-total">
                  <h3>
                    Total: ৳ {cartTotal.toLocaleString("en-BD")}
                  </h3>

                  <button
                    className="af-add-button"
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* Checkout */}
      {showCheckout && (
        <div className="af-overlay">
          <section className="af-checkout">

            <button
              className="af-close"
              onClick={() => setShowCheckout(false)}
            >
              ✕
            </button>

            <h2>Checkout</h2>

            <p>
              তোমার অর্ডার সম্পন্ন করতে তথ্যগুলো পূরণ করো।
            </p>

           <form
  onSubmit={async (e) => {
    e.preventDefault();

    const form = e.currentTarget;

    const orderData = {
      customerName: form.customerName.value.trim(),
      phone: form.phone.value.trim(),
      district: form.district.value.trim(),
      address: form.address.value.trim(),
      deliveryZone,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
    };

    try {
      setPlacingOrder(true);
      setCheckoutError("");

      const response = await  fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order could not be placed.");
      }

      setOrderPlaced({
        id: data.order.orderNumber,
        name: data.order.customerName,
        phone: data.order.phone,
        district: data.order.district,
        address: data.order.address,
        total: data.order.total,
      });

      setCart([]);
      setShowCheckout(false);

    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setPlacingOrder(false);
    }
  }}
>
              <label>তোমার নাম</label>

              <input
                type="text"
                name="customerName"
                placeholder="সম্পূর্ণ নাম লিখো"
                required
              />

              <label>মোবাইল নম্বর</label>

              <input
                type="tel"
                name="phone"
                placeholder="01XXXXXXXXX"
                pattern="01[0-9]{9}"
                title="১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখো"
                required
              />

              <label>জেলা</label>

              <input
                type="text"
                name="district"
                placeholder="যেমন: Dhaka, Cumilla"
                required
              />

              <label>সম্পূর্ণ ঠিকানা</label>

              <textarea
                name="address"
                placeholder="বাসা নম্বর, রোড, এলাকা..."
                rows="3"
                required
              />

              <label>Delivery Location</label>

              <select
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value)}
              >
                <option value="inside">
                  ঢাকার ভিতরে — ৳70
                </option>

                <option value="outside">
                  ঢাকার বাইরে — ৳120
                </option>
              </select>

              <div className="af-payment">
                <strong>Payment Method</strong>

                <p>Cash on Delivery (COD)</p>

                <small>
                  পণ্য হাতে পাওয়ার পর টাকা পরিশোধ করবে।
                </small>
              </div>

              <div className="af-checkout-total">
                <p>
                  Product Price: ৳{" "}
                  {cartTotal.toLocaleString("en-BD")}
                </p>

                <p>
                  Delivery Charge: ৳ {deliveryFee}
                </p>

                <h3>
                  Total: ৳{" "}
                  {(cartTotal + deliveryFee).toLocaleString("en-BD")}
                </h3>
              </div>
{checkoutError && (
  <p className="checkout-error">
    {checkoutError}
  </p>
)}

              <button type="submit" disabled={placingOrder}>
  {placingOrder ? "Placing Order..." : "Place Order"}
</button>
            </form>
          </section>
        </div>
      )}

      {/* Order Success */}
      {orderPlaced && (
        <div className="af-overlay">
          <section className="af-success">

            <div className="af-success-icon">✓</div>

            <h2>অর্ডার সফল হয়েছে!</h2>

            <p>ধন্যবাদ, {orderPlaced.name}!</p>

            <p>তোমার Order ID:</p>

            <h3>{orderPlaced.id}</h3>

            <p>মোবাইল: {orderPlaced.phone}</p>

            <p>
              ঠিকানা: {orderPlaced.address}, {orderPlaced.district}
            </p>

            <h3>
              সর্বমোট: ৳{" "}
              {orderPlaced.total.toLocaleString("en-BD")}
            </h3>

            <p>Payment: Cash on Delivery</p>

            <button
              className="af-add-button"
              onClick={() => setOrderPlaced(null)}
            >
              Continue Shopping
            </button>

          </section>
        </div>
      )}

    </div>
  );
}

function App() {

  const [storeSettings, setStoreSettings] = useState({
    storeName: "Aklima Fashion House",
   logoUrl: "",
    });

    useEffect(() => {
fetch(`${API_BASE_URL}/api/store-settings`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load store settings");
      }
      return response.json();
    })
    .then((data) => {
      setStoreSettings({
        storeName: data.settings.storeName || "Aklima Fashion House",
        logoUrl: data.settings.logoUrl || "",
      });
    })
    .catch((error) => {
      console.error("Store settings error:", error);
    });
}, []);


  return (
    <Routes>
      <Route path="/" element={<Storefront />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/track-order" element={<OrderTracking />} />
    </Routes>
  );
}

export default App;