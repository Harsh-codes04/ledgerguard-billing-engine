import mongoose from "mongoose";

export async function connectDB(uri = process.env.MONGO_URI || process.env.MONGODB_URI) {
  if (!uri) {
    console.error("MongoDB is not configured. Set MONGO_URI in server/.env.");
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB.");
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection was lost.");
});
