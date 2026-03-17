const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Item = require('../models/Item');

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@reunite.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      stats: {
        itemsPosted: 0,
        itemsFound: 0,
        itemsRecovered: 0,
        totalRewardsPaid: 0,
        totalRewardsReceived: 0
      }
    });
    await admin.save();
    console.log('Created admin user');

    // Create test users
    const testUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1234567890',
        isVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+0987654321',
        isVerified: true
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1122334455',
        isVerified: true
      }
    ];

    const createdUsers = await User.insertMany(testUsers);
    console.log('Created test users');

    // Create sample items
    const sampleItems = [
      {
        title: 'Lost iPhone 13 Pro',
        description: 'Black iPhone 13 Pro with leather case. Lost near Central Park on March 15th. Contains important photos.',
        type: 'lost',
        category: 'electronics',
        tags: ['iphone', 'apple', 'phone', 'black'],
        location: 'Central Park, New York',
        coordinates: { latitude: 40.7829, longitude: -73.9654 },
        reward: 100,
        postedBy: createdUsers[0]._id,
        additionalInfo: {
          color: 'Black',
          brand: 'Apple',
          model: 'iPhone 13 Pro',
          serialNumber: 'ABC123XYZ',
          dateLost: new Date('2024-03-15')
        }
      },
      {
        title: 'Found Gold Ring',
        description: 'Gold wedding ring found in coffee shop. Has inscription "Forever 2020". Very sentimental value.',
        type: 'found',
        category: 'jewelry',
        tags: ['ring', 'gold', 'wedding', 'jewelry'],
        location: 'Starbucks, Times Square',
        coordinates: { latitude: 40.7580, longitude: -73.9855 },
        reward: 0,
        postedBy: createdUsers[1]._id,
        additionalInfo: {
          color: 'Gold',
          brand: 'Unknown',
          distinguishingFeatures: 'Inscription: Forever 2020',
          dateFound: new Date('2024-03-16')
        }
      },
      {
        title: 'Lost MacBook Pro',
        description: '14-inch MacBook Pro with M1 chip. Space gray color. Contains work documents. Last seen at airport.',
        type: 'lost',
        category: 'electronics',
        tags: ['macbook', 'apple', 'laptop', 'space-gray'],
        location: 'JFK Airport Terminal 4',
        coordinates: { latitude: 40.6413, longitude: -73.7781 },
        reward: 500,
        postedBy: createdUsers[2]._id,
        additionalInfo: {
          color: 'Space Gray',
          brand: 'Apple',
          model: 'MacBook Pro 14"',
          serialNumber: 'XYZ789ABC',
          dateLost: new Date('2024-03-14')
        }
      },
      {
        title: 'Found Wallet',
        description: 'Brown leather wallet containing ID cards and credit cards. Found near subway station.',
        type: 'found',
        category: 'accessories',
        tags: ['wallet', 'leather', 'cards', 'id'],
        location: 'Times Square Subway Station',
        coordinates: { latitude: 40.7558, longitude: -73.9862 },
        reward: 0,
        postedBy: createdUsers[0]._id,
        additionalInfo: {
          color: 'Brown',
          brand: 'Unknown',
          distinguishingFeatures: 'Multiple card slots',
          dateFound: new Date('2024-03-17')
        }
      },
      {
        title: 'Lost Cat - Orange Tabby',
        description: 'Orange tabby cat named Whiskers. Very friendly, wearing blue collar. Lost from backyard.',
        type: 'lost',
        category: 'pets',
        tags: ['cat', 'orange', 'tabby', 'whiskers'],
        location: 'Brooklyn, Park Slope',
        coordinates: { latitude: 40.6710, longitude: -73.9775 },
        reward: 200,
        postedBy: createdUsers[1]._id,
        additionalInfo: {
          color: 'Orange',
          distinguishingFeatures: 'Blue collar, responds to Whiskers',
          dateLost: new Date('2024-03-13')
        }
      },
      {
        title: 'Found Keys',
        description: 'Set of keys with Toyota key fob and house keys. Found in parking lot.',
        type: 'found',
        category: 'keys',
        tags: ['keys', 'toyota', 'car', 'house'],
        location: 'Mall Parking Lot',
        coordinates: { latitude: 40.7489, longitude: -73.9680 },
        reward: 0,
        postedBy: createdUsers[2]._id,
        additionalInfo: {
          brand: 'Toyota',
          distinguishingFeatures: 'Key fob with Toyota logo',
          dateFound: new Date('2024-03-18')
        }
      }
    ];

    await Item.insertMany(sampleItems);
    console.log('Created sample items');

    // Update user stats
    await User.findByIdAndUpdate(createdUsers[0]._id, {
      $inc: { 'stats.itemsPosted': 2 }
    });
    await User.findByIdAndUpdate(createdUsers[1]._id, {
      $inc: { 'stats.itemsPosted': 2 }
    });
    await User.findByIdAndUpdate(createdUsers[2]._id, {
      $inc: { 'stats.itemsPosted': 2 }
    });

    console.log('Database seeded successfully!');
    console.log('\nTest Users:');
    console.log('Admin: admin@reunite.com / admin123');
    console.log('John: john@example.com / password123');
    console.log('Jane: jane@example.com / password123');
    console.log('Mike: mike@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedData();
