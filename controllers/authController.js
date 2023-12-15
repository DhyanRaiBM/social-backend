import User from "../models/userModel.js";
import { comparePassword, createJWT, hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";


export const register = async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;

    //-Validate Fields

    if (!(firstName || lastName || email || password)) {
        next("Provide Required Fields");
        return;
    }

    try {
        const userExist = await User.findOne({ email: email });

        if (userExist) {
            next("Email already in use");
            return;
        }

        const hashedPassword = await hashString(password);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        //send email verification to user
        sendVerificationEmail(user, res);

    } catch (e) {
        console.log(e);
        res.status(404).json({ message: e.message });
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        //-Validation:
        if (!(email || password)) {
            next("Please provide user Credentials");
            return;
        }
        //-Find user by email:
        const user = await User.findOne({ email }).select("+password").populate({
            path: "friends",
            select: "firstName lastName location profileUrl -password"
        });
        if (!user) {
            next("Invalid email or password");
            return;
        }
        if (!user?.verified) {
            next("User email is not verified,Check your email.");
            return;
        }

        //-Compare Password :
        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            next("Invalid Password");
            return;
        }

        user.password = undefined;

        const token = createJWT(user?._id)

        res.status(201).json({
            success: true,
            message: "Logged in successfully",
            user,
            token,
        })



    } catch (e) {
        console.log(e);
        res.status(404).json({ message: e.message });
    }
}