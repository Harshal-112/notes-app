// State
let notes = JSON.parse(localStorage.getItem('notevault_notes')) || [];
let categories = JSON.parse(localStorage.getItem('notevault_cats')) || [];
let currentFilter = 'all'; // all, pinned, trash, category-id
let currentView = 'grid'; // grid, list
let editingNoteId = null;
let currentTags = [];
let searchQuery = '';

// DOM Elements
const notesGrid = document.getElementById('notes-grid');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyDesc = document.getElementById('empty-desc');
const pageTitle = document.getElementById('page-title');

// Sidebar
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const searchInput = document.getElementById('search-input');
const navItems = document.querySelectorAll('.nav-item');
const catList = document.getElementById('category-list');
const countAll = document.getElementById('count-all');
const countPinned = document.getElementById('count-pinned');
const countTrash = document.getElementById('count-trash');
const storageUsed = document.getElementById('storage-used');
const storageFill = document.getElementById('storage-fill');

// Note Modal
const noteModal = document.getElementById('note-modal');
const noteTitleInput = document.getElementById('note-title-input');
const noteBody = document.getElementById('note-body');
const noteCatSelect = document.getElementById('note-category-select');
const notePinBtn = document.getElementById('modal-pin-btn');
const colorSwatches = document.querySelectorAll('.swatch');
const tagInput = document.getElementById('tag-input');
const tagsList = document.getElementById('tags-list');
const wordCount = document.getElementById('word-count');

// Category Modal
const catModal = document.getElementById('cat-modal');
const catNameInput = document.getElementById('cat-name-input');
const catSwatches = document.querySelectorAll('.cat-swatch');

// Initialize
function init() {
  updateSidebarCounts();
  renderCategories();
  renderNotes();
  updateStorageMeter();
  setupEventListeners();
  updateCategorySelects();
}

// Event Listeners setup
function setupEventListeners() {
  // Sidebar Toggle
  menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderNotes();
  });

  // Nav Filters
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item, .cat-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      currentFilter = item.dataset.filter;
      pageTitle.textContent = item.textContent.trim().split('\n')[0];
      if(window.innerWidth <= 768) sidebar.classList.remove('open');
      renderNotes();
    });
  });

  // View Toggle
  document.getElementById('view-grid').addEventListener('click', (e) => setView('grid', e.currentTarget));
  document.getElementById('view-list').addEventListener('click', (e) => setView('list', e.currentTarget));

  // New Note
  document.getElementById('new-note-btn').addEventListener('click', openNewNoteModal);

  // Note Modal Actions
  document.getElementById('note-modal-close').addEventListener('click', closeNoteModal);
  document.getElementById('note-save-btn').addEventListener('click', saveNote);
  document.getElementById('note-delete-btn').addEventListener('click', moveToTrashOrDelete);
  
  notePinBtn.addEventListener('click', () => {
    notePinBtn.classList.toggle('active');
  });

  // Editor formatting
  document.querySelectorAll('.toolbar-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.val || null;
      document.execCommand(cmd, false, val);
      noteBody.focus();
    });
  });
  
  document.getElementById('clear-format-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('removeFormat', false, null);
    noteBody.focus();
  });

  noteBody.addEventListener('input', updateWordCount);

  // Color Swatches
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      colorSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });

  // Tags
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagInput.value.trim()) {
      e.preventDefault();
      addTag(tagInput.value.trim());
      tagInput.value = '';
    }
  });

  // Category Modal
  document.getElementById('add-category-btn').addEventListener('click', () => {
    catNameInput.value = '';
    catModal.style.display = 'flex';
    setTimeout(() => {
      catModal.classList.add('show');
      catNameInput.focus();
    }, 10);
  });
  
  document.getElementById('cat-modal-close').addEventListener('click', closeCatModal);
  document.getElementById('cat-cancel-btn').addEventListener('click', closeCatModal);
  document.getElementById('cat-save-btn').addEventListener('click', saveCategory);

  catSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      catSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });
}

// ----- Core Functions -----

