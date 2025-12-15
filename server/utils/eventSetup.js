import Event from "../models/Event.js";

export async function ensureEventDocument() {
  let event = await Event.findOne();

  if (!event) {
    event = await Event.create({
      title: "Quota-Controlled Event",
      description: "",
      location: "",
    });
  }

  return event;
}
