// roomController.js
const HashTag = require("../models/hashTag");

exports.getHashTag = async (req, res) => {
  try {
    const { roomId,hashtagId } = req.params;
    const quizzes = await HashTag.findOne({
      roomId: roomId,
      _id:hashtagId
    });
    // console.log({ quizzes });
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHashTagList = async (req, res) => {
    try {
        const {roomId}=req.params;
      const hashtagList = await HashTag.find({roomId});
      res.status(200).json({ success: true, data: hashtagList });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
