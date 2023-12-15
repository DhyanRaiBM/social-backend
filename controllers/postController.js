import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Comment from "../models/commentModal.js";
import { v4 as uuidv4 } from 'uuid'

export const createPost = async (req, res, next) => {
    try {
        const { userId } = req.body.user;
        const { description, image } = req.body;

        if (!description) {
            next("You must provide a description");
            return;
        }

        const post = await Post.create({
            userId,
            description,
            image,
        });

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: post,
        })

    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const getPosts = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { search } = req.body;

        const user = await User.findById(userId);
        const friends = user?.friends || [];
        let postsRes = [];
        friends.push(userId);

        const searchPostQuery = {
            $or: [
                {
                    description: { regex: search, $options: "i" },
                },
            ],
        };

        const posts = await Post.find(search ? searchPostQuery : {})
            .populate({
                path: "userId",
                select: "firstName lastName location profileUrl -password"
            }).sort({ _id: -1 })

        const friendsPosts = posts?.filter((post) => {
            return friends?.includes(post?.userId);
        })

        const otherPosts = posts?.filter((post) => {
            return !friends?.includes(post?.userId);
        })

        if (friendsPosts.length > 0) {
            postsRes = search ? [...friendsPosts, ...otherPosts] : friendsPosts;
        } else {
            postsRes = posts;
        }

        res.status(201).json({
            success: true,
            message: "Successful",
            data: postsRes,
        })

    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const getPost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id).populate({
            path: "userId",
            select: "firstName lastName profileUrl location -password",
        });

        res.status(200).json({
            success: true,
            message: "Successful",
            data: post,
        });
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const getUserPost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.find({ userId: id }).populate({
            path: "userId",
            select: "firstName lastName profileUrl location -password",
        }).sort({ _id: -1 });

        res.status(200).json({
            success: true,
            message: "Successful",
            data: post,
        });
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;

        const postComments = await Comment.find({ postId })
            .populate({
                path: "userId",
                select: "firstName lastName profileUrl location -password"
            })
            .populate({
                path: "replies.userId",
                select: "firstName lastName profileUrl location -password"
            })
            .sort({ _id: -1 })

        res.status(200).json({
            success: "True",
            message: "Comments fetched successfully",
            data: postComments
        })
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const likePost = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { id } = req.params;

        const post = await Post.findById(id);

        const index = post.likes.findIndex((pid) => pid === String(userId));

        if (index === -1) {
            post.likes.push(userId);
        }
        else {
            post.likes = post.likes.filter((pid) => pid !== String(userId));
        }

        const newPost = await Post.findByIdAndUpdate(id, post, {
            new: true,
        });

        res.status(200).json({
            success: true,
            message: "Liking done",
            data: newPost,
        });

    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const likePostComment = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { id, rid } = req.params;

        if (rid === undefined || rid === null || rid === false) {
            const post = await Comment.findById(id);
            console.log(post);

            const index = post?.likes.findIndex((pid) => pid === String(userId));

            if (index === -1) {
                post.likes.push(userId);
            }
            else {
                post.likes = post?.likes.filter((pid) => pid !== String(userId));
            }

            const newPost = await Comment.findByIdAndUpdate(id, post, {
                new: true,
            });
            res.status(201).json(newPost);
        }
        else {
            const replyComments = await Comment.findOne(
                { _id: id },
                {
                    replies: {
                        $elemMatch: {
                            rid: rid,
                        }
                    }
                }
            )

            const index = replyComments?.replies[0]?.likes.findIndex(
                (i) => i === String(userId)
            )

            if (index === -1) {
                replyComments?.replies[0]?.likes.push(userId);
            }
            else {
                replyComments.replies[0].likes = replyComments?.replies[0]?.likes.filter(
                    (i) => i !== String(userId)
                );
            }

            const query = { _id: id, "replies.rid": rid };

            const updated = {
                $set: {
                    "replies.$.likes": replyComments?.replies[0]?.likes,
                }
            }

            const result = await Comment.findOneAndUpdate(query, updated);

            res.status(201).json(result);
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const commentPost = async (req, res) => {
    try {
        const { comment, from } = req.body;
        const { userId } = req.body.user;
        const { id } = req.params;

        if (comment === null) {
            res.status(404).json({ message: "Comment cannot be empty" });
        }
        const newComment = new Comment({ comment, from, userId, postId: id });

        await newComment.save();

        const post = await Post.findById(id);

        post.comments.push(newComment._id);

        const updatedPost = await Post.findByIdAndUpdate(id, post, {
            new: true,
        });

        res.status(201).json(updatedPost)

    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const replyPostComment = async (req, res) => {
    try {
        const { comment, from, replyAt } = req.body;
        const { userId } = req.body.user;
        const { id } = req.params;

        if (comment === null) {
            res.status(404).json({ message: "Comment cannot be empty" });
        }
        const commentInfo = await Comment.findById(id);

        commentInfo.replies.push({
            rid: String(uuidv4()),
            comment,
            replyAt,
            from,
            userId,
            createdAt: Date.now(),
        });

        await commentInfo.save();

        res.status(201).json(commentInfo)

    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        await Post.findByIdAndDelete(id);

        res.status(201).json({
            success: true,
            message: "Post deleted successfully",
        })
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}