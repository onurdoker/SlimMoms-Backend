import mongoose from "mongoose";


const initMongoDB = async () => {
  try {
    const {
      MONGODB_USER,
      MONGODB_PASSWORD,
      MONGODB_URL,
      MONGODB_DB,
      MONGODB_OPTIONS,
    } = process.env;
    
    const encodedPassword = encodeURIComponent(MONGODB_PASSWORD ?? "");
    const optionsPart = MONGODB_OPTIONS ? `?${MONGODB_OPTIONS}` : "";
    const connectionString = `mongodb+srv://${MONGODB_USER}:${encodedPassword}@${MONGODB_URL}/${MONGODB_DB}${optionsPart}`;
    
    await mongoose.connect(connectionString);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
  }
};

export default initMongoDB;