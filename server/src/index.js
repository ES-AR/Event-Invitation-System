const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');

const Event = require('./models/Event');
const Registration = require('./models/Registration');

dotenv.config();
mongoose.set('strictQuery', true);

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ADMIN_KEY = process.env.ADMIN_KEY || 'dev-admin-key';
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [FRONTEND_URL];

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image uploads are allowed'));
  }
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use('/uploads', requireAdmin, express.static(uploadDir));

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many registration attempts. Please try again in a minute.'
});

const checkInLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many check-in attempts. Please slow down.'
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin requests. Please slow down.'
});

const captchaStore = new Map();
const CAPTCHA_TTL = 5 * 60 * 1000;

function createCaptcha() {
  const a = Math.ceil(Math.random() * 9);
  const b = Math.ceil(Math.random() * 9);
  const answer = a + b;
  const id = uuidv4();
  captchaStore.set(id, { answer, expires: Date.now() + CAPTCHA_TTL });
  return { id, question: `What is ${a} + ${b}?` };
}

function verifyCaptcha(id, answer) {
  const record = captchaStore.get(id);
  captchaStore.delete(id);
  if (!record) return false;
  if (record.expires < Date.now()) return false;
  return Number(answer) === Number(record.answer);
}

let useMemoryStore = false;
const memoryStore = {
  event: null,
  registrations: []
};

function buildDefaultEvent() {
  return {
    _id: 'memory-event',
    title: 'Quota-Controlled Open House',
    description: 'Secure registration with main and overflow quotas.',
    location: 'Main Hall',
    maxMainSlots: 50,
    overflowSlots: 20,
    allowOverflow: true,
    registrationClosesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isClosed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) return next();
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ message: 'Admin key missing or invalid' });
  }
  next();
}

async function connectDatabase() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_invitation';
  try {
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'event_invitation', serverSelectionTimeoutMS: 4000 });
    console.log('Connected to MongoDB');
    useMemoryStore = false;
    return;
  } catch (error) {
    console.warn('Mongo connection failed, falling back to in-memory store:', error.message);
    useMemoryStore = true;
  }
}

async function ensureEvent() {
  if (useMemoryStore) {
    if (!memoryStore.event) {
      memoryStore.event = buildDefaultEvent();
    }
    return memoryStore.event;
  }

  let event = await Event.findOne();
  if (!event) {
    event = await Event.create(buildDefaultEvent());
  }
  return event;
}

async function computeStats() {
  const registrations = useMemoryStore
    ? memoryStore.registrations.filter((r) => r.status !== 'removed')
    : await Registration.find({ status: { $ne: 'removed' } });
  const stats = {
    total: registrations.length,
    mainCount: registrations.filter((r) => r.category === 'main').length,
    overflowCount: registrations.filter((r) => r.category === 'overflow').length,
    pending: registrations.filter((r) => r.status === 'pending').length,
    approved: registrations.filter((r) => r.status === 'approved').length,
    checkedIn: registrations.filter((r) => r.status === 'checked-in').length
  };
  return stats;
}

async function evaluateCategory(event) {
  const stats = await computeStats();
  if (stats.mainCount < event.maxMainSlots) return { category: 'main', stats };
  if (event.allowOverflow && stats.overflowCount < event.overflowSlots) return { category: 'overflow', stats };
  return { category: null, stats };
}

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.get('/api/captcha', (_req, res) => {
  const captcha = createCaptcha();
  res.json(captcha);
});

