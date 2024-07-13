const express = require('express');
const validateToken = require('../middleware/validateToken');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const router = express.Router();

// Public - Sign Up
router.route('/sign-up').post(
    asyncHandler(async (req, res) => {
        const { userName, userEmail, userPassword } = req.body;

        if (!userName || !userEmail || !userPassword) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        const userExist = await User.findOne({ userEmail });
        if (userExist) {
            res.status(409);
            throw new Error("User already exists");
        }

        const user_id = uuidv4();
        const hashPassword = await bcrypt.hash(userPassword, 10);
        const user = new User({
            user_id,
            userName,
            userEmail,
            userPassword: hashPassword
        });

        await user.save();
        res.status(201).json({ message: "User created successfully" });
    })
);

// Public - Login
router.route('/login').post(
    asyncHandler(async (req, res) => {
        const { userEmail, userPassword } = req.body;

        if (!userEmail || !userPassword) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        const user = await User.findOne({ userEmail });
        if (!user) {
            res.status(404);
            throw new Error("User does not exist");
        }

        const passwordMatch = await bcrypt.compare(userPassword, user.userPassword);
        if (passwordMatch) {
            const token = jwt.sign(
                {
                    user: {
                        userName: user.userName,
                        userEmail: user.userEmail,
                        user_id: user.user_id
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "150m" }
            );

            res.status(200).json({
                status: 1,
                message: "Login successful",
                token,
                userName: user.userName,
                userEmail: user.userEmail,
                user_id: user.user_id
            });
        } else {
            res.status(401);
            throw new Error("Invalid password or email");
        }
    })
);

// Private - Current User
router.route('/current-user').post(
    validateToken,
    asyncHandler(async (req, res) => {
        res.status(200).json(req.user);
    })
);

const authRouter = router;

module.exports = authRouter;
