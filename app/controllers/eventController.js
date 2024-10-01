const { default: mongoose } = require("mongoose");
const { getSocket } = require("../../sockets");
const Event = require("../models/event");
const User = require("../models/user");

exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    const eventSave = await event.save();
    res.status(201).json({ success: true, data: eventSave });
  } catch (err) {
    res.status(500).json({ success: false, ...err });
  }
};

//Get all events
exports.getAllEvents = async (req, res) => {
  const { status } = req.params;
  let data = { isDeleted: false };

  if (status == "true") {
    data = { ...data, status: true };
  } else if (status != undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Status code is not defined" });
  }

  try {
    const eventList = await Event.find(data).select(["-messages", "-isDeleted"]);

    // If no events are found, return 404
    if (!eventList || eventList.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No Events found" });
    }

    const currentTime = new Date();
    const updatedEventList = await Promise.all(
      eventList.map(async (event) => {
        if (event.endTime && new Date(event.endTime) < currentTime && event.status === true) {
          // Update the event's status to false in the database
          event.status = false;
          await Event.updateOne({ _id: event._id }, { status: false });
        }
        return event;
      })
    );

    res.status(200).json({ success: true, data: updatedEventList });
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
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, ...err });
  }
};
//Update event
// Update event
exports.updateEventDetail = async (req, res) => {
  try {
    const { id } = req.params;
    let { endTime } = req.body; // Get endTime from the request body
    let data = req.body;

    let current = new Date(); // Get the current date and time

    // Ensure endTime is a Date object (if it's a string in req.body)
    if (endTime) {
      endTime = new Date(endTime);
    }

    // Check if endTime is before the current time
    if (endTime && endTime < current) {
      return res
        .status(400)
        .json({ success: false, message: "Event endTime has already passed" });
    }
    // Remove the `messages` field from the update if it exists in the request body
    delete data.messages;

    // Ensure that status is set to true if endTime is valid and in the future
    data = { ...data, status: true };

    // Find and update the event by ID
    const eventList = await Event.findByIdAndUpdate(id, data, {
      new: true, // Return the updated event
      runValidators: true, // Ensure that validation is run on the update
    });

    // If the event is not found, return 404
    if (!eventList) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Return the updated event data
    res.status(200).json({ success: true, data: eventList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

exports.sendEventMessage = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, eventId, content } = req.body;

    // Find the user and room
    const user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: "User  not found" });
    }
    let msg_id = new mongoose.Types.ObjectId();
    let message = {
      _id: msg_id,
      sender: user,
      content: content,
      emojiReaction: [],
    };

    let updatedevent = await Event.findByIdAndUpdate(eventId, {
      $push: { messages: message },
    });
    req.app.io.to(eventId).emit("eventMessage", {
      type: "EVENT_MESSAGE",
      eventId: eventId,
      data: message,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
