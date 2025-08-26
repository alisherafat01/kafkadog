#!/usr/bin/env tsx

import { Kafka } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'topic-creator',
  brokers: ['localhost:9092']
})

const admin = kafka.admin()

const topics = [
  // Core Topics
  {
    topic: 'orders.v1',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '604800000' }, // 7 days
      { name: 'segment.ms', value: '86400000' } // 1 day
    ]
  },
  {
    topic: 'payments.v1',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '604800000' }, // 7 days
    ]
  },
  {
    topic: 'inventory.v1',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '604800000' }, // 7 days
    ]
  },
  {
    topic: 'orders.outcome.v1',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '604800000' }, // 7 days
    ]
  },
  
  // Analytics Topics
  {
    topic: 'analytics.pageviews.v1',
    numPartitions: 1,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '2592000000' }, // 30 days
    ]
  },
  {
    topic: 'analytics.snapshots.v1',
    numPartitions: 1,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '2592000000' }, // 30 days
    ]
  },
  
  // Error Handling Topics
  {
    topic: 'orders.retry.v1',
    numPartitions: 1,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '86400000' }, // 1 day
    ]
  },
  {
    topic: 'orders.dlq.v1',
    numPartitions: 1,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '2592000000' }, // 30 days
    ]
  }
]

async function createTopics() {
  try {
    console.log('🔌 Connecting to Kafka...')
    await admin.connect()
    
    console.log('📋 Creating topics...')
    
    for (const topicConfig of topics) {
      try {
        await admin.createTopics({
          topics: [topicConfig],
          waitForLeaders: true
        })
        console.log(`✅ Created topic: ${topicConfig.topic} (${topicConfig.numPartitions} partitions)`)
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Topic already exists: ${topicConfig.topic}`)
        } else {
          console.error(`❌ Failed to create topic ${topicConfig.topic}:`, error.message)
        }
      }
    }
    
    console.log('\n🎉 Topic creation completed!')
    
    // List all topics
    const existingTopics = await admin.listTopics()
    console.log('\n📊 Existing topics:')
    existingTopics.forEach(topic => console.log(`  - ${topic}`))
    
  } catch (error) {
    console.error('❌ Failed to create topics:', error)
    process.exit(1)
  } finally {
    await admin.disconnect()
  }
}

createTopics()

