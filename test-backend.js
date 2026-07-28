const axios = require('axios');

axios.post('https://lens-growth.onrender.com/auth/register', {
  email: 'testuser2@gmail.com',
  password: 'password123',
  name: 'test',
  role: 'business'
}).then(res => {
  console.log('Success:', res.data);
}).catch(err => {
  console.log('Error:', err.response ? err.response.data : err.message);
});
