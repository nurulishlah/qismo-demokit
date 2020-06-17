const express = require('express');
const morgan = require('morgan');
const app = express();
const parser = require('body-parser');
const port = process.env.PORT || 8000;
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

app.use(morgan('combined'));
app.use(parser.json());

const additionalInformation = async (roomID, userInfo) => {
  try {
    const paylaod = {
      user_properties: userInfo,
    };

    console.log(`send additional information: ${paylaod}`);
    const url = `${process.env.QISMO_BASE_URL}/api/v1/qiscus/room/${roomID}/user_info`;
    const headers = {
      Authorization: process.env.QISMO_AUTH_TOKEN,
    };

    const { data } = await axios.post(url, paylaod, { headers: headers });
    console.log('send add info done');
    return data;
  } catch (error) {
    console.log(JSON.stringify(error));
  }
};

const addTag = async (roomID) => {
  try {
    console.log(`add room tag ${roomID}`);
    const url = `${process.env.QISMO_BASE_URL}/api/v1/room_tag/create`;
    const payload = {
      tag: roomID.toString(),
      room_id: roomID.toString(),
    };

    const headers = {
      Authorization: process.env.QISMO_AUTH_TOKEN,
      'Qiscus-App-Id': process.env.QISMO_APP_ID,
    };

    const { data } = await axios.post(url, payload, { headers: headers });
    return data;
  } catch (error) {
    console.log(JSON.stringify(error));
  }
};

const sendMessage = async (roomID, message) => {
  try {
    console.log(`send message ${message} to room: ${roomID}`);
    const url = `${process.env.QISMO_BASE_URL}/${process.env.QISMO_APP_ID}/bot`;
    const payload = {
      sender_email: process.env.QISMO_ADMIN_EMAIL,
      message: message,
      type: 'text',
      room_id: roomID.toString(),
    };
    const headers = {
      Authorization: process.env.QISMO_AUTH_TOKEN,
    };

    const { data } = await axios.post(url, payload, { headers: headers });
    return data;
  } catch (error) {
    console.log(JSON.stringify(error));
  }
};

app.get('/', (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Service qismo-demokit-2 up and running',
    env: process.env.NODE_ENV,
  });
});

app.post('/caa', async (req, res, next) => {
  try {
    const body = req.body;
    const roomID = body.room_id;
    const email = body.email;
    const name = body.name;

    let paylaod = [
      {
        key: 'Order ID',
        value: '-',
      },
      {
        key: 'Nama',
        value: name,
      },
      {
        key: 'Alamat',
        value: '-',
      },
      {
        key: 'No Hp',
        value: email,
      },
      {
        key: 'Order',
        value: '-',
      },
      {
        key: 'Jumlah',
        value: '-',
      },
      {
        key: 'Biaya',
        value: '-',
      },
      {
        key: 'Link_Payment',
        value: 'https://invoice.bayardulu.com/',
      },
      {
        key: 'No. Resi',
        value: '-',
      },
    ];

    additionalInformation(roomID, paylaod);
    res.status(200).json({
      success: true,
      message: 'Successfully set addtional information',
    });
  } catch (error) {
    next(error);
  }
});

app.post('/ticket', async (req, res, next) => {
  try {
    const body = req.body;
    const roomID = body.room_id;
    let addInfo = body.additional_info;
    addInfo[0] = { key: 'Order ID', value: roomID };

    let message = 'Berikut e-invoice anda';
    let payment = '';
    let fetchAddInfo = '';

    addInfo.map((data) => {
      if (data.key === 'Link_Payment') {
        payment = `Silahkan melalukan pembayaran pada link berikut ${data.value}`;
      } else {
        fetchAddInfo = `${data.key}: ${data.value}`;
        message = `${message} \n${fetchAddInfo}`;
      }
    });

    message = `${message} \n\n${payment}`;

    Promise.all([
      additionalInformation(roomID, addInfo),
      addTag(roomID),
      sendMessage(roomID, message),
    ]);

    res.status(200).json({
      success: true,
      message: 'Successfully send e-invoice',
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.staus = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({
    success: false,
    error: error.message,
  });
});

app.listen(port, () => console.log('Listening on port', port));
