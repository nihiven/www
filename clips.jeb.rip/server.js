const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8083;

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const transcodedDir = path.join(__dirname, 'transcoded');
const thumbnailsDir = path.join(__dirname, 'thumbnails');
[uploadsDir, transcodedDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const videoTypes = /video\/(mp4|webm|avi|mov|mkv|flv|wmv|m4v|quicktime|x-msvideo|x-matroska)/;
    if (videoTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use('/transcoded', express.static(transcodedDir));
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// Upload page
app.get('/', (req, res) => {
  res.render('upload');
});

// Individual video view page with Open Graph metadata
app.get('/v/:filename', (req, res) => {
  const filename = req.params.filename.endsWith('.mp4')
    ? req.params.filename
    : req.params.filename + '.mp4';

  const videoPath = path.join(transcodedDir, filename);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  }

  const stats = fs.statSync(videoPath);
  const baseFilename = path.basename(filename, '.mp4');
  const thumbnailPath = `/thumbnails/${baseFilename}.jpg`;

  res.render('video', {
    filename,
    videoUrl: `/transcoded/${filename}`,
    thumbnailUrl: thumbnailPath,
    size: (stats.size / (1024 * 1024)).toFixed(2),
    date: stats.mtime
  });
});

// List videos page
app.get('/videos', (req, res) => {
  const videos = fs.readdirSync(transcodedDir)
    .filter(file => file.endsWith('.mp4'))
    .map(file => {
      const stats = fs.statSync(path.join(transcodedDir, file));
      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2), // Size in MB
        date: stats.mtime,
        url: `/transcoded/${file}`
      };
    })
    .sort((a, b) => b.date - a.date); // Newest first

  res.render('videos', { videos });
});

// Upload and transcode endpoint
app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputFilename = path.basename(req.file.filename, path.extname(req.file.filename)) + '.mp4';
  const outputPath = path.join(transcodedDir, outputFilename);

  // Transcode to MP4 using Intel QuickSync via VAAPI
  ffmpeg(inputPath)
    .inputOptions([
      '-hwaccel vaapi',
      '-hwaccel_device /dev/dri/renderD128',
      '-hwaccel_output_format vaapi'
    ])
    .outputOptions([
      '-vf scale_vaapi=format=nv12',
      '-c:v h264_vaapi',
      '-qp 23',
      '-c:a aac',
      '-b:a 128k',
      '-movflags +faststart'
    ])
    .output(outputPath)
    .on('start', (cmd) => {
      console.log('Transcoding started:', cmd);
    })
    .on('progress', (progress) => {
      if (progress.percent) {
        console.log(`Processing: ${Math.round(progress.percent)}% done`);
      }
    })
    .on('end', () => {
      console.log('Transcoding finished:', outputFilename);

      // Generate thumbnail
      const thumbnailFilename = path.basename(outputFilename, '.mp4') + '.jpg';
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

      ffmpeg(outputPath)
        .screenshots({
          timestamps: ['10%'],
          filename: thumbnailFilename,
          folder: thumbnailsDir,
          size: '1280x720'
        })
        .on('end', () => {
          console.log('Thumbnail generated:', thumbnailFilename);
        })
        .on('error', (err) => {
          console.error('Thumbnail generation error:', err);
        });

      // Delete original upload
      fs.unlink(inputPath, (err) => {
        if (err) console.error('Error deleting original file:', err);
      });

      res.json({
        success: true,
        filename: outputFilename,
        url: `/transcoded/${outputFilename}`,
        viewUrl: `/v/${path.basename(outputFilename, '.mp4')}`
      });
    })
    .on('error', (err) => {
      console.error('Transcoding error:', err);
      // Clean up on error
      fs.unlink(inputPath, () => {});
      if (fs.existsSync(outputPath)) {
        fs.unlink(outputPath, () => {});
      }
      res.status(500).json({ error: 'Transcoding failed: ' + err.message });
    })
    .run();
});

// Delete video endpoint
app.delete('/videos/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(transcodedDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Clips server running on http://localhost:${PORT}`);
  console.log('Upload page: http://localhost:' + PORT);
  console.log('Videos page: http://localhost:' + PORT + '/videos');
});
