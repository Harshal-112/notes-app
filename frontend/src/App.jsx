import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

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

  return (
    <div className="App" style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>NoteVault - React + Django</h1>
      
      <form onSubmit={createNote} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Note Title..." 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: '10px' }}
        />
        <input 
          type="text" 
          placeholder="Note Body..." 
          value={body} 
          onChange={(e) => setBody(e.target.value)}
          style={{ padding: '10px', flex: 1 }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none' }}>
          Add Note
        </button>
      </form>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {notes.map(note => (
          <div key={note.id} style={{ padding: '20px', background: '#1e2535', borderRadius: '12px', color: '#fff' }}>
            <h3>{note.title || 'Untitled'}</h3>
            <p style={{ color: '#94a3b8' }}>{note.body}</p>
            <button 
              onClick={() => deleteNote(note.id)}
              style={{ marginTop: '10px', padding: '5px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
