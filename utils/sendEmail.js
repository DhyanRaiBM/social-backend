import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { hashString } from "./index.js";
import Verification from "../models/emailVerification.js";
import PasswordReset from "../models/passwordReset.js";


dotenv.config();

const { AUTH_EMAIL, AUTH_PASSWORD, APP_URL } = process.env;

let transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    auth: {
        user: AUTH_EMAIL,
        pass: AUTH_PASSWORD,
    }
})

export const sendVerificationEmail = async (user, res) => {
    const { _id, email, firstName } = user;
    const token = _id + uuidv4();
    const link = APP_URL + "users/verify/" + _id + "/" + token;

    //-Mail Options:
    const mailOptions = {
        from: AUTH_EMAIL,
        to: email,
        subject: "Email Verification",
        html: `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f2f2f2;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 30px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        h1 {
            color: #333;
            font-size: 28px;
            margin: 0;
        }

        .content {
            text-align: left;
        }

        p {
            font-size: 18px;
            color: #555;
            margin: 10px 0;
            line-height: 1.6;
        }

        .button-container {
            text-align: center;
            margin-top: 30px;
        }

        .button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            font-size: 20px;
            border-radius: 8px;
            transition: background-color 0.3s ease;
        }

        .button:hover {
            background-color: #0056b3;
        }

        .note {
            font-size: 16px;
            color: #777;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hello, ${firstName}!</h1>
        </div>
        <div class="content">
            <p>Thank you for signing up with UpQuarium.Please click the button below to verify your email address:</p>
        </div>
        <div class="button-container">
            <a href=${link} class="button">Verify Email</a>
        </div>
        <div class="content">
            <p>Please be aware that the verification link will expire in 1 hour.</p>
            <p>If you did not request this email, please disregard it.</p>
        </div>
        <div class="note">
            <p>Best regards,</p>
            <p>The UpQuarium Team</p>
        </div>
    </div>
</body>
</html>

    `
    };

    try {
        const hashedToken = await hashString(token);

        const newVerifiedEmail = await Verification.create({
            userId: _id,
            token: hashedToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000
        });

        if (newVerifiedEmail) {
            transporter
                .sendMail(mailOptions)
                .then(() => {
                    res.status(201).send({
                        success: "PENDING",
                        message: "Verification email has been sent to your account ,Check your email to complete verification"
                    })
                })
        }
    } catch (e) {
        console.log(e);
        res.status(404).json({ message: "Something went wrong" })
    }
}

export const sendResetPasswordLink = async (user, res) => {
    const { _id, email } = user;

    const token = _id + uuidv4();
    const link = APP_URL + "users/reset-password/" + _id + "/" + token;

    const mailOptions = {
        from: AUTH_EMAIL,
        to: email,
        subject: "Reset Password",
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                /* Reset some default styles */
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
        
                /* Styling for the email container */
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                }
        
                /* Heading styles */
                h1 {
                    color: #333;
                    font-size: 24px;
                }
        
                /* Message styles */
                p {
                    font-size: 16px;
                    color: #555;
                    line-height: 1.5;
                }
        
                /* Link styles */
                a {
                    color: #007BFF;
                    text-decoration: none;
                }
        
                /* Button styles */
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007BFF;
                    color: #fff;
                    font-size: 16px;
                    text-align: center;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Password Reset</h1>
                <p>Hello,</p>
                <p>You have requested to reset your password. Please click the button below to reset your password. This link will expire in 10 minutes.</p>
                <a href=${link} class="button">Reset Password</a>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                <p>Best regards,</p>
                <p>Your Company Name</p>
            </div>
        </body>
        </html>
        `
    }

    try {
        const hashedToken = await hashString(token);

        const resetEmail = await PasswordReset.create({
            userId: _id,
            email: email,
            token: hashedToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + 600000
        })

        if (resetEmail) {
            transporter
                .sendMail(mailOptions)
                .then(() => {
                    res.status(201).send({
                        success: "PENDING",
                        message: "Reset password link has been sent to your email address"
                    })
                })
        }

    } catch (e) {
        console.log(e);
        res.status(404).json({ message: e.message })
    }
}