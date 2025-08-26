#!/bin/bash

PID_FILE=".service-pids"

if [ ! -f "$PID_FILE" ]; then
    echo "❌ No PID file found. No services are running or PID file was removed."
    exit 1
fi

echo "🛑 Stopping all services..."

# Stop each service gracefully
while read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then
        echo "🔄 Stopping process $pid..."
        kill "$pid" 2>/dev/null
        sleep 1
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            echo "💀 Force killing process $pid..."
            kill -9 "$pid" 2>/dev/null
        fi
    else
        echo "⚠️  Process $pid is not running"
    fi
done < "$PID_FILE"

# Remove PID file
rm -f "$PID_FILE"

echo "✅ All services stopped"

# Also stop Kafka if running
echo "🔄 Stopping Kafka..."
pnpm run kafka:down

echo "🎉 All services and Kafka stopped successfully!"
