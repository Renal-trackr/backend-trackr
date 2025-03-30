import mongoose from "mongoose";
import seedService from "../services/seed.service.js"; // Adjust the path as needed

const connectDb = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("Connected to MongoDB");
        });

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(async () => {
            console.log("Connected to MongoDB");

            // Initialize database with required data
            await seedService.initialize();
        }).catch((error) => {
            console.error("Error connecting to MongoDB:", error);
        });
    } catch (error) {
        console.log("Error connecting to MongoDB", error);
    }
};

export default connectDb;