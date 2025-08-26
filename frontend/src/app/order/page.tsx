"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Trash2, ArrowLeft } from "lucide-react";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export default function CreateOrder() {
  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    {
      productId: "product-1",
      quantity: 1,
      price: 29.99,
      name: "Sample Product 1",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: `product-${items.length + 1}`,
        quantity: 1,
        price: 19.99,
        name: `Sample Product ${items.length + 1}`,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that all required fields are filled
    const hasEmptyNames = items.some(
      (item) => !item.name || item.name.trim() === ""
    );
    if (hasEmptyNames) {
      setError("All product names must be filled");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name.trim(),
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setOrderId(result.orderId);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create order");
      }
    } catch (err) {
      setError("Failed to connect to API Gateway");
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="text-success-600 mb-4">
            <ShoppingCart className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Order Created Successfully! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            Your order has been placed and is now flowing through the system.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="font-mono text-lg font-bold text-gray-900">
              {orderId}
            </p>
          </div>
          <div className="space-y-3">
            <Link href="/orders" className="btn btn-primary w-full">
              View All Orders
            </Link>
            <button
              onClick={() => {
                setOrderId(null);
                setUserId("");
                setItems([
                  {
                    productId: "product-1",
                    quantity: 1,
                    price: 29.99,
                    name: "Sample Product 1",
                  },
                ]);
              }}
              className="btn btn-secondary w-full"
            >
              Create Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
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
        <div className="flex items-center space-x-3 mb-6">
          <ShoppingCart className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User ID */}
          <div>
            <label htmlFor="userId" className="label">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="input"
              required
            />
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="label mb-0">Order Items</label>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                >
                  <div>
                    <label className="label">Product ID</label>
                    <input
                      type="text"
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, "productId", e.target.value)
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(index, "name", e.target.value)
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", parseInt(e.target.value))
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="label">Price</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", parseFloat(e.target.value))
                        }
                        className="input"
                        required
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="btn bg-danger-600 hover:bg-danger-700 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Order Total:
              </span>
              <span className="text-2xl font-bold text-primary-600">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <p className="text-danger-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Order..." : "Create Order"}
          </button>
        </form>
      </div>
    </div>
  );
}
