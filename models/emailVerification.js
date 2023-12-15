import mongoose, { Schema } from "mongoose";

// Schema

const emailVerificaitonSchema = new Schema({
    userId: String,
    token: String,
    createdAt: Date,
    expiresAt: Date
})

const Verification = mongoose.model('Verification', emailVerificaitonSchema);

export default Verification;