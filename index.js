const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Rute untuk halaman utama
app.get('/', (req, res) => {
  const info = JSON.stringify({
    message: 'Selamat datang di API Reuploader',
    endpoints: [
      {
        path: '/up',
        method: 'GET',
        description: 'Mengunggah file dari URL yang ditentukan',
        parameters: [
          {
            name: 'url1, url2, url3, ..., url10',
            type: 'string',
            description: 'URL media yang akan diunggah, pisahkan dengan koma (maksimal 10 URL)',
          },
        ],
      },
      {
        path: '/file',
        method: 'POST',
        description: 'Mengunggah file dari form-data',
        parameters: [
          {
            name: 'file',
            type: 'file',
            description: 'File yang akan diunggah',
          },
        ],
      },
    ],
  }, null, 2);
  res.setHeader('Content-Type', 'application/json');
  res.send(info);
});

// Rute untuk mengunggah media dari URL
app.get('/up', async (req, res) => {
  const urls = req.query.urls;

  if (!urls) {
    return res.status(400).json({ error: 'Parameter "urls" tidak ditemukan' });
  }

  const urlArray = urls.split(',').slice(0, 10); // Batasi maksimal 10 URL

  try {
    const results = [];

    for (const url of urlArray) {
      // Mengunduh file dari URL
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      // Menyimpan file sementara
      const tempFilePath = 'file.png';
      fs.writeFileSync(tempFilePath, Buffer.from(response.data, 'binary'));

      // Membuat objek FormData
      const formData = new FormData();
      formData.append('files[]', fs.createReadStream(tempFilePath));

      // Mengirim permintaan POST ke pomf.lain.la
      const uploadResponse = await axios.post('https://pomf.lain.la/upload.php', formData, {
        headers: formData.getHeaders(),
      });

      // Menghapus file sementara
      fs.unlinkSync(tempFilePath);

      // Ambil URL file yang diunggah
      const fileUrl = uploadResponse.data.files[0].url;
      results.push(fileUrl);
    }

    let rslt = JSON.stringify(results, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(rslt);
  } catch (error) {
    console.error('Terjadi kesalahan saat mengunggah file:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengunggah file' });
  }
});

// Rute untuk mengunggah file dari form-data
app.post('/file', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const file = req.files.file;

    // Menyimpan file sementara
    const tempFilePath = 'file.png';
    await file.mv(tempFilePath);

    // Membuat objek FormData
    const formData = new FormData();
    formData.append('files[]', fs.createReadStream(tempFilePath));

    // Mengirim permintaan POST ke pomf.lain.la
    const uploadResponse = await axios.post('https://pomf.lain.la/upload.php', formData, {
      headers: formData.getHeaders(),
    });

    // Menghapus file sementara
    fs.unlinkSync(tempFilePath);

    // Ambil URL file yang diunggah
    const fileUrl = uploadResponse.data.files[0].url;

    res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error('Terjadi kesalahan saat mengunggah file:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengunggah file' });
  }
});

// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
