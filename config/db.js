// db.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbURI = process.env.MONGODB_URI;

export async function connectDB() {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1); 
  }
}

export default mongoose;
