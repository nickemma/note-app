'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, Trash2, User, X, Eye, LogOut, BarChart3, Sparkles, BookOpen, Calendar } from 'lucide-react';

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
  const [currentUsername, setCurrentUsername] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [stats, setStats] = useState({ user_note_count: 0, total_notes: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthMode, setIsAuthMode] = useState<'login' | 'register'>('login');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

  useEffect(() => {
    fetchNotes();
    if (token) fetchStats();
  }, [token]);

  useEffect(() => {
    const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNotes(filtered);
  }, [notes, searchTerm]);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_GO_API_URL}/api/notes`);
      setNotes(res.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
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

  const handleAuth = async () => {
    try {
      const endpoint = isAuthMode === 'login' ? 'login' : 'register';
      const res = await axios.post(`${process.env.NEXT_PUBLIC_JAVA_API_URL}/api/auth/${endpoint}`, {
        username,
        password,
      });
      setToken(res.data.token);
      setUserId(res.data.userId);
      setCurrentUsername(username)
      setUsername('');
      setPassword('');
    } catch (error) {
      alert(`${isAuthMode === 'login' ? 'Login' : 'Registration'} failed`);
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
      setShowCreateModal(false);
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
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string, noteUserId: number) => {
    if (noteUserId !== userId) {
      alert('You can only delete your own notes');
      return;
    }
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_GO_API_URL}/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotes();
    } catch (error) {
      alert('Delete failed');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    setNotes([]);
    setStats({ user_note_count: 0, total_notes: 0 });
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingNoteId(null);
    setShowCreateModal(false);
  };

  if (!token) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg border border-white/20">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    NoteMaster
                  </h1>
                  <p className="text-gray-600 mt-2">Your thoughts, beautifully organized</p>
                </div>

                <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
                  <button
                      onClick={() => setIsAuthMode('login')}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                          isAuthMode === 'login'
                              ? 'bg-white text-purple-600 shadow-lg'
                              : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    Login
                  </button>
                  <button
                      onClick={() => setIsAuthMode('register')}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                          isAuthMode === 'register'
                              ? 'bg-white text-purple-600 shadow-lg'
                              : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    Register
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full text-gray-600 pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Eye className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-gray-600 pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                      onClick={handleAuth}
                      className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {isAuthMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    NoteMaster
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-6 bg-white rounded-2xl px-6 py-3 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">
                    {stats.user_note_count} yours
                  </span>
                  </div>
                  <div className="w-px h-6 bg-gray-200"></div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">
                    {stats.total_notes} total
                  </span>
                  </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Greeting Section */}
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {getGreeting()}, {currentUsername}! 👋
              </h2>
              <p className="text-gray-600 text-lg">
                Ready to capture your thoughts and ideas?
              </p>
            </div>
          </div>
          {/* Search and Create Bar */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                  type="text"
                  placeholder="Search your notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-gray-600 pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg transition-all"
              />
            </div>
            <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>New Note</span>
            </button>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
                <div
                    key={note.id}
                    className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{note.title}</h3>
                    {userId === note.userId && (
                        <div className="flex space-x-2 ml-4">
                          <button
                              onClick={() => handleEdit(note)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                              onClick={() => handleDelete(note.id, note.userId)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-4">{note.content}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <User className="w-4 h-4" />
                      <span>User {note.userId}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {userId === note.userId && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Your note
                  </span>
                      </div>
                  )}
                </div>
            ))}
          </div>

          {filteredNotes.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchTerm ? 'No notes found' : 'No notes yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'Create your first note to get started!'
                  }
                </p>
                {!searchTerm && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Note</span>
                    </button>
                )}
              </div>
          )}
        </main>

        {/* Create/Edit Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingNoteId ? 'Edit Note' : 'Create New Note'}
                  </h2>
                  <button
                      onClick={resetForm}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                        type="text"
                        placeholder="Enter note title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-gray-600 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                        placeholder="Write your note content..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        className="w-full text-gray-600 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <button
                        onClick={handleCreateOrUpdateNote}
                        disabled={!title.trim() || !content.trim()}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                    >
                      {editingNoteId ? 'Update Note' : 'Create Note'}
                    </button>
                    <button
                        onClick={resetForm}
                        className="px-6 py-3 text-gray-600 font-medium border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}