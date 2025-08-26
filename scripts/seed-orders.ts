#!/usr/bin/env tsx

import { Kafka } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'

const kafka = new Kafka({
  clientId: 'order-seeder',
  brokers: ['localhost:9092']
})

const producer = kafka.producer()

const sampleProducts = [
  { id: 'product-1', name: 'Laptop', price: 999.99 },
  { id: 'product-2', name: 'Smartphone', price: 699.99 },
  { id: 'product-3', name: 'Headphones', price: 199.99 },
  { id: 'product-4', name: 'Tablet', price: 399.99 },
  { id: 'product-5', name: 'Smartwatch', price: 299.99 },
  { id: 'product-6', name: 'Gaming Console', price: 499.99 },
  { id: 'product-7', name: 'Camera', price: 799.99 },
  { id: 'product-8', name: 'Speaker', price: 149.99 }
]

const sampleUsers = [
  'user-001',
  'user-002', 
  'user-003',
  'user-004',
  'user-005'
]

function generateRandomOrder() {
  const userId = sampleUsers[Math.floor(Math.random() * sampleUsers.length)]
  const numItems = Math.floor(Math.random() * 3) + 1 // 1-3 items
  
  const items = []
  for (let i = 0; i < numItems; i++) {
    const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)]
    const quantity = Math.floor(Math.random() * 3) + 1 // 1-3 quantity
    items.push({
      productId: product.id,
      quantity,
      price: product.price,
      name: product.name
    })
  }
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  return {
    userId,
    items,
    total
  }
}

async function seedOrders(numOrders: number = 5) {
  try {
    console.log('🔌 Connecting to Kafka...')
    await producer.connect()
    
    console.log(`🌱 Seeding ${numOrders} orders...`)
    
    for (let i = 0; i < numOrders; i++) {
      const orderData = generateRandomOrder()
      const orderId = uuidv4()
      
      const orderPlacedEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        correlationId: uuidv4(),
        traceId: uuidv4(),
        version: '1.0.0',
        data: {
          orderId,
          userId: orderData.userId,
          items: orderData.items,
          total: orderData.total,
          ts: new Date().toISOString()
        }
      }
      
      await producer.send({
        topic: 'orders.v1',
        messages: [{
          key: orderId,
          value: JSON.stringify(orderPlacedEvent),
          headers: {
            'x-correlation-id': orderPlacedEvent.correlationId,
            'x-trace-id': orderPlacedEvent.traceId,
            'x-event-id': orderPlacedEvent.id,
            'x-event-type': 'OrderPlaced',
            'x-source': 'order-seeder',
            'x-timestamp': orderPlacedEvent.timestamp
          }
        }]
      })
      
      console.log(`✅ Seeded order ${i + 1}/${numOrders}: ${orderId} ($${orderData.total.toFixed(2)})`)
      
      // Small delay between orders
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('\n🎉 Order seeding completed!')
    console.log('📊 Check Kafka UI at http://localhost:8080 to see the events')
    console.log('📱 Check the frontend dashboard to see order processing')
    
  } catch (error) {
    console.error('❌ Failed to seed orders:', error)
    process.exit(1)
  } finally {
    await producer.disconnect()
  }
}

// Get number of orders from command line argument
const numOrders = parseInt(process.argv[2]) || 5
seedOrders(numOrders)

