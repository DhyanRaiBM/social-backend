import mongoose from "mongoose";
import Verification from "../models/emailVerification.js";
import User from "../models/userModel.js";
import { comparePassword, createJWT, hashString } from "../utils/index.js";
import PasswordReset from "../models/passwordReset.js";
import { sendResetPasswordLink } from "../utils/sendEmail.js";
import FriendRequest from "../models/friendRequest.js"

export const verifyEmail = async (req, res) => {
    const { userId, token } = req.params;

    try {
        const result = await Verification.findOne({ userId });

        if (result) {
            const { expiresAt, token: hashedToken } = result;

            //-Token has expired :
            if (expiresAt < Date.now()) {
                Verification.findOneAndDelete({ userId })
                    .then(() => {
                        User.findOneAndDelete({ _id: userId })
                            .then(() => {
                                const message = "Verification token has expired."
                                res.redirect(`/users/verified?status=error&message=${message}`)
                            })
                            .catch((err) => {
                                res.redirect(`/users/verified?status=error&message=`)
                            })
                    })
                    .catch((err) => {
                        res.redirect(`/users/verified?status=error&message=`);
                    })

            }
            //-Token is valid:
            else {
                comparePassword(token, hashedToken).then((isMatch) => {
                    if (isMatch) {
                        User.findOneAndUpdate({ _id: userId }, { verified: true })
                            .then(() => {
                                Verification.findOneAndDelete({ userId })
                                    .then(() => {
                                        const message = "Email verified successfully"
                                        res.redirect(`/users/verified?status=success&message=${message}`);
                                    })
                                    .catch((err) => {
                                        res.redirect(`/users/verified?status=error&message=`);
                                    })

                            })
                            .catch((err) => {
                                const message = "Verification failed or link is expired";
                                res.redirect(`/users/verified?status=error&message=${message}`);
                            })
                    }
                    //-Invalid token:
                    else {
                        const message = "Verification failed or link is expired";
                        res.redirect(`/users/verified?status=error&message=${message}`);
                    }
                }).catch((err) => {
                    res.redirect(`/users/verified?status=error&message=`)
                })
            }
        }
        else {
            const message = "Invalid Verification link..Try again later";
            res.redirect(`/users/verified?status=error&message=${message}`);
        }


    } catch (e) {
        console.log(e);
        res.redirect(`/users/verified?status=error&message=`)
    }

}

export const requestPasswordReset = async (req, res) => {
    try {

        const { email } = req.body;
        const user = await User.findOne({ email: email });


        if (!user) {
            return res.status(404).json({
                status: "FAILED",
                message: "Email address not found",
            })
        }

        const existingRequest = await PasswordReset.findOne({ email: email });

        if (existingRequest) {
            if (existingRequest.expiresAt > Date.now()) {
                return res.status(201).json({
                    status: "PENDING",
                    message: "Reset Password link has already been sent to your email",
                })
            }
            await PasswordReset.findOneAndDelete({ email });
        }
        await sendResetPasswordLink(user, res);
    }
    catch (e) {
        console.log(e);
        res.status(404).json({ message: e.message })
    }
}

export const resetPassword = async (req, res) => {
    const { userId, token } = req.params;

    try {
        //-find record:
        const user = await User.findOne({ _id: userId });
        if (!user) {
            const message = "Invalid link.Please try again ";
            res.redirect(`/users/resetpassword?status=error&message=${message}`);
        }

        const resetPassword = await PasswordReset.findOne({ userId });
        if (!resetPassword) {
            const message = "Invalid link.Please try again.";
            res.redirect(`/users/resetpassword?status=error&message=${message}`);
        }

        const { expiresAt, token: hashedToken } = resetPassword;

        if (expiresAt < Date.now()) {
            const message = "This Link has Expired";
            res.redirect(`/users/resetpassword?status=error&message=${message}`);
        }
        else {
            const isMatch = await comparePassword(token, hashedToken);

            if (!isMatch) {
                const message = "Invalid link.Please try again.";
                res.redirect(`/users/resetpassword?status=error&message=${message}`);
            }
            else {
                res.redirect(`/users/resetpassword?id=${userId}`);
            }
        }

    }
    catch (e) {
        console.log(e);
        res.status(404).json({ message: e.message });
    }
}

export const changePassword = async (req, res) => {
    try {
        const { userId, password } = req.query;
        console.log(req.query);
        const hashedPassword = await hashString(password);

        const user = await User.findOneAndUpdate({ _id: userId }, { password: hashedPassword });
        if (user) {
            await PasswordReset.findOneAndDelete({ userId });

            const message = "Your password has been successfully reset"
            res.redirect(`/users/resetpassword?status=success&message=${message}`);

        }

    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const getUser = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { id } = req.params;

        const user = await User.findById(id ?? userId).populate({
            path: "friends",
            select: "-password"
        });

        if (!user) {
            return res.status(404).send({
                message: "User not found",
                success: false,
            })
        }

        user.password = undefined;

        res.status(200).json({
            success: true,
            user: user,
        })

    } catch (err) {
        console.log(err);
        res.status(404).json({
            message: "Auth error",
            success: false,
            error: err.message,
        });
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const { firstName, lastName, location, profession, profileUrl } = req.body;
        console.log(req.body);

        if (!(firstName || lastName || location || profession || profileUrl)) {
            next("Please provide all the fields");
            return;
        }

        const { userId } = req.body.user;

        const updateUser = {
            firstName,
            lastName,
            profileUrl,
            location,
            profession,
            _id: userId,
        }
        const user = await User.findByIdAndUpdate(userId, updateUser, {
            new: true,
        });

        await user.populate({ path: "friends", select: "-password" });
        const token = createJWT(user?._id);

        user.password = undefined;

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
            token,
        })
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}

export const friendRequest = async (req, res, next) => {
    try {
        const { userId } = req.body.user;
        const { requestTo } = req.body;

        const requestExist = await FriendRequest.findOne({
            requestFrom: userId,
            requestTo: requestTo,
        });

        if (requestExist) {
            next("Friend Request already sent!");
            return;
        }
        const sentYouRequest = await FriendRequest.findOne({
            requestFrom: requestTo,
            requestTo: userId,
        })

        if (sentYouRequest) {
            next("This person has sent you a friend request!");
            return;
        }
        await FriendRequest.create({
            requestFrom: userId,
            requestTo: requestTo,
        });

        res.status(200).json({
            success: true,
            message: "Friend request sent successfully",
        })


    } catch (err) {
        console.log(err);
        res.status(404).json({
            message: "Auth error",
            success: false,
            error: err.message,
        });
    }
}

export const getFriendRequest = async (req, res) => {
    try {
        const { userId } = req.body.user;

        const request = await FriendRequest.find({
            requestTo: userId,
            requestStatus: "Pending",
        }).populate({
            path: "requestFrom",
            select: "firstName lastName profileUrl profession -password",
        }).limit(10).sort({
            _id: -1,
        })

        res.status(200).json({
            success: true,
            data: request,
        })


    } catch (err) {
        console.log(err);
        res.status(404).json({
            message: "Auth error",
            success: false,
            error: err.message,
        });
    }
}

export const acceptRequest = async (req, res) => {
    try {
        const id = req.body.user.userId;
        const { rid, status } = req.body;

        const requestExist = await FriendRequest.findById(rid);

        if (!requestExist) {
            next("No Friend Request Found");
            return;
        }
        const newRes = await FriendRequest.findByIdAndUpdate(
            { _id: rid },
            { requestStatus: status },
        );

        if (status === "Accepted") {
            const user = await User.findById(id);

            user.friends.push(newRes?.requestFrom);

            await user.save();

            const friend = await User.findById(newRes?.requestFrom);

            friend.friends.push(newRes?.requestTo);

            await friend.save();

        }

        res.status(201).json({
            success: true,
            message: "Friend Request " + status,
        });

    } catch (err) {
        console.log(err);
        res.status(404).json({
            message: "Auth error",
            success: false,
            error: err.message,
        });
    }
}

export const profileViews = async (req, res, next) => {
    try {
        const { userId } = req.body.user;
        const { id } = req.body;

        const user = await User.findById(id);

        user.views.push(userId);

        await user.save();

        res.status(201).json({
            success: true,
            message: "Successfull"
        })
    } catch (err) {
        console.log(err);
        res.status(404).json({
            message: "Auth error",
            success: false,
            error: err.message,
        });
    }
}

export const suggestedFriends = async (req, res, next) => {
    try {
        const { userId } = req.body.user;

        const suggestedFriends = await User.find({
            _id: { $ne: userId },
            friends: { $nin: userId }
        })
            .limit(15)
            .select("firstName lastName profileUrl profession -password");

        res.status(201).json({
            success: true,
            data: suggestedFriends,
        })
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ message: err.message });
    }
}
