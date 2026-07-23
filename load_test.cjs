const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/db',
  method: 'GET',
};

const CONCURRENCY = 100;
const TOTAL_REQUESTS = 1000;
let completed = 0;
let errors = 0;

const startTime = Date.now();

function makeRequest() {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      res.on('data', () => {}); 
      res.on('end', () => {
        if (res.statusCode === 200) completed++;
        else errors++;
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(e);
      errors++;
      resolve();
    });

    req.end();
  });
}

async function runTest() {
  console.log(`Starting load test: ${TOTAL_REQUESTS} requests with concurrency ${CONCURRENCY}...`);
  
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const batch = [];
    for (let j = 0; j < CONCURRENCY && (i + j) < TOTAL_REQUESTS; j++) {
      batch.push(makeRequest());
    }
    await Promise.all(batch);
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n--- Load Test Results ---');
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful: ${completed}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total Time: ${duration.toFixed(2)} seconds`);
  console.log(`Requests per second (RPS): ${(TOTAL_REQUESTS / duration).toFixed(2)} req/s`);
}

runTest();
