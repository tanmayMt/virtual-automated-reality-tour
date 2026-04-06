/**
 * @param {import('axios').AxiosResponse['data']} data
 */
export function persistAuthFromResponse(data) {
  const token = data?.token ?? data?.data?.token;
  const user = data?.user ?? data?.data?.user;
  if (token) {
    localStorage.setItem('token', token);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  return { token, user };
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function dashboardPathForRole(role) {
  return role === 'buyer' ? '/buyer-dashboard' : '/seller/dashboard';
}
