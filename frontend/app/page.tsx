'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Note {
  id: string;
  title: string;
  content: string;
  userId: number;
  createdAt: string;
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [stats, setStats] = useState({ user_note_count: 0, total_notes: 0 });

  useEffect(() => {
    fetchNotes();
    if (token) fetchStats();
  }, [token]);

  const fetchNotes = async () => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_GO_API_URL}/api/notes`);
    setNotes(res.data);
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRegister = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_JAVA_API_URL}/api/auth/register`, {
        username,
        password,
      });
      setToken(res.data.token);
      setUserId(res.data.userId);
      setUsername('');
      setPassword('');
    } catch (error) {
      alert('Registration failed');
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_JAVA_API_URL}/api/auth/login`, {
        username,
        password,
      });
      setToken(res.data.token);
      setUserId(res.data.userId);
      setUsername('');
      setPassword('');
    } catch (error) {
      alert('Login failed');
    }
  };

  const handleCreateOrUpdateNote = async () => {
    try {
      if (editingNoteId) {
        await axios.put(
            `${process.env.NEXT_PUBLIC_GO_API_URL}/api/notes/${editingNoteId}`,
            { title, content },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditingNoteId(null);
      } else {
        await axios.post(
            `${process.env.NEXT_PUBLIC_GO_API_URL}/api/notes`,
            { title, content },
            { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setTitle('');
      setContent('');
      fetchNotes();
    } catch (error) {
      alert('Operation failed');
    }
  };

  const handleEdit = (note: Note) => {
    if (note.userId !== userId) {
      alert('You can only edit your own notes');
      return;
    }
    setTitle(note.title);
    setContent(note.content);
    setEditingNoteId(note.id);
  };

  const handleDelete = async (id: string, noteUserId: number) => {
    if (noteUserId !== userId) {
      alert('You can only delete your own notes');
      return;
    }
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_GO_API_URL}/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotes();
    } catch (error) {
      alert('Delete failed');
    }
  };

  return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Note Taking App</h1>
        {!token ? (
            <div className="mb-4">
              <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border p-2 mr-2"
              />
              <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-2 mr-2"
              />
              <button onClick={handleRegister} className="bg-blue-500 text-white p-2 mr-2">
                Register
              </button>
              <button onClick={handleLogin} className="bg-green-500 text-white p-2">
                Login
              </button>
            </div>
        ) : (
            <div>
              <div className="mb-4">
                <h2 className="text-xl">Stats: {stats.user_note_count} notes by you, {stats.total_notes} total</h2>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border p-2 mb-2 w-full"
                />
                <textarea
                    placeholder="Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="border p-2 mb-2 w-full"
                />
                <button onClick={handleCreateOrUpdateNote} className="bg-blue-500 text-white p-2">
                  {editingNoteId ? 'Update Note' : 'Create Note'}
                </button>
              </div>
              <div>
                {notes.map((note) => (
                    <div key={note.id} className="border p-4 mb-2">
                      <h3 className="text-lg font-bold">{note.title}</h3>
                      <p>{note.content}</p>
                      <p className="text-sm text-gray-500">By User {note.userId} on {new Date(note.createdAt).toLocaleString()}</p>
                      {userId === note.userId && (
                          <div>
                            <button onClick={() => handleEdit(note)} className="bg-yellow-500 text-white p-2 mr-2">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(note.id, note.userId)} className="bg-red-500 text-white p-2">
                              Delete
                            </button>
                          </div>
                      )}
                    </div>
                ))}
              </div>
            </div>
        )}
      </div>
  );
}