import mongoose from "mongoose";

function dbConnection() {
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(() => {
            console.log('Connected to the database');
        })
        .catch((err) => {
            console.error(`Database connection error: ${err}`);
        });
}

export default dbConnection;
