

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import "./OrderTracking.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function OrderTracking({ storeName = "Aklima Fashion House" }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrack(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/orders/${encodeURIComponent(
          orderNumber.trim()
        )}?phone=${encodeURIComponent(phone.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not find order.");
      }

      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const currentIndex = order ? STATUSES.indexOf(order.status) : -1;

  return (
    <div className="tracking-page">
      <header className="tracking-header">
        <Link to="/" className="tracking-back">
          <ArrowLeft size={18} /> Back to shop
        </Link>
        <span className="tracking-brand">{storeName}</span>
      </header>

      <div className="tracking-card">
        <p className="tracking-eyebrow">ORDER STATUS</p>
        <h1>Track Your Order</h1>
        <p className="tracking-sub">
          Enter your Order ID and phone number to check your order.
        </p>

        <form onSubmit={handleTrack}>
          <label>Order ID</label>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="AFH-XXXXXXXX"
            required
          />

          <label>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            pattern="01[0-9]{9}"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Track Order"}
          </button>
        </form>

        {error && <div className="tracking-error">{error}</div>}

        {order && (
          <div className="tracking-result">
            <div className="tracking-result-head">
              <h2>Order Details</h2>
              <span className={`tracking-pill status-${order.status.toLowerCase()}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <dl className="tracking-meta">
              <div>
                <dt>Order ID</dt>
                <dd>{order.orderNumber}</dd>
              </div>
              <div>
                <dt>Customer</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>৳ {order.total.toLocaleString("en-BD")}</dd>
              </div>
              <div>
                <dt>Order Date</dt>
                <dd>{new Date(order.createdAt).toLocaleDateString("en-BD")}</dd>
              </div>
            </dl>

            {order.status === "CANCELLED" ? (
              <p className="cancelled-message">This order has been cancelled.</p>
            ) : (
              <div className="tracking-progress">
                {STATUSES.map((status, index) => (
                  <div
                    key={status}
                    className={`tracking-step ${
                      index <= currentIndex ? "completed" : ""
                    }`}
                  >
                    <div className="tracking-dot">
                      {index <= currentIndex && <Check size={12} />}
                    </div>
                    <span>{STATUS_LABELS[status]}</span>
                  </div>
                ))}
              </div>
            )}

            <h3>Ordered Products</h3>

            {order.items.map((item) => (
              <div className="tracking-item" key={item.id}>
                <strong>{item.productName}</strong>
                <p>
                  Size: {item.size} | Color: {item.color}
                </p>
                <p>
                  Quantity: {item.quantity} | ৳{" "}
                  {Number(item.lineTotal).toLocaleString("en-BD")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderTracking;
