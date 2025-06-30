const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');
const app = express();
const upload = multer();

const R2_ACCESS_KEY_ID = '1a97851a3d59ab74661048250ca6c6d2'; // Poné tu key real
const R2_SECRET_ACCESS_KEY = 'c2035635518d4a86286fb823368f9e64221344b152eaf6f9a463fc26095f28a9'; // Poné tu secret real
const R2_BUCKET = 'autos';
const R2_ENDPOINT = 'https://b8e9969cd7cb127d29e94326868587ec.r2.cloudflarestorage.com';
const R2_PUBLIC_URL = 'https://pub-89ae4203d72c4ba9825b47d5c1c74291.r2.dev';

const s3 = new AWS.S3({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  endpoint: R2_ENDPOINT,
  signatureVersion: 'v4',
  region: 'us-east-1',
  s3ForcePathStyle: true,
});

app.use(cors());

// Subir una sola imagen
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const remoteFileName = Date.now() + '-' + file.originalname;

  s3.putObject({
    Bucket: R2_BUCKET,
    Key: remoteFileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  }, (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    const publicUrl = `${R2_PUBLIC_URL}/${remoteFileName}`;
    res.json({ url: publicUrl });
  });
});

// Subir varias imágenes (para galería)
app.post('/upload-multiple', upload.array('files'), async (req, res) => {
  const files = req.files;
  let urls = [];

  for (const file of files) {
    const remoteFileName = Date.now() + '-' + file.originalname;
    await s3.putObject({
      Bucket: R2_BUCKET,
      Key: remoteFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }).promise();

    urls.push(`${R2_PUBLIC_URL}/${remoteFileName}`);
  }

  res.json({ urls });
});

app.listen(4000, () => console.log('Server on http://localhost:4000'));
