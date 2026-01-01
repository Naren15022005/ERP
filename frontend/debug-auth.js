console.log('=== DEBUG AUTH STATE ===');
console.log('LocalStorage token:', localStorage.getItem('token'));
const user = localStorage.getItem('currentUser');
console.log('LocalStorage currentUser:', user);
if (user) {
  const parsed = JSON.parse(user);
  console.log('Parsed user:', parsed);
  console.log('Tenant in user:', parsed.tenant);
}
