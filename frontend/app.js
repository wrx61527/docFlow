// ====== KONFIGURACJA ======
const API_URL = 'http://localhost:3000/api';

// ====== ELEMENTY UI ======
const authDiv = document.getElementById('auth');
const appDiv = document.getElementById('app');
const dashboard = document.getElementById('dashboard');
const msg = document.getElementById('msg');
const userSpan = document.getElementById('user');
const userBar = document.getElementById('userBar');
const adminCard = document.getElementById('adminCard');

// Sekcje
const categoriesSection = document.getElementById('categoriesSection');
const documentsSection = document.getElementById('documentsSection');
const adminSection = document.getElementById('adminSection');

// Listy
const catList = document.getElementById('catList');
const docsList = document.getElementById('docsList');
const usersList = document.getElementById('usersList');

// Formularze
const email = document.getElementById('email');
const password = document.getElementById('password');
const docFile = document.getElementById('docFile');
const catName = document.getElementById('catName');
const catKeywords = document.getElementById('catKeywords');

let token = '';
let role = '';

// ====== WALIDACJA ======
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ====== SESJA (localStorage) ======
function saveSession(data) {
  localStorage.setItem('docflow_token', data.token);
  localStorage.setItem('docflow_email', data.email);
  localStorage.setItem('docflow_role', data.role);
}

function clearSession() {
  localStorage.removeItem('docflow_token');
  localStorage.removeItem('docflow_email');
  localStorage.removeItem('docflow_role');
}

function loadSession() {
  const t = localStorage.getItem('docflow_token');
  const e = localStorage.getItem('docflow_email');
  const r = localStorage.getItem('docflow_role');
  
  if (t && e && r) {
    token = t;
    role = r;
    userSpan.innerText = e;
    authDiv.style.display = 'none';
    appDiv.style.display = 'block';
    userBar.style.display = 'inline';
    
    if (role === 'admin') {
      adminCard.style.display = 'block';
    }
    
    loadDocuments();
    loadCategories();
  }
}

// Załaduj sesję przy starcie
document.addEventListener('DOMContentLoaded', loadSession);

// ====== AUTORYZACJA ======
function register() {
  const emailVal = email.value.trim();
  const passVal = password.value.trim();
  
  if (!emailVal || !passVal) {
    msg.className = 'text-danger';
    msg.innerText = '❌ Email i hasło są wymagane';
    return;
  }
  
  if (!isValidEmail(emailVal)) {
    msg.className = 'text-danger';
    msg.innerText = '❌ Nieprawidłowy adres e-mail';
    return;
  }
  
  if (passVal.length < 6) {
    msg.className = 'text-danger';
    msg.innerText = '❌ Hasło musi mieć minimum 6 znaków';
    return;
  }
  
  fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailVal, password: passVal })
  })
    .then(res => {
      if (res.ok) {
        msg.className = 'text-success';
        msg.innerText = '✅ Zarejestrowano! Możesz się zalogować.';
        email.value = '';
        password.value = '';
      } else {
        msg.className = 'text-danger';
        msg.innerText = '❌ Użytkownik już istnieje';
      }
    })
    .catch(() => {
      msg.className = 'text-danger';
      msg.innerText = '❌ Błąd rejestracji. Spróbuj później.';
    });
}

function login() {
  const emailVal = email.value.trim();
  const passVal = password.value.trim();
  
  if (!emailVal || !passVal) {
    msg.className = 'text-danger';
    msg.innerText = '❌ Email i hasło są wymagane';
    return;
  }
  
  fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailVal, password: passVal })
  })
    .then(res => {
      if (!res.ok) throw new Error('Błędne dane logowania');
      return res.json();
    })
    .then(data => {
      token = data.token;
      role = data.role;
      saveSession(data);
      
      userSpan.innerText = data.email;
      userBar.style.display = 'inline';
      authDiv.style.display = 'none';
      appDiv.style.display = 'block';
      msg.innerText = '';
      email.value = '';
      password.value = '';
      
      if (role === 'admin') {
        adminCard.style.display = 'block';
      } else {
        adminCard.style.display = 'none';
      }
      
      loadDocuments();
      loadCategories();
      showSection('dashboard');
    })
    .catch(err => {
      msg.className = 'text-danger';
      msg.innerText = '❌ ' + err.message;
    });
}

function logout() {
  clearSession();
  token = '';
  role = '';
  
  userBar.style.display = 'none';
  appDiv.style.display = 'none';
  authDiv.style.display = 'block';
  
  dashboard.style.display = 'block';
  documentsSection.style.display = 'none';
  categoriesSection.style.display = 'none';
  adminSection.style.display = 'none';
}