function renderNotes() {
  notesGrid.innerHTML = '';
  
  let filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery) || 
                          n.textBody.toLowerCase().includes(searchQuery) ||
                          n.tags.some(t => t.toLowerCase().includes(searchQuery));
                          
    if (!matchesSearch) return false;

    if (currentFilter === 'all') return !n.isDeleted;
    if (currentFilter === 'pinned') return n.isPinned && !n.isDeleted;
    if (currentFilter === 'trash') return n.isDeleted;
    
    // Category filter
    return !n.isDeleted && n.categoryId === currentFilter;
  });

  // Sort: Pinned first, then by date (newest first)
  filteredNotes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  if (filteredNotes.length === 0) {
    notesGrid.style.display = 'none';
    emptyState.style.display = 'flex';
    if (searchQuery) {
      emptyTitle.textContent = 'No results found';
      emptyDesc.textContent = `No notes match "${searchQuery}"`;
    } else if (currentFilter === 'trash') {
      emptyTitle.textContent = 'Trash is empty';
      emptyDesc.textContent = 'Deleted notes will appear here.';
    } else {
      emptyTitle.textContent = 'No notes yet';
      emptyDesc.textContent = 'Click "New Note" to start capturing your thoughts.';
    }
  } else {
    notesGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    filteredNotes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';
      
      const themeColor = `var(--color-${note.color})`;
      card.style.setProperty('--note-color', themeColor);
      
      const cat = categories.find(c => c.id === note.categoryId);
      const catBadge = cat && !note.isDeleted ? `<span class="note-cat-badge" style="--ccat:${cat.color}">${cat.name}</span>` : '';
      
      const date = new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const tagsHtml = note.tags.slice(0, 3).map(t => `<span class="tag-badge">#${t}</span>`).join('');
      const moreTags = note.tags.length > 3 ? `<span class="tag-badge">+${note.tags.length - 3}</span>` : '';

      card.innerHTML = `
        <div class="note-card-content">
          <div class="note-header">
            <h3 class="note-title">${note.title || 'Untitled Note'}</h3>
            ${note.isPinned && !note.isDeleted ? '<svg class="pin-indicator pinned" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#0f111a"/></svg>' : ''}
          </div>
          <div class="note-body-preview">${note.textBody || '<em>No content</em>'}</div>
          <div class="note-footer">
            <span class="note-date">${date}</span>
            <div class="note-tags-preview">
              ${catBadge}
              ${tagsHtml}
              ${moreTags}
            </div>
          </div>
        </div>
      `;
      
      card.addEventListener('click', () => openEditNoteModal(note.id));
      notesGrid.appendChild(card);
    });
  }
}

function updateSidebarCounts() {
  const activeNotes = notes.filter(n => !n.isDeleted);
  countAll.textContent = activeNotes.length;
  countPinned.textContent = activeNotes.filter(n => n.isPinned).length;
  countTrash.textContent = notes.filter(n => n.isDeleted).length;
}

function renderCategories() {
  catList.innerHTML = '';
  categories.forEach(cat => {
    const catNotesCount = notes.filter(n => !n.isDeleted && n.categoryId === cat.id).length;
    const btn = document.createElement('button');
    btn.className = `cat-item ${currentFilter === cat.id ? 'active' : ''}`;
    btn.dataset.filter = cat.id;
    btn.innerHTML = `
      <div class="cat-color-dot" style="background:${cat.color}"></div>
      ${cat.name}
      <span class="nav-count">${catNotesCount}</span>
      <svg class="cat-delete" data-id="${cat.id}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    `;
    
    btn.addEventListener('click', (e) => {
      if(e.target.closest('.cat-delete')) {
        e.stopPropagation();
        deleteCategory(cat.id);
        return;
      }
      document.querySelectorAll('.nav-item, .cat-item').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = cat.id;
      pageTitle.textContent = cat.name;
      if(window.innerWidth <= 768) sidebar.classList.remove('open');
      renderNotes();
    });
    
    catList.appendChild(btn);
  });
  updateCategorySelects();
}

function updateCategorySelects() {
  noteCatSelect.innerHTML = '<option value="">No Category</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    noteCatSelect.appendChild(opt);
  });
}

// ----- Note Modal Functions -----

function openNewNoteModal() {
  editingNoteId = null;
  noteTitleInput.value = '';
  noteBody.innerHTML = '';
  noteCatSelect.value = '';
  notePinBtn.classList.remove('active');
  colorSwatches.forEach(s => s.classList.remove('active'));
  document.querySelector('.swatch[data-color="default"]').classList.add('active');
  currentTags = [];
  renderTags();
  updateWordCount();
  
  document.getElementById('note-delete-btn').style.display = 'none';
  
  showModal(noteModal);
  setTimeout(() => noteTitleInput.focus(), 100);
}

function openEditNoteModal(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  editingNoteId = id;
  noteTitleInput.value = note.title;
  noteBody.innerHTML = note.body;
  noteCatSelect.value = note.categoryId || '';
  
  if (note.isPinned) notePinBtn.classList.add('active');
  else notePinBtn.classList.remove('active');
  
  colorSwatches.forEach(s => s.classList.remove('active'));
  const swatch = document.querySelector(`.swatch[data-color="${note.color}"]`);
  if (swatch) swatch.classList.add('active');
  else document.querySelector('.swatch[data-color="default"]').classList.add('active');
  
  currentTags = [...note.tags];
  renderTags();
  updateWordCount();
  
  const delBtn = document.getElementById('note-delete-btn');
  delBtn.style.display = 'flex';
  
  if (note.isDeleted) {
    delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete Forever';
    document.getElementById('note-save-btn').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> Restore Note';
  } else {
    delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Trash';
    document.getElementById('note-save-btn').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Note';
  }
  
  showModal(noteModal);
}

function closeNoteModal() {
  hideModal(noteModal);
}

