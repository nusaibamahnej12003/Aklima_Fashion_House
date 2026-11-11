



import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Truck,
  Banknote,
  PackageCheck,
  Sparkles,
  Minus,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import OrderTracking from "./OrderTracking";
import { AdminLogin, AdminDashboard } from "./Admin";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ALL = "সব পণ্য";
const CATEGORIES = [ALL, "শাড়ি", "থ্রি-পিস", "কুর্তি", "গাউন"];

const SORT_OPTIONS = [
  { value: "default", label: "ডিফল্ট" },
  { value: "low", label: "দাম: কম থেকে বেশি" },
  { value: "high", label: "দাম: বেশি থেকে কম" },
];

const money = (n) => `৳ ${Number(n || 0).toLocaleString("en-BD")}`;

function Storefront({ storeSettings }) {
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Load products from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load products");
        return response.json();
      })
      .then((data) => {
        setProducts(data.products);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setApiError("পণ্য লোড করা যাচ্ছে না। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।");
        setLoading(false);
      });
  }, []);

  // Lock page scroll while any overlay is open + close on Escape
  const overlayOpen = Boolean(
    selectedProduct || showCart || showCheckout || orderPlaced
  );

  useEffect(() => {
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayOpen]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      setSelectedProduct(null);
      setShowCart(false);
      setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Search, category filter and sorting
  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const matchesCategory =
        selectedCategory === ALL || product.category === selectedCategory;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, selectedCategory, search, sort]);

  function openProduct(product) {
    setSelectedProduct(product);

    const galleryImages =
      product.images?.length > 0 ? product.images : [product.image];

    setSelectedImage(galleryImages[0]);
    setSelectedSize(product.sizes[0]);
    setSelectedColor(product.colors[0]);
    setQuantity(1);
  }

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
            ? { ...item, quantity: item.quantity + quantity }
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

  function updateCartQuantity(index, change) {
    setCart((currentCart) =>
      currentCart
        .map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + change } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(index) {
    setCart((currentCart) => currentCart.filter((_, i) => i !== index));
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const productImages = selectedProduct
    ? selectedProduct.images?.length > 0
      ? selectedProduct.images
      : [selectedProduct.image].filter(Boolean)
    : [];

  function stepImage(direction) {
    const index = productImages.indexOf(selectedImage);
    const next =
      (index + direction + productImages.length) % productImages.length;
    setSelectedImage(productImages[next]);
  }

  async function handlePlaceOrder(e) {
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

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  }

  const navLinks = [
    { href: "#home", label: "হোম" },
    { href: "#products", label: "কালেকশন" },
    { href: "#about", label: "আমাদের সম্পর্কে" },
  ];

  return (
    <div className="af-app">
      {/* Announcement bar */}
      <div className="af-topbar">
        সারা বাংলাদেশে ডেলিভারি &nbsp;•&nbsp; ক্যাশ অন ডেলিভারি সুবিধা
      </div>

      {/* Header */}
      <header className="af-header">
        <div className="af-header-inner">
          <button
            className="af-icon-btn af-menu-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <a className="af-logo" href="#home">
            {storeSettings.logoUrl ? (
              <img
                src={storeSettings.logoUrl}
                alt={storeSettings.storeName}
                className="af-header-logo"
              />
            ) : (
              <span className="af-logo-text">{storeSettings.storeName}</span>
            )}
          </a>

          <nav className={`af-nav ${menuOpen ? "open" : ""}`}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link to="/track-order" onClick={() => setMenuOpen(false)}>
              অর্ডার ট্র্যাক
            </Link>
          </nav>

          <div className="af-header-actions">
            <button
              className="af-cart-button"
              onClick={() => setShowCart(true)}
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingBag size={20} />
              <span className="af-cart-label">Cart</span>
              {cartCount > 0 && <span className="af-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="af-hero" id="home">
        <div className="af-hero-inner">
          <p className="af-eyebrow">NEW COLLECTION</p>
          <h1>
            আপনার সৌন্দর্যে <em>নতুন মাত্রা</em>
          </h1>
          <p className="af-hero-text">
            শাড়ি, থ্রি-পিস, কুর্তি ও গাউন — যত্ন করে বাছাই করা পোশাক, আপনার
            দোরগোড়ায়।
          </p>
          <div className="af-hero-actions">
            <a href="#products" className="af-btn af-btn-primary">
              এখনই শপিং করুন
            </a>
            <Link to="/track-order" className="af-btn af-btn-outline">
              অর্ডার ট্র্যাক করুন
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="af-trust" aria-label="Our promises">
        <div className="af-trust-item">
          <Truck size={22} />
          <div>
            <strong>সারা দেশে ডেলিভারি</strong>
            <span>ঢাকার ভিতরে ৳70, বাইরে ৳120</span>
          </div>
        </div>
        <div className="af-trust-item">
          <Banknote size={22} />
          <div>
            <strong>ক্যাশ অন ডেলিভারি</strong>
            <span>পণ্য হাতে পেয়ে মূল্য পরিশোধ</span>
          </div>
        </div>
        <div className="af-trust-item">
          <PackageCheck size={22} />
          <div>
            <strong>সহজ অর্ডার ট্র্যাকিং</strong>
            <span>Order ID দিয়ে স্ট্যাটাস দেখুন</span>
          </div>
        </div>
        <div className="af-trust-item">
          <Sparkles size={22} />
          <div>
            <strong>নির্বাচিত কালেকশন</strong>
            <span>মানসম্মত ফ্যাব্রিক ও ডিজাইন</span>
          </div>
        </div>
      </section>

      {/* Products */}
      <main className="af-main" id="products">
        <div className="af-section-head">
          <p className="af-eyebrow">SHOP</p>
          <h2>আমাদের কালেকশন</h2>
        </div>

        <div className="af-toolbar">
          <div className="af-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="পণ্যের নাম দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </div>

          <select
            className="af-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="af-categories">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? "active" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {apiError && <p className="af-empty">{apiError}</p>}

        <div className="af-products-grid">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div className="af-skeleton" key={i}>
                <div className="af-skeleton-img" />
                <div className="af-skeleton-line" />
                <div className="af-skeleton-line short" />
              </div>
            ))}

          {!loading &&
            !apiError &&
            filteredProducts.map((product) => (
              <article
                className="af-product-card"
                key={product.id}
                onClick={() => openProduct(product)}
              >
                <div className="af-product-media">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="af-product-tag">{product.category}</span>
                  <span className="af-quick-view">বিস্তারিত দেখুন</span>
                </div>

                <div className="af-product-info">
                  <h3>{product.name}</h3>
                  <strong>{money(product.price)}</strong>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openProduct(product);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
        </div>

        {!loading && !apiError && filteredProducts.length === 0 && (
          <p className="af-empty">কোনো পণ্য পাওয়া যায়নি।</p>
        )}
      </main>

      {/* Footer */}
      <footer className="af-footer" id="about">
        <div className="af-footer-inner">
          <div className="af-footer-brand">
            <h2>{storeSettings.storeName}</h2>
            <p>
              আপনার পছন্দ, আমাদের অনুপ্রেরণা। নারীদের জন্য নির্বাচিত পোশাকের
              বিশ্বস্ত ঠিকানা।
            </p>
          </div>

          <div>
            <h4>দ্রুত লিংক</h4>
            <a href="#products">কালেকশন</a>
            <Link to="/track-order">অর্ডার ট্র্যাক</Link>
          </div>

          <div>
            <h4>ক্যাটেগরি</h4>
            {CATEGORIES.slice(1).map((category) => (
              <a
                key={category}
                href="#products"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </a>
            ))}
          </div>

          <div>
            <h4>পেমেন্ট ও ডেলিভারি</h4>
            <span>ক্যাশ অন ডেলিভারি</span>
            <span>ঢাকার ভিতরে ৳70</span>
            <span>ঢাকার বাইরে ৳120</span>
          </div>
        </div>

        <div className="af-footer-bottom">
          © {new Date().getFullYear()} {storeSettings.storeName}. All rights
          reserved.
        </div>
      </footer>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="af-overlay" onClick={() => setSelectedProduct(null)}>
          <section
            className="af-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="af-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="af-gallery">
              <div className="af-gallery-main">
                {productImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="af-gallery-arrow af-gallery-prev"
                      onClick={() => stepImage(-1)}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="af-gallery-arrow af-gallery-next"
                      onClick={() => stepImage(1)}
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
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
                      className={selectedImage === image ? "active" : ""}
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
              <p className="af-modal-category">{selectedProduct.category}</p>
              <h2>{selectedProduct.name}</h2>
              <p className="af-modal-price">{money(selectedProduct.price)}</p>

              {selectedProduct.description && (
                <p className="af-modal-desc">{selectedProduct.description}</p>
              )}

              <label>Size নির্বাচন করুন</label>
              <div className="af-options">
                {selectedProduct.sizes.map((size) => (
                  <button
                    key={size}
                    className={selectedSize === size ? "chosen" : ""}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <label>Color নির্বাচন করুন</label>
              <div className="af-options">
                {selectedProduct.colors.map((color) => (
                  <button
                    key={color}
                    className={selectedColor === color ? "chosen" : ""}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>

              <label>Quantity</label>
              <div className="af-quantity">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease"
                >
                  <Minus size={16} />
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button className="af-add-button" onClick={addToCart}>
                Add to Cart — {money(selectedProduct.price * quantity)}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Shopping Cart drawer */}
      {showCart && (
        <div
          className="af-overlay af-overlay-right"
          onClick={() => setShowCart(false)}
        >
          <aside
            className="af-cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="af-panel-head">
              <h2>আপনার Shopping Cart</h2>
              <button
                className="af-icon-btn"
                onClick={() => setShowCart(false)}
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="af-cart-empty">
                <ShoppingBag size={42} />
                <p>আপনার Cart এখনো খালি।</p>
                <button
                  className="af-btn af-btn-primary"
                  onClick={() => setShowCart(false)}
                >
                  শপিং চালিয়ে যান
                </button>
              </div>
            ) : (
              <>
                <div className="af-cart-items">
                  {cart.map((item, index) => (
                    <div
                      className="af-cart-item"
                      key={`${item.id}-${item.size}-${item.color}`}
                    >
                      <img src={item.image} alt={item.name} />

                      <div className="af-cart-item-info">
                        <h3>{item.name}</h3>
                        <p>
                          Size: {item.size} · Color: {item.color}
                        </p>

                        <div className="af-cart-item-row">
                          <div className="af-quantity">
                            <button
                              onClick={() => updateCartQuantity(index, -1)}
                              aria-label="Decrease"
                            >
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(index, 1)}
                              aria-label="Increase"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <strong>{money(item.price * item.quantity)}</strong>
                        </div>

                        <button
                          className="af-remove"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="af-total">
                  <div className="af-total-row">
                    <span>Subtotal</span>
                    <strong>{money(cartTotal)}</strong>
                  </div>
                  <p className="af-total-note">
                    ডেলিভারি চার্জ চেকআউটে যোগ হবে।
                  </p>
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
          </aside>
        </div>
      )}

      {/* Checkout */}
      {showCheckout && (
        <div className="af-overlay">
          <section
            className="af-checkout"
            role="dialog"
            aria-modal="true"
            aria-label="Checkout"
          >
            <button
              className="af-close"
              onClick={() => setShowCheckout(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2>Checkout</h2>
            <p className="af-checkout-sub">
              আপনার অর্ডার সম্পন্ন করতে তথ্যগুলো পূরণ করুন।
            </p>

            <form onSubmit={handlePlaceOrder}>
              <label>আপনার নাম</label>
              <input
                type="text"
                name="customerName"
                placeholder="সম্পূর্ণ নাম লিখুন"
                required
              />

              <label>মোবাইল নম্বর</label>
              <input
                type="tel"
                name="phone"
                placeholder="01XXXXXXXXX"
                pattern="01[0-9]{9}"
                title="১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন"
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
                <option value="inside">ঢাকার ভিতরে — ৳70</option>
                <option value="outside">ঢাকার বাইরে — ৳120</option>
              </select>

              <div className="af-payment">
                <strong>Payment Method</strong>
                <p>Cash on Delivery (COD)</p>
                <small>পণ্য হাতে পাওয়ার পর টাকা পরিশোধ করবেন।</small>
              </div>

              <div className="af-checkout-total">
                <div>
                  <span>Product Price</span>
                  <span>{money(cartTotal)}</span>
                </div>
                <div>
                  <span>Delivery Charge</span>
                  <span>{money(deliveryFee)}</span>
                </div>
                <div className="af-grand">
                  <span>Total</span>
                  <span>{money(cartTotal + deliveryFee)}</span>
                </div>
              </div>

              {checkoutError && (
                <p className="checkout-error">{checkoutError}</p>
              )}

              <button
                type="submit"
                className="af-add-button"
                disabled={placingOrder}
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Order Success */}
      {orderPlaced && (
        <div className="af-overlay">
          <section className="af-success" role="dialog" aria-modal="true">
            <div className="af-success-icon">
              <Check size={30} />
            </div>

            <h2>অর্ডার সফল হয়েছে!</h2>
            <p>ধন্যবাদ, {orderPlaced.name}!</p>

            <div className="af-success-id">
              <span>আপনার Order ID</span>
              <h3>{orderPlaced.id}</h3>
            </div>

            <p>মোবাইল: {orderPlaced.phone}</p>
            <p>
              ঠিকানা: {orderPlaced.address}, {orderPlaced.district}
            </p>
            <p className="af-success-total">
              সর্বমোট: {money(orderPlaced.total)}
            </p>
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
        if (!response.ok) throw new Error("Failed to load store settings");
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
      <Route path="/" element={<Storefront storeSettings={storeSettings} />} />
      <Route
        path="/track-order"
        element={<OrderTracking storeName={storeSettings.storeName} />}
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
