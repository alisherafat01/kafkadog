#!/usr/bin/env tsx

import { Kafka } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'offset-resetter',
  brokers: ['localhost:9092']
})

const admin = kafka.admin()

const consumerGroups = [
  'order-saga-group',
  'payment-service-group',
  'inventory-service-group',
  'notification-service-group',
  'analytics-service-group'
]

const topics = [
  'orders.v1',
  'payments.v1',
  'inventory.v1',
  'orders.outcome.v1'
]

async function resetOffsets() {
  try {
    console.log('🔌 Connecting to Kafka...')
    await admin.connect()
    
    console.log('📋 Available consumer groups:')
    const groups = await admin.listGroups()
    groups.groups.forEach(group => {
      console.log(`  - ${group.groupId} (${group.members.length} members)`)
    })
    
    console.log('\n🔄 Resetting offsets for consumer groups...')
    
    for (const groupId of consumerGroups) {
      try {
        // Get current offsets
        const offsets = await admin.fetchOffsets({ groupId, topics })
        
        console.log(`\n📊 Current offsets for ${groupId}:`)
        offsets.forEach(offset => {
          console.log(`  ${offset.topic}[${offset.partition}]: ${offset.offset}`)
        })
        
        // Reset to earliest offset (beginning of topic)
        await admin.resetOffsets({
          groupId,
          topic: topics[0], // Reset first topic as example
          earliest: true
        })
        
        console.log(`✅ Reset ${groupId} offsets to earliest`)
        
      } catch (error: any) {
        if (error.message.includes('not found')) {
          console.log(`ℹ️  Consumer group not found: ${groupId}`)
        } else {
          console.error(`❌ Failed to reset ${groupId}:`, error.message)
        }
      }
    }
    
    console.log('\n🎉 Offset reset completed!')
    console.log('💡 Services will now reprocess events from the beginning')
    console.log('📊 Check Kafka UI to see consumer group rebalancing')
    
  } catch (error) {
    console.error('❌ Failed to reset offsets:', error)
    process.exit(1)
  } finally {
    await admin.disconnect()
  }
}

async function showOffsetInfo() {
  try {
    console.log('🔌 Connecting to Kafka...')
    await admin.connect()
    
    console.log('📊 Consumer Group Information:')
    
    for (const groupId of consumerGroups) {
      try {
        const offsets = await admin.fetchOffsets({ groupId, topics })
        console.log(`\n${groupId}:`)
        
        if (offsets.length === 0) {
          console.log('  No active consumers')
          continue
        }
        
        offsets.forEach(offset => {
          console.log(`  ${offset.topic}[${offset.partition}]: ${offset.offset}`)
        })
        
      } catch (error: any) {
        if (error.message.includes('not found')) {
          console.log(`  ${groupId}: Not found`)
        } else {
          console.log(`  ${groupId}: Error - ${error.message}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to get offset info:', error)
  } finally {
    await admin.disconnect()
  }
}

// Parse command line arguments
const command = process.argv[2]

switch (command) {
  case 'reset':
    resetOffsets()
    break
  case 'info':
    showOffsetInfo()
    break
  default:
    console.log('Usage:')
    console.log('  npm run replay reset    - Reset all consumer group offsets to earliest')
    console.log('  npm run replay info     - Show current offset information')
    console.log('\nExamples:')
    console.log('  npm run replay reset    # Reset offsets to replay all events')
    console.log('  npm run replay info     # Check current offset positions')
}