function saveNote() {
  const isRestoring = editingNoteId && notes.find(n => n.id === editingNoteId)?.isDeleted;
  
  if (isRestoring) {
    const note = notes.find(n => n.id === editingNoteId);
    note.isDeleted = false;
    saveData();
    showToast('Note restored successfully', 'success');
    closeNoteModal();
    return;
  }

  const title = noteTitleInput.value.trim();
  const body = noteBody.innerHTML;
  const textBody = noteBody.innerText || noteBody.textContent;
  
  if (!title && !textBody.trim()) {
    showToast('Cannot save an empty note', 'error');
    return;
  }
  
  const categoryId = noteCatSelect.value;
  const isPinned = notePinBtn.classList.contains('active');
  const color = document.querySelector('.swatch.active').dataset.color;
  
  if (editingNoteId) {
    const note = notes.find(n => n.id === editingNoteId);
    note.title = title;
    note.body = body;
    note.textBody = textBody;
    note.categoryId = categoryId;
    note.isPinned = isPinned;
    note.color = color;
    note.tags = [...currentTags];
    note.updatedAt = Date.now();
    showToast('Note updated', 'success');
  } else {
    const newNote = {
      id: generateId(),
      title,
      body,
      textBody,
      categoryId,
      isPinned,
      color,
      tags: [...currentTags],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: false
    };
    notes.push(newNote);
    showToast('Note created', 'success');
  }
  
  saveData();
  closeNoteModal();
}

function moveToTrashOrDelete() {
  if (!editingNoteId) return;
  
  const noteIndex = notes.findIndex(n => n.id === editingNoteId);
  if (noteIndex === -1) return;
  
  if (notes[noteIndex].isDeleted) {
    // Hard delete
    if(confirm('Are you sure you want to permanently delete this note?')) {
      notes.splice(noteIndex, 1);
      showToast('Note deleted permanently', 'success');
    } else {
      return;
    }
  } else {
    // Soft delete to trash
    notes[noteIndex].isDeleted = true;
    notes[noteIndex].isPinned = false; // unpin when trashed
    showToast('Note moved to trash', 'success');
  }
  
  saveData();
  closeNoteModal();
}

// ----- Tags -----
function renderTags() {
  tagsList.innerHTML = '';
  currentTags.forEach(tag => {
    const el = document.createElement('div');
    el.className = 'tag-item';
    el.innerHTML = `#${tag} <span>&times;</span>`;
    el.querySelector('span').addEventListener('click', () => removeTag(tag));
    tagsList.appendChild(el);
  });
}

function addTag(tag) {
  const cleanTag = tag.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
  if (cleanTag && !currentTags.includes(cleanTag)) {
    currentTags.push(cleanTag);
    renderTags();
  }
}

function removeTag(tag) {
  currentTags = currentTags.filter(t => t !== tag);
  renderTags();
}

function updateWordCount() {
  const text = noteBody.innerText || noteBody.textContent;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

// ----- Category Functions -----
function saveCategory() {
  const name = catNameInput.value.trim();
  if (!name) {
    showToast('Category name is required', 'error');
    return;
  }
  
  const color = document.querySelector('.cat-swatch.active').dataset.ccat;
  
  const newCat = {
    id: generateId(),
    name,
    color
  };
  
  categories.push(newCat);
  saveData();
  closeCatModal();
  showToast('Category created', 'success');
}

function deleteCategory(id) {
  if(confirm('Delete this category? Notes in this category will not be deleted.')) {
    categories = categories.filter(c => c.id !== id);
    // Remove category from notes
    notes.forEach(n => {
      if (n.categoryId === id) n.categoryId = '';
    });
    
    if (currentFilter === id) {
      document.getElementById('nav-all').click();
    } else {
      saveData();
    }
    showToast('Category deleted', 'success');
  }
}

function closeCatModal() {
  hideModal(catModal);
}

// ----- Helpers -----

function setView(view, btnElement) {
  currentView = view;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
  
  if (view === 'list') {
    notesGrid.classList.add('list-view');
  } else {
    notesGrid.classList.remove('list-view');
  }
}

function showModal(modal) {
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
}

function hideModal(modal) {
  modal.classList.remove('show');
  setTimeout(() => modal.style.display = 'none', 300);
}

function saveData() {
  localStorage.setItem('notevault_notes', JSON.stringify(notes));
  localStorage.setItem('notevault_cats', JSON.stringify(categories));
  updateSidebarCounts();
  renderCategories();
  renderNotes();
  updateStorageMeter();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' 
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    
  toast.innerHTML = `${icon} <span>${msg}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function updateStorageMeter() {
  // Rough estimation of local storage usage (max 5MB generally)
  let totalBytes = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalBytes += ((localStorage[key].length + key.length) * 2);
    }
  }
  
  const kb = (totalBytes / 1024).toFixed(1);
  storageUsed.textContent = `${kb} KB`;
  
  // Assuming 5MB max
  const maxKB = 5120;
  let percent = (totalBytes / 1024 / maxKB) * 100;
  if (percent > 100) percent = 100;
  
  storageFill.style.width = `${percent}%`;
  
  if (percent > 80) {
    storageFill.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
  } else {
    storageFill.style.background = 'linear-gradient(90deg, var(--accent-primary), #a855f7)';
  }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