// ====== NAWIGACJA ======
function showSection(sectionId) {
  // Ukryj wszystkie sekcje
  dashboard.style.display = 'none';
  categoriesSection.style.display = 'none';
  documentsSection.style.display = 'none';
  adminSection.style.display = 'none';
  
  // Pokaż wybraną sekcję
  if (sectionId === 'dashboard') {
    dashboard.style.display = 'block';
  } else if (sectionId === 'documentsSection') {
    documentsSection.classList.add('active');
    documentsSection.style.display = 'block';
    loadDocuments();
  } else if (sectionId === 'categoriesSection') {
    categoriesSection.classList.add('active');
    categoriesSection.style.display = 'block';
    loadCategories();
  } else if (sectionId === 'adminSection') {
    adminSection.classList.add('active');
    adminSection.style.display = 'block';
    loadUsers();
  }
}

// ====== DOKUMENTY ======
function uploadDocument() {
  if (!docFile.files.length) {
    alert('⚠️ Wybierz plik!');
    return;
  }
  
  const file = docFile.files[0];
  const formData = new FormData();
  formData.append('file', file);
  
  fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('❌ ' + data.error);
      } else {
        alert('✅ Dokument przesłany!');
        docFile.value = '';
        loadDocuments();
      }
    })
    .catch(err => alert('❌ Błąd: ' + err.message));
}

function loadDocuments() {
  docsList.innerHTML = '<p class="text-muted">Ładowanie dokumentów...</p>';
  
  fetch(`${API_URL}/documents`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => {
      if (!res.ok) throw new Error('Nieautoryzowany dostęp');
      return res.json();
    })
    .then(data => {
      if (!data.documents || data.documents.length === 0) {
        docsList.innerHTML = '<p class="text-muted">📭 Brak dokumentów. Przesyłanie pierwszego dokumentu...</p>';
        return;
      }
      
      docsList.innerHTML = '';
      data.documents.forEach(doc => {
        const statusBadge = getStatusBadge(doc.status || 'Niedostępny');
        const html = `
          <div class="document-item">
            <div class="document-item-info">
              <strong>${doc.filename || 'Nieznana nazwa'}</strong><br>
              <small class="text-muted">
                Kategoria: <span class="badge badge-primary">${doc.category || 'Nieprzypisane'}</span>
                Status: ${statusBadge}
              </small>
            </div>
            <div class="document-item-actions">
              <select class="form-select form-select-sm" style="max-width: 150px;" onchange="changeStatus('${doc._id}', this.value)">
                <option value="Szkic" ${doc.status === 'Szkic' ? 'selected' : ''}>Szkic</option>
                <option value="Do akceptacji" ${doc.status === 'Do akceptacji' ? 'selected' : ''}>Do akceptacji</option>
                <option value="Zatwierdzony" ${doc.status === 'Zatwierdzony' ? 'selected' : ''}>Zatwierdzony</option>
                <option value="Zarchiwizowany" ${doc.status === 'Zarchiwizowany' ? 'selected' : ''}>Zarchiwizowany</option>
              </select>
              <button onclick="deleteDocument('${doc._id}')" class="btn btn-sm btn-danger">Usuń</button>
            </div>
          </div>
        `;
        docsList.innerHTML += html;
      });
    })
    .catch(err => {
      docsList.innerHTML = `<p class="text-danger">❌ ${err.message}</p>`;
    });
}

function changeStatus(docId, newStatus) {
  fetch(`${API_URL}/documents/${docId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('❌ ' + data.error);
      } else {
        alert('✅ Status zmieniony!');
        loadDocuments();
      }
    })
    .catch(err => alert('❌ Błąd: ' + err.message));
}

function deleteDocument(docId) {
  if (!confirm('❓ Na pewno chcesz usunąć ten dokument?')) return;
  
  fetch(`${API_URL}/documents/${docId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('❌ ' + data.error);
      } else {
        alert('✅ Dokument usunięty!');
        loadDocuments();
      }
    })
    .catch(err => alert('❌ Błąd: ' + err.message));
}

// ====== KATEGORIE ======
function addCategory() {
  const name = catName.value.trim();
  const keywords = catKeywords.value.split(',').map(k => k.trim()).filter(k => k);
  
  if (!name || keywords.length === 0) {
    alert('⚠️ Wypełnij nazwę i słowa kluczowe!');
    return;
  }
  
  fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, keywords })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('❌ ' + data.error);
      } else {
        alert('✅ Kategoria dodana!');
        catName.value = '';
        catKeywords.value = '';
        loadCategories();
      }
    })
    .catch(err => alert('❌ Błąd: ' + err.message));
}

function loadCategories() {
  catList.innerHTML = '<p class="text-muted">Ładowanie kategorii...</p>';
  
  fetch(`${API_URL}/categories`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        catList.innerHTML = '<p class="text-muted">📭 Brak kategorii. Dodaj pierwszą...</p>';
        return;
      }
      
      catList.innerHTML = '';
      data.forEach(cat => {
        const keywordsTags = cat.keywords.map(k => `<span class="badge badge-success">${k}</span>`).join(' ');
        const html = `
          <div class="list-group-item">
            <strong>${cat.name}</strong><br>
            <small class="text-muted">Słowa kluczowe:</small><br>
            ${keywordsTags}
            <button onclick="deleteCategory('${cat._id}')" class="btn btn-sm btn-danger mt-2">Usuń</button>
          </div>
        `;
        catList.innerHTML += html;
      });
    })
    .catch(err => {
      catList.innerHTML = `<p class="text-danger">❌ ${err.message}</p>`;
    });
}

function deleteCategory(catId) {
  if (!confirm('❓ Na pewno chcesz usunąć tę kategorię?')) return;
  
  fetch(`${API_URL}/categories/${catId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('❌ ' + data.error);
      } else {
        alert('✅ Kategoria usunięta!');
        loadCategories();
      }
    })
    .catch(err => alert('❌ Błąd: ' + err.message));
}

// ====== UŻYTKOWNICY (ADMIN) ======
function loadUsers() {
  if (role !== 'admin') {
    usersList.innerHTML = '<p class="text-danger">❌ Brak dostępu - tylko admin!</p>';
    return;
  }
  
  usersList.innerHTML = '<p class="text-muted">Ładowanie użytkowników...</p>';
  
  fetch(`${API_URL}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => {
      if (!res.ok) throw new Error('Nieautoryzowany dostęp');
      return res.json();
    })
    .then(data => {
      if (!data || data.length === 0) {
        usersList.innerHTML = '<p class="text-muted">📭 Brak użytkowników.</p>';
        return;
      }
      
      usersList.innerHTML = '';
      data.forEach(user => {
        const roleBadge = user.role === 'admin' ? 
          '<span class="badge badge-danger">Admin</span>' : 
          '<span class="badge badge-primary">User</span>';
        
        const html = `
          <div class="list-group-item">
            <strong>${user.email}</strong> ${roleBadge}<br>
            <small class="text-muted">ID: ${user._id}</small><br>
            <button onclick="changeUserRole('${user._id}', '${user.role === 'admin' ? 'user' : 'admin'}')" class="btn btn-sm btn-warning mt-2">
              ${user.role === 'admin' ? 'Obniż do User' : 'Podnieś do Admin'}
            </button>
            <button onclick="deleteUser('${user._id}')" class="btn btn-sm btn-danger mt-2">Usuń</button>
          </div>
        `;
        usersList.innerHTML += html;
      });
    })
    .catch(err => {
      usersList.innerHTML = `<p class="text-danger">❌ ${err.message}</p>`;
    });
}

function changeUserRole(userId, newRole) {
  if (!confirm(`❓ Zmienić rolę na '${newRole}'?`)) return;
  
  fetch(`${API_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: newRole })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('❌ ' + data.error);
      } else {
        alert('✅ Rola zmieniona!');
        loadUsers();
      }
    })
    .catch(err => alert('❌ Błąd: ' + err.message));
}

function deleteUser(userId) {
  if (!confirm('❓ Na pewno usunąć tego użytkownika?')) return;
  
  fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('❌ ' + data.error);
      } else {
        alert('✅ Użytkownik usunięty!');
        loadUsers();
      }
    })
    .catch(err => alert('❌ Błąd: ' + err.message));
}

// ====== HELPER FUNCTIONS ======
function getStatusBadge(status) {
  const badges = {
    'Szkic': '<span class="badge badge-warning">Szkic</span>',
    'Do akceptacji': '<span class="badge badge-info">Do akceptacji</span>',
    'Zatwierdzony': '<span class="badge badge-success">Zatwierdzony</span>',
    'Zarchiwizowany': '<span class="badge badge-secondary">Zarchiwizowany</span>'
  };
  return badges[status] || '<span class="badge badge-danger">Nieznany</span>';
}