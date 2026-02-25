import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootUploadsDir = path.join(__dirname, "..", "uploads", "attendees");
fs.mkdirSync(rootUploadsDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, rootUploadsDir);
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname) || ".jpg";
		const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, `${unique}${ext}`);
	},
});

const fileFilter = (req, file, cb) => {
	if (!file.mimetype.startsWith("image/")) {
		return cb(new Error("Only image uploads are allowed"));
	}
	cb(null, true);
};

export const attendeePhotoUpload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 },
});
