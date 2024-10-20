const Advertisement = require("../models/advertisement");
const Slot = require("../models/slot");
const User = require("../models/user");
const moment = require('moment')

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
// Get all advertisements (excluding soft-deleted ones)
exports.getAllAdvertisements = async (req, res) => {
  const { status } = req.params;
  let data = { isDeleted: false };

  // Check the status parameter
  if (status == "true") {
    data = { ...data, status: true };
  } else if (status != undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Status code is not defined" });
  }

  try {
    // Fetch advertisements based on the query
    const advertisements = await Advertisement.find(data).populate(
      "selectedSlots",
      "name"
    );

    // If no advertisements are found, return 404
    if (!advertisements || advertisements.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No advertisements found" });
    }

    const currentTime = new moment(new Date());

    
    // Update any advertisement whose endTime has passed
    const updatedAdvertisements = await Promise.all(
      advertisements.map(async (ad) => {
        // console.log("object", new moment(ad.endTime), new moment(new Date()));
        if (
          ad.endTime &&
          new moment(ad.endTime) < currentTime &&
          ad.status === true
        ) {
          // Update the status to false in the database
          await Advertisement.updateOne({ _id: ad._id }, { status: false });
          ad.status = false; // Also update the status in the response
        }
        return ad;
      })
    );

    // Send the updated advertisements list
    res.status(200).json({ success: true, data: updatedAdvertisements });
  } catch (err) {
    // Handle any errors
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all active advertisements (excluding soft-deleted ones)
exports.getAllActiveAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find({
      status: true,
      isDeleted: false,
    }).populate("selectedSlots", "name"); // Populate selectedSlots with only the name field
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

    res.status(200).json({
      success: true,
      message: "Advertisement soft deleted",
      data: deletedAd,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// updateAdvertisement
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedSlots, endTime } = req.body;

    // Validate and update the selected slots if provided
    if (selectedSlots && selectedSlots.length > 0) {
      // Fetch the valid slots from the database
      const validSlots = await Slot.find({
        _id: { $in: selectedSlots.map((slot) => slot._id) },
      });

      // If some slots are invalid, return an error
      if (validSlots.length !== selectedSlots.length) {
        return res
          .status(400)
          .json({ success: false, message: "Some slots are invalid" });
      }

      // Convert validSlots to the format required for selectedSlots (_id, name)
      req.body.selectedSlots = validSlots.map((slot) => ({
        _id: slot._id,
        name: slot.name,
      }));
    }

    // Set the status based on endTime if provided
    // if (endTime) {
    //   req.body.status = endTime < Date.now() ? false : true;
    // }
    const currentTime = new Date();
    const endTime1 = new Date(endTime);
    const timeDifference = endTime1 - currentTime;
    // Only schedule if endTime is in the future
    if (timeDifference <= 0) {
      req.body.status = false;
      return res
        .status(400)
        .json({ success: false, message: "Endtime already passed" });
    } else {
      req.body.status = true;
    }

    // if (endTime) {
    //   data = { id, endTime, status: true };
    // } else {
    //   data = { id, endTime };
    // }
    console.log(req.body);
    // Update the advertisement
    const updatedAd = await Advertisement.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validation
    });

    // If the advertisement is not found or is deleted, return an error
    if (!updatedAd || updatedAd.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Advertisement not found" });
    }

    // Return success response with the updated advertisement data
    res.status(200).json({ success: true, data: updatedAd });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Set advertisement click details (log user's click)
exports.setAdvertisementClick = async (req, res) => {
  try {
    const { id } = req.params; // Get the advertisement ID from the route params
    const { userId } = req.body; // Get the userId from the request body

    // Check if userId is provided
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Check if the user exists in the User collection (optional, but recommended)
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Find the advertisement by ID
    const advertisement = await Advertisement.findById(id);
    if (!advertisement || advertisement.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Advertisement not found" });
    }

    // Add the user's click details to the click array
    advertisement.click.push({ userId });

    // Save the updated advertisement document
    const updatedAd = await advertisement.save();

    res
      .status(200)
      .json({ success: true, message: "Click recorded", data: updatedAd });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
