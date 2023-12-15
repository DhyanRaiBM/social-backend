import mongoose, { Schema } from "mongoose";

// Schema
const commentSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post"
    },
    comment: { type: String },
    from: { type: String, required: true },
    replies: [{
        rid: { type: String },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        from: { type: String },
        replyAt: { type: String },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now() },
        updatedAt: { type: Date, default: Date.now() },
        likes: [{ type: String }]
    }],
    likes: [{ type: String }]
}, { timestamps: true })

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;