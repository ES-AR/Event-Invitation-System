// server/controllers/event.controller.js

import Event from "../models/Event.js";

export const getEventSettings = async (req, res) => {
  try {
    const event = await Event.findOne();

    if (!event) {
      return res.status(404).json({ message: "Event settings not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateEventSettings = async (req, res) => {
  try {
    const updates = req.body; 

    const event = await Event.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
    });

    res.status(200).json({
      message: "Event settings updated successfully",
      event,
    });
  } catch (error) {
    console.error("Error updating event settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleRegistration = async (req, res) => {
  try {
    const { status } = req.body;

    const event = await Event.findOneAndUpdate(
      {},
      { isRegistrationOpen: status },
      { new: true }
    );

    res.status(200).json({
      message: `Registration has been ${status ? "opened" : "closed"}`,
      event,
    });
  } catch (error) {
    console.error("Error toggling registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
