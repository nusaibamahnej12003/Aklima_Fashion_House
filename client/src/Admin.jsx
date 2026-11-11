import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const emptyProduct = {
  slug: "",
  name: "",
  category: "শাড়ি",
  price: "",
  image: "",
  images: [],
  description: "",
  sizes: "",
  colors: "",
  stock: 0,
};

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem("adminName", data.admin.name);

      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleLogin}>
        <h1>AKLIMA</h1>
        <p className="admin-subtitle">Fashion House — Admin Portal</p>

        <h2>Admin Login</h2>

        {error && <div className="admin-error">{error}</div>}

        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter admin email"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login to Dashboard"}
        </button>

        <a href="/" className="admin-back-link">
          ← Back to Store
        </a>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = sessionStorage.getItem("adminToken");
  const adminName = sessionStorage.getItem("adminName") || "Admin";
const [uploadingImages, setUploadingImages] = useState(false);
const [orders, setOrders] = useState([]);
const [ordersLoading, setOrdersLoading] = useState(true);
const [storeName, setStoreName] = useState("Aklima Fashion House");
const [logoUrl, setLogoUrl] = useState("");
const [logoPublicId, setLogoPublicId] = useState("");
const [logoFile, setLogoFile] = useState(null);
const [settingsSaving, setSettingsSaving] = useState(false);
const [settingsLoading, setSettingsLoading] = useState(true);

  function logout() {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminName");
    navigate("/admin/login");
  }

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not load products");
      }

      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  if (!token) {
    navigate("/admin/login");
    return;
  }

  loadProducts();
  loadOrders();
  loadStoreSettings();
}, []);

  async function loadOrders() {
  setOrdersLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      throw new Error(data.message || "Could not load orders");
    }

    setOrders(data.orders);
  } catch (err) {
    setError(err.message);
  } finally {
    setOrdersLoading(false);
  }
}


async function loadStoreSettings() {
  setSettingsLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/store-settings`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load store settings");
    }

    setStoreName(data.settings.storeName || "Aklima Fashion House");
    setLogoUrl(data.settings.logoUrl || "");
    setLogoPublicId(data.settings.logoPublicId || "");
  } catch (err) {
    setError(err.message);
  } finally {
    setSettingsLoading(false);
  }
}

async function handleSaveStoreSettings(e) {
  e.preventDefault();
  setSettingsSaving(true);
  setError("");
  setMessage("");

  try {
    let updatedLogoUrl = logoUrl;
    let updatedLogoPublicId = logoPublicId;

    // Upload a newly selected logo first
    if (logoFile) {
      const uploadForm = new FormData();
      uploadForm.append("image", logoFile);

      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/admin/upload-logo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadForm,
        }
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || "Logo upload failed");
      }

      updatedLogoUrl = uploadData.logo.url;
      updatedLogoPublicId = uploadData.logo.publicId;
    }

    // Save store name and logo details
    const response = await fetch(`${API_BASE_URL}/api/admin/store-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        storeName,
        logoUrl: updatedLogoUrl || null,
        logoPublicId: updatedLogoPublicId || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not save store settings");
    }

    setLogoUrl(data.settings.logoUrl || "");
    setLogoPublicId(data.settings.logoPublicId || "");
    setLogoFile(null);

    setMessage("Store settings updated successfully!");
  } catch (err) {
    setError(err.message);
  } finally {
    setSettingsSaving(false);
  }
}


  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyProduct);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function startEditing(product) {
    setEditingId(product.id);

    setForm({
      slug: product.slug,
      name: product.name,
      category: product.category,
      price: String(product.price),
      image: product.image,
      images: product.images?.length
  ? product.images
  : product.image
    ? [product.image]
    : [],
      description: product.description,
      sizes: product.sizes.join(", "),
      colors: product.colors.join(", "),
      stock: String(product.stock),
    });

    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

async function handleImageUpload(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = "";

  if (files.length === 0) return;

  const remaining = 10 - form.images.length;

  if (files.length > remaining) {
    setError(`You can upload only ${remaining} more image(s).`);
    return;
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  setUploadingImages(true);
  setError("");
  setMessage("");

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/upload-images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      throw new Error(data.message || "Image upload failed.");
    }

    const uploadedUrls = data.images.map((image) => image.url);

    setForm((current) => {
      const nextImages = [...current.images, ...uploadedUrls];

      return {
        ...current,
        images: nextImages,
        image: current.image || nextImages[0],
      };
    });

    setMessage("Images uploaded successfully!");
  } catch (err) {
    setError(err.message);
  } finally {
    setUploadingImages(false);
  }
}

