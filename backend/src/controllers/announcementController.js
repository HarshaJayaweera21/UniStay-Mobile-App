const cloudinary = require("../config/cloudinary");
const Announcement = require("../models/Announcement");

const uploadPDFToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "Announcement_PDF" },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    return reject(error);
                }
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadPDFToCloudinary(req.file.buffer);

    const announcement = new Announcement({
      title,
      message,
      pdfUrl: result.secure_url,
    });

    await announcement.save();

    res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating announcement" });
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching announcements" });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Try to delete from cloudinary if possible (extract public_id from URL)
    if (announcement.pdfUrl) {
      try {
        const urlParts = announcement.pdfUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `Announcement_PDF/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      } catch (clkErr) {
        console.log("Cloudinary cleanup error (ignored):", clkErr);
      }
    }

    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting announcement" });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;
    
    let announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    let pdfUrl = announcement.pdfUrl;

    if (req.file) {
      // delete old pdf from cloudinary
      if (pdfUrl) {
        try {
          const urlParts = pdfUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = `Announcement_PDF/${filename.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        } catch (clkErr) {
          console.log("Cloudinary cleanup error during update (ignored):", clkErr);
        }
      }

      // upload new
      const result = await uploadPDFToCloudinary(req.file.buffer);
      pdfUrl = result.secure_url;
    }

    announcement.title = title || announcement.title;
    announcement.message = message || announcement.message;
    announcement.pdfUrl = pdfUrl;

    await announcement.save();
    
    res.status(200).json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating announcement" });
  }
};

module.exports = { createAnnouncement, getAllAnnouncements, deleteAnnouncement, updateAnnouncement };