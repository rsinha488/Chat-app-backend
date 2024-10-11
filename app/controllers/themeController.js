const Event = require("../models/event");
const Room = require("../models/room");
const DataModel = require("../models/theme");

// Create a new data entry
exports.createData = async (req, res) => {
  try {
    const newData = new DataModel(req.body);
    console.log("data", req.body);
    await newData.save();
    res.status(201).json({ success: true, ...newData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get data by ID
exports.getDataById = async (req, res) => {
  try {
    const data = await DataModel.findById({ _id: req.params.id });
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Data not found" });
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update data by ID
exports.updateDataById = async (req, res) => {
  try {
    const updatedData = await DataModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedData)
      return res
        .status(404)
        .json({ success: false, message: "Data not found" });
    res.json({ success: true, data: updatedData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete data by ID
exports.deleteDataById = async (req, res) => {
  try {
    const deletedData = await DataModel.findByIdAndDelete(req.params.id);
    if (!deletedData)
      return res
        .status(404)
        .json({ success: false, message: "Data not found" });
    res.json({ success: true, message: "Data deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all data entries
exports.getAllData = async (req, res) => {
  try {
    const allData = await DataModel.find();
    res.json({ success: true, data: allData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyForAll = async (req, res) => {
  try {
    const { bgcolor, color } = req.body;
    
    await DataModel.updateMany({}, { 'header.backgroundColor': bgcolor, 'header.textColor': color, 'bubble.backgroundColor': bgcolor, 'bubble.textColor': color,
    'signup.primaryLoginColor' : bgcolor, 'signup.primaryRegisterColor': bgcolor, 'signup.primaryLoginTextColor': color, 'signup.primaryRegisterTextColor': color
  });
    await Room.updateMany({}, { primaryBgColor: bgcolor, primaryTextColor: color });
    await Event.updateMany({}, { primaryBgColor: bgcolor, primaryTextColor: color });

    res.json({ success: true, message: "Update Colors for all" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
