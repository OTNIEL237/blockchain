const http = require('http');

const postData = JSON.stringify({
  rewardAddress: "test-address"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/mine',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Mine Response:", data);
    
    // Now get balance
    http.get('http://localhost:3000/api/address/test-address/transactions', (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => console.log("Balance Response:", data2));
    });
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
