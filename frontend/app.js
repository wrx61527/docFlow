/* ======================================================
   ELEMENTY UI
====================================================== */
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
const usersTile = document.getElementById('usersTile');

const email = document.getElementById('email');
const password = document.getElementById('password');

let token = '';
let role = '';
let editingCategoryId = null;

/* ======================================================
   WALIDACJA
====================================================== */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* ======================================================
   SESJA (localStorage)
====================================================== */
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
      usersTile.style.display = 'block';
    }

    loadCategories();
    loadDocs();
  }
}

/* ======================================================
   AUTORYZACJA
====================================================== */
function register() {
  const emailVal = email.value.trim();
  const passVal = password.value.trim();

  if (!emailVal || !passVal) {
    msg.className = 'text-danger';
    msg.innerText = 'Email i hasło są wymagane';
    return;
  }

  if (!isValidEmail(emailVal)) {
    msg.className = 'text-danger';
    msg.innerText = 'Nieprawidłowy adres e-mail';
    return;
  }

  fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailVal,
      password: passVal
    })
  }).then(res => {
    msg.className = res.ok ? 'text-success' : 'text-danger';
    msg.innerText = res.ok
      ? 'Zarejestrowano. Możesz się zalogować.'
      : 'Użytkownik już istnieje';
  });
}

function login() {
  fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
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

      if (role === 'admin') {
        usersTile.style.display = 'block';
      } else {
        usersTile.style.display = 'none';
      }

      loadCategories();
      loadDocs();
    })
    .catch(err => {
      msg.className = 'text-danger';
      msg.innerText = err.message;
    });
}

function logout() {
  clearSession();
  token = '';
  role = '';
  editingCategoryId = null;

  userBar.style.display = 'none';
  appDiv.style.display = 'none';
  authDiv.style.display = 'block';
}

/* ======================================================
   NAWIGACJA
====================================================== */
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

function backToDashboard() {
  categoriesSection.style.display = 'none';
  documentsSection.style.display = 'none';
  usersSection.style.display = 'none';
  dashboard.style.display = 'flex';
}

/* ======================================================
   KATEGORIE
====================================================== */
function saveCategory() {
  const name = catName.value.trim();
  const keywordsArr = keywords.value.split(',').map(k => k.trim()).filter(k => k);

  const url = editingCategoryId
    ? `http://localhost:3000/api/categories/${editingCategoryId}`
    : 'http://localhost:3000/api/categories';

  const method = editingCategoryId ? 'PUT' : 'POST';

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, keywords: keywordsArr })
  }).then(() => {
    editingCategoryId = null;
    catName.value = '';
    keywords.value = '';
    loadCategories();
  });
}

function loadCategories() {
  categoriesDiv.innerHTML = '';
  fetch('http://localhost:3000/api/categories')
    .then(res => res.json())
    .then(data => {
      data.forEach(cat => {
        const tags = cat.keywords.map(k =>
          `<span class="badge bg-info text-dark me-1">${k}</span>`
        ).join('');

        categoriesDiv.innerHTML += `
          <div class="list-group-item d-flex justify-content-between align-items-start">
            <div>
              <strong>${cat.name}</strong><br/>
              ${tags}
            </div>
            <div class="text-end">
              <button class="btn btn-outline-primary btn-sm mb-1"
                onclick="editCategory('${cat._id}','${cat.name}','${cat.keywords.join(',')}')">
                EDYTUJ
              </button><br/>
              <button class="btn btn-outline-danger btn-sm"
                onclick="deleteCategory('${cat._id}')">
                USUŃ
              </button>
            </div>
          </div>
        `;
      });
    });
}

function editCategory(id, name, keys) {
  editingCategoryId = id;
  catName.value = name;
  keywords.value = keys;
}

function deleteCategory(id) {
  if (!confirm('Usunąć kategorię?')) return;
  fetch(`http://localhost:3000/api/categories/${id}`, { method: 'DELETE' })
    .then(loadCategories);
}

/* ======================================================
   DOKUMENTY
====================================================== */
function upload() {
  if (!file.files.length) {
    alert('Wybierz plik');
    return;
  }

  const form = new FormData();
  form.append('file', file.files[0]);

  fetch('http://localhost:3000/api/documents/upload', {
    method: 'POST',
    body: form
  }).then(loadDocs);
}

function reclassifyDocuments() {
  fetch('http://localhost:3000/api/documents/reclassify', {
    method: 'POST'
  }).then(loadDocs);
}

function loadDocs() {
  docsList.innerHTML = '';
  fetch('http://localhost:3000/api/documents')
    .then(res => res.json())
    .then(data => {
      data.forEach(doc => {
        docsList.innerHTML += `
          <li class="list-group-item d-flex justify-content-between align-items-start">
            <div>
              <strong>${doc.filename}</strong><br/>
              <span class="badge bg-secondary">${doc.category}</span>
              <span class="badge bg-info ms-1">${doc.status}</span><br/>

              <select class="form-select form-select-sm w-auto mt-2"
                onchange="changeStatus('${doc._id}', this.value)">
                <option ${doc.status === 'Szkic' ? 'selected' : ''}>Szkic</option>
                <option ${doc.status === 'Do akceptacji' ? 'selected' : ''}>Do akceptacji</option>
                <option ${doc.status === 'Zatwierdzony' ? 'selected' : ''}>Zatwierdzony</option>
              </select>
            </div>

            <div class="text-end">
              <button class="btn btn-outline-primary btn-sm mb-1"
                onclick="downloadDoc('${doc._id}')">
                POBIERZ
              </button><br/>
              <button class="btn btn-outline-danger btn-sm"
                onclick="deleteDoc('${doc._id}')">
                USUŃ
              </button>
            </div>
          </li>
        `;
      });
    });
}

function changeStatus(id, status) {
  fetch(`http://localhost:3000/api/documents/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(loadDocs);
}

function deleteDoc(id) {
  if (!confirm('Usunąć dokument?')) return;
  fetch(`http://localhost:3000/api/documents/${id}`, { method: 'DELETE' })
    .then(loadDocs);
}

function downloadDoc(id) {
  window.location.href = `http://localhost:3000/api/documents/download/${id}`;
}

/* ======================================================
   UŻYTKOWNICY (ADMIN)
====================================================== */
function loadUsers() {
  usersList.innerHTML = '';

  fetch('http://localhost:3000/api/users')
    .then(res => {
      if (!res.ok) {
        throw new Error('Nie udało się pobrać użytkowników');
      }
      return res.json();
    })
    .then(users => {
      if (users.length === 0) {
        usersList.innerHTML =
          '<div class="list-group-item text-muted">Brak użytkowników</div>';
        return;
      }

      users.forEach(u => {
        usersList.innerHTML += `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>${u.email}</strong><br/>
              <small class="text-muted">Rola: ${u.role}</small>
            </div>
            <div class="text-end">
              <select class="form-select form-select-sm mb-1"
                onchange="changeUserRole('${u._id}', this.value)">
                <option value="user" ${u.role === 'user' ? 'selected' : ''}>USER</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ADMIN</option>
              </select>
              <button class="btn btn-outline-danger btn-sm"
                onclick="deleteUser('${u._id}')">
                USUŃ
              </button>
            </div>
          </div>
        `;
      });
    })
    .catch(err => {
      usersList.innerHTML =
        `<div class="list-group-item text-danger">${err.message}</div>`;
    });
}

function changeUserRole(id, role) {
  fetch(`http://localhost:3000/api/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  }).then(loadUsers);
}

function deleteUser(id) {
  if (!confirm('Usunąć użytkownika?')) return;
  fetch(`http://localhost:3000/api/users/${id}`, { method: 'DELETE' })
    .then(loadUsers);
}

/* ======================================================
   AUTO-LOGIN PO ODŚWIEŻENIU
====================================================== */
window.addEventListener('DOMContentLoaded', loadSession);
