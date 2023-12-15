import mongoose, { Schema } from "mongoose";

// Schema

const passwordResetSchema = new Schema({
    userId: { type: String, required: true },
    email: { type: String, required: true },
    token: String,
    createdAt: Date,
    expiresAt: Date,
})

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;