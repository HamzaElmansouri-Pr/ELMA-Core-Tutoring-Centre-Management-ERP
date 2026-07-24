const axios = require('axios');

async function test() {
  try {
    const api = axios.create({
      baseURL: 'http://localhost:8000',
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174', // simulate frontend
      }
    });

    console.log("Fetching CSRF cookie...");
    const res = await api.get('/sanctum/csrf-cookie');
    console.log("CSRF Cookie Response Headers:", res.headers);
    const cookies = res.headers['set-cookie'] || [];
    console.log("Cookies received:", cookies);

    let xsrfToken = '';
    for (const cookie of cookies) {
      if (cookie.startsWith('XSRF-TOKEN=')) {
        xsrfToken = decodeURIComponent(cookie.split(';')[0].substring(11));
      }
    }
    console.log("Extracted XSRF-TOKEN:", xsrfToken);

    // Set cookie on api instance
    api.defaults.headers.Cookie = cookies.map(c => c.split(';')[0]).join('; ');
    if (xsrfToken) {
      api.defaults.headers['X-XSRF-TOKEN'] = xsrfToken;
    }

    console.log("\nAttempting login...");
    const loginRes = await api.post('/api/login', {
      email: 'test@example.com',
      password: 'password'
    });
    console.log("Login Success! Status:", loginRes.status);
    console.log("Login Data:", loginRes.data);

  } catch (err) {
    console.error("Error:");
    if (err.response) {
      console.error(err.response.status, err.response.statusText);
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

test();
