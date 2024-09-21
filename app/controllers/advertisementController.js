const Advertisement = require("../models/advertisement");
const Slot = require("../models/slot");

// Create a new advertisement
exports.createAdvertisement = async (req, res) => {
  try {
    const advertisement = new Advertisement(req.body);
    const savedAd = await advertisement.save();
    res.status(201).json({ success: true, data: savedAd });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Get all advertisements (excluding soft-deleted ones)
exports.getAllAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find({ isDeleted: false }).populate('selectedSlots', 'name'); // Populate selectedSlots with only the name field
    ;
    res.status(200).json({ success: true, data: advertisements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Get all active advertisements (excluding soft-deleted ones)
exports.getAllActiveAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find({
      status: true,
      isDeleted: false,
    }).populate('selectedSlots', 'name'); // Populate selectedSlots with only the name field
    ;

    res.status(200).json({ success: true, data: advertisements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Get one advertisement detail by ID
exports.getAdvertisementDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const advertisement = await Advertisement.findById(id);

    if (!advertisement || advertisement.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Advertisement not found" });
    }

    // Check if the advertisement's endTime has passed and update its status
    if (advertisement.endTime && advertisement.endTime < Date.now()) {
      advertisement.status = false;
      await advertisement.save(); // Update status in the database
    }

    res.status(200).json({ success: true, data: advertisement });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// setAdvertisementEndTime
exports.setAdvertisementEndTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { endTime } = req.body;

    if (!endTime) {
      return res
        .status(400)
        .json({ success: false, message: "EndTime is required" });
    }

    // Update the endTime field of the advertisement
    const updatedAd = await Advertisement.findByIdAndUpdate(
      id,
      { endTime, status: endTime < Date.now() ? false : true }, // Set status based on endTime
      { new: true, runValidators: true }
    );

    if (!updatedAd || updatedAd.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Advertisement not found" });
    }

    res.status(200).json({ success: true, data: updatedAd });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Soft delete an advertisement
exports.softDeleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAd = await Advertisement.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!deletedAd) {
      return res
        .status(404)
        .json({ success: false, message: "Advertisement not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Advertisement soft deleted",
        data: deletedAd,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Update an advertisement by ID
// exports.updateAdvertisement = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { selectedSlots } = req.body;

//     // Validate if the provided selectedSlots are valid Slot IDs
//     if (selectedSlots && selectedSlots.length > 0) {
//       const validSlots = await Slot.find({ _id: { $in: selectedSlots } });

//       if (validSlots.length !== selectedSlots.length) {
//         return res.status(400).json({ success: false, message: 'One or more selected slots are invalid' });
//       }
//     }

//     // Update the advertisement including the selected slots
//     const updatedAd = await Advertisement.findByIdAndUpdate(id, req.body, {
//       new: true, // Return the updated document
//       runValidators: true // Ensure validation
//     });

//     if (!updatedAd || updatedAd.isDeleted) {
//       return res.status(404).json({ success: false, message: 'Advertisement not found' });
//     }

//     res.status(200).json({ success: true, data: updatedAd });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };
// Update an advertisement by ID
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedSlots } = req.body;

    // Validate if the selected slots are valid (e.g., all slot names exist)
    if (selectedSlots && selectedSlots.length > 0) {
      const validSlots = await Slot.find({ name: { $in: selectedSlots } });
      if (validSlots.length !== selectedSlots.length) {
        return res.status(400).json({ success: false, message: 'Some slots are invalid' });
      }
    }

    const updatedAd = await Advertisement.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated document
      runValidators: true // Ensure validation
    });

    if (!updatedAd || updatedAd.isDeleted) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    res.status(200).json({ success: true, data: updatedAd });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

