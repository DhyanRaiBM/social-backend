import bcrypt from 'bcryptjs';
import JWT from "jsonwebtoken";

export const hashString = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};

export const comparePassword = async (userPassword, password) => {
    const isMatch = await bcrypt.compare(userPassword, password);
    return isMatch;
}

//JSON WEBTOKEN
export function createJWT(id) {
    return JWT.sign({ userId: id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
}