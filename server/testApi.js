import jwt from 'jsonwebtoken';

(async () => {
  try {
    const token = jwt.sign({ id: '6975ba7ea1c93aaca18c7104' }, 'Swapnil8888', { expiresIn: '1d' });
    const res = await fetch('http://localhost:5000/api/chat/admin/conversations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 500));
  } catch (error) {
    console.error(error);
  }
})();
