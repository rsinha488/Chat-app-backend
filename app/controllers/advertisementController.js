const Advertisement = require("../models/advertisement");


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
      const advertisements = await Advertisement.find({ isDeleted: false });
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
        return res.status(404).json({ success: false, message: 'Advertisement not found' });
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
        return res.status(404).json({ success: false, message: 'Advertisement not found' });
      }
  
      res.status(200).json({ success: true, message: 'Advertisement soft deleted', data: deletedAd });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  // Update an advertisement by ID
exports.updateAdvertisement = async (req, res) => {
    try {
      const { id } = req.params;
  
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
  