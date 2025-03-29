import mongoose from "mongoose";

const connectDb = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("Connected to MongoDB");
        });
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/renaltrack`);
        if (connection) {
            console.log("Connected to MongoDB");
        }
    } catch (error) {
        console.log("Error connecting to MongoDB", error);
    }
}

export default connectDb;