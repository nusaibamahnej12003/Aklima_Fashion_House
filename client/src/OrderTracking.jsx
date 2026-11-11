
import { useState } from "react";
import "./OrderTracking.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function OrderTracking() {
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
        `${API_BASE_URL}/api/orders/${encodeURIComponent(orderNumber.trim())}?phone=${encodeURIComponent(phone.trim())}`
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

  const statuses = [
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
  ];

  const statusLabels = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  return (
    <div className="tracking-page">
      <div className="tracking-card">
        <h1>Track Your Order</h1>
        <p>Enter your Order ID and phone number to check your order.</p>

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
            <h2>Order Details</h2>

            <p><strong>Order ID:</strong> {order.orderNumber}</p>
            <p><strong>Customer:</strong> {order.customerName}</p>
            <p><strong>Total:</strong> ৳ {order.total.toLocaleString("en-BD")}</p>
            <p>
              <strong>Order Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleDateString("en-BD")}
            </p>

            <div className="tracking-status">
              <strong>Current Status: </strong>
              <span className={`status-${order.status.toLowerCase()}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </div>

            {order.status === "CANCELLED" ? (
              <p className="cancelled-message">
                This order has been cancelled.
              </p>
            ) : (
              <div className="tracking-progress">
                {statuses.map((status, index) => {
                  const currentIndex = statuses.indexOf(order.status);

                  return (
                    <div
                      key={status}
                      className={`tracking-step ${
                        index <= currentIndex ? "completed" : ""
                      }`}
                    >
                      <div className="tracking-dot"></div>
                      <span>{statusLabels[status]}</span>
                    </div>
                  );
                })}
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
                  Quantity: {item.quantity} | ৳ {item.lineTotal}
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
