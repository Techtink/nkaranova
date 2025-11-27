import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      const name = collection.collectionName;
      // Keep settings, but clear user-generated content
      if (!['settings', 'roles'].includes(name)) {
        await collection.deleteMany({});
        console.log(`Cleared: ${name}`);
      } else {
        console.log(`Skipped: ${name}`);
      }
    }

    console.log('\nDatabase cleared successfully!');
    console.log('You can now start fresh with new data.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

clearData();
