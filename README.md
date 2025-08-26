# 🐕 kafkadog

**Learn Apache Kafka through hands-on scenarios with a complete, production-like microservices demo.**

kafkadog is a comprehensive learning project that demonstrates Apache Kafka patterns and best practices through a realistic e-commerce order processing system. Built with Next.js, NestJS, and Kafka, it showcases event-driven architecture, choreography sagas, retry mechanisms, and stream processing.

## 🏗️ What This Demonstrates

- **Event-Driven Architecture**: Microservices communicating via Kafka events
- **Choreography Saga Pattern**: Decentralized order processing workflow
- **Producer/Consumer Groups**: Load balancing and partitioning strategies
- **At-Least-Once Delivery**: Idempotency and duplicate handling
- **Retry & Dead Letter Queues**: Error handling with exponential backoff
- **Stream Aggregation**: Real-time analytics using Kafka Streams concepts
- **Observability**: Kafka UI for topic monitoring and debugging

## 🏛️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Order Saga    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (NestJS)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                        ┌─────────────────┐    ┌─────────────────┐
                        │   orders.v1     │    │  orders.outcome │
                        │   (OrderPlaced) │    │  (.v1)          │
                        └─────────────────┘    └─────────────────┘
                                │                       ▲
                                ▼                       │
        ┌─────────────────────────────────────────────────┐
        │                                                 │
        ▼                                                 ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Payment       │    │   Inventory     │    │   Analytics     │
│   Service       │    │   Service       │    │   Service       │
│   (NestJS)      │    │   (NestJS)      │    │   (NestJS)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  payments.v1    │    │  inventory.v1   │    │analytics.snapshots.v1
│  (PaymentAuth/  │    │  (InvReserved/  │    │(TopProductsUpdated)
│   Declined)     │    │   Rejected)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Notification   │    │   Retry/DLQ     │
│   Service       │    │   Workers       │
│   (NestJS)      │    │                 │
└─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Console Logs   │    │  orders.retry   │
│  (Email Sim)    │    │  orders.dlq     │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quickstart

### Prerequisites
- Docker & Docker Compose
- Node.js 20 LTS
- pnpm (recommended) or npm

### 1. Start Everything
```bash
# Clone and setup
git clone <your-repo>
cd kafkadog
pnpm install

# Start all services
docker compose up --build
```

### 2. Access the Applications
- **Frontend Dashboard**: http://localhost:3000
- **Kafka UI**: http://localhost:8080
- **API Gateway**: http://localhost:3001

### 3. Create Your First Order
1. Open http://localhost:3000
2. Navigate to "Create Order"
3. Fill out the form and submit
4. Watch the order flow through the system in real-time!

## 🎯 Scenarios to Explore

### 🟢 Normal Success Path
1. Create an order → `OrderPlaced` event
2. Payment service processes → `PaymentAuthorized`
3. Inventory service reserves stock → `InventoryReserved`
4. Order saga completes → `OrderCompleted`
5. Notification service logs "email sent"

### 🔴 Failure & Recovery Path
1. Create an order (inventory service has random failures)
2. Watch retry attempts in `orders.retry.v1`
3. After max retries → `orders.dlq.v1`
4. Check DLQ metrics at `/metrics/dlq`

### 🔄 Replay & Recovery
1. Use the replay script to reset consumer offsets
2. Watch services reprocess historical events
3. Observe idempotency in action

### 📈 Scaling & Load Balancing
```bash
# Scale payment service to 3 instances
docker compose up --scale payment-service=3

# Watch consumer group rebalancing in Kafka UI
```

## 🏗️ Project Structure

```
kafkadog/
├── frontend/                 # Next.js dashboard
├── backend/                  # NestJS microservices
│   ├── apps/
│   │   ├── api-gateway/     # HTTP endpoints
│   │   ├── order-saga/      # Order workflow orchestration
│   │   ├── payment-service/ # Payment processing
│   │   ├── inventory-service/ # Stock management
│   │   ├── notification-service/ # Email notifications
│   │   └── analytics-service/ # Stream aggregation
│   └── libs/
│       ├── contracts/       # Shared types & validators
│       └── kafka/          # Kafka utilities
├── docker/                  # Docker configuration
├── scripts/                 # Helper scripts
└── README.md               # This file
```

