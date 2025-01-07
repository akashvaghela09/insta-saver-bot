const User = require("../models/User");

const addOrUpdateUser = async (chatId, userName, firstName) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ chatId });

        if (existingUser) {
            // Update existing user's requestCount and lastUpdated
            existingUser.requestCount += 1;
            existingUser.lastUpdated = new Date();
            await existingUser.save();
            console.log("User updated:", existingUser);
            return existingUser;
        }

        // If user doesn't exist, create a new user
        const newUser = new User({
            chatId,
            userName,
            firstName,
            requestCount: 1, // First request for the new user
            lastUpdated: new Date(),
        });

        await newUser.save();
        console.log("New user added:", newUser);

        return newUser;
    } catch (error) {
        console.error("Error adding or updating user:", error);
    }
};

module.exports = { addOrUpdateUser };
