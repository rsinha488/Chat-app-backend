const DataModel = require("../models/theme");

// Create a new data entry
exports.createData = async (req, res) => {
    console.log("hhhhhhh",req.body)
  try {
    const newData = new DataModel(req.body);
    console.log("data", req.body);
    await newData.save();
    res.status(201).json(newData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get data by ID
exports.getDataById = async (req, res) => {
  try {
    const data = await DataModel.findById({_id: req.params.id});
    if (!data) return res.status(404).json({ message: "Data not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({ message: "Data not found" });
    res.json(updatedData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete data by ID
exports.deleteDataById = async (req, res) => {
  try {
    const deletedData = await DataModel.findByIdAndDelete(req.params.id);
    if (!deletedData)
      return res.status(404).json({ message: "Data not found" });
    res.json({ message: "Data deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all data entries
exports.getAllData = async (req, res) => {
  try {
    const allData = await DataModel.find();
    res.json(allData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
