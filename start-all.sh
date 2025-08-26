#!/bin/bash

# PID file to store process IDs for proper shutdown
PID_FILE=".service-pids"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down all services..."
    if [ -f "$PID_FILE" ]; then
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                echo "🔄 Stopping process $pid..."
                kill "$pid" 2>/dev/null
                sleep 1
                if kill -0 "$pid" 2>/dev/null; then
                    echo "💀 Force killing process $pid..."
                    kill -9 "$pid" 2>/dev/null
                fi
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Clear PID file
rm -f "$PID_FILE"

echo "🚀 Starting Kafka and Kafka UI..."
pnpm run kafka:up

echo "⏳ Waiting for Kafka to be ready..."
sleep 10

echo "🔧 Starting all backend services..."

# Start API Gateway
echo "📡 Starting API Gateway on port 3001..."
KAFKA_BROKERS=localhost:9092 KAFKA_CLIENT_ID=api-gateway PORT=3001 NODE_ENV=development pnpm run dev:api-gateway &
echo $! >> "$PID_FILE"
sleep 3

# Start Inventory Service
echo "📦 Starting Inventory Service on port 3004..."
KAFKA_BROKERS=localhost:9092 KAFKA_CLIENT_ID=inventory-service PORT=3004 NODE_ENV=development pnpm run dev:inventory-service &
echo $! >> "$PID_FILE"
sleep 3

# Start Payment Service
echo "💳 Starting Payment Service on port 3003..."
KAFKA_BROKERS=localhost:9092 KAFKA_CLIENT_ID=payment-service PORT=3003 NODE_ENV=development pnpm run dev:payment-service &
echo $! >> "$PID_FILE"
sleep 3

# Start Order Saga Service
echo "🎭 Starting Order Saga Service on port 3007..."
KAFKA_BROKERS=localhost:9092 KAFKA_CLIENT_ID=order-saga PORT=3007 NODE_ENV=development pnpm run dev:order-saga &
echo $! >> "$PID_FILE"
sleep 3

# Start Notification Service
echo "📧 Starting Notification Service on port 3005..."
KAFKA_BROKERS=localhost:9092 KAFKA_CLIENT_ID=notification-service PORT=3005 NODE_ENV=development pnpm run dev:notification-service &
echo $! >> "$PID_FILE"
sleep 3

# Start Analytics Service
echo "📊 Starting Analytics Service on port 3006..."
KAFKA_BROKERS=localhost:9092 KAFKA_CLIENT_ID=analytics-service PORT=3006 NODE_ENV=development pnpm run dev:analytics-service &
echo $! >> "$PID_FILE"
sleep 3

echo "⏳ Waiting for all services to start..."
sleep 10

echo "🌐 Starting Frontend..."
pnpm run dev:frontend &
echo $! >> "$PID_FILE"

echo "✅ All services started!"
echo ""
echo "📋 Service Status:"
echo "  • Kafka: localhost:9092"
echo "  • Kafka UI: http://localhost:8080"
echo "  • Frontend: http://localhost:3000"
echo "  • API Gateway: http://localhost:3001"
echo "  • Inventory Service: http://localhost:3004"
echo "  • Payment Service: http://localhost:3003"
echo "  • Order Saga Service: http://localhost:3007"
echo "  • Notification Service: http://localhost:3005"
echo "  • Analytics Service: http://localhost:3006"
echo ""
echo "🔍 Check health endpoints:"
echo "  • curl http://localhost:3001/health"
echo "  • curl http://localhost:3003/health"
echo "  • curl http://localhost:3004/health"
echo "  • curl http://localhost:3005/health"
echo "  • curl http://localhost:3006/health"
echo "  • curl http://localhost:3007/health"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo "📊 To view logs: Check individual terminal windows"

# Wait for user interrupt
wait
