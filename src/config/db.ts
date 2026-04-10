import dns from 'dns';
import mongoose from 'mongoose';

// Force reliable DNS (VERY IMPORTANT)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  console.log(uri);
  if (!uri) throw new Error('MONGO_URI not defined in .env');

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
// import mysql from "mysql2/promise";
// import { drizzle } from "drizzle-orm/mysql2";

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME || "myapp",
//   waitForConnections: true,
//   connectionLimit: 10,
// });

// export const db = drizzle(pool);

// console.log("MySQL connected");