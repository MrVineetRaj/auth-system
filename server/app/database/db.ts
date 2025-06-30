import mongoose from 'mongoose';
import envConf from '../../envConf';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(envConf.MONGO_URI, {
      dbName: 'auth-system',
      connectTimeoutMS: 3 * 60 * 1000, // Set connection timeout to 10 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(
        'An unknown error occurred while connecting to MongoDB',
        error
      );
    }
    process.exit(1);
  }
};

export default connectDB;
