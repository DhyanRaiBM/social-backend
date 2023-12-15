import express from 'express';
import path from 'path';
import {
    acceptRequest,
    changePassword,
    friendRequest,
    getFriendRequest,
    getUser,
    profileViews,
    requestPasswordReset,
    resetPassword,
    suggestedFriends,
    updateUser,
    verifyEmail
} from '../controllers/userController.js';
import { userAuth } from '../middleware/authMiddleware.js';


const __dirname = path.resolve(path.dirname(""));

const router = express.Router();

router.get("/verify/:userId/:token", verifyEmail);
router.get("/verified", (req, res) => {
    const { status, message } = req.query;
    let obj = {}

    if (status === "success") {
        obj.icon = "✔️";
        obj.message = message;
        obj.class = "success";
        obj.statusIconClass = "success";
        obj.statusMessageClass = "success";
        obj.btnClass = "showBtn";
    }
    else if (status === "error") {
        obj.icon = "❌";
        obj.message = message;
        obj.class = "error";
        obj.statusIconClass = "error";
        obj.statusMessageClass = "error";
        obj.btnClass = "hideBtn";
    }
    console.log(obj);

    res.render("verificationStatus", { obj });
})

//-Password reset:
router.get("/reset-password/:userId/:token", resetPassword);//-2
router.post("/request-passwordreset", requestPasswordReset)//-1
router.get("/reset-password", changePassword);//-4

router.get("/resetpassword", (req, res) => {  //-3
    const { status, message, id } = req.query;
    let obj = {};

    if (status === "success") {
        obj.icon = "✔️";
        obj.message = message;
        obj.class = "success";
        obj.statusIconClass = "success";
        obj.statusMessageClass = "success";
        obj.btnClass = "showBtn";
    }
    else if (status === "error") {
        obj.icon = "❌";
        obj.message = message;
        obj.class = "error";
        obj.statusIconClass = "error";
        obj.statusMessageClass = "error";
        obj.btnClass = "hideBtn";
    }
    if (id) {
        obj.id = id;
    }

    res.render("resetPassword", { obj });
})

//-User routes:
router.post("/get-user/:id?", userAuth, getUser);
router.put("/update-user", userAuth, updateUser);

//-Friend Request:
router.post("/friend-request", userAuth, friendRequest);
router.post("/get-friend-request", userAuth, getFriendRequest);

//-Accept /Deny Connection Request:
router.post("/accept-request", userAuth, acceptRequest);

//-View Profile :
router.post("/profile-views", userAuth, profileViews);

//-Suggested Friends :
router.post("/suggested-friends", userAuth, suggestedFriends);


export default router;