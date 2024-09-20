const Event = require("../models/event");

exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body );
    const eventSave = await event.save();
    res.status(201).json({ success: true, data: eventSave });
  } catch (err) {
    res.status(500).json({ success: false, ...err });
  }
};

//Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const eventList = await Event.find({ isDeleted: false });

    // If event is not found, return 404
    if (!eventList) {
        return res.status(404).json({ success: false, message: 'No Events found' });
      }
    res.status(200).json({ success: true, data: eventList });
  } catch (err) {
    res.status(500).json({ success: false, ...err });
  }
};
//Get one event
exports.getOneEventDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    // If event is not found, return 404
    if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
    res.status(200).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, ...err });
  }
};
//Update event
exports.updateEventDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const eventList = await Event.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated event
      runValidators: true, // Ensure that validation is run on the update
    });

    // If event is not found, return 404
    if (!eventList) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, data: eventList });
  } catch (err) {
    res.status(500).json({ success: false, ...err });
  }
};

// Soft delete an event
exports.softDeleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Mark event as deleted
    const event = await Event.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    res.status(200).json({
      success: true,
      message: "Event soft deleted successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
