import mongoose, { Schema } from "mongoose";

// Schema

const postSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    description: { type: String, required: true },
    image: { type: String },
    likes: [{ type: String }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }]
},
    { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;