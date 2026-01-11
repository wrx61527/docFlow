/* ====================================================== KONFIGURACJA API ====================================================== */
const API_URL = 'http://localhost:3000/api';

/* ====================================================== ELEMENTY DOM ====================================================== */
const authDiv = document.getElementById('auth');
const appDiv = document.getElementById('app');
const dashboard = document.getElementById('dashboard');
const msg = document.getElementById('msg');
const userSpan = document.getElementById('user');
const userBar = document.getElementById('userBar');
const categoriesSection = document.getElementById('categoriesSection');
const documentsSection = document.getElementById('documentsSection');
const usersSection = document.getElementById('usersSection');
const categoriesDiv = document.getElementById('categories');
const docsList = document.getElementById('docs');
const usersList = document.getElementById('usersList');
const email = document.getElementById('email');
const password = document.getElementById('password');
const fileInput = document.getElementById('fileInput');

/* ====================================================== ZMIENNE SESJI ====================================================== */
let token = '';
let role = '';
let userId = '';
let editingCategoryId = null;

/* ====================================================== FUNKCJE POMOCNICZE ====================================================== */

/**
 * Walidacja formatu adresu email
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Wyświetlanie komunikatu
 */
function showMessage(text, type = 'danger') {
  msg.className = `alert alert-${type}`;
  msg.innerText = text;
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.display = 'none';
  }, 5000);
}

/**
 * Pobieranie tokena z nagłówka Authorization
 */
function getAuthHeader() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/* ====================================================== ZARZĄDZANIE SESJĄ ====================================================== */

/**
 * Zapisanie sesji do localStorage
 */
function saveSession(data) {
  localStorage.setItem('docflow_token', data.token);
  localStorage.setItem('docflow_email', data.email);
  localStorage.setItem('docflow_role', data.role);
  localStorage.setItem('docflow_userId', data.userId);
}

/**
 * Wczytanie sesji z localStorage
 */
function loadSession() {
  token = localStorage.getItem('docflow_token');
  const storedEmail = localStorage.getItem('docflow_email');
  role = localStorage.getItem('docflow_role');
  userId = localStorage.getItem('docflow_userId');

  if (token && storedEmail && role) {
    userSpan.innerText = storedEmail;
    authDiv.style.display = 'none';
    appDiv.style.display = 'block';
    userBar.style.display = 'inline-block';

    // Pokaż sekcję użytkowników tylko dla adminów
    if (role === 'admin') {
      document.getElementById('usersTile').style.display = 'block';
    }

    loadCategories();
    loadDocuments();
  }
}

/**
 * Wyczyszczenie sesji
 */
function clearSession() {
  localStorage.removeItem('docflow_token');
  localStorage.removeItem('docflow_email');
  localStorage.removeItem('docflow_role');
  localStorage.removeItem('docflow_userId');
  token = '';
  role = '';
  userId = '';
  editingCategoryId = null;
}

/* ====================================================== REJESTRACJA I LOGOWANIE ====================================================== */

/**
 * Rejestracja nowego użytkownika
 */
function register() {
  const emailVal = email.value.trim();
  const passVal = password.value.trim();

  // Walidacja
  if (!emailVal || !passVal) {
    showMessage('Email i hasło są wymagane');
    return;
  }

  if (!isValidEmail(emailVal)) {
    showMessage('Nieprawidłowy format adresu e-mail');
    return;
  }

  if (passVal.length < 6) {
    showMessage('Hasło musi mieć co najmniej 6 znaków');
    return;
  }

  // Wysłanie żądania
  fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailVal, password: passVal })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showMessage(data.error);
      } else {
        showMessage('Konto zostało utworzone! Możesz się zalogować.', 'success');
        email.value = '';
        password.value = '';
      }
    })
    .catch(err => showMessage('Błąd: ' + err.message));
}

/**
 * Logowanie użytkownika
 */
function login() {
  const emailVal = email.value.trim();
  const passVal = password.value.trim();

  if (!emailVal || !passVal) {
    showMessage('Email i hasło są wymagane');
    return;
  }

  fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailVal, password: passVal })
  })
    .then(res => {
      if (!res.ok) throw new Error('Nieprawidłowe dane logowania');
      return res.json();
    })
    .then(data => {
      token = data.token;
      role = data.role;
      userId = data.userId;
      saveSession(data);
      userSpan.innerText = data.email;
      userBar.style.display = 'inline-block';
      authDiv.style.display = 'none';
      appDiv.style.display = 'block';
      email.value = '';
      password.value = '';

      if (role === 'admin') {
        document.getElementById('usersTile').style.display = 'block';
      }

      loadCategories();
      loadDocuments();
      showMessage('Zalogowano pomyślnie!', 'success');
    })
    .catch(err => {
      showMessage(err.message);
    });
}

/**
 * Wylogowanie użytkownika
 */
function logout() {
  clearSession();
  userBar.style.display = 'none';
  appDiv.style.display = 'none';
  authDiv.style.display = 'block';
  dashboard.style.display = 'grid';
  categoriesSection.style.display = 'none';
  documentsSection.style.display = 'none';
  usersSection.style.display = 'none';
  showMessage('Wylogowano pomyślnie', 'success');
}

/* ====================================================== NAWIGACJA ====================================================== */

/**
 * Pokazanie danej sekcji
 */
function showSection(sectionId) {
  dashboard.style.display = 'none';
  categoriesSection.style.display = 'none';
  documentsSection.style.display = 'none';
  usersSection.style.display = 'none';
  document.getElementById(sectionId).style.display = 'block';

  if (sectionId === 'usersSection') {
    loadUsers();
  }
}

/**
 * Powrót do dashboardu
 */
function backToDashboard() {
  dashboard.style.display = 'grid';
  categoriesSection.style.display = 'none';
  documentsSection.style.display = 'none';
  usersSection.style.display = 'none';
}

/* ====================================================== ZARZĄDZANIE KATEGORIAMI ====================================================== */

/**
 * Załadowanie kategorii
 */
function loadCategories() {
  categoriesDiv.innerHTML = '<p class="text-muted">Ładowanie kategorii...</p>';

  fetch(`${API_URL}/categories`, {
    headers: getAuthHeader()
  })
    .then(res => {
      if (!res.ok) throw new Error('Błąd pobierania kategorii');
      return res.json();
    })
    .then(data => {
      categoriesDiv.innerHTML = '';
      if (data.categories.length === 0) {
        categoriesDiv.innerHTML = '<p class="text-muted">Brak kategorii. Dodaj pierwszą!</p>';
        return;
      }

      data.categories.forEach(cat => {
        const keywordsTags = cat.keywords
          .map(k => `<span class="badge bg-info">${k}</span>`)
          .join('');

        const categoryItem = document.createElement('div');
        categoryItem.className = 'document-item';
        categoryItem.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h6>${cat.name}</h6>
              <p style="margin: 5px 0 10px 0;">${keywordsTags}</p>
            </div>
            <div>
              <button class="btn btn-sm btn-warning" onclick="editCategory('${cat._id}', '${cat.name}', '${cat.keywords.join(', ')}')">Edytuj</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat._id}')">Usuń</button>
            </div>
          </div>
        `;
        categoriesDiv.appendChild(categoryItem);
      });
    })
    .catch(err => showMessage(err.message));
}

/**
 * Zapisanie nowej kategorii
 */
function saveCategory() {
  const catNameInput = document.getElementById('catName');
  const keywordsInput = document.getElementById('keywords');
  const name = catNameInput.value.trim();
  const keywordsArr = keywordsInput.value
    .split(',')
    .map(k => k.trim())
    .filter(k => k);

  if (!name) {
    showMessage('Nazwa kategorii jest wymagana');
    return;
  }

  const url = editingCategoryId
    ? `${API_URL}/categories/${editingCategoryId}`
    : `${API_URL}/categories`;

  const method = editingCategoryId ? 'PUT' : 'POST';

  fetch(url, {
    method: method,
    headers: getAuthHeader(),
    body: JSON.stringify({ name, keywords: keywordsArr })
  })
    .then(res => {
      if (!res.ok) throw new Error('Błąd zapisu kategorii');
      return res.json();
    })
    .then(data => {
      showMessage('Kategoria została zapisana', 'success');
      editingCategoryId = null;
      catNameInput.value = '';
      keywordsInput.value = '';
      loadCategories();
    })
    .catch(err => showMessage(err.message));
}

/**
 * Edycja kategorii
 */
function editCategory(id, name, keywords) {
  editingCategoryId = id;
  document.getElementById('catName').value = name;
  document.getElementById('keywords').value = keywords;
}

/**
 * Usunięcie kategorii
 */
function deleteCategory(id) {
  if (confirm('Czy na pewno chcesz usunąć tę kategorię?')) {
    fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
      .then(res => {
        if (!res.ok) throw new Error('Błąd usuwania kategorii');
        return res.json();
      })
      .then(data => {
        showMessage('Kategoria została usunięta', 'success');
        loadCategories();
      })
      .catch(err => showMessage(err.message));
  }
}

/* ====================================================== ZARZĄDZANIE DOKUMENTAMI ====================================================== */

/**
 * Załadowanie listy dokumentów
 */
function loadDocuments() {
  docsList.innerHTML = '<p class="text-muted">Ładowanie dokumentów...</p>';

  fetch(`${API_URL}/documents`, {
    headers: getAuthHeader()
  })
    .then(res => {
      if (!res.ok) throw new Error('Błąd pobierania dokumentów');
      return res.json();
    })
    .then(data => {
      docsList.innerHTML = '';
      if (data.documents.length === 0) {
        docsList.innerHTML = '<p class="text-muted">Brak dokumentów. Prześlij swój pierwszy dokument!</p>';
        return;
      }

      data.documents.forEach(doc => {
        const statusClass = doc.status === 'Szkic' ? 'draft' : doc.status === 'Do akceptacji' ? 'review' : 'approved';
        const docItem = document.createElement('div');
        docItem.className = 'document-item';
        docItem.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <h6>📄 ${doc.filename}</h6>
              <p style="margin: 5px 0;">
                <span class="badge-category">${doc.category}</span>
                <span class="badge-status ${statusClass}">${doc.status}</span>
              </p>
              <small class="text-muted">${new Date(doc.createdAt).toLocaleDateString('pl-PL')}</small>
            </div>
            <div>
              <button class="btn btn-sm btn-info" onclick="downloadDocument('${doc._id}', '${doc.filename}')">Pobierz</button>
              <button class="btn btn-sm btn-danger" onclick="deleteDocument('${doc._id}')">Usuń</button>
            </div>
          </div>
        `;
        docsList.appendChild(docItem);
      });
    })
    .catch(err => showMessage(err.message));
}

/**
 * Przesłanie dokumentu
 */
function uploadDocument() {
  if (!fileInput.files.length) {
    showMessage('Wybierz plik do przesłania');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error('Błąd przesyłania pliku');
      return res.json();
    })
    .then(data => {
      showMessage(`Dokument "${data.document.filename}" został przesłany i sklasyfikowany jako: ${data.document.category}`, 'success');
      fileInput.value = '';
      loadDocuments();
    })
    .catch(err => showMessage(err.message));
}

/**
 * Pobranie dokumentu
 */
function downloadDocument(id, filename) {
  const link = document.createElement('a');
  link.href = `${API_URL}/documents/download/${id}`;
  link.download = filename;
  link.click();
}

/**
 * Usunięcie dokumentu
 */
function deleteDocument(id) {
  if (confirm('Czy na pewno chcesz usunąć ten dokument?')) {
    fetch(`${API_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
      .then(res => {
        if (!res.ok) throw new Error('Błąd usuwania dokumentu');
        return res.json();
      })
      .then(data => {
        showMessage('Dokument został usunięty', 'success');
        loadDocuments();
      })
      .catch(err => showMessage(err.message));
  }
}

/* ====================================================== ZARZĄDZANIE UŻYTKOWNIKAMI (ADMIN) ====================================================== */

/**
 * Załadowanie listy użytkowników (tylko admin)
 */
function loadUsers() {
  usersList.innerHTML = '<p class="text-muted">Ładowanie użytkowników...</p>';

  fetch(`${API_URL}/users`, {
    headers: getAuthHeader()
  })
    .then(res => {
      if (!res.ok) throw new Error('Błąd pobierania użytkowników');
      return res.json();
    })
    .then(data => {
      usersList.innerHTML = '';
      if (data.users.length === 0) {
        usersList.innerHTML = '<p class="text-muted">Brak użytkowników</p>';
        return;
      }

      data.users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'document-item';
        userItem.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h6>👤 ${user.email}</h6>
              <small class="text-muted">Rola: ${user.role}</small>
            </div>
            <div>
              <select class="form-select form-select-sm" style="width: auto; margin-right: 10px;" onchange="changeUserRole('${user._id}', this.value)">
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
              <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">Usuń</button>
            </div>
          </div>
        `;
        usersList.appendChild(userItem);
      });
    })
    .catch(err => showMessage(err.message));
}

/**
 * Zmiana roli użytkownika
 */
function changeUserRole(userId, newRole) {
  fetch(`${API_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({ role: newRole })
  })
    .then(res => {
      if (!res.ok) throw new Error('Błąd zmiany roli');
      return res.json();
    })
    .then(data => {
      showMessage('Rola użytkownika została zmieniona', 'success');
      loadUsers();
    })
    .catch(err => showMessage(err.message));
}

/**
 * Usunięcie użytkownika
 */
function deleteUser(userId) {
  if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
    fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
      .then(res => {
        if (!res.ok) throw new Error('Błąd usuwania użytkownika');
        return res.json();
      })
      .then(data => {
        showMessage('Użytkownik został usunięty', 'success');
        loadUsers();
      })
      .catch(err => showMessage(err.message));
  }
}

/* ====================================================== INICJALIZACJA ====================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadSession();
});