"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Order {
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentStatus: string;
  inventoryStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    // Refresh every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:3001/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      setError("Failed to connect to API Gateway");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Activity className="w-5 h-5 text-primary-500" />;

    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case "cancelled":
      case "failed":
        return <XCircle className="w-5 h-5 text-danger-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-warning-500" />;
      case "processing":
        return <Activity className="w-5 h-5 text-blue-500" />;
      default:
        return <Activity className="w-5 h-5 text-primary-500" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-primary-600";

    switch (status.toLowerCase()) {
      case "completed":
        return "text-success-600";
      case "cancelled":
      case "failed":
        return "text-danger-600";
      case "pending":
        return "text-warning-600";
      case "processing":
        return "text-blue-600";
      default:
        return "text-primary-600";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Orders Overview
            </h1>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
            <p className="text-danger-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ||
          (orders.length === 1 && orders[0].message) ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first order to see it appear here and watch it flow
              through the system.
            </p>
            <Link href="/order" className="btn btn-primary">
              Create Order
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders
              .filter((order) => order.orderId && !order.message)
              .map((order, index) => (
                <div
                  key={order.orderId || index}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Order {order.orderId}
                        </h3>
                        <p
                          className={`text-sm ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Total: ${order.total?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-xs text-gray-400">
                        User: {order.userId}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Items:
                    </h4>
                    <div className="space-y-1">
                      {order.items?.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex justify-between text-sm text-gray-600"
                        >
                          <span>
                            {item.name} (x{item.quantity})
                          </span>
                          <span>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Details */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <div className="flex space-x-4">
                      <span
                        className={`px-2 py-1 rounded ${
                          order.paymentStatus === "AUTHORIZED"
                            ? "bg-green-100 text-green-800"
                            : order.paymentStatus === "DECLINED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        Payment: {order.paymentStatus}
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${
                          order.inventoryStatus === "RESERVED"
                            ? "bg-green-100 text-green-800"
                            : order.inventoryStatus === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        Inventory: {order.inventoryStatus}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">
            💡 How to Monitor Orders
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              • <strong>Kafka UI:</strong> Open{" "}
              <a
                href="http://localhost:8080"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                http://localhost:8080
              </a>{" "}
              to see real-time event flow
            </p>
            <p>
              • <strong>Service Logs:</strong> Check Docker logs to see event
              processing: <code>docker compose logs -f</code>
            </p>
            <p>
              • <strong>Topics to Watch:</strong> <code>orders.v1</code>,{" "}
              <code>payments.v1</code>, <code>inventory.v1</code>,{" "}
              <code>orders.outcome.v1</code>
            </p>
            <p>
              • <strong>Consumer Groups:</strong> Monitor load balancing and
              partition assignment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
