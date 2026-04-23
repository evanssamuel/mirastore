// ============================================================
// MIRASTORE — API Configuration
// ============================================================
const API_URL = 'https://mirastore-backend-api.onrender.com/api';

// Helper function to get auth token
function getToken() {
  const user = localStorage.getItem('ms_current_user');
  if (!user) return null;
  return JSON.parse(user).token || null;
}

// Helper function for authenticated API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}