import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, userSocketMap } from "../server.js";

//get all user except logged in user
export const getUserForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    //count number of messages not seen
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const message = await Message.find({
        senderId: user._id,
        recieverId: userId,
        seen: false,
      });
      if (message.length > 0) {
        unseenMessages[user._id] = message.length; // number of unseen messages for the user or me?
      }
    });
    await Promise.all(promises);
    res.json({ success: true, filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//get all messages for selected users
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, recieverId: selectedUserId },
        { senderId: selectedUserId, recieverId: myId },
      ],
    });
    await Message.updateMany(
      { recieverId: myId, senderId: selectedUserId },
      { seen: true }
    );
    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//api to mark message as seen using message id

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//send message to selected user

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const recieverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      recieverId,
      text,
      image: imageUrl,
    });
    //emit the new message to the receiver's socket
    const recieverSockerId = userSocketMap[recieverId];
    if (recieverSockerId) {
      io.to(recieverSockerId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