app.get('/api/event', async (_req, res) => {
  try {
    const event = await ensureEvent();
    const stats = await computeStats();
    const now = new Date();
    const closesAt = event.registrationClosesAt ? new Date(event.registrationClosesAt) : null;
    const isExpired = closesAt && now > closesAt;
    res.json({
      event,
      stats,
      isClosed: event.isClosed || isExpired,
      closesAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load event', error: error.message });
  }
});

app.post('/api/event', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const event = await ensureEvent();
    const numericFields = ['maxMainSlots', 'overflowSlots'];
    for (const field of numericFields) {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field]);
        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({ message: `${field} must be a non-negative number` });
        }
      }
    }
    if (req.body.registrationClosesAt) {
      const closesAt = new Date(req.body.registrationClosesAt);
      if (Number.isNaN(closesAt.getTime())) {
        return res.status(400).json({ message: 'registrationClosesAt must be a valid date' });
      }
      req.body.registrationClosesAt = closesAt;
    }
    const updates = ['title', 'description', 'location', 'maxMainSlots', 'overflowSlots', 'allowOverflow', 'registrationClosesAt', 'isClosed', 'banner'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = field === 'registrationClosesAt' && req.body[field] ? new Date(req.body[field]) : req.body[field];
      }
    });
    if (useMemoryStore) {
      event.updatedAt = new Date();
      memoryStore.event = event;
      res.json(event);
    } else {
      await event.save();
      res.json(event);
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
});

app.post('/api/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, phone, organization, note, captchaId, captchaAnswer } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ message: 'Captcha failed. Please try again.' });
    }
    const event = await ensureEvent();
    const now = new Date();
    if (event.isClosed || (event.registrationClosesAt && now > event.registrationClosesAt)) {
      return res.status(403).json({ message: 'Registration is closed for this event.' });
    }
    const { category } = await evaluateCategory(event);
    if (!category) {
      return res.status(409).json({ message: 'The event is at capacity. Please contact the organizer.' });
    }

    if (useMemoryStore) {
      if (memoryStore.registrations.some((r) => r.email === email.toLowerCase())) {
        return res.status(409).json({ message: 'This email is already registered.' });
      }
      const registration = {
        _id: uuidv4(),
        name,
        email: email.toLowerCase(),
        phone,
        organization,
        note,
        category,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.registrations.push(registration);
      return res.status(201).json({
        message: `Registered as ${category}. Await admin approval.`,
        registration
      });
    } else {
      const registration = new Registration({
        name,
        email: email.toLowerCase(),
        phone,
        organization,
        note,
        category,
        status: 'pending'
      });
      await registration.save();
      res.status(201).json({
        message: `Registered as ${category}. Await admin approval.`,
        registration
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }
    res.status(500).json({ message: 'Failed to register', error: error.message });
  }
});

app.get('/api/registrations', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const registrations = useMemoryStore
      ? memoryStore.registrations
          .filter((r) => (!query.status ? true : r.status === query.status))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : await Registration.find(query).sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load registrations', error: error.message });
  }
});

app.post('/api/registrations/:id/approve', requireAdmin, adminLimiter, async (req, res) => {
  try {
    if (useMemoryStore) {
      const registration = memoryStore.registrations.find((r) => r._id === req.params.id);
      if (!registration) return res.status(404).json({ message: 'Registration not found' });
      registration.status = 'approved';
      registration.approvedAt = new Date();
      registration.checkInCode = registration.checkInCode || uuidv4();
      const link = `${FRONTEND_URL}/check-in?code=${registration.checkInCode}`;
      return res.json({ message: 'Approved', registration, checkInLink: link });
    }

    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    registration.status = 'approved';
    registration.approvedAt = new Date();
    registration.checkInCode = registration.checkInCode || uuidv4();
    await registration.save();
    const link = `${FRONTEND_URL}/check-in?code=${registration.checkInCode}`;
    res.json({ message: 'Approved', registration, checkInLink: link });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve', error: error.message });
  }
});

app.delete('/api/registrations/:id', requireAdmin, adminLimiter, async (req, res) => {
  try {
    if (useMemoryStore) {
      const registration = memoryStore.registrations.find((r) => r._id === req.params.id);
      if (!registration) return res.status(404).json({ message: 'Registration not found' });
      registration.status = 'removed';
      return res.json({ message: 'Removed', registration });
    }

    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    registration.status = 'removed';
    await registration.save();
    res.json({ message: 'Removed', registration });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove', error: error.message });
  }
});

