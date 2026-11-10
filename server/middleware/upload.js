
import multer from "multer";

const storage = multer.memoryStorage();

function imageFilter(req, file, callback) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return callback(
      new Error("Only JPG, PNG and WebP images are allowed.")
    );
  }

  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

export default upload;
