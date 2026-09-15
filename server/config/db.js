const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  const dbOptions = {};
  if (process.env.MONGO_DB_NAME) {
    dbOptions.dbName = process.env.MONGO_DB_NAME;
  } else if (!process.env.MONGO_URI.includes('/', 14)) {
    // If no db path in uri, default db name
    dbOptions.dbName = 'expensedb';
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, dbOptions);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;