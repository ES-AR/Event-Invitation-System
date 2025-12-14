// server/controllers/registration.controller.js

import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

export const registerUser = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    // Fetch event settings
    const event = await Event.findOne();

    if (!event || !event.isRegistrationOpen) {
      return res.status(403).json({ message: "Registration is closed" });
    }

    // Prevent duplicate email registration
    const exists = await Registration.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Get current counts
    const mainCount = await Registration.countDocuments({ slotType: "main" });
    const overflowCount = await Registration.countDocuments({
      slotType: "overflow",
    });

    let slotType = "overflow";
    if (mainCount < event.mainSlots) {
      slotType = "main";
    } else if (overflowCount >= event.overflowSlots) {
      return res.status(403).json({ message: "Event quota reached" });
    }

    // Create new registration
    const reg = new Registration({
      fullName,
      email,
      slotType,
      approved: false,
    });

    await reg.save();

    res.status(201).json({
      message: "Registration submitted successfully",
      attendee: reg,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: get all attendees
export const getAllRegistrations = async (req, res) => {
  try {
    const list = await Registration.find().sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: approve attendee
export const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const reg = await Registration.findByIdAndUpdate(
      id,
      { approved: true },
      { new: true }
    );

    res.status(200).json({
      message: "Attendee approved",
      attendee: reg,
    });
  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: delete registration
export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    await Registration.findByIdAndDelete(id);

    res.status(200).json({ message: "Attendee removed successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Check-in feature
export const checkInAttendee = async (req, res) => {
  try {
    const { email, photo } = req.body;

    const attendee = await Registration.findOne({ email, approved: true });

    if (!attendee) {
      return res.status(404).json({ message: "Attendee not approved" });
    }

    attendee.checkedIn = true;
    attendee.checkInPhoto = photo;
    attendee.checkInTime = new Date();

    await attendee.save();

    res.status(200).json({
      message: "Check-in successful",
      attendee,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