function removeProductImage(imageUrl) {
  setForm((current) => {
    const nextImages = current.images.filter(
      (url) => url !== imageUrl
    );

    return {
      ...current,
      images: nextImages,
      image:
        current.image === imageUrl
          ? nextImages[0] || ""
          : current.image,
    };
  });
}


  async function handleSubmit(e) {
    e.preventDefault();
    if (form.images.length === 0 && !form.image.trim()) {
  setError("Please upload at least one product image.");
  return;
}
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
    image: form.image.trim() || form.images[0] || "",
    images: form.images,      description: form.description.trim(),
      sizes: form.sizes.split(",").map((item) => item.trim()).filter(Boolean),
      colors: form.colors.split(",").map((item) => item.trim()).filter(Boolean),
      stock: Number(form.stock),
    };

    try {
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/api/admin/products/${editingId}`
          : `${API_BASE_URL}/api/admin/products`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not save product");
      }

      setMessage(
        isEditing
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

     setForm(emptyProduct);
setEditingId(null);
await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not delete product");
      }

      setMessage("Product deleted successfully!");
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateOrderStatus(orderId, status) {
  const confirmed =
    status !== "CANCELLED" ||
    window.confirm("Are you sure you want to cancel this order?");

  if (!confirmed) return;

  setError("");
  setMessage("");

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      throw new Error(data.message || "Could not update order status");
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? data.order : order
      )
    );

    setMessage("Order status updated successfully!");
  } catch (err) {
    setError(err.message);
  }
}
  if (!token) return null;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h2>AKLIMA <span>ADMIN</span></h2>
          <p>Welcome, {adminName}</p>
        </div>

        <div className="admin-header-actions">
         <a href="/">
  View Store
</a>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-heading">
          <div>
            <h1>Product Management</h1>
            <p>Manage your store products, prices and stock.</p>
          </div>

          <div className="admin-count">
            <strong>{products.length}</strong>
            <span>Active Products</span>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}


<section className="admin-form-card admin-store-settings">
  <h2>Store Settings</h2>
  <p>Customize your store name and brand logo.</p>

  {settingsLoading ? (
    <p>Loading store settings...</p>
  ) : (
    <form onSubmit={handleSaveStoreSettings}>
      <div className="admin-form-grid">
        <div className="admin-full-width">
          <label>Store Name</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Aklima Fashion House"
            required
          />
        </div>

        <div className="admin-full-width">
          <label>Store Logo</label>

          {logoUrl && (
            <div className="admin-logo-preview">
              <img src={logoUrl} alt="Current store logo" />
              <span>Current Logo</span>
            </div>
          )}

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) =>
              setLogoFile(e.target.files?.[0] || null)
            }
          />

          {logoFile && (
            <p className="admin-logo-filename">
              Selected: {logoFile.name}
            </p>
          )}

          <small>
            JPG, PNG or WebP. Maximum file size: 5 MB.
          </small>
        </div>
      </div>

      <div className="admin-form-actions">
        <button type="submit" disabled={settingsSaving}>
          {settingsSaving ? "Saving..." : "Save Store Settings"}
        </button>
      </div>
    </form>
  )}
</section>


        <section className="admin-form-card">
          <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div>
                <label>Product Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Premium Silk Saree"
                  required
                />
              </div>

              <div>
                <label>Product Slug</label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="premium-silk-saree"
                  required
                />
              </div>

              <div>
                <label>Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option>শাড়ি</option>
                  <option>থ্রি-পিস</option>
                  <option>কুর্তি</option>
                  <option>গাউন</option>
                </select>
              </div>

              <div>
                <label>Price (BDT)</label>
                <input
                  name="price"
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="1500"
                  required
                />
              </div>

              <div>
                <label>Stock Quantity</label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  required
                />
              </div>

              
<div className="admin-full-width admin-image-upload">
  <label>Product Images (Maximum 10)</label>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    onChange={handleImageUpload}
    disabled={uploadingImages || form.images.length >= 10}
  />

  <p className="admin-image-hint">
    Select multiple photos of this dress. JPG, PNG or WebP.
    Maximum 5 MB per image.
  </p>

  {uploadingImages && <p>Uploading images...</p>}

  {form.images.length > 0 && (
    <div className="admin-image-preview-grid">
      {form.images.map((url, index) => (
        <div className="admin-image-preview" key={`${url}-${index}`}>
          <img src={url} alt={`Product ${index + 1}`} />

          <div className="admin-image-preview-actions">
            <span>
              {form.image === url ? "Cover Image" : "Gallery Image"}
            </span>

            {form.image !== url && (
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    image: url,
                  }))
                }
              >
                Set as Cover
              </button>
            )}

            <button
              type="button"
              className="admin-image-remove"
              onClick={() => removeProductImage(url)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>


              <div>
                <label>Available Sizes (comma separated)</label>
                <input
                  name="sizes"
                  value={form.sizes}
                  onChange={handleChange}
                  placeholder="M, L, XL"
                  required
                />
              </div>

              <div>
                <label>Available Colors (comma separated)</label>
                <input
                  name="colors"
                  value={form.colors}
                  onChange={handleChange}
                  placeholder="কালো, লাল, নীল"
                  required
                />
              </div>

              <div className="admin-full-width">
                <label>Product Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Write product details..."
                  required
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit"disabled={saving || uploadingImages}>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-products-section">
          <h2>All Products</h2>

          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>No active products found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          <img src={product.image} alt={product.name} />
                          <span>{product.name}</span>
                        </div>
                      </td>

                      <td>{product.category}</td>
                      <td>৳ {product.price.toLocaleString("en-BD")}</td>
                      <td>{product.stock}</td>

                      <td>
                        <div className="admin-row-actions">
                          <button onClick={() => startEditing(product)}>
                            Edit
                          </button>

                          <button
                            className="admin-delete-button"
                            onClick={() => deleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="admin-products-section admin-orders-section">
  <h2>All Orders ({orders.length})</h2>

  {ordersLoading ? (
    <p>Loading orders...</p>
  ) : orders.length === 0 ? (
    <p>No orders found yet.</p>
  ) : (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Products</th>
            <th>Address</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>{order.orderNumber}</strong>
              </td>

              <td>
                <strong>{order.customerName}</strong>
                <br />
                {order.phone}
              </td>

              <td>
                {order.items.map((item) => (
                  <div key={item.id} className="admin-order-item">
                    <strong>{item.productName}</strong>
                    <br />
                    Size: {item.size} | Color: {item.color}
                    <br />
                    Quantity: {item.quantity}
                    <br />
                    ৳ {item.lineTotal.toLocaleString("en-BD")}
                  </div>
                ))}
              </td>

              <td>
                {order.address}
                <br />
                {order.district}
              </td>

              <td>
                <strong>
                  ৳ {order.total.toLocaleString("en-BD")}
                </strong>
                <br />
                <small>Subtotal: ৳ {order.subtotal}</small>
                <br />
                <small>Delivery: ৳ {order.deliveryFee}</small>
              </td>

              <td>
                {new Date(order.createdAt).toLocaleDateString("en-BD")}
              </td>

              <td>
                <select
                  className="admin-order-status"
                  value={order.status}
                  onChange={(e) =>
                    updateOrderStatus(order.id, e.target.value)
                  }
                  disabled={order.status === "CANCELLED"}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
      </main>
    </div>
  );
}

export { AdminLogin, AdminDashboard };