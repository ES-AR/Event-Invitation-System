const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Quota-Controlled Event' },
    description: { type: String, default: 'Registration is open until capacity is reached.' },
    location: { type: String, default: 'TBD' },
    maxMainSlots: { type: Number, default: 50 },
    overflowSlots: { type: Number, default: 20 },
    allowOverflow: { type: Boolean, default: true },
    registrationClosesAt: { type: Date },
    isClosed: { type: Boolean, default: false },
    banner: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
