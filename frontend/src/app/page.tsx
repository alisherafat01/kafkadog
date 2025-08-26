"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ShoppingCart,
  CreditCard,
  Package,
  Mail,
  BarChart3,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface ServiceHealth {
  name: string;
  status: "up" | "down" | "unknown";
  url: string;
}

interface AnalyticsData {
  topProducts: Array<{
    productId: string;
    count: number;
    revenue: number;
  }>;
  totalOrders: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: "API Gateway", status: "unknown", url: "http://localhost:3001" },
    { name: "Order Saga", status: "unknown", url: "http://localhost:3007" },
    {
      name: "Payment Service",
      status: "unknown",
      url: "http://localhost:3003",
    },
    {
      name: "Inventory Service",
      status: "unknown",
      url: "http://localhost:3004",
    },
    {
      name: "Notification Service",
      status: "unknown",
      url: "http://localhost:3005",
    },
    {
      name: "Analytics Service",
      status: "unknown",
      url: "http://localhost:3006",
    },
  ]);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkServicesHealth();
    fetchAnalytics();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      checkServicesHealth();
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkServicesHealth = async () => {
    try {
      // First check API Gateway health
      const gatewayResponse = await fetch("http://localhost:3001/health");
      let gatewayStatus = "down";
      if (gatewayResponse.ok) {
        const gatewayData = await gatewayResponse.json();
        gatewayStatus = gatewayData.status === "up" ? "up" : "down";
      }

      // Then check other services
      const response = await fetch("http://localhost:3001/health/services");
      if (response.ok) {
        const data = await response.json();
        const serviceStatuses = data.details || {};

        setServices(
          services.map((service) => {
            if (service.name === "API Gateway") {
              return {
                ...service,
                status: gatewayStatus as "up" | "down" | "unknown",
              };
            }

            // Map service names to match the health check response
            let serviceKey = "";
            switch (service.name) {
              case "Order Saga":
                serviceKey = "order-saga";
                break;
              case "Payment Service":
                serviceKey = "payment-service";
                break;
              case "Inventory Service":
                serviceKey = "inventory-service";
                break;
              case "Notification Service":
                serviceKey = "notification-service";
                break;
              case "Analytics Service":
                serviceKey = "analytics-service";
                break;
              default:
                serviceKey = "";
            }

            const healthStatus = serviceStatuses[serviceKey];
            return {
              ...service,
              status: healthStatus?.status === "up" ? "up" : "down",
            };
          })
        );
      }
    } catch (error) {
      // If gateway is down, mark all services as down
      setServices(
        services.map((service) => ({
          ...service,
          status: "down",
        }))
      );
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("http://localhost:3001/analytics/metrics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case "down":
        return <XCircle className="w-5 h-5 text-danger-500" />;
      default:
        return <Clock className="w-5 h-5 text-warning-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "text-success-600";
      case "down":
        return "text-danger-600";
      default:
        return "text-warning-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to kafkadog! 🐕
        </h1>
        <p className="text-lg text-gray-600">
          Learn Apache Kafka through hands-on scenarios with a complete,
          production-like microservices demo
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/order" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Create Order
              </h3>
              <p className="text-gray-600">
                Place a new order and watch it flow through the system
              </p>
            </div>
          </div>
        </Link>

        <Link href="/orders" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-success-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                View Orders
              </h3>
              <p className="text-gray-600">
                Monitor order status and event flow in real-time
              </p>
            </div>
          </div>
        </Link>

        <a
          href="http://localhost:8080"
          target="_blank"
          rel="noopener noreferrer"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-warning-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Kafka UI</h3>
              <p className="text-gray-600">
                Explore topics, partitions, and consumer groups
              </p>
              <ExternalLink className="w-4 h-4 text-gray-400 mt-1" />
            </div>
          </div>
        </a>
      </div>

      {/* Service Health */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Service Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center space-x-3 p-3 rounded-lg border"
            >
              {getStatusIcon(service.status)}
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <p className={`text-sm ${getStatusColor(service.status)}`}>
                  {service.status === "up"
                    ? "Healthy"
                    : service.status === "down"
                      ? "Down"
                      : "Unknown"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Analytics Overview
        </h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {analytics.totalOrders}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                ${analytics.totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">
                {analytics.topProducts.length}
              </div>
              <div className="text-sm text-gray-600">Products Tracked</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            Analytics service is not available
          </div>
        )}
      </div>

      {/* Top Products */}
      {analytics && analytics.topProducts.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top Products
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topProducts.slice(0, 5).map((product) => (
                  <tr key={product.productId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${product.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Getting Started */}
      <div className="card bg-primary-50 border-primary-200">
        <h2 className="text-xl font-semibold text-primary-900 mb-4">
          🚀 Getting Started
        </h2>
        <div className="space-y-3 text-primary-800">
          <p>
            1. <strong>Create an Order:</strong> Use the "Create Order" button
            above to place your first order
          </p>
          <p>
            2. <strong>Watch the Flow:</strong> Monitor how the order flows
            through payment, inventory, and completion
          </p>
          <p>
            3. <strong>Explore Kafka UI:</strong> Open the Kafka UI to see
            topics, partitions, and consumer groups
          </p>
          <p>
            4. <strong>Scale Services:</strong> Try scaling services with{" "}
            <code>docker compose up --scale payment-service=3</code>
          </p>
          <p>
            5. <strong>Check Logs:</strong> Monitor service logs to see event
            processing in real-time
          </p>
        </div>
      </div>
    </div>
  );
}