app.post('/api/registrations/bulk', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { ids = [], action } = req.body;
    if (!ids.length || !action) return res.status(400).json({ message: 'ids and action are required' });
    const updates = {};
    if (action === 'approve') {
      updates.status = 'approved';
      updates.approvedAt = new Date();
    }
    if (action === 'remove') {
      updates.status = 'removed';
    }
    if (useMemoryStore) {
      memoryStore.registrations = memoryStore.registrations.map((reg) => {
        if (ids.includes(reg._id)) {
          const updated = { ...reg, status: updates.status || reg.status };
          if (updates.approvedAt) {
            updated.approvedAt = updates.approvedAt;
            updated.checkInCode = updated.checkInCode || uuidv4();
          }
          return updated;
        }
        return reg;
      });
    } else {
      const registrations = await Registration.find({ _id: { $in: ids } });
      await Promise.all(
        registrations.map(async (reg) => {
          reg.status = updates.status || reg.status;
          if (updates.approvedAt) {
            reg.approvedAt = updates.approvedAt;
            reg.checkInCode = reg.checkInCode || uuidv4();
          }
          await reg.save();
        })
      );
    }
    res.json({ message: 'Bulk action complete' });
  } catch (error) {
    res.status(500).json({ message: 'Failed bulk action', error: error.message });
  }
});

app.get('/api/registrations/:id/checkin-link', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const registration = useMemoryStore
      ? memoryStore.registrations.find((r) => r._id === req.params.id)
      : await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (!registration.checkInCode) {
      registration.checkInCode = uuidv4();
      if (!useMemoryStore) {
        await registration.save();
      }
    }
    const link = `${FRONTEND_URL}/check-in?code=${registration.checkInCode}`;
    res.json({ link });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create link', error: error.message });
  }
});

app.post('/api/checkin', checkInLimiter, upload.single('photo'), async (req, res) => {
  try {
    const { code, email } = req.body;
    if (!code || !email) return res.status(400).json({ message: 'Code and email are required' });
    const registration = useMemoryStore
      ? memoryStore.registrations.find(
          (r) => r.checkInCode === code && (r.status === 'approved' || r.status === 'checked-in')
        )
      : await Registration.findOne({ checkInCode: code, status: { $in: ['approved', 'checked-in'] } });
    if (!registration) return res.status(404).json({ message: 'No approved registration matches this code.' });
    if (registration.email !== email.toLowerCase()) {
      return res.status(403).json({ message: 'Email does not match the invitation.' });
    }
    registration.status = 'checked-in';
    registration.checkedInAt = new Date();
    if (req.file) {
      registration.photoPath = `/uploads/${req.file.filename}`;
    }
    if (!useMemoryStore) {
      await registration.save();
    }
    res.json({ message: 'Check-in verified', registration });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check in', error: error.message });
  }
});

app.get('/api/export', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const status = req.query.status || 'approved';
    const registrations = useMemoryStore
      ? memoryStore.registrations.filter((r) => r.status === status)
      : await Registration.find({ status });
    const parser = new Parser({
      fields: ['name', 'email', 'phone', 'organization', 'category', 'status', 'approvedAt', 'checkedInAt']
    });
    const csv = parser.parse(
      registrations.map((r) => ({
        ...(r.toObject ? r.toObject() : r),
        approvedAt: r.approvedAt ? new Date(r.approvedAt).toISOString() : '',
        checkedInAt: r.checkedInAt ? new Date(r.checkedInAt).toISOString() : ''
      }))
    );
    res.header('Content-Type', 'text/csv');
    res.attachment(`registrations-${status}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export', error: error.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error' });
});

connectDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
});

process.on('SIGINT', async () => {
  if (!useMemoryStore) {
    await mongoose.disconnect();
  }
  process.exit(0);
});
