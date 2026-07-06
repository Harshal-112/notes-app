import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://127.0.0.1:8000/api/notes/';

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    if (!title && !body) return;
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          text_body: body,
          is_pinned: false,
          is_deleted: false,
          color: 'default'
        }),
      });
      if (response.ok) {
        setTitle('');
        setBody('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id) => {
    try {
      await fetch(`${API_URL}${id}/`, { method: 'DELETE' });
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatIndex = (num) => String(num).padStart(3, '0');

  return (
    <div className="vault">
      <header className="vault-header">
        <div className="vault-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="36" height="36">
            <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="24" cy="24" r="4" fill="currentColor" />
            <line x1="24" y1="6" x2="24" y2="12" stroke="currentColor" strokeWidth="2" />
            <line x1="24" y1="36" x2="24" y2="42" stroke="currentColor" strokeWidth="2" />
            <line x1="6" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="2" />
            <line x1="36" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <h1>NoteVault</h1>
          <p className="vault-sub">Secured records &middot; React + Django</p>
        </div>
        <div className="vault-count">
          <span className="vault-count-num">{formatIndex(notes.length)}</span>
          <span className="vault-count-label">filed</span>
        </div>
      </header>

      <form onSubmit={createNote} className="deposit-form">
        <input
          type="text"
          placeholder="Title this record..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="deposit-title"
        />
        <input
          type="text"
          placeholder="What do you want to remember?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="deposit-body"
        />
        <button type="submit" className="deposit-btn" disabled={loading}>
          {loading ? 'Filing…' : 'File it away'}
        </button>
      </form>

      {notes.length === 0 ? (
        <div className="empty-vault">
          <p>The vault is empty.</p>
          <span>Records you file will show up here.</span>
        </div>
      ) : (
        <div className="record-grid">
          {notes.map((note, i) => (
            <article key={note.id} className="record-card">
              <div className="record-tab">{formatIndex(i + 1)}</div>
              <h3>{note.title || 'Untitled record'}</h3>
              <p>{note.body}</p>
              <button
                onClick={() => deleteNote(note.id)}
                className="record-delete"
                aria-label={`Delete ${note.title || 'note'}`}
              >
                Shred
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
