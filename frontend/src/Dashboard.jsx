import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Download, Clock, Loader, AlertCircle, LogOut, User, Scissors } from 'lucide-react';
import { resumeAPI, authAPI } from './services/api';

function Dashboard({ user, onLogout, onCreateNew, onEditResume, onTailorResume }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await resumeAPI.listResumes();
      
      if (response.success) {
        setResumes(response.data.resumes);
      } else {
        setError('Failed to load resumes');
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setError('Unable to load resumes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      setDeletingId(id);
      const response = await resumeAPI.deleteResume(id);
      
      if (response.success) {
        setResumes(resumes.filter(r => r._id !== id));
      } else {
        alert('Failed to delete resume');
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      alert('Unable to delete resume. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
      // Still logout on frontend even if backend fails
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      onLogout();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 mesh-background opacity-20"></div>
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      
      {/* Header */}
      <div className="glass-strong backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 slide-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 float">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="gradient-text">AI Resume Builder</span>
                </h1>
                <p className="text-sm text-white/70">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-white/90">
                <User className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold">{user.fullName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 glass-dark text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-xl transition-all hover-lift border border-red-400/30"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 fade-in">
          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Welcome back, {user.fullName.split(' ')[0]}! 👋</span>
          </h2>
          <p className="text-white/80 text-lg">Manage your resumes and create new ones</p>
        </div>

        {/* Create New and Tailor Buttons */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <button
            onClick={onCreateNew}
            className="flex-1 min-w-[200px] px-8 py-5 btn-premium text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-lg pulse-glow hover-lift justify-center"
          >
            <Plus className="w-7 h-7" />
            Create New Resume
          </button>
          {onTailorResume && (
            <button
              onClick={onTailorResume}
              className="flex-1 min-w-[200px] px-8 py-5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-lg hover:shadow-cyan-500/50 hover-lift justify-center border border-cyan-400/30"
            >
              <Scissors className="w-7 h-7" />
              Tailor Resume for Job
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 fade-in">
            <Loader className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
            <p className="text-white/80 text-lg">Loading your resumes...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 glass-dark border border-red-400/30 rounded-2xl flex items-start gap-4 slide-in-up">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-300 mb-1 text-lg">Error Loading Resumes</h3>
              <p className="text-red-200 mb-3">{error}</p>
              <button
                onClick={fetchResumes}
                className="px-5 py-2.5 btn-premium text-white rounded-xl hover-lift font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && resumes.length === 0 && (
          <div className="text-center py-16 fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 glass-strong rounded-3xl mb-6 float">
              <FileText className="w-14 h-14 text-cyan-400" />
            </div>
            <h3 className="text-3xl font-bold mb-2">
              <span className="gradient-text">No Resumes Yet</span>
            </h3>
            <p className="text-white/70 mb-8 text-lg">Create your first resume to get started!</p>
            <button
              onClick={onCreateNew}
              className="px-8 py-4 btn-premium text-white rounded-xl hover-lift inline-flex items-center gap-3 font-bold text-lg shadow-2xl"
            >
              <Plus className="w-6 h-6" />
              Create Your First Resume
            </button>
          </div>
        )}

        {/* Resumes Grid */}
        {!loading && !error && resumes.length > 0 && (
          <div className="fade-in">
            <h3 className="text-2xl font-bold mb-6">
              <span className="gradient-text">Your Resumes ({resumes.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume, index) => (
                <div
                  key={resume._id}
                  className="premium-card rounded-2xl overflow-hidden border border-white/30 hover-lift stagger-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-5 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10">
                      <h4 className="font-bold text-xl truncate mb-1">{resume.title}</h4>
                      <p className="text-sm text-white/90 truncate flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {resume.personalInfo?.fullName || 'No name'}
                      </p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-8 h-8 glass rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{resume.layout || 'Modern Minimalist'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 glass rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <span>{formatDate(resume.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => onEditResume(resume)}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-bold hover-lift"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resume._id)}
                        disabled={deletingId === resume._id}
                        className="py-3 px-4 glass-dark text-red-400 border border-red-400/30 rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
                      >
                        {deletingId === resume._id ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

