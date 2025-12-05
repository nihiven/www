const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const https = require('https');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 8083;

// Store active transcoding progress
const activeTranscodes = new Map();

// Metadata helpers
function getMetadataPath(jobId) {
  return path.join(__dirname, 'metadata', `${jobId}.json`);
}

function saveMetadata(jobId, data) {
  const metadataPath = getMetadataPath(jobId);
  fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
}

function loadMetadata(jobId) {
  const metadataPath = getMetadataPath(jobId);
  if (fs.existsSync(metadataPath)) {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }
  return null;
}

// GroupMe video upload function
async function uploadToGroupMe(videoPath, filename, jobId) {
  const accessToken = process.env.GROUPME_ACCESS_TOKEN;
  const conversationId = process.env.GROUPME_GROUP_ID;

  if (!accessToken || !conversationId) {
    console.log('GroupMe credentials not configured, skipping upload');
    saveMetadata(jobId, {
      filename,
      uploadDate: new Date().toISOString(),
      groupmeStatus: 'skipped',
      groupmeError: 'Credentials not configured',
    });
    return null;
  }

  console.log(`Uploading ${filename} to GroupMe...`);

  // Update progress status
  const currentStatus = activeTranscodes.get(jobId);
  if (currentStatus) {
    activeTranscodes.set(jobId, {
      ...currentStatus,
      groupmeStatus: 'uploading',
    });
  }

  try {
    // Step 1: Upload video to GroupMe
    const formData = new FormData();
    formData.append('file', fs.createReadStream(videoPath));

    const uploadResponse = await new Promise((resolve, reject) => {
      const req = https.request(
        'https://video.groupme.com/transcode',
        {
          method: 'POST',
          headers: {
            'X-Access-Token': accessToken,
            'X-Conversation-Id': conversationId,
            ...formData.getHeaders(),
          },
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Upload failed: ${res.statusCode}`));
            }
          });
        }
      );
      req.on('error', reject);
      formData.pipe(req);
    });

    const statusUrl = uploadResponse.status_url;
    console.log(`GroupMe job started: ${statusUrl}`);

    // Step 2: Poll status until complete
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (5s intervals)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 5s

      const statusResponse = await new Promise((resolve, reject) => {
        const statusUrlObj = new URL(statusUrl);
        const options = {
          hostname: statusUrlObj.hostname,
          path: statusUrlObj.pathname + statusUrlObj.search,
          headers: {
            'X-Access-Token': accessToken,
          },
        };

        https
          .get(options, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
              if (res.statusCode === 201) {
                // 201 = Complete, includes video_url and thumbnail_url
                resolve({ complete: true, data: JSON.parse(data) });
              } else if (res.statusCode === 200 || res.statusCode === 202) {
                // 200 or 202 = Still processing
                resolve({ complete: false });
              } else {
                reject(new Error(`Status check failed: ${res.statusCode}`));
              }
            });
          })
          .on('error', reject);
      });

      if (statusResponse.complete) {
        const groupmeUrl = statusResponse.data.url;
        const thumbnailUrl = statusResponse.data.thumbnail_url;

        console.log(`GroupMe upload complete: ${groupmeUrl}`);

        // Save metadata
        saveMetadata(jobId, {
          filename,
          uploadDate: new Date().toISOString(),
          groupmeUrl,
          groupmeThumbnail: thumbnailUrl,
          groupmeStatus: 'complete',
        });

        // Update progress with GroupMe URLs
        const currentStatus = activeTranscodes.get(jobId);
        if (currentStatus) {
          activeTranscodes.set(jobId, {
            ...currentStatus,
            groupmeStatus: 'complete',
            groupmeUrl,
            groupmeThumbnail: thumbnailUrl,
          });
        }

        return { url: groupmeUrl, thumbnail: thumbnailUrl };
      }

      attempts++;
    }

    throw new Error('GroupMe upload timed out');
  } catch (err) {
    console.error('GroupMe upload error:', err);

    // Save error to metadata
    saveMetadata(jobId, {
      filename,
      uploadDate: new Date().toISOString(),
      groupmeStatus: 'error',
      groupmeError: err.message,
    });

    // Update progress with error
    const currentStatus = activeTranscodes.get(jobId);
    if (currentStatus) {
      activeTranscodes.set(jobId, {
        ...currentStatus,
        groupmeStatus: 'error',
        groupmeError: err.message,
      });
    }

    throw err;
  }
}

// Authentication middleware - checks query parameter
function requireAuth(req, res, next) {
  const configuredPassword = process.env.UPLOAD_PASSWORD;

  // Skip auth if no password configured
  if (!configuredPassword) {
    return next();
  }

  const providedPassword = req.query.pass || '';

  if (providedPassword !== configuredPassword) {
    return res.status(403).json({ error: 'Invalid password' });
  }

  next();
}

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const transcodedDir = path.join(__dirname, 'transcoded');
const thumbnailsDir = path.join(__dirname, 'thumbnails');
const metadataDir = path.join(__dirname, 'metadata');
[uploadsDir, transcodedDir, thumbnailsDir, metadataDir].forEach(dir => {
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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const videoTypes =
      /video\/(mp4|webm|avi|mov|mkv|flv|wmv|m4v|quicktime|x-msvideo|x-matroska)/;
    if (videoTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse JSON bodies
app.use(express.json());

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

  // Load metadata to check for GroupMe URL
  const jobId = path.basename(filename, '.mp4');
  const metadata = loadMetadata(jobId);

  res.render('video', {
    filename,
    videoUrl: metadata?.groupmeUrl || `/transcoded/${filename}`,
    thumbnailUrl: metadata?.groupmeThumbnail || thumbnailPath,
    localVideoUrl: `/transcoded/${filename}`,
    localThumbnailUrl: thumbnailPath,
    size: (stats.size / (1024 * 1024)).toFixed(2),
    date: stats.mtime,
    usingGroupMe: !!metadata?.groupmeUrl
  });
});

// Progress stream endpoint (Server-Sent Events)
app.get('/progress/:jobId', (req, res) => {
  const jobId = req.params.jobId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write('data: {"status":"connected"}\n\n');

  // Set up interval to send progress updates
  const interval = setInterval(() => {
    const progress = activeTranscodes.get(jobId);
    if (progress) {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);

      if (progress.status === 'complete' || progress.status === 'error') {
        clearInterval(interval);
        res.end();
        // Clean up after a delay
        setTimeout(() => activeTranscodes.delete(jobId), 2000);
      }
    }
  }, 500);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// List videos page
app.get('/videos', (req, res) => {
  const videos = fs
    .readdirSync(transcodedDir)
    .filter(file => file.endsWith('.mp4'))
    .map(file => {
      const stats = fs.statSync(path.join(transcodedDir, file));
      const jobId = path.basename(file, '.mp4');
      const metadata = loadMetadata(jobId);

      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2), // Size in MB
        date: stats.mtime,
        url: `/transcoded/${file}`,
        groupmeUrl: metadata?.groupmeUrl || null,
        groupmeStatus: metadata?.groupmeStatus || 'unknown',
      };
    })
    .sort((a, b) => b.date - a.date); // Newest first

  res.render('videos', { videos });
});

// Upload and transcode endpoint
app.post('/upload', requireAuth, upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputFilename =
    path.basename(req.file.filename, path.extname(req.file.filename)) + '.mp4';
  const outputPath = path.join(transcodedDir, outputFilename);
  const jobId = path.basename(
    req.file.filename,
    path.extname(req.file.filename)
  );

  // Initialize progress tracking
  activeTranscodes.set(jobId, {
    status: 'transcoding',
    percent: 0,
    phase: 'uploading',
  });

  // Send immediate response with job ID
  res.json({
    success: true,
    jobId: jobId,
    message: 'Upload complete, transcoding started',
  });

  // Transcode to MP4 using Intel QuickSync via VAAPI
  ffmpeg(inputPath)
    .inputOptions([
      '-hwaccel vaapi',
      '-hwaccel_device /dev/dri/renderD128',
      '-hwaccel_output_format vaapi',
    ])
    .outputOptions([
      '-vf scale_vaapi=w=\'min(1280,iw)\':h=\'min(720,ih)\':format=nv12',
      '-c:v h264_vaapi',
      '-qp 28',
      '-c:a aac',
      '-b:a 128k',
      '-movflags +faststart',
    ])
    .output(outputPath)
    .on('start', cmd => {
      console.log('Transcoding started:', cmd);
      activeTranscodes.set(jobId, {
        status: 'transcoding',
        percent: 0,
        phase: 'transcoding',
      });
    })
    .on('progress', progress => {
      if (progress.percent) {
        const percent = Math.round(progress.percent);
        console.log(`Processing: ${percent}% done`);
        activeTranscodes.set(jobId, {
          status: 'transcoding',
          percent: percent,
          phase: 'transcoding',
        });
      }
    })
    .on('end', () => {
      console.log('Transcoding finished:', outputFilename);

      // Update progress - generating thumbnail
      activeTranscodes.set(jobId, {
        status: 'generating_thumbnail',
        percent: 100,
        phase: 'generating thumbnail',
      });

      // Generate thumbnail
      const thumbnailFilename = path.basename(outputFilename, '.mp4') + '.jpg';
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

      ffmpeg(outputPath)
        .screenshots({
          timestamps: ['10%'],
          filename: thumbnailFilename,
          folder: thumbnailsDir,
          size: '1280x720',
        })
        .on('end', () => {
          console.log('Thumbnail generated:', thumbnailFilename);

          // Mark as complete immediately
          activeTranscodes.set(jobId, {
            status: 'complete',
            percent: 100,
            phase: 'complete',
            filename: outputFilename,
            url: `/transcoded/${outputFilename}`,
            viewUrl: `/v/${path.basename(outputFilename, '.mp4')}`,
            groupmeStatus: 'pending',
          });

          // Always start GroupMe upload asynchronously
          uploadToGroupMe(outputPath, outputFilename, jobId).catch(err => {
            console.error('GroupMe upload failed:', err);
            // Error already saved to metadata in uploadToGroupMe
          });
        })
        .on('error', err => {
          console.error('Thumbnail generation error:', err);

          // Still mark as complete even if thumbnail fails
          activeTranscodes.set(jobId, {
            status: 'complete',
            percent: 100,
            phase: 'complete',
            filename: outputFilename,
            url: `/transcoded/${outputFilename}`,
            viewUrl: `/v/${path.basename(outputFilename, '.mp4')}`,
          });
        });

      // Delete original upload
      fs.unlink(inputPath, err => {
        if (err) console.error('Error deleting original file:', err);
      });
    })
    .on('error', err => {
      console.error('Transcoding error:', err);

      // Update progress with error
      activeTranscodes.set(jobId, {
        status: 'error',
        percent: 0,
        phase: 'error',
        error: err.message,
      });

      // Clean up on error
      fs.unlink(inputPath, () => {});
      if (fs.existsSync(outputPath)) {
        fs.unlink(outputPath, () => {});
      }
    })
    .run();
});

// Delete video endpoint
app.delete('/videos/:filename', requireAuth, (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(transcodedDir, filename);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const jobId = path.basename(filename, '.mp4');
  const thumbnailPath = path.join(thumbnailsDir, `${jobId}.jpg`);
  const metadataPath = getMetadataPath(jobId);

  // Delete video file
  fs.unlink(videoPath, err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete video file' });
    }

    // Delete thumbnail if exists
    if (fs.existsSync(thumbnailPath)) {
      fs.unlink(thumbnailPath, err => {
        if (err) console.error('Error deleting thumbnail:', err);
      });
    }

    // Delete metadata if exists
    if (fs.existsSync(metadataPath)) {
      fs.unlink(metadataPath, err => {
        if (err) console.error('Error deleting metadata:', err);
      });
    }

    res.json({ success: true });
  });
});

// Get GroupMe groups list
app.get('/api/groupme/groups', requireAuth, async (req, res) => {
  const accessToken = process.env.GROUPME_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'GroupMe token not configured' });
  }

  try {
    const groupsData = await new Promise((resolve, reject) => {
      https
        .get(
          `https://api.groupme.com/v3/groups?token=${accessToken}`,
          response => {
            let data = '';
            response.on('data', chunk => (data += chunk));
            response.on('end', () => {
              if (response.statusCode === 200) {
                resolve(JSON.parse(data));
              } else {
                reject(
                  new Error(`GroupMe API error: ${response.statusCode}`)
                );
              }
            });
          }
        )
        .on('error', reject);
    });

    // Extract just the needed group info
    const groups = groupsData.response.map(group => ({
      id: group.id,
      name: group.name,
    }));

    res.json({ groups });
  } catch (err) {
    console.error('Error fetching GroupMe groups:', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Post video to GroupMe group
app.post('/api/groupme/post', requireAuth, async (req, res) => {
  const accessToken = process.env.GROUPME_ACCESS_TOKEN;
  const { groupId, filename, message } = req.body;

  if (!accessToken) {
    return res.status(500).json({ error: 'GroupMe token not configured' });
  }

  if (!groupId || !filename) {
    return res.status(400).json({ error: 'Missing groupId or filename' });
  }

  try {
    // Load metadata to get GroupMe URLs
    const jobId = path.basename(filename, '.mp4');
    const metadata = loadMetadata(jobId);

    if (!metadata || !metadata.groupmeUrl) {
      return res
        .status(400)
        .json({ error: 'Video not uploaded to GroupMe yet' });
    }

    // Generate unique GUID for message
    const guid =
      Date.now().toString() + '-' + Math.random().toString(36).substring(2, 15);

    // Build message body
    const messageBody = {
      message: {
        source_guid: guid,
        text: message || '',
        attachments: [
          {
            type: 'video',
            url: metadata.groupmeUrl,
            preview_url: metadata.groupmeThumbnail,
          },
        ],
      },
    };

    // Post to GroupMe
    const postData = JSON.stringify(messageBody);
    const postUrl = new URL(
      `https://api.groupme.com/v3/groups/${groupId}/messages?token=${accessToken}`
    );

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: postUrl.hostname,
        path: postUrl.pathname + postUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 201) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`GroupMe post failed: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log(`Posted ${filename} to GroupMe group ${groupId}`);
    res.json({ success: true, response });
  } catch (err) {
    console.error('Error posting to GroupMe:', err);
    res.status(500).json({ error: 'Failed to post to GroupMe' });
  }
});

app.listen(PORT, () => {
  console.log(`Clips server running on http://localhost:${PORT}`);
  console.log('Upload page: http://localhost:' + PORT);
  console.log('Videos page: http://localhost:' + PORT + '/videos');
});