## 📊 Kafka Topics & Events

### Core Topics
- **`orders.v1`** (3 partitions, key: `orderId`)
  - `OrderPlaced`: New order creation
- **`payments.v1`** (3 partitions, key: `orderId`)
  - `PaymentAuthorized`: Successful payment
  - `PaymentDeclined`: Failed payment
- **`inventory.v1`** (3 partitions, key: `orderId`)
  - `InventoryReserved`: Stock reserved
  - `InventoryRejected`: Insufficient stock
- **`orders.outcome.v1`** (3 partitions, key: `orderId`)
  - `OrderCompleted`: Order successful
  - `OrderCancelled`: Order failed

### Analytics Topics
- **`analytics.pageviews.v1`** (1 partition)
  - Page view tracking
- **`analytics.snapshots.v1`** (1 partition)
  - `TopProductsUpdated`: Periodic product rankings

### Error Handling
- **`orders.retry.v1`** (1 partition)
  - Retry events with exponential backoff
- **`orders.dlq.v1`** (1 partition)
  - Dead letter queue for failed events

## 🔧 Development

### Local Development (without Docker)
```bash
# Install dependencies
pnpm install

# Start Kafka locally (requires Kafka installation)
pnpm run kafka:start

# Start services in development mode
pnpm run dev
```

### Useful Scripts
```bash
# Create Kafka topics
pnpm run topics:create

# Seed demo data
pnpm run seed

# Replay events
pnpm run replay

# Reset everything
pnpm run reset
```

## 🐛 Troubleshooting

### Common Issues

**Kafka connection refused**
```bash
# Check if Kafka is running
docker compose ps kafka

# Restart Kafka
docker compose restart kafka
```

**Service health check failures**
```bash
# Check service logs
docker compose logs <service-name>

# Restart specific service
docker compose restart <service-name>
```

**Start fresh**
```bash
# Remove all containers and volumes
docker compose down -v

# Rebuild and start
docker compose up --build
```

### Network Issues
- Ensure ports 3000, 3001, 8080, and 9092 are available
- Check Docker network configuration
- Verify service dependencies in docker-compose.yml

## 📚 Key Kafka Concepts Demonstrated

### 1. **Partitioning & Ordering**
- `orderId` as partition key ensures order events arrive in sequence
- Multiple partitions enable parallel processing
- Consumer groups balance load across instances

### 2. **At-Least-Once Delivery**
- Events may be delivered multiple times
- Idempotent consumers handle duplicates gracefully
- Offset management tracks processing progress

### 3. **Consumer Groups**
- Services scale horizontally by adding instances
- Automatic partition rebalancing
- Load distribution across group members

### 4. **Retry & Dead Letter Queues**
- Exponential backoff for transient failures
- Configurable retry attempts
- Failed events moved to DLQ for manual inspection

### 5. **Event Sourcing & CQRS**
- Order state derived from event stream
- In-memory state tables for correlation
- Event replay capabilities

## 🚀 Next Steps

### Advanced Patterns to Explore
- **Schema Registry**: Replace JSON with Avro/Protobuf
- **Exactly-Once Semantics**: Transactional producers
- **Outbox Pattern**: Database consistency with event publishing
- **Event Sourcing**: Persistent event stores
- **CQRS**: Separate read/write models

### Production Considerations
- **Monitoring**: Prometheus + Grafana
- **Logging**: Centralized log aggregation
- **Security**: SASL/SSL authentication
- **Performance**: Tuning partition counts and retention

## 🤝 Contributing

This is a learning project! Feel free to:
- Add new scenarios
- Improve error handling
- Enhance the UI
- Add more Kafka patterns
- Submit issues and PRs

## 📄 License

MIT License - feel free to use this for learning and commercial projects.

---

**Happy Kafka-ing! 🚀**

*Built with ❤️ for the Kafka community*

