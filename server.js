import express from 'express';
import dotenv from 'dotenv';
import connectDb from './src/config/database.js';


const app = express();
dotenv.config();
app.use(express.json());


connectDb();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on url http://localhost:${PORT}`);
}
);
