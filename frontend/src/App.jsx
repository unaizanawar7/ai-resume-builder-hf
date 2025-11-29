/**
 * AI Resume Builder - Main Application
 * 
 * A comprehensive resume builder with AI assistance
 * Features: File upload, manual entry, AI generation, chat assistant, export
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Sparkles, MessageSquare, Download, 
  ChevronRight, Check, X, Loader, Edit, Save,
  Layout, User, Briefcase, GraduationCap, Code,
  Send, Bot, RefreshCw, ArrowLeft, Scissors,
  Image, Palette, Eye, EyeOff, Settings
} from 'lucide-react';
import { resumeAPI, aiAPI, authAPI } from './services/api';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import ReviewPage from './components/ReviewPage';
import './index.css';
import curvePreview from './assets/A Customised CurVe CV.jpeg';
import altacvPreview from './assets/AltaCV.jpeg';
import hipsterPreview from './assets/Simple Hipster CV.jpeg';
import cvTemplatePreview from './assets/CV Template.jpeg';
import resumeTemplatePreview from './assets/Resume Template.jpeg';
import maltacvPreview from './assets/MAltaCV.jpeg';
import sixtySecondsPreview from './assets/SixtySecondsCV.jpeg';

function App() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'dashboard', 'builder', 'tailor'
  const [editingResume, setEditingResume] = useState(null); // Resume being edited
  const [tailorMode, setTailorMode] = useState(false); // Whether in tailor mode
  
  // Main state
  const [currentStep, setCurrentStep] = useState(1); // 1-6 for each step
  const [resumeData, setResumeData] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState('Customised Curve CV'); // Default layout
  const [generatedResume, setGeneratedResume] = useState(null);
  const [targetRole, setTargetRole] = useState(''); // Shared across LayoutStep and GenerateStep
  const [targetIndustry, setTargetIndustry] = useState(''); // Shared across LayoutStep and GenerateStep
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Manual entry state
  const [manualData, setManualData] = useState({
    personalInfo: { fullName: '', email: '', phone: '', location: '' },
    experience: [],
    education: [],
    skills: { technical: [], soft: [] },
  });

  // Tailor resume state
  const [jobCircular, setJobCircular] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [interviewResponses, setInterviewResponses] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [tailoredResume, setTailoredResume] = useState(null);
  const [editingTailoredResume, setEditingTailoredResume] = useState(null);
  const [selectedTailoredLayout, setSelectedTailoredLayout] = useState('Customised Curve CV');

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        // Verify token with backend
        const response = await authAPI.getCurrentUser();
        if (response.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        } else {
          // Invalid token, clear storage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setCurrentView('login');
        }
      } else {
        setCurrentView('login');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      // If token is invalid, clear storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setCurrentView('login');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleSignup = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView('login');
    // Reset all state
    setCurrentStep(1);
    setResumeData(null);
    setGeneratedResume(null);
    setEditingResume(null);
  };

  // Helper function to map layout names to template IDs
  const getTemplateIdFromLayout = (layoutName) => {
    const mapping = {
      'Customised Curve CV': 'customised-curve-cv',
      'AltaCV': 'altacv',
      'Simple Hipster CV': 'simple-hipster-cv',
      'CV Template': 'cv-template',
      'Resume Template': 'resume-template',
      'MAltaCV': 'maltacv',
      'SixtySecondsCV': 'sixty-seconds-cv',
      'Infographics CV': 'infographics-cv'
    };
    return mapping[layoutName] || 'customised-curve-cv';
  };

  const handleCreateNew = () => {
    // Reset builder state
    setCurrentStep(1);
    setResumeData(null);
    setGeneratedResume(null);
    setEditingResume(null);
    setSelectedLayout('Customised Curve CV');
    setTargetRole(''); // Reset target role
    setTargetIndustry(''); // Reset target industry
    setManualData({
      personalInfo: { fullName: '', email: '', phone: '', location: '' },
      experience: [],
      education: [],
      skills: { technical: [], soft: [] },
    });
    setCurrentView('builder');
  };

  const handleEditResume = (resume) => {
    setEditingResume(resume);
    setResumeData(resume);
    setGeneratedResume(resume);
    setSelectedLayout(resume.layout || 'Customised Curve CV');
    setCurrentStep(5); // Go to edit step
    setCurrentView('builder');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentStep(1);
    // Reset chat when returning to dashboard
    setChatOpen(false);
    setChatMessages([]);
  };

  const handleTailorResume = () => {
    setTailorMode(true);
    setCurrentView('tailor');
    setCurrentStep(1);
    // Reset tailor-specific state
    setJobCircular('');
    setInterviewQuestions([]);
    setInterviewResponses([]);
    setCurrentQuestionIndex(0);
    setTailoredResume(null);
  };

  // Save resume to database (called from Export step)
  const handleSaveResume = async () => {
    if (!generatedResume && !resumeData) return;

    try {
      setLoading(true);
      const dataToSave = {
        ...generatedResume,
        layout: selectedLayout,
      };

      if (editingResume) {
        // Update existing resume
        await resumeAPI.updateResume(editingResume._id, dataToSave);
        setSuccess('Resume updated successfully!');
      } else {
        // Create new resume
        await resumeAPI.saveResume(dataToSave);
        setSuccess('Resume saved successfully!');
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save resume. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Steps configuration
  const steps = [
    { number: 1, name: 'Get Started', icon: User },
    { number: 2, name: 'Information', icon: FileUp },
    { number: 3, name: 'Choose Layout', icon: Layout },
    { number: 4, name: 'Generate', icon: Sparkles },
    { number: 5, name: 'Edit & Refine', icon: Edit },
    { number: 6, name: 'Export', icon: Download },
  ];

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Login page
  if (currentView === 'login') {
    return <Login onLogin={handleLogin} onSwitchToSignup={() => setCurrentView('signup')} />;
  }

  // Show Signup page
  if (currentView === 'signup') {
    return <Signup onSignup={handleSignup} onSwitchToLogin={() => setCurrentView('login')} />;
  }

  // Show Dashboard
  if (currentView === 'dashboard') {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        onCreateNew={handleCreateNew}
        onEditResume={handleEditResume}
        onTailorResume={handleTailorResume}
      />
    );
  }

  // Show Tailor Resume Flow (currentView === 'tailor')
  if (currentView === 'tailor') {
    return (
      <TailorResumeFlow
        user={user}
        onBackToDashboard={handleBackToDashboard}
        jobCircular={jobCircular}
        setJobCircular={setJobCircular}
        interviewQuestions={interviewQuestions}
        setInterviewQuestions={setInterviewQuestions}
        interviewResponses={interviewResponses}
        setInterviewResponses={setInterviewResponses}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        tailoredResume={tailoredResume}
        setTailoredResume={setTailoredResume}
        selectedTailoredLayout={selectedTailoredLayout}
        setSelectedTailoredLayout={setSelectedTailoredLayout}
        setError={setError}
        setSuccess={setSuccess}
        setLoading={setLoading}
        loading={loading}
      />
    );
  }

  // Show Resume Builder (currentView === 'builder')


  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 mesh-background opacity-20"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      
      {/* Header */}
      <header className="glass-strong backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back to Dashboard Button */}
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 px-3 py-2 glass-dark text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all hover-lift"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Dashboard</span>
              </button>
              
              <div className="flex items-center gap-3 float-slow">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    <span className="gradient-text">AI Resume Builder</span>
                  </h1>
                  {editingResume && (
                    <p className="text-xs text-white/70">Editing: {editingResume.title}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* AI Chat Button - Available from step 2 onwards */}
            {currentStep >= 2 && (
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="flex items-center gap-2 px-5 py-3 btn-premium text-white rounded-xl shadow-lg glow-hover"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="hidden sm:inline font-bold">AI Career Coach</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      {currentStep > 1 && (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10">
          <div className="glass-strong backdrop-blur-xl rounded-2xl p-6 border border-white/30 fade-in">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      currentStep >= step.number 
                        ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg scale-110' 
                        : 'glass text-white/50'
                    }`}>
                      {currentStep > step.number ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-semibold transition-colors ${
                      currentStep >= step.number ? 'text-white' : 'text-white/50'
                    }`}>{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-300 ${
                      currentStep > step.number ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        {/* Notifications */}
        {error && (
          <div className="mb-6 p-5 glass-dark border border-red-400/30 rounded-2xl flex items-start gap-4 slide-in-down">
            <X className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 font-bold text-lg">Error</p>
              <p className="text-red-200">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-5 glass border border-green-400/30 rounded-2xl flex items-start gap-4 slide-in-down">
            <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-300 font-bold text-lg">Success</p>
              <p className="text-green-200">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-300 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <WelcomeStep onNext={() => setCurrentStep(2)} />
        )}
        
        {currentStep === 2 && (
          <InformationStep 
            onNext={(data) => {
              setResumeData(data);
              setCurrentStep(3);
            }}
            setError={setError}
            setLoading={setLoading}
            loading={loading}
            chatOpen={chatOpen}
            setChatOpen={setChatOpen}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
          />
        )}
        
        {currentStep === 3 && resumeData && (
          <LayoutStep 
            resumeData={resumeData}
            targetRole={targetRole}
            onTargetRoleChange={setTargetRole}
            onNext={(layout) => {
              setSelectedLayout(layout);
              setCurrentStep(4);
            }}
            onBack={() => setCurrentStep(2)}
            setError={setError}
            setLoading={setLoading}
            loading={loading}
          />
        )}
        
        {currentStep === 4 && resumeData && selectedLayout && (
          <GenerateStep 
            resumeData={resumeData}
            layout={selectedLayout}
            targetRole={targetRole}
            targetIndustry={targetIndustry}
            onTargetRoleChange={setTargetRole}
            onTargetIndustryChange={setTargetIndustry}
            onNext={(enhanced) => {
              setGeneratedResume(enhanced);
              setCurrentStep(5);
            }}
            onBack={() => setCurrentStep(3)}
            onUpdateResume={(updated) => {
              setResumeData(updated);
            }}
            setError={setError}
            setSuccess={setSuccess}
            setLoading={setLoading}
            loading={loading}
          />
        )}
        
        {currentStep === 5 && generatedResume && (
          <ReviewPage 
            resumeData={generatedResume}
            templateId={getTemplateIdFromLayout(selectedLayout)}
            onSave={async (updatedResume) => {
              setGeneratedResume(updatedResume);
              setSuccess('Resume saved successfully!');
              setTimeout(() => setSuccess(null), 3000);
            }}
            onDownload={() => {
              setSuccess('PDF downloaded successfully!');
              setTimeout(() => setSuccess(null), 3000);
            }}
            onNext={() => setCurrentStep(6)}
            onBack={() => setCurrentStep(4)}
            setError={setError}
            setLoading={setLoading}
            loading={loading}
          />
        )}
        
        {currentStep === 6 && generatedResume && (
          <ExportStep 
            resume={generatedResume}
            layout={selectedLayout}
            onBack={() => setCurrentStep(5)}
            onSave={handleSaveResume}
            setError={setError}
            setSuccess={setSuccess}
            setLoading={setLoading}
            loading={loading}
          />
        )}
      </main>

      {/* AI Chat Sidebar */}
      {chatOpen && resumeData && (
        <ChatSidebar 
          resumeData={generatedResume || resumeData}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          setMessages={setChatMessages}
        />
      )}
    </div>
  );
}

// Step 1: Welcome Screen
function WelcomeStep({ onNext }) {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="mb-8">
        <Sparkles className="w-20 h-20 mx-auto text-blue-600 mb-4" />
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to AI Resume Builder
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create a professional, ATS-friendly resume in minutes with the power of AI
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <FeatureCard 
          icon={<FileUp className="w-8 h-8" />}
          title="Import or Create"
          description="Upload your existing resume or build from scratch"
        />
        <FeatureCard 
          icon={<Sparkles className="w-8 h-8" />}
          title="AI Enhancement"
          description="Let AI optimize your content and suggest improvements"
        />
        <FeatureCard 
          icon={<MessageSquare className="w-8 h-8" />}
          title="Career Coaching"
          description="Get personalized advice from our AI career coach"
        />
      </div>

      <button
        onClick={onNext}
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
      >
        Get Started
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="text-blue-600 mb-3">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

// Step 2: Information Entry
function InformationStep({ onNext, setError, setLoading, loading, chatOpen, setChatOpen, chatMessages, setChatMessages }) {
  const [mode, setMode] = useState(null); // 'upload' or 'manual'
  const [parsedData, setParsedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const response = await resumeAPI.parseResume(file);
      
      if (response.success) {
        setParsedData(response.data);
        setMode('upload');
      } else {
        setError(response.error || 'Failed to parse resume');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    setMode('manual');
  };

  // Determine which data to pass to chat (parsedData if available, otherwise empty)
  const currentResumeData = parsedData || { 
    personalInfo: { fullName: '', email: '' },
    experience: [],
    education: [],
    skills: { technical: [] }
  };

  if (!mode) {
    return (
      <>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center">How would you like to start?</h2>
        <p className="text-gray-600 text-center mb-8">Choose your preferred method</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Option */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="p-8 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all disabled:opacity-50"
          >
            <FileUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Upload Resume</h3>
            <p className="text-gray-600 text-sm">
              Import from PDF or DOCX file
            </p>
            {loading && <Loader className="w-5 h-5 animate-spin mx-auto mt-4" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Manual Entry Option */}
          <button
            onClick={handleManualEntry}
            className="p-8 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all"
          >
            <Edit className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Start From Scratch</h3>
            <p className="text-gray-600 text-sm">
              Enter your information manually
            </p>
          </button>
        </div>
      </div>
        
        {chatOpen && (
          <ChatSidebar 
            resumeData={currentResumeData}
            onClose={() => setChatOpen(false)}
            messages={chatMessages}
            setMessages={setChatMessages}
          />
        )}
      </>
    );
  }

  if (mode === 'upload' && parsedData) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Review Extracted Information</h2>
        <p className="text-gray-600 mb-6">Please verify and edit if needed</p>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <DataReviewForm data={parsedData} onSubmit={onNext} />
        </div>
      </div>
    );
  }

  if (mode === 'manual') {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Enter Your Information</h2>
        <p className="text-gray-600 mb-6">Fill in your details below</p>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <ManualEntryForm onSubmit={onNext} />
        </div>
      </div>
    );
  }
}

// Data Review Component (for uploaded resumes)
function DataReviewForm({ data, onSubmit }) {
  const [formData, setFormData] = useState(data);

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.personalInfo?.fullName || ''}
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, fullName: e.target.value }
            })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.personalInfo?.email || ''}
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, email: e.target.value }
            })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.personalInfo?.phone || ''}
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, phone: e.target.value }
            })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.personalInfo?.location || ''}
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, location: e.target.value }
            })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="url"
            placeholder="LinkedIn URL"
            value={formData.personalInfo?.linkedin || ''}
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, linkedin: e.target.value }
            })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="url"
            placeholder="GitHub URL"
            value={formData.personalInfo?.github || ''}
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, github: e.target.value }
            })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Professional Summary */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Professional Summary</h3>
        <textarea
          placeholder="Professional summary..."
          value={formData.summary || ''}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          rows="3"
        />
      </div>

      {/* Experience */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Experience ({formData.experience?.length || 0} positions)
        </h3>
        <div className="space-y-4">
          {formData.experience && formData.experience.length > 0 ? (
            formData.experience.map((exp, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Position"
                    value={exp.position || ''}
                    onChange={(e) => {
                      const updated = [...formData.experience];
                      updated[idx] = { ...updated[idx], position: e.target.value };
                      setFormData({ ...formData, experience: updated });
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company || ''}
                    onChange={(e) => {
                      const updated = [...formData.experience];
                      updated[idx] = { ...updated[idx], company: e.target.value };
                      setFormData({ ...formData, experience: updated });
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={exp.location || ''}
                    onChange={(e) => {
                      const updated = [...formData.experience];
                      updated[idx] = { ...updated[idx], location: e.target.value };
                      setFormData({ ...formData, experience: updated });
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={exp.startDate || ''}
                      onChange={(e) => {
                        const updated = [...formData.experience];
                        updated[idx] = { ...updated[idx], startDate: e.target.value };
                        setFormData({ ...formData, experience: updated });
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="End Date"
                      value={exp.endDate || ''}
                      onChange={(e) => {
                        const updated = [...formData.experience];
                        updated[idx] = { ...updated[idx], endDate: e.target.value };
                        setFormData({ ...formData, experience: updated });
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Responsibilities (one per line)</label>
                  <textarea
                    placeholder="• Responsibility 1&#10;• Responsibility 2"
                    value={exp.responsibilities?.join('\n') || ''}
                    onChange={(e) => {
                      const updated = [...formData.experience];
                      updated[idx] = { 
                        ...updated[idx], 
                        responsibilities: e.target.value.split('\n').filter(r => r.trim())
                      };
                      setFormData({ ...formData, experience: updated });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="4"
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No experience data extracted</p>
          )}
        </div>
      </div>

      {/* Education */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Education ({formData.education?.length || 0} entries)
        </h3>
        <div className="space-y-4">
          {formData.education && formData.education.length > 0 ? (
            formData.education.map((edu, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree || ''}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx] = { ...updated[idx], degree: e.target.value };
                      setFormData({ ...formData, education: updated });
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution || ''}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx] = { ...updated[idx], institution: e.target.value };
                      setFormData({ ...formData, education: updated });
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={edu.location || ''}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx] = { ...updated[idx], location: e.target.value };
                      setFormData({ ...formData, education: updated });
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Graduation Date"
                    value={edu.graduationDate || ''}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx] = { ...updated[idx], graduationDate: e.target.value };
                      setFormData({ ...formData, education: updated });
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="GPA (optional)"
                    value={edu.gpa || ''}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx] = { ...updated[idx], gpa: e.target.value };
                      setFormData({ ...formData, education: updated });
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No education data extracted</p>
          )}
        </div>
      </div>

      {/* Skills */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Skills ({formData.skills?.technical?.length || 0} listed)
        </h3>
        <div>
          <textarea
            placeholder="Enter skills separated by commas"
            value={formData.skills?.technical?.join(', ') || ''}
            onChange={(e) => setFormData({
              ...formData,
              skills: {
                ...formData.skills,
                technical: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }
            })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            rows="3"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          ✓ Information extracted! You can edit any field above before continuing, or proceed to select a layout.
        </p>
      </div>

      <button
        onClick={() => onSubmit(formData)}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        Continue to Layout Selection
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// Manual Entry Form
function ManualEntryForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
    summary: '',
    experience: [{ company: '', position: '', location: '', startDate: '', endDate: 'Present', responsibilities: [''] }],
    education: [{ institution: '', degree: '', field: '', location: '', graduationDate: '', gpa: '' }],
    skills: { technical: [], soft: [], languages: [] },
    projects: [],
    certifications: [],
    achievements: []
  });

  const [skillInput, setSkillInput] = useState('');
  const [expIndex, setExpIndex] = useState(0);
  const [currentTab, setCurrentTab] = useState('personal');

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData({
        ...formData,
        skills: { ...formData.skills, technical: [...formData.skills.technical, skillInput.trim()] }
      });
      setSkillInput('');
    }
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { company: '', position: '', location: '', startDate: '', endDate: 'Present', responsibilities: [''] }]
    });
  };

  const updateExperience = (index, field, value) => {
    const newExp = [...formData.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setFormData({ ...formData, experience: newExp });
  };

  const addResponsibility = (expIndex) => {
    const newExp = [...formData.experience];
    newExp[expIndex].responsibilities = [...newExp[expIndex].responsibilities, ''];
    setFormData({ ...formData, experience: newExp });
  };

  const updateResponsibility = (expIndex, respIndex, value) => {
    const newExp = [...formData.experience];
    newExp[expIndex].responsibilities[respIndex] = value;
    setFormData({ ...formData, experience: newExp });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { institution: '', degree: '', field: '', location: '', graduationDate: '', gpa: '' }]
    });
  };

  const updateEducation = (index, field, value) => {
    const newEdu = [...formData.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setFormData({ ...formData, education: newEdu });
  };

  const handleSubmit = () => {
    if (!formData.personalInfo.fullName || !formData.personalInfo.email) {
      alert('Please fill in at least your name and email');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {['personal', 'experience', 'education', 'skills'].map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              currentTab === tab 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Personal Information Tab */}
      {currentTab === 'personal' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name *"
              value={formData.personalInfo.fullName}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, fullName: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="email"
              placeholder="Email *"
              value={formData.personalInfo.email}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, email: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.personalInfo.phone}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, phone: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Location (City, State)"
              value={formData.personalInfo.location}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, location: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="url"
              placeholder="LinkedIn Profile URL"
              value={formData.personalInfo.linkedin}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, linkedin: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="url"
              placeholder="GitHub Profile URL"
              value={formData.personalInfo.github}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, github: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="url"
              placeholder="Personal Website"
              value={formData.personalInfo.website}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, website: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none col-span-2"
            />
          </div>
          
          <div>
            <label className="block font-medium mb-2">Professional Summary</label>
            <textarea
              placeholder="Brief 2-3 sentence summary highlighting your experience and expertise..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows="4"
            />
          </div>
        </div>
      )}

      {/* Experience Tab */}
      {currentTab === 'experience' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Work Experience</h3>
            <button
              onClick={addExperience}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + Add Experience
            </button>
          </div>
          
          {formData.experience.map((exp, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-gray-600">Experience #{idx + 1}</span>
                {formData.experience.length > 1 && (
                  <button
                    onClick={() => setFormData({
                      ...formData,
                      experience: formData.experience.filter((_, i) => i !== idx)
                    })}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={exp.company}
                  onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.position}
                  onChange={(e) => updateExperience(idx, 'position', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={exp.location}
                  onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Start Date (e.g., Jan 2020)"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(idx, 'startDate', e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="End Date"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(idx, 'endDate', e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Key Responsibilities & Achievements</label>
                {exp.responsibilities.map((resp, respIdx) => (
                  <div key={respIdx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Describe achievement or responsibility..."
                      value={resp}
                      onChange={(e) => updateResponsibility(idx, respIdx, e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {exp.responsibilities.length > 1 && (
                      <button
                        onClick={() => {
                          const newExp = [...formData.experience];
                          newExp[idx].responsibilities = newExp[idx].responsibilities.filter((_, i) => i !== respIdx);
                          setFormData({ ...formData, experience: newExp });
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addResponsibility(idx)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Responsibility
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Education Tab */}
      {currentTab === 'education' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Education</h3>
            <button
              onClick={addEducation}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + Add Education
            </button>
          </div>
          
          {formData.education.map((edu, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-gray-600">Education #{idx + 1}</span>
                {formData.education.length > 1 && (
                  <button
                    onClick={() => setFormData({
                      ...formData,
                      education: formData.education.filter((_, i) => i !== idx)
                    })}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Institution Name"
                  value={edu.institution}
                  onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Degree (e.g., Bachelor of Science)"
                  value={edu.degree}
                  onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Field of Study (e.g., Computer Science)"
                  value={edu.field}
                  onChange={(e) => updateEducation(idx, 'field', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={edu.location || ''}
                  onChange={(e) => updateEducation(idx, 'location', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Graduation Date"
                  value={edu.graduationDate || ''}
                  onChange={(e) => updateEducation(idx, 'graduationDate', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="GPA (Optional)"
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(idx, 'gpa', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills Tab */}
      {currentTab === 'skills' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Skills</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add a skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.technical.map((skill, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                {skill}
                <button
                  onClick={() => setFormData({
                    ...formData,
                    skills: { ...formData.skills, technical: formData.skills.technical.filter((_, i) => i !== idx) }
                  })}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        {currentTab !== 'personal' && (
          <button
            onClick={() => {
              const tabs = ['personal', 'experience', 'education', 'skills'];
              const currentIndex = tabs.indexOf(currentTab);
              if (currentIndex > 0) setCurrentTab(tabs[currentIndex - 1]);
            }}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Previous
          </button>
        )}
        {currentTab !== 'skills' ? (
          <button
            onClick={() => {
              const tabs = ['personal', 'experience', 'education', 'skills'];
              const currentIndex = tabs.indexOf(currentTab);
              if (currentIndex < tabs.length - 1) setCurrentTab(tabs[currentIndex + 1]);
            }}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Next Section
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Continue to Layout Selection
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Step 3: Layout Selection (will continue in next file due to length)
function LayoutStep({ resumeData, targetRole: propTargetRole, onTargetRoleChange, onNext, onBack, setError, setLoading, loading }) {
  const [recommendation, setRecommendation] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hoveredLayout, setHoveredLayout] = useState(null);
  const [zoomData, setZoomData] = useState({ mouseX: 0, mouseY: 0, zoomX: 0, zoomY: 0 });
  const [localTargetRole, setLocalTargetRole] = useState(propTargetRole || '');
  const [showTargetRolePrompt, setShowTargetRolePrompt] = useState(!propTargetRole);
  const [fetchingRecommendation, setFetchingRecommendation] = useState(false);

  // Sync localTargetRole with propTargetRole when it changes
  useEffect(() => {
    if (propTargetRole) {
      setLocalTargetRole(propTargetRole);
    }
  }, [propTargetRole]);

  // Get AI recommendation after target role prompt is handled
  const getRecommendation = async (role = '') => {
    setFetchingRecommendation(true);
      setLoading(true);
      try {
      const response = await resumeAPI.recommendLayout(resumeData, role);
        if (response.success) {
          setRecommendation(response.data);
          setSelected(response.data.recommendedLayout);
        }
      } catch (err) {
        setError('Failed to get layout recommendation');
      } finally {
        setLoading(false);
      setFetchingRecommendation(false);
    }
  };

  // If targetRole is already provided, fetch recommendations immediately
  useEffect(() => {
    if (propTargetRole && !showTargetRolePrompt && !recommendation) {
      getRecommendation(propTargetRole);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propTargetRole, showTargetRolePrompt]);

  const handleContinueWithTargetRole = () => {
    const roleValue = localTargetRole.trim();
    if (onTargetRoleChange) {
      onTargetRoleChange(roleValue);
    }
    setShowTargetRolePrompt(false);
    getRecommendation(roleValue);
  };

  const handleSkipTargetRole = () => {
    if (onTargetRoleChange) {
      onTargetRoleChange('');
    }
    setShowTargetRolePrompt(false);
    getRecommendation(''); // Pass empty string for no target role
  };

  const layouts = [
    { 
      name: 'Customised Curve CV', 
      desc: 'Light green & maroon accents with a clean horizontal header',
      preview: curvePreview 
    },
    { 
      name: 'AltaCV', 
      desc: 'Two-column layout with bold headline sidebar styling',
      preview: altacvPreview 
    },
    { 
      name: 'Simple Hipster CV', 
      desc: 'Dark sidebar with minimalist content emphasis',
      preview: hipsterPreview 
    },
    { 
      name: 'CV Template', 
      desc: 'Professional CV template with clean layout and structured sections',
      preview: cvTemplatePreview 
    },
    { 
      name: 'Resume Template', 
      desc: 'Clean and professional resume template with structured layout',
      preview: resumeTemplatePreview 
    },
    { 
      name: 'MAltaCV', 
      desc: 'Modern two-column CV template based on AltaCV with enhanced features',
      preview: maltacvPreview 
    },
    { 
      name: 'SixtySecondsCV', 
      desc: 'Modern sidebar CV template with customizable colors and clean design',
      preview: sixtySecondsPreview 
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Choose Your Layout</h2>
      
      {/* Target Job Role Prompt Modal */}
      {showTargetRolePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Target Job Role</h3>
              <button
                onClick={handleSkipTargetRole}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Tell us about your target job role to get better layout recommendations. This is optional - you can skip if you prefer.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What job role are you applying for?
              </label>
              <input
                type="text"
                value={localTargetRole}
                onChange={(e) => setLocalTargetRole(e.target.value)}
                placeholder="e.g., Software Engineer, Data Analyst, Marketing Manager"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && localTargetRole.trim()) {
                    handleContinueWithTargetRole();
                  }
                }}
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSkipTargetRole}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleContinueWithTargetRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      
      {fetchingRecommendation ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Getting personalized recommendations...</span>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {recommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-blue-900 mb-2">AI Recommendation:</p>
              <p className="text-blue-800">{recommendation.reasoning}</p>
              {(propTargetRole || localTargetRole) && (
                <p className="text-sm text-blue-700 mt-2">
                  <span className="font-medium">Target Role:</span> {propTargetRole || localTargetRole}
                </p>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {layouts.map((layout) => {
              const isSelected = selected === layout.name;
              const isRecommended = recommendation?.recommendedLayout === layout.name;
              const isHovered = hoveredLayout === layout.name;

              return (
              <button
                key={layout.name}
                onClick={() => setSelected(layout.name)}
                onMouseEnter={() => setHoveredLayout(layout.name)}
                onMouseLeave={() => {
                  setHoveredLayout(null);
                  setZoomData({ mouseX: 0, mouseY: 0, zoomX: 0, zoomY: 0 });
                }}
                onMouseMove={(e) => {
                  const container = e.currentTarget.querySelector('.thumbnail-container');
                  const rect = container?.getBoundingClientRect();
                  if (rect) {
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setZoomData({ 
                      mouseX: e.clientX, 
                      mouseY: e.clientY, 
                      zoomX: Math.max(0, Math.min(100, x)), 
                      zoomY: Math.max(0, Math.min(100, y)) 
                    });
                  }
                }}
                className={`group flex flex-col text-left rounded-xl border-2 overflow-visible hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="relative w-full min-h-[400px] aspect-[4/3] overflow-hidden bg-slate-100 flex items-center justify-center p-4 thumbnail-container">
                  <img
                    src={layout.preview}
                    alt={`${layout.name} preview`}
                    className="w-full h-full max-w-full max-h-full object-contain transition-transform duration-200"
                    loading="lazy"
                  />
                  {isRecommended && (
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-yellow-400/90 px-2.5 py-1 text-xs font-semibold text-yellow-900 shadow">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Pick
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute top-3 right-3 z-10 inline-flex items-center justify-center rounded-full bg-blue-600 text-white p-1.5 shadow">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>
                {/* Zoomed Preview on Hover */}
                {isHovered && hoveredLayout === layout.name && (
                  <div 
                    className="fixed z-50 pointer-events-none"
                    style={{
                      left: `${zoomData.mouseX + 20}px`,
                      top: `${zoomData.mouseY + 20}px`,
                      transform: 'translate(-50%, -50%)',
                      width: '350px',
                      height: '450px',
                      border: '3px solid #3b82f6',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      backgroundColor: 'white'
                    }}
                  >
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${layout.preview})`,
                        backgroundSize: '300%',
                        backgroundPosition: `${zoomData.zoomX}% ${zoomData.zoomY}%`,
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-1 text-slate-900">{layout.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{layout.desc}</p>
                </div>
              </button>
            );})}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => onNext(selected)}
              disabled={!selected}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continue with {selected}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Step 4: Generate Resume
function GenerateStep({ resumeData, layout, targetRole: propTargetRole, targetIndustry: propTargetIndustry, onTargetRoleChange, onTargetIndustryChange, onNext, onBack, onUpdateResume, setError, setSuccess, setLoading, loading }) {
  const [generating, setGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState(propTargetRole || '');
  const [targetIndustry, setTargetIndustry] = useState(propTargetIndustry || '');
  const [missingFields, setMissingFields] = useState(null);
  const [checkingFields, setCheckingFields] = useState(false);
  const [populatingWithAI, setPopulatingWithAI] = useState(false);
  const [updatedResumeData, setUpdatedResumeData] = useState(null);

  // Check for missing fields when component mounts or layout changes
  useEffect(() => {
    const checkFields = async () => {
      if (!resumeData || !layout) {
        console.log('⚠️ GenerateStep: Skipping check - missing resumeData or layout', { resumeData: !!resumeData, layout });
        return;
      }
      
      console.log('🔍 GenerateStep: Checking missing fields for layout:', layout);
      setCheckingFields(true);
      try {
        // Normalize layout name to template ID
        const templateId = layout; // Could be name or ID
        console.log('📤 GenerateStep: Calling checkMissingFields with templateId:', templateId);
        const response = await resumeAPI.checkMissingFields(resumeData, templateId);
        console.log('📥 GenerateStep: Response received:', response);
        
        if (response.success) {
          const fields = response.data.missingFields;
          console.log('📋 GenerateStep: Missing fields:', fields);
          
          // Check if there are any missing fields
          const hasMissingFields = Object.keys(fields).length > 0 && 
            (fields.personalInfo?.length > 0 || 
             fields.summary || 
             fields.experience || 
             fields.education || 
             fields.skills?.length > 0);
          
          console.log('✅ GenerateStep: Has missing fields?', hasMissingFields);
          
          if (hasMissingFields) {
            setMissingFields(fields);
            console.log('⚠️ GenerateStep: Setting missing fields state');
          } else {
            setMissingFields(null);
            console.log('✅ GenerateStep: No missing fields, clearing state');
          }
        } else {
          console.error('❌ GenerateStep: Response not successful:', response);
        }
      } catch (err) {
        console.error('❌ GenerateStep: Error checking missing fields:', err);
        // Don't show error to user, just proceed without warning
        setMissingFields(null);
      } finally {
        setCheckingFields(false);
      }
    };

    checkFields();
  }, [resumeData, layout]);

  const handlePopulateWithAI = async () => {
    if (!missingFields || !layout) return;
    
    setPopulatingWithAI(true);
    setLoading(true);
    setError(null);

    try {
      const templateId = layout;
      const response = await resumeAPI.populateMissingFields(resumeData, templateId, missingFields);
      
      if (response.success) {
        const updated = response.data.resume;
        setUpdatedResumeData(updated);
        setMissingFields(null); // Clear missing fields after population
        
        // Update parent component's resume data
        if (onUpdateResume) {
          onUpdateResume(updated);
        }
        
        setSuccess('Missing fields populated with AI!');
        
        // Proceed to generate resume with updated data
        setTimeout(async () => {
          try {
            const genResponse = await resumeAPI.generateResume(updated, targetRole || propTargetRole || '', targetIndustry || propTargetIndustry || '');
            if (genResponse.success) {
              setSuccess('Resume generated successfully!');
              setTimeout(() => onNext(genResponse.data), 1000);
            }
          } catch (err) {
            setError('Failed to generate resume. Please try again.');
          }
        }, 500);
      }
    } catch (err) {
      setError('Failed to populate missing fields. Please try again.');
    } finally {
      setPopulatingWithAI(false);
      setLoading(false);
    }
  };

  const handleFillManually = async () => {
    // Proceed to generate resume and let user edit in next step
    setGenerating(true);
    setLoading(true);
    setError(null);

    try {
      const response = await resumeAPI.generateResume(resumeData, targetRole || propTargetRole || '', targetIndustry || propTargetIndustry || '');
      
      if (response.success) {
        setSuccess('Resume generated successfully!');
        setTimeout(() => onNext(response.data), 1000);
      }
    } catch (err) {
      setError('Failed to generate resume. Please try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    // Use updated resume data if available
    const dataToUse = updatedResumeData || resumeData;
    
    setGenerating(true);
    setLoading(true);
    setError(null);

    try {
      const response = await resumeAPI.generateResume(dataToUse, targetRole || propTargetRole || '', targetIndustry || propTargetIndustry || '');
      
      if (response.success) {
        setSuccess('Resume generated successfully!');
        setTimeout(() => onNext(response.data), 1000);
      }
    } catch (err) {
      setError('Failed to generate resume. Please try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  // Helper function to format missing fields for display
  const formatMissingFields = (fields) => {
    const messages = [];
    
    if (fields.personalInfo && fields.personalInfo.length > 0) {
      messages.push(`Personal Info: ${fields.personalInfo.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}`);
    }
    
    if (fields.summary) {
      messages.push('Professional Summary');
    }
    
    if (fields.experience === true) {
      messages.push('Work Experience');
    } else if (Array.isArray(fields.experience)) {
      messages.push(`Work Experience: ${fields.experience.length} incomplete ${fields.experience.length === 1 ? 'entry' : 'entries'}`);
    }
    
    if (fields.education === true) {
      messages.push('Education');
    } else if (Array.isArray(fields.education)) {
      messages.push(`Education: ${fields.education.length} incomplete ${fields.education.length === 1 ? 'entry' : 'entries'}`);
    }
    
    if (fields.skills && fields.skills.length > 0) {
      messages.push(`Skills: ${fields.skills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`);
    }
    
    return messages;
  };

  // Show loading while checking fields
  if (checkingFields) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">Checking required fields...</span>
        </div>
      </div>
    );
  }

  // Show warning if missing fields detected
  if (missingFields && Object.keys(missingFields).length > 0) {
    const missingFieldsList = formatMissingFields(missingFields);
    
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Missing Required Fields</h2>
        <p className="text-gray-600 mb-6">
          The selected template <strong>{layout}</strong> requires the following fields:
        </p>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <X className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">Missing Fields:</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                {missingFieldsList.map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <Sparkles className="w-4 h-4 inline mr-2" />
            You can either let AI fill these fields automatically, or fill them manually after generating your resume.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            disabled={populatingWithAI}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handlePopulateWithAI}
            disabled={populatingWithAI}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {populatingWithAI ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                AI is generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Fill with AI
              </>
            )}
          </button>
          <button
            onClick={handleFillManually}
            disabled={generating || populatingWithAI}
            className="flex-1 py-3 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Edit className="w-5 h-5" />
                Fill Manually
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Normal generate flow when no missing fields
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Generate Your Resume</h2>
      <p className="text-gray-600 mb-6">Tell us about your target role for better customization</p>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Target Job Role (Optional)</label>
          <input
            type="text"
            placeholder="e.g., Senior Software Engineer"
            value={targetRole}
            onChange={(e) => {
              const value = e.target.value;
              setTargetRole(value);
              if (onTargetRoleChange) {
                onTargetRoleChange(value);
              }
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target Industry (Optional)</label>
          <input
            type="text"
            placeholder="e.g., FinTech, Healthcare, E-commerce"
            value={targetIndustry}
            onChange={(e) => {
              const value = e.target.value;
              setTargetIndustry(value);
              if (onTargetIndustryChange) {
                onTargetIndustryChange(value);
              }
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <Sparkles className="w-4 h-4 inline mr-2" />
            Our AI will optimize your resume content with action verbs, quantified achievements, 
            and industry-specific keywords while maintaining your authentic voice.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={generating}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating Your Resume...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate with AI
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Template Layout Mapper - Maps template names to layout types
function getTemplateLayoutType(templateName) {
  const templateMap = {
    'AltaCV': 'two-column',
    'MAltaCV': 'two-column',
    'Simple Hipster CV': 'sidebar',
    'SixtySecondsCV': 'sidebar',
    'Customised Curve CV': 'horizontal',
    'CV Template': 'default',
    'Resume Template': 'default',
    'Infographics CV': 'default'
  };
  
  return templateMap[templateName] || 'default';
}

// Template Preview Component - Renders template-specific layouts
function TemplatePreview({ 
  layoutType, 
  resumeData, 
  editingField, 
  onStartEditing, 
  onSaveEdit, 
  getFieldValue,
  colors, 
  visibleSections 
}) {
  const isSectionVisible = (sectionName) => {
    return (visibleSections || []).includes(sectionName);
  };

  // Render Editable Field Helper
  const renderEditableField = (section, index, field, value, displayValue, className = '', inputClassName = '') => {
    const isEditing = editingField?.section === section && 
                     editingField?.index === index && 
                     editingField?.field === field;
    
    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={value}
          onBlur={(e) => onSaveEdit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(e.target.value)}
          className={`border-2 border-blue-500 rounded px-2 ${inputClassName}`}
          autoFocus
        />
      );
    }
    return (
      <span 
        className={`cursor-pointer hover:bg-gray-100 rounded px-2 py-1 ${className}`}
        onClick={() => onStartEditing(section, index, field)}
      >
        {displayValue || 'Click to edit...'}
      </span>
    );
  };

  const renderEditableTextarea = (section, index, field, value, displayValue, className = '') => {
    const isEditing = editingField?.section === section && 
                     editingField?.index === index && 
                     editingField?.field === field;
    
    if (isEditing) {
      return (
        <textarea
          defaultValue={value}
          onBlur={(e) => onSaveEdit(e.target.value)}
          className={`w-full border-2 border-blue-500 rounded px-2 py-1 min-h-[100px] ${className}`}
          autoFocus
        />
      );
    }
    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 rounded px-2 py-1 min-h-[60px] whitespace-pre-line ${className}`}
        onClick={() => onStartEditing(section, index, field)}
      >
        {displayValue || 'Click to edit...'}
      </div>
    );
  };

  // Two-Column Layout (AltaCV, MAltaCV)
  if (layoutType === 'two-column') {
    return (
      <div className="template-two-column">
        {/* Left Sidebar */}
        <div className="template-sidebar">
          {/* Profile Photo */}
          {resumeData.images?.profilePhoto && (
            <img 
              src={resumeData.images.profilePhoto} 
              alt="Profile" 
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4"
              style={{ borderColor: colors.primary }}
            />
          )}
          
          {/* Name */}
          <div className="template-header">
            <div 
              className="text-2xl font-bold mb-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
              onClick={() => onStartEditing('personalInfo', null, 'fullName')}
              style={{ color: colors.primary }}
            >
              {editingField?.section === 'personalInfo' && editingField?.field === 'fullName' ? (
                <input
                  type="text"
                  defaultValue={getFieldValue('personalInfo', null, 'fullName')}
                  onBlur={(e) => onSaveEdit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(e.target.value)}
                  className="text-2xl font-bold w-full border-2 border-blue-500 rounded px-2"
                  autoFocus
                />
              ) : (
                resumeData.personalInfo?.fullName || 'Your Name'
              )}
            </div>
            
            {/* Contact Info */}
            <div className="space-y-1 text-sm">
              {renderEditableField('personalInfo', null, 'email', getFieldValue('personalInfo', null, 'email'), resumeData.personalInfo?.email, 'block')}
              {renderEditableField('personalInfo', null, 'phone', getFieldValue('personalInfo', null, 'phone'), resumeData.personalInfo?.phone, 'block')}
              {renderEditableField('personalInfo', null, 'location', getFieldValue('personalInfo', null, 'location'), resumeData.personalInfo?.location, 'block')}
            </div>
          </div>

          {/* Skills */}
          {isSectionVisible('skills') && (
            <div className="template-section">
              <div className="template-section-title">Skills</div>
              {renderEditableTextarea('skills', null, 'technical', getFieldValue('skills', null, 'technical'), (resumeData.skills?.technical || []).join(', '))}
            </div>
          )}
        </div>

        {/* Right Main Content */}
        <div className="template-main">
          {/* Summary */}
          {isSectionVisible('summary') && (
            <div className="template-section">
              <div className="template-section-title">Professional Summary</div>
              {renderEditableTextarea('summary', null, null, getFieldValue('summary', null, null), resumeData.summary)}
            </div>
          )}

          {/* Experience */}
          {isSectionVisible('experience') && resumeData.experience && resumeData.experience.length > 0 && (
            <div className="template-section">
              <div className="template-section-title">Experience</div>
              <div className="space-y-3">
                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="font-semibold text-lg">
                      {renderEditableField('experience', idx, 'position', getFieldValue('experience', idx, 'position'), exp.position)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {renderEditableField('experience', idx, 'company', getFieldValue('experience', idx, 'company'), exp.company)} • {' '}
                      {renderEditableField('experience', idx, 'startDate', getFieldValue('experience', idx, 'startDate'), exp.startDate)} - {' '}
                      {renderEditableField('experience', idx, 'endDate', getFieldValue('experience', idx, 'endDate'), exp.endDate)}
                    </div>
                    <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                      {exp.responsibilities?.map((resp, respIdx) => (
                        <li key={respIdx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {isSectionVisible('education') && resumeData.education && resumeData.education.length > 0 && (
            <div className="template-section">
              <div className="template-section-title">Education</div>
              <div className="space-y-2">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">
                      {renderEditableField('education', idx, 'degree', getFieldValue('education', idx, 'degree'), edu.degree)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {renderEditableField('education', idx, 'institution', getFieldValue('education', idx, 'institution'), edu.institution)}
                      {edu.graduationDate && ` • ${edu.graduationDate}`}
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

  // Sidebar Layout (Simple Hipster CV, SixtySecondsCV)
  if (layoutType === 'sidebar') {
    return (
      <div className="template-sidebar-layout">
        {/* Left Sidebar */}
        <div className="template-sidebar">
          {resumeData.images?.profilePhoto && (
            <img 
              src={resumeData.images.profilePhoto} 
              alt="Profile" 
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white"
            />
          )}
          
          <div className="template-header">
            <div 
              className="text-2xl font-bold mb-2 cursor-pointer hover:bg-white/10 rounded px-2 py-1"
              onClick={() => onStartEditing('personalInfo', null, 'fullName')}
            >
              {editingField?.section === 'personalInfo' && editingField?.field === 'fullName' ? (
                <input
                  type="text"
                  defaultValue={getFieldValue('personalInfo', null, 'fullName')}
                  onBlur={(e) => onSaveEdit(e.target.value)}
                  className="text-2xl font-bold w-full border-2 border-blue-500 rounded px-2 bg-white text-gray-900"
                  autoFocus
                />
              ) : (
                resumeData.personalInfo?.fullName || 'Your Name'
              )}
            </div>
            
            <div className="space-y-1 text-sm">
              {renderEditableField('personalInfo', null, 'email', getFieldValue('personalInfo', null, 'email'), resumeData.personalInfo?.email, 'block text-white/90')}
              {renderEditableField('personalInfo', null, 'phone', getFieldValue('personalInfo', null, 'phone'), resumeData.personalInfo?.phone, 'block text-white/90')}
              {renderEditableField('personalInfo', null, 'location', getFieldValue('personalInfo', null, 'location'), resumeData.personalInfo?.location, 'block text-white/90')}
            </div>
          </div>

          {isSectionVisible('skills') && (
            <div className="template-section">
              <div className="template-section-title">Skills</div>
              {renderEditableTextarea('skills', null, 'technical', getFieldValue('skills', null, 'technical'), (resumeData.skills?.technical || []).join(', '), 'text-white/90')}
            </div>
          )}
        </div>

        {/* Right Main Content */}
        <div className="template-main">
          {isSectionVisible('summary') && (
            <div className="template-section">
              <div className="template-section-title">Professional Summary</div>
              {renderEditableTextarea('summary', null, null, getFieldValue('summary', null, null), resumeData.summary)}
            </div>
          )}

          {isSectionVisible('experience') && resumeData.experience && resumeData.experience.length > 0 && (
            <div className="template-section">
              <div className="template-section-title">Experience</div>
              <div className="space-y-3">
                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="font-semibold text-lg">
                      {renderEditableField('experience', idx, 'position', getFieldValue('experience', idx, 'position'), exp.position)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {renderEditableField('experience', idx, 'company', getFieldValue('experience', idx, 'company'), exp.company)} • {' '}
                      {renderEditableField('experience', idx, 'startDate', getFieldValue('experience', idx, 'startDate'), exp.startDate)} - {' '}
                      {renderEditableField('experience', idx, 'endDate', getFieldValue('experience', idx, 'endDate'), exp.endDate)}
                    </div>
                    <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                      {exp.responsibilities?.map((resp, respIdx) => (
                        <li key={respIdx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSectionVisible('education') && resumeData.education && resumeData.education.length > 0 && (
            <div className="template-section">
              <div className="template-section-title">Education</div>
              <div className="space-y-2">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">
                      {renderEditableField('education', idx, 'degree', getFieldValue('education', idx, 'degree'), edu.degree)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {renderEditableField('education', idx, 'institution', getFieldValue('education', idx, 'institution'), edu.institution)}
                      {edu.graduationDate && ` • ${edu.graduationDate}`}
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

  // Horizontal Layout (Customised Curve CV)
  if (layoutType === 'horizontal') {
    return (
      <div className="template-horizontal">
        {/* Header */}
        <div className="template-header">
          {resumeData.images?.profilePhoto && (
            <img 
              src={resumeData.images.profilePhoto} 
              alt="Profile" 
              className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-white"
            />
          )}
          <div 
            className="text-3xl font-bold mb-2 cursor-pointer hover:bg-white/20 rounded px-2 py-1 inline-block"
            onClick={() => onStartEditing('personalInfo', null, 'fullName')}
          >
            {editingField?.section === 'personalInfo' && editingField?.field === 'fullName' ? (
              <input
                type="text"
                defaultValue={getFieldValue('personalInfo', null, 'fullName')}
                onBlur={(e) => onSaveEdit(e.target.value)}
                className="text-3xl font-bold text-center w-full border-2 border-blue-500 rounded px-2 bg-white text-gray-900"
                autoFocus
              />
            ) : (
              resumeData.personalInfo?.fullName || 'Your Name'
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {renderEditableField('personalInfo', null, 'email', getFieldValue('personalInfo', null, 'email'), resumeData.personalInfo?.email, 'text-white/90')}
            {renderEditableField('personalInfo', null, 'phone', getFieldValue('personalInfo', null, 'phone'), resumeData.personalInfo?.phone, 'text-white/90')}
            {renderEditableField('personalInfo', null, 'location', getFieldValue('personalInfo', null, 'location'), resumeData.personalInfo?.location, 'text-white/90')}
          </div>
        </div>

        {/* Sections */}
        {isSectionVisible('summary') && (
          <div className="template-section">
            <div className="template-section-title">Professional Summary</div>
            {renderEditableTextarea('summary', null, null, getFieldValue('summary', null, null), resumeData.summary)}
          </div>
        )}

        {isSectionVisible('experience') && resumeData.experience && resumeData.experience.length > 0 && (
          <div className="template-section">
            <div className="template-section-title">Experience</div>
            <div className="space-y-3">
              {resumeData.experience.map((exp, idx) => (
                <div key={idx} className="mb-3">
                  <div className="font-semibold text-lg">
                    {renderEditableField('experience', idx, 'position', getFieldValue('experience', idx, 'position'), exp.position)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {renderEditableField('experience', idx, 'company', getFieldValue('experience', idx, 'company'), exp.company)} • {' '}
                    {renderEditableField('experience', idx, 'startDate', getFieldValue('experience', idx, 'startDate'), exp.startDate)} - {' '}
                    {renderEditableField('experience', idx, 'endDate', getFieldValue('experience', idx, 'endDate'), exp.endDate)}
                  </div>
                  <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                    {exp.responsibilities?.map((resp, respIdx) => (
                      <li key={respIdx}>{resp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSectionVisible('education') && resumeData.education && resumeData.education.length > 0 && (
          <div className="template-section">
            <div className="template-section-title">Education</div>
            <div className="space-y-2">
              {resumeData.education.map((edu, idx) => (
                <div key={idx}>
                  <div className="font-semibold">
                    {renderEditableField('education', idx, 'degree', getFieldValue('education', idx, 'degree'), edu.degree)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {renderEditableField('education', idx, 'institution', getFieldValue('education', idx, 'institution'), edu.institution)}
                    {edu.graduationDate && ` • ${edu.graduationDate}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSectionVisible('skills') && (
          <div className="template-section">
            <div className="template-section-title">Skills</div>
            {renderEditableTextarea('skills', null, 'technical', getFieldValue('skills', null, 'technical'), (resumeData.skills?.technical || []).join(', '))}
          </div>
        )}
      </div>
    );
  }

  // Default Single Column Layout
  return (
    <div className="template-default">
      <div className="template-header">
        {resumeData.images?.profilePhoto && (
          <img 
            src={resumeData.images.profilePhoto} 
            alt="Profile" 
            className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4"
            style={{ borderColor: colors.primary }}
          />
        )}
        <div 
          className="text-4xl font-bold mb-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 inline-block"
          onClick={() => onStartEditing('personalInfo', null, 'fullName')}
          style={{ color: colors.primary }}
        >
          {editingField?.section === 'personalInfo' && editingField?.field === 'fullName' ? (
            <input
              type="text"
              defaultValue={getFieldValue('personalInfo', null, 'fullName')}
              onBlur={(e) => onSaveEdit(e.target.value)}
              className="text-4xl font-bold text-center w-full border-2 border-blue-500 rounded px-2"
              autoFocus
            />
          ) : (
            resumeData.personalInfo?.fullName || 'Your Name'
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-gray-600">
          {renderEditableField('personalInfo', null, 'email', getFieldValue('personalInfo', null, 'email'), resumeData.personalInfo?.email)}
          {renderEditableField('personalInfo', null, 'phone', getFieldValue('personalInfo', null, 'phone'), resumeData.personalInfo?.phone)}
          {renderEditableField('personalInfo', null, 'location', getFieldValue('personalInfo', null, 'location'), resumeData.personalInfo?.location)}
        </div>
      </div>

      {isSectionVisible('summary') && (
        <div className="template-section">
          <div className="template-section-title">Professional Summary</div>
          {renderEditableTextarea('summary', null, null, getFieldValue('summary', null, null), resumeData.summary)}
        </div>
      )}

      {isSectionVisible('experience') && resumeData.experience && resumeData.experience.length > 0 && (
        <div className="template-section">
          <div className="template-section-title">Experience</div>
          <div className="space-y-4">
            {resumeData.experience.map((exp, idx) => (
              <div key={idx} className="mb-4 pb-4 border-b">
                <div className="font-semibold text-xl">
                  {renderEditableField('experience', idx, 'position', getFieldValue('experience', idx, 'position'), exp.position)}
                </div>
                <div className="text-lg text-gray-600 mt-1">
                  {renderEditableField('experience', idx, 'company', getFieldValue('experience', idx, 'company'), exp.company)} • {' '}
                  {renderEditableField('experience', idx, 'startDate', getFieldValue('experience', idx, 'startDate'), exp.startDate)} - {' '}
                  {renderEditableField('experience', idx, 'endDate', getFieldValue('experience', idx, 'endDate'), exp.endDate)}
                </div>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {exp.responsibilities?.map((resp, respIdx) => (
                    <li key={respIdx}>{resp}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSectionVisible('education') && resumeData.education && resumeData.education.length > 0 && (
        <div className="template-section">
          <div className="template-section-title">Education</div>
          <div className="space-y-3">
            {resumeData.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-start pb-3 border-b">
                <div className="flex-1">
                  <div className="text-lg font-semibold">
                    {renderEditableField('education', idx, 'degree', getFieldValue('education', idx, 'degree'), edu.degree)}
                  </div>
                  <div className="text-gray-600 mt-1">
                    {renderEditableField('education', idx, 'institution', getFieldValue('education', idx, 'institution'), edu.institution)}
                    {edu.graduationDate && ` • ${edu.graduationDate}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSectionVisible('skills') && (
        <div className="template-section">
          <div className="template-section-title">Skills</div>
          {renderEditableTextarea('skills', null, 'technical', getFieldValue('skills', null, 'technical'), (resumeData.skills?.technical || []).join(', '))}
        </div>
      )}

      {isSectionVisible('certifications') && resumeData.certifications && resumeData.certifications.length > 0 && (
        <div className="template-section">
          <div className="template-section-title">Certifications</div>
          {renderEditableTextarea('certifications', null, null, getFieldValue('certifications', null, null), (resumeData.certifications || []).join('\n'))}
        </div>
      )}

      {isSectionVisible('achievements') && resumeData.achievements && resumeData.achievements.length > 0 && (
        <div className="template-section">
          <div className="template-section-title">Achievements</div>
          {renderEditableTextarea('achievements', null, null, getFieldValue('achievements', null, null), (resumeData.achievements || []).join('\n'))}
        </div>
      )}
    </div>
  );
}

// Step 5: Edit Resume - Original Layout (Left Panel Form / Right Panel PDF Preview)
function EditStep({ resume, layout, onUpdate, onNext, onBack, setError, setLoading, loading }) {
  const [editedResume, setEditedResume] = useState(() => ({
    ...resume,
    images: resume.images || {},
    customColors: resume.customColors || {},
    visibleSections: resume.visibleSections || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements']
  }));
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageType, setImageType] = useState('profilePhoto');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Image upload handler
  const handleImageUpload = async (file, type = 'profilePhoto') => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError?.('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError?.('Image file size must be less than 5MB');
      return;
    }
    
    try {
      setUploadingImage(true);
      const response = await resumeAPI.uploadImage(file);
      
      if (response.success) {
        // Construct full image URL
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        const imageUrl = baseUrl + response.data.url;
        setEditedResume(prev => ({
          ...prev,
          images: {
            ...(prev.images || {}),
            [type]: type === 'profilePhoto' ? imageUrl : [...(prev.images?.[type] || []), imageUrl]
          }
        }));
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError?.('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Color change handler
  const handleColorChange = (colorType, colorValue) => {
    setEditedResume(prev => ({
      ...prev,
      customColors: {
        ...(prev.customColors || {}),
        [colorType]: colorValue
      }
    }));
    setTimeout(() => generatePreview(), 1000);
  };

  // Section visibility toggle
  const toggleSection = (sectionName) => {
    setEditedResume(prev => {
      const visibleSections = prev.visibleSections || [];
      const isVisible = visibleSections.includes(sectionName);
      
      return {
        ...prev,
        visibleSections: isVisible
          ? visibleSections.filter(s => s !== sectionName)
          : [...visibleSections, sectionName]
      };
    });
    setTimeout(() => generatePreview(), 500);
  };

  // Generate PDF preview
  const generatePreview = async () => {
    if (generatingPreview) return;
    setGeneratingPreview(true);
    try {
        const blob = await resumeAPI.exportPDFBlob(editedResume, layout);
      const url = window.URL.createObjectURL(blob);
      // Clean up old URL
      if (pdfPreviewUrl) {
        window.URL.revokeObjectURL(pdfPreviewUrl);
      }
      setPdfPreviewUrl(url);
      } catch (err) {
      console.error('Preview generation error:', err);
      setError?.('Failed to generate preview');
      } finally {
      setGeneratingPreview(false);
    }
  };

  // Generate preview on mount and when resume data changes
  useEffect(() => {
    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        window.URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const handleSaveAndContinue = () => {
    onUpdate(editedResume);
    onNext();
  };

  // Handle form field changes
  const handleFieldChange = (section, index, field, value) => {
    setEditedResume(prev => {
      if (section === 'personalInfo') {
        return {
      ...prev,
      personalInfo: { ...(prev.personalInfo || {}), [field]: value }
        };
      } else if (section === 'summary') {
        return { ...prev, summary: value };
      } else if (section === 'experience' && index !== null) {
        const experience = [...(prev.experience || [])];
        experience[index] = { ...(experience[index] || {}), [field]: value };
        return { ...prev, experience };
      } else if (section === 'education' && index !== null) {
        const education = [...(prev.education || [])];
        education[index] = { ...(education[index] || {}), [field]: value };
        return { ...prev, education };
      } else if (section === 'skills') {
        const items = value.split(',').map(s => s.trim()).filter(Boolean);
        return {
          ...prev,
          skills: { ...(prev.skills || {}), [field]: items }
        };
      } else if (['achievements', 'certifications'].includes(section)) {
        const entries = value.split('\n').map(e => e.trim()).filter(Boolean);
        return { ...prev, [section]: entries };
      }
      return prev;
    });
    
    // Regenerate preview after a short delay (debounce)
    setTimeout(() => {
      generatePreview();
    }, 1000);
  };

  // Add/remove experience entries
  const addExperience = () => {
    setEditedResume(prev => ({
      ...prev,
      experience: [...(prev.experience || []), { position: '', company: '', startDate: '', endDate: '', responsibilities: [] }]
    }));
  };

  const removeExperience = (index) => {
    setEditedResume(prev => {
      const experience = [...(prev.experience || [])];
      experience.splice(index, 1);
      return { ...prev, experience };
    });
    setTimeout(() => generatePreview(), 500);
  };

  // Add/remove education entries
  const addEducation = () => {
    setEditedResume(prev => ({
      ...prev,
      education: [...(prev.education || []), { degree: '', institution: '', graduationDate: '' }]
    }));
  };

  const removeEducation = (index) => {
    setEditedResume(prev => {
      const education = [...(prev.education || [])];
      education.splice(index, 1);
      return { ...prev, education };
    });
    setTimeout(() => generatePreview(), 500);
  };

  // Check if section is visible
  const isSectionVisible = (sectionName) => {
    return (editedResume.visibleSections || []).includes(sectionName);
  };

  // Default colors for templates
  const defaultColors = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    text: '#1f2937',
    background: '#ffffff'
  };

  const currentColors = {
    primary: editedResume.customColors?.primary || defaultColors.primary,
    secondary: editedResume.customColors?.secondary || defaultColors.secondary,
    accent: editedResume.customColors?.accent || defaultColors.accent,
    text: editedResume.customColors?.text || defaultColors.text,
    background: editedResume.customColors?.background || defaultColors.background
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">Edit Your Resume</h2>
          <p className="text-gray-600">Edit your resume information and see the preview update in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showColorPicker ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Palette className="w-4 h-4" />
            Colors
          </button>
        <button
          onClick={handleSaveAndContinue}
          className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Continue to Export
        </button>
        </div>
      </div>

      {/* Color Picker Panel */}
      {showColorPicker && (
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Customize Colors</h3>
            <button onClick={() => setShowColorPicker(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries({ primary: 'Primary', secondary: 'Secondary', accent: 'Accent', text: 'Text', background: 'Background' }).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentColors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
              <input
                type="text"
                    value={currentColors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Visibility Toggles */}
      <div className="bg-white rounded-xl shadow border p-4">
        <h3 className="text-sm font-semibold mb-3">Show/Hide Sections</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'summary', label: 'Summary' },
            { key: 'experience', label: 'Experience' },
            { key: 'education', label: 'Education' },
            { key: 'skills', label: 'Skills' },
            { key: 'projects', label: 'Projects' },
            { key: 'certifications', label: 'Certifications' },
            { key: 'achievements', label: 'Achievements' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSection(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isSectionVisible(key)
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              {isSectionVisible(key) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Panel Layout: Left Form / Right PDF Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Form Fields */}
        <div className="bg-white rounded-xl shadow-lg border p-6 space-y-6 max-h-[800px] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Edit Resume Information</h3>
          
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg border-b pb-2">Personal Information</h4>
            
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={editedResume.personalInfo?.fullName || ''}
                onChange={(e) => handleFieldChange('personalInfo', null, 'fullName', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Your Full Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={editedResume.personalInfo?.email || ''}
                onChange={(e) => handleFieldChange('personalInfo', null, 'email', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="text"
                value={editedResume.personalInfo?.phone || ''}
                onChange={(e) => handleFieldChange('personalInfo', null, 'phone', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={editedResume.personalInfo?.location || ''}
                onChange={(e) => handleFieldChange('personalInfo', null, 'location', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="City, State, Country"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Profile Photo</label>
              <div className="flex items-center gap-3">
                {editedResume.images?.profilePhoto && (
                  <img src={editedResume.images.profilePhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  <Image className="w-4 h-4" />
                  {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                </button>
              <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'profilePhoto');
                    e.target.value = '';
                  }}
                  className="hidden"
              />
            </div>
            </div>
          </div>

          {/* Professional Summary */}
          {isSectionVisible('summary') && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Professional Summary</h4>
            <textarea
              value={editedResume.summary || ''}
                onChange={(e) => handleFieldChange('summary', null, null, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
                placeholder="Write a brief professional summary..."
              />
            </div>
          )}

          {/* Experience */}
          {isSectionVisible('experience') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-semibold text-lg">Experience</h4>
              <button
                onClick={addExperience}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                  + Add
              </button>
            </div>
              {editedResume.experience?.map((exp, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">Experience #{idx + 1}</h5>
                    <button
                      onClick={() => removeExperience(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                        <input
                          type="text"
                          value={exp.position || ''}
                    onChange={(e) => handleFieldChange('experience', idx, 'position', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Job Title"
                        />
                        <input
                          type="text"
                          value={exp.company || ''}
                    onChange={(e) => handleFieldChange('experience', idx, 'company', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Company Name"
                        />
                  <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                            value={exp.startDate || ''}
                      onChange={(e) => handleFieldChange('experience', idx, 'startDate', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Start Date"
                          />
                          <input
                            type="text"
                            value={exp.endDate || ''}
                      onChange={(e) => handleFieldChange('experience', idx, 'endDate', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="End Date"
                          />
                      </div>
                      <textarea
                        value={(exp.responsibilities || []).join('\n')}
                    onChange={(e) => {
                      const responsibilities = e.target.value.split('\n').map(r => r.trim()).filter(Boolean);
                      setEditedResume(prev => {
                        const experience = [...(prev.experience || [])];
                        experience[idx] = { ...experience[idx], responsibilities };
                        return { ...prev, experience };
                      });
                      setTimeout(() => generatePreview(), 1000);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                    placeholder="Responsibilities (one per line)"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {isSectionVisible('education') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-semibold text-lg">Education</h4>
              <button
                onClick={addEducation}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                  + Add
              </button>
            </div>
              {editedResume.education?.map((edu, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">Education #{idx + 1}</h5>
                    <button
                      onClick={() => removeEducation(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                    <input
                      type="text"
                      value={edu.degree || ''}
                    onChange={(e) => handleFieldChange('education', idx, 'degree', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Degree"
                    />
                    <input
                      type="text"
                      value={edu.institution || ''}
                    onChange={(e) => handleFieldChange('education', idx, 'institution', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Institution"
                    />
                    <input
                      type="text"
                      value={edu.graduationDate || ''}
                    onChange={(e) => handleFieldChange('education', idx, 'graduationDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Graduation Date"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {isSectionVisible('skills') && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Skills</h4>
            <input
              type="text"
              value={(editedResume.skills?.technical || []).join(', ')}
                onChange={(e) => handleFieldChange('skills', null, 'technical', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Skills (comma separated)"
              />
            </div>
          )}
        </div>

        {/* Right Panel: PDF Preview */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">PDF Preview</h3>
            <button
              onClick={generatePreview}
              disabled={generatingPreview}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${generatingPreview ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="border rounded-lg overflow-hidden bg-gray-50 min-h-[800px]">
            {generatingPreview ? (
              <div className="flex items-center justify-center h-full min-h-[800px]">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            ) : pdfPreviewUrl ? (
            <iframe
                src={pdfPreviewUrl}
                className="w-full h-full min-h-[800px]"
                title="Resume Preview"
            />
          ) : (
              <div className="flex items-center justify-center h-full min-h-[800px] text-gray-500">
                <p>Preview will appear here</p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleSaveAndContinue}
          className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Continue to Export
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Step 6: Export
function ExportStep({ resume, layout, onBack, onSave, setError, setSuccess, setLoading, loading }) {
  const handleExportPDF = async () => {
    setLoading(true);
    try {
      await resumeAPI.exportPDF(resume, layout.toLowerCase().replace(/\s+/g, ''));
      setSuccess('PDF downloaded successfully!');
    } catch (err) {
      setError('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDOCX = async () => {
    setLoading(true);
    try {
      await resumeAPI.exportDOCX(resume);
      setSuccess('Text file downloaded successfully!');
    } catch (err) {
      setError('Failed to export document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <Check className="w-16 h-16 mx-auto text-green-600 mb-4" />
        <h2 className="text-3xl font-bold mb-4">Your Resume is Ready!</h2>
        <p className="text-gray-600">Save to your account and download in your preferred format</p>
      </div>

      {/* Save to Database Button */}
      <button
        onClick={onSave}
        disabled={loading}
        className="w-full max-w-md mx-auto mb-6 p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 font-semibold"
      >
        {loading ? (
          <>
            <Loader className="w-6 h-6 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-6 h-6" />
            Save Resume to Account
          </>
        )}
      </button>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={handleExportPDF}
          disabled={loading}
          className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-red-500 hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Download className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Download PDF</h3>
          <p className="text-sm text-gray-600">Best for printing and ATS systems</p>
        </button>

        <button
          onClick={handleExportDOCX}
          disabled={loading}
          className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Download Text</h3>
          <p className="text-sm text-gray-600">Easy to edit and customize further</p>
        </button>
      </div>

      <button
        onClick={onBack}
        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Go Back to Edit
      </button>
    </div>
  );
}

// Chat Sidebar Component
function ChatSidebar({ resumeData, onClose, messages, setMessages }) {
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || sending) return;
    
    const userMessage = { role: 'user', content: input.trim() };
    console.log('👤 ChatSidebar: User sending message:', userMessage.content);
    setMessages([...messages, userMessage]);
    setInput('');
    setSending(true);

    try {
      console.log('📤 ChatSidebar: Calling aiAPI.chat with:', { message: userMessage.content, messagesLength: messages.length, resumeData: resumeData });
      const response = await aiAPI.chat(userMessage.content, messages, resumeData);
      console.log('📥 ChatSidebar: Response received:', response);
      
      if (response.success) {
        console.log('✅ ChatSidebar: Success! Adding message to chat:', response.data.message);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.message 
        }]);
      } else {
        console.error('❌ ChatSidebar: Response not successful:', response);
      }
    } catch (err) {
      console.error('❌ ChatSidebar: Error calling API:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col" style={{ maxHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h3 className="font-semibold">AI Career Coach</h3>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button onClick={resetChat} className="hover:bg-white/20 rounded p-1" title="Reset Chat">
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="text-center py-4">
            <Bot className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-800 font-semibold mb-1">👋 Hi! I'm your AI Career Coach</p>
            <p className="text-sm text-gray-500 mb-4">
              Ask me anything about resumes, interviews, or career advice
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader className="w-5 h-5 animate-spin text-gray-600" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Text Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

// Tailor Resume Flow Component
function TailorResumeFlow({
  user,
  onBackToDashboard,
  jobCircular,
  setJobCircular,
  interviewQuestions,
  setInterviewQuestions,
  interviewResponses,
  setInterviewResponses,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  tailoredResume,
  setTailoredResume,
  selectedTailoredLayout,
  setSelectedTailoredLayout,
  setError,
  setSuccess,
  setLoading,
  loading
}) {
  const [tailorStep, setTailorStep] = useState(1); // 1: job circular, 2: resume upload, 3: interview, 4: review, 5: download
  const [resumeData, setResumeData] = useState(null);
  const [jobCircularFile, setJobCircularFile] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const fileInputRef = useRef(null);
  const jobCircularInputRef = useRef(null);

  const handleJobCircularUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const response = await resumeAPI.parseJobCircular(null, file);
      if (response.success) {
        setJobCircular(response.data.jobDescription);
        setSuccess('Job circular uploaded and parsed successfully!');
      }
    } catch (err) {
      setError('Failed to parse job circular');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setProgressPercent(0);
    setProgressMessage('Reading resume file...');
    
    try {
      // Simulate reading progress
      setTimeout(() => {
        setProgressPercent(20);
        setProgressMessage('Extracting text from resume...');
      }, 300);
      
      const response = await resumeAPI.parseResume(file);
      
      if (response.success) {
        setProgressPercent(60);
        setProgressMessage('Analyzing resume content...');
        
        setResumeData(response.data);
        setSuccess('Resume uploaded successfully!');
        
        // Generate interview questions
        await generateQuestions(response.data);
      }
    } catch (err) {
      setProgressMessage('');
      setProgressPercent(0);
      setError(`Failed to parse resume: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setProgressMessage('');
      setProgressPercent(0);
    }
  };

  const generateQuestions = async (resumeData) => {
    setLoading(true);
    setProgressPercent(60);
    setProgressMessage('Generating personalized interview questions...');
    
    try {
      const response = await resumeAPI.generateQuestions(resumeData, jobCircular);
      if (response.success) {
        setProgressPercent(90);
        setProgressMessage('Questions ready!');
        setInterviewQuestions(response.data);
        setTailorStep(3); // Move to interview
      }
    } catch (err) {
      setProgressMessage('');
      setProgressPercent(0);
      setError(`Failed to generate interview questions: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setProgressMessage('');
      setProgressPercent(0);
    }
  };

  const handleAnswerSubmit = () => {
    // If no answer provided, skip if not last question, or proceed to generation if last question
    if (!currentAnswer.trim()) {
      if (currentQuestionIndex < interviewQuestions.length - 1) {
        // Not last question, skip to next
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer('');
        return;
      } else {
        // Last question, generate resume without this answer
        handleGenerateTailoredResume(interviewResponses);
        return;
      }
    }
    
    const newResponse = {
      question: interviewQuestions[currentQuestionIndex].question,
      answer: currentAnswer
    };
    
    const updatedResponses = [...interviewResponses, newResponse];
    setInterviewResponses(updatedResponses);
    setCurrentAnswer('');
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, generate tailored resume
      handleGenerateTailoredResume(updatedResponses);
    }
  };

  const handleGenerateTailoredResume = async (responses) => {
    setLoading(true);
    setProgressPercent(0);
    setProgressMessage('Analyzing your responses...');
    
    try {
      setProgressPercent(20);
      setProgressMessage('Tailoring resume content...');
      
      const response = await resumeAPI.tailorResume(resumeData, jobCircular, responses);
      
      if (response.success) {
        setProgressPercent(60);
        setProgressMessage('Optimizing for ATS compliance...');
        
        setProgressPercent(100);
        setProgressMessage('Resume generated successfully!');
        
        setTailoredResume(response.data);
        setTailorStep(4); // Review step
        setSuccess('Tailored resume generated successfully!');
      }
    } catch (err) {
      console.error('❌ Resume generation error:', err);
      setProgressMessage('');
      setProgressPercent(0);
      setError(`Failed to generate tailored resume: ${err.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgressMessage('');
        setProgressPercent(0);
      }, 500);
    }
  };

  const handleSkipJobCircular = () => {
    setTailorStep(2);
  };

  // Handle navigation with warning if resume is generating
  const handleNavigation = (targetStep = null, targetAction = null) => {
    // Check if resume is actively being generated
    const isGeneratingResume = loading && progressMessage && (
      progressMessage.includes('Tailoring resume') ||
      progressMessage.includes('Analyzing your responses') ||
      progressMessage.includes('Optimizing for ATS')
    );
    
    if (isGeneratingResume) {
      setPendingNavigation({ step: targetStep, action: targetAction });
      setShowExitWarning(true);
    } else {
      if (targetStep !== null) {
        setTailorStep(targetStep);
      } else if (targetAction === 'dashboard') {
        onBackToDashboard();
      }
    }
  };

  const confirmExit = () => {
    setShowExitWarning(false);
    if (pendingNavigation) {
      if (pendingNavigation.step !== null) {
        setTailorStep(pendingNavigation.step);
      } else if (pendingNavigation.action === 'dashboard') {
        onBackToDashboard();
      }
    }
    setPendingNavigation(null);
  };

  const cancelExit = () => {
    setShowExitWarning(false);
    setPendingNavigation(null);
  };

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Header */}
      <div className="glass-strong backdrop-blur-xl border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Tailor Your Resume</h1>
              <p className="text-sm text-white/70">Step {tailorStep} of 5</p>
            </div>
          </div>
          <button
            onClick={() => handleNavigation(null, 'dashboard')}
            className="px-4 py-2 glass-dark rounded-lg hover-lift text-white/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Step 1: Job Circular Input (Optional) */}
        {tailorStep === 1 && (
          <div className="glass-strong rounded-2xl p-8">
            <h2 className="text-3xl font-bold gradient-text mb-2">Add Job Description (Optional)</h2>
            <p className="text-white/70 mb-6">Paste the job description or upload a PDF to optimize your resume for this specific role.</p>
            
          <div className="space-y-4">
              <div>
                <label className="block text-white/90 mb-2 font-semibold">Paste Job Description</label>
                <textarea
                  value={jobCircular}
                  onChange={(e) => setJobCircular(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-40 px-4 py-3 glass-dark rounded-xl text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-cyan-400"
                />
              </div>
              
              <div className="text-center text-white/60">OR</div>
              
              <div>
                <label className="block text-white/90 mb-2 font-semibold">Upload Job Circular PDF</label>
                <input
                  ref={jobCircularInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleJobCircularUpload}
                  className="hidden"
                />
                    <button
                  onClick={() => jobCircularInputRef.current?.click()}
                  className="w-full px-6 py-4 glass-dark border-2 border-dashed border-white/30 rounded-xl hover:border-cyan-400 transition-all text-white/90 hover-lift"
                    >
                  <FileUp className="w-8 h-8 mx-auto mb-2" />
                  <span>Click to Upload Job Circular PDF</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSkipJobCircular}
                className="flex-1 px-6 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-white/20"
              >
                Skip This Step
              </button>
              <button
                onClick={() => setTailorStep(2)}
                disabled={!jobCircular || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Resume Input */}
        {tailorStep === 2 && (
          <div className="glass-strong rounded-2xl p-8">
            <h2 className="text-3xl font-bold gradient-text mb-2">Upload Your Resume</h2>
            <p className="text-white/70 mb-6">Upload your existing resume in PDF or DOCX format.</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleResumeUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-6 py-12 glass-dark border-2 border-dashed border-white/30 rounded-xl hover:border-cyan-400 transition-all text-white/90 hover-lift"
              disabled={loading}
            >
              <FileUp className="w-16 h-16 mx-auto mb-4" />
              <div className="text-xl font-semibold mb-2">Click to Upload Resume</div>
              <div className="text-sm text-white/60">PDF or DOCX format</div>
            </button>

            {/* Loading Progress */}
            {loading && progressMessage && (
              <div className="mt-4 glass-dark rounded-xl p-6 border border-cyan-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span className="text-cyan-300 font-semibold">{progressMessage}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-teal-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-right text-white/60 text-sm mt-2">{progressPercent}%</div>
              </div>
            )}

            {resumeData && !loading && (
              <div className="mt-4 p-4 glass-dark rounded-xl border border-green-400/30">
                <Check className="w-6 h-6 text-green-400 inline mr-2" />
                <span className="text-green-300 font-semibold">Resume uploaded successfully!</span>
              </div>
            )}

            <button
              onClick={() => handleNavigation(1, null)}
              className="mt-6 w-full px-6 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-white/20"
            >
              <ArrowLeft className="w-5 h-5 inline mr-2" />
              Back to Job Circular
            </button>
          </div>
        )}

        {/* Step 3: Interview */}
        {tailorStep === 3 && interviewQuestions.length > 0 && (
          <div className="glass-strong rounded-2xl p-8">
            <h2 className="text-3xl font-bold gradient-text mb-2">Tell Us About Yourself</h2>
            <p className="text-white/70 mb-6">Answer a few personalized questions to help us tailor your resume.</p>
            
            <div className="mb-6">
              <div className="text-sm text-white/60 mb-2">
                Question {currentQuestionIndex + 1} of {interviewQuestions.length}
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-teal-600 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / interviewQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Loading Progress Overlay */}
            {loading && progressMessage && (
              <div className="glass-dark rounded-xl p-6 mb-6 border border-cyan-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span className="text-cyan-300 font-semibold">{progressMessage}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-teal-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-right text-white/60 text-sm mt-2">{progressPercent}%</div>
              </div>
            )}

            {!loading && (
              <div className="glass-dark rounded-xl p-6 mb-6">
                <p className="text-xl text-white font-semibold mb-4">
                  {interviewQuestions[currentQuestionIndex].question}
                </p>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here... (or click Skip to move on)"
                  className="w-full h-32 px-4 py-3 glass rounded-xl text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => handleNavigation(2, null)}
                className="px-4 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-white/20"
              >
                <ArrowLeft className="w-5 h-5 inline mr-2" />
                Back
              </button>
              <button
                onClick={() => {
                  // Skip current question
                  if (currentQuestionIndex < interviewQuestions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setCurrentAnswer('');
                  } else {
                    // Last question skipped, generate resume
                    handleGenerateTailoredResume(interviewResponses);
                  }
                }}
                className="px-4 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-white/20"
              >
                Skip
              </button>
              <button
                onClick={async () => {
                  // Generate new questions
                  setLoading(true);
                  try {
                    const response = await resumeAPI.generateQuestions(resumeData, jobCircular);
                    if (response.success) {
                      setInterviewQuestions(response.data);
                      // Keep current index but ensure it doesn't exceed new question count
                      const safeIndex = Math.min(currentQuestionIndex, response.data.length - 1);
                      setCurrentQuestionIndex(safeIndex);
                      setCurrentAnswer('');
                      setSuccess('New questions generated!');
                    }
                  } catch (err) {
                    setError('Failed to generate new questions');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-white/20"
              >
                Different Question
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl hover-lift disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {currentQuestionIndex < interviewQuestions.length - 1 ? 'Next Question' : 'Generate Tailored Resume'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review Tailored Resume */}
        {tailorStep === 4 && tailoredResume && (
          <div className="glass-strong rounded-2xl p-8">
            <h2 className="text-3xl font-bold gradient-text mb-2">Edit & Customize Your Resume</h2>
            <p className="text-white/70 mb-6">Review and edit your tailored resume, then choose a layout.</p>
            
            {/* Layout Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">Choose Layout</label>
              <select
                value={selectedTailoredLayout}
                onChange={(e) => setSelectedTailoredLayout(e.target.value)}
                className="w-full px-4 py-3 glass rounded-xl text-white border border-white/20 focus:outline-none focus:border-cyan-400"
              >
                <option value="Customised Curve CV">Customised Curve CV</option>
                <option value="AltaCV">AltaCV</option>
                <option value="Simple Hipster CV">Simple Hipster CV</option>
              </select>
            </div>

            {/* Editable Resume Preview */}
            <div className="glass-dark rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-4">{tailoredResume.personalInfo?.fullName || 'Your Name'}</h3>
              <div className="space-y-4">
                {tailoredResume.summary && (
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-300 mb-2">Professional Summary</h4>
                    <textarea
                      value={tailoredResume.summary}
                      onChange={(e) => setTailoredResume({...tailoredResume, summary: e.target.value})}
                      className="w-full px-3 py-2 glass rounded-xl text-white border border-white/20 focus:outline-none focus:border-cyan-400"
                      rows="3"
                    />
                  </div>
                )}
                
                {tailoredResume.experience && tailoredResume.experience.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-300 mb-2">Experience</h4>
                    {tailoredResume.experience.slice(0, 3).map((exp, idx) => (
                      <div key={idx} className="mb-3 p-3 glass rounded-lg">
                        <input
                          type="text"
                          value={exp.position || ''}
                          onChange={(e) => {
                            const updated = [...tailoredResume.experience];
                            updated[idx] = {...updated[idx], position: e.target.value};
                            setTailoredResume({...tailoredResume, experience: updated});
                          }}
                          className="w-full px-3 py-1 glass rounded text-white border border-white/20 focus:outline-none focus:border-cyan-400 mb-1"
                          placeholder="Position"
                        />
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => {
                            const updated = [...tailoredResume.experience];
                            updated[idx] = {...updated[idx], company: e.target.value};
                            setTailoredResume({...tailoredResume, experience: updated});
                          }}
                          className="w-full px-3 py-1 glass rounded text-white border border-white/20 focus:outline-none focus:border-cyan-400"
                          placeholder="Company"
                        />
              </div>
            ))}
                  </div>
                )}
                
                {tailoredResume.skills && (
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-300 mb-2">Skills</h4>
                    <textarea
                      value={tailoredResume.skills.technical?.join(', ') || ''}
                      onChange={(e) => setTailoredResume({
                        ...tailoredResume,
                        skills: {
                          ...tailoredResume.skills,
                          technical: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      })}
                      className="w-full px-3 py-2 glass rounded-xl text-white border border-white/20 focus:outline-none focus:border-cyan-400"
                      rows="2"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleNavigation(3, null)}
                className="px-4 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-white/20"
              >
                <ArrowLeft className="w-5 h-5 inline mr-2" />
                Back
              </button>
              <button
                onClick={() => setTailorStep(5)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl hover-lift font-semibold"
              >
                Proceed to Download
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Download */}
        {tailorStep === 5 && tailoredResume && (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <Download className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold gradient-text mb-4">Download Your Resume</h2>
            <p className="text-white/70 mb-8">Choose your preferred format</p>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await resumeAPI.exportPDF(tailoredResume, selectedTailoredLayout);
                    setSuccess('Resume downloaded successfully!');
                  } catch (err) {
                    setError('Failed to download resume');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="p-6 glass-dark rounded-xl border border-white/20 hover:border-cyan-400 hover-lift text-white/90"
              >
                <Download className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
                <div className="font-bold">Download as PDF</div>
              </button>
              
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await resumeAPI.exportDOCX(tailoredResume);
                    setSuccess('Resume downloaded successfully!');
                  } catch (err) {
                    setError('Failed to download resume');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="p-6 glass-dark rounded-xl border border-white/20 hover:border-cyan-400 hover-lift text-white/90"
              >
                <Download className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
                <div className="font-bold">Download as DOCX</div>
              </button>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => handleNavigation(4, null)}
                className="flex-1 px-6 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-white/20"
              >
                <ArrowLeft className="w-5 h-5 inline mr-2" />
                Back to Edit
              </button>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await resumeAPI.saveResume({
                      ...tailoredResume,
                      layout: selectedTailoredLayout
                    });
                    setSuccess('Resume saved to your account!');
                  } catch (err) {
                    setError('Failed to save resume');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover-lift disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save to Account
                  </>
                )}
              </button>
              <button
                onClick={() => handleNavigation(null, 'dashboard')}
                className="flex-1 px-6 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-white/20"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-2xl p-8 max-w-md w-full border border-red-400/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold gradient-text">Wait!</h3>
            </div>
            <p className="text-white/90 mb-2">
              Your resume is currently being generated.
            </p>
            <p className="text-white/70 mb-6">
              Are you sure you want to leave? Your progress may be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelExit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl hover-lift font-semibold"
              >
                Stay
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-3 glass-dark rounded-xl text-white/90 hover-lift border border-red-400/50"
              >
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
