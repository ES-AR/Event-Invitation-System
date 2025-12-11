const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    organization: { type: String },
    note: { type: String },
    category: { type: String, enum: ['main', 'overflow'], default: 'main' },
    status: { type: String, enum: ['pending', 'approved', 'removed', 'checked-in'], default: 'pending' },
    checkInCode: { type: String },
    approvedAt: { type: Date },
    checkedInAt: { type: Date },
    photoPath: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
