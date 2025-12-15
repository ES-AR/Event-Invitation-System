import Registration from "../models/Registration.js";
import { ensureEventDocument } from "../utils/eventSetup.js";

const editableFields = [
  "title",
  "description",
  "location",
  "bannerUrl",
  "maxMainSlots",
  "maxOverflowSlots",
  "requiresApproval",
  "allowWalkIns",
  "checkInInstructions",
  "isRegistrationOpen",
  "closeReason",
];

export const getEventSettings = async (req, res) => {
  try {
    const event = await ensureEventDocument();
    res.status(200).json({ event });
  } catch (error) {
    console.error("Error fetching event settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateEventSettings = async (req, res) => {
  try {
    const event = await ensureEventDocument();
    const updates = {};

    editableFields.forEach((field) => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(event, updates);
    await event.save();

    res.status(200).json({
      message: "Event settings updated successfully",
      event,
    });
  } catch (error) {
    console.error("Error updating event settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const closeRegistration = async (req, res) => {
  try {
    const event = await ensureEventDocument();
    event.isRegistrationOpen = false;
    event.closeReason = req.body?.reason || "Closed by admin";
    await event.save();

    res.status(200).json({
      message: "Registration has been closed",
      event,
    });
  } catch (error) {
    console.error("Error closing registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEventStats = async (req, res) => {
  try {
    const event = await ensureEventDocument();

    const [pending, approved, checkedIn, cancelled, mainCount, overflowCount] =
      await Promise.all([
        Registration.countDocuments({ event: event._id, status: "pending" }),
        Registration.countDocuments({ event: event._id, status: "approved" }),
        Registration.countDocuments({ event: event._id, status: "checked-in" }),
        Registration.countDocuments({ event: event._id, status: "cancelled" }),
        Registration.countDocuments({ event: event._id, slotType: "main" }),
        Registration.countDocuments({ event: event._id, slotType: "overflow" }),
      ]);

    res.status(200).json({
      event,
      totals: {
        pending,
        approved,
        checkedIn,
        cancelled,
      },
      slots: {
        main: {
          used: mainCount,
          capacity: event.maxMainSlots,
        },
        overflow: {
          used: overflowCount,
          capacity: event.maxOverflowSlots,
        },
      },
    });
  } catch (error) {
    console.error("Error loading event stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
