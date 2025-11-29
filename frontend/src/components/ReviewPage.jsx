/**
 * ReviewPage Component
 * Main review and customization page with template-agnostic system
 */

import React, { useState, useEffect } from 'react';
import { resumeAPI } from '../services/api';
import CustomizationPanel from './CustomizationPanel';
import EditableContentForm from './EditableContentForm';
import PDFPreview from './PDFPreview';
import { Loader, Save, Download, RefreshCw, ArrowLeft, ChevronRight } from 'lucide-react';

function ReviewPage({ resumeData, templateId, onSave, onDownload, onNext, onBack, setError, setLoading, loading }) {
  const [templateConfig, setTemplateConfig] = useState(null);
  const [customizations, setCustomizations] = useState({
    colorScheme: null,
    font: null,
    enabledSections: {},
    editedContent: {},
    customColors: {}
  });
  const [placeholders, setPlaceholders] = useState({});
  const [sections, setSections] = useState([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  // Load template config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        const response = await resumeAPI.getTemplateConfig(templateId);
        if (response.success) {
          setTemplateConfig(response.data);
          
          // Initialize enabled sections from config
          const initialSections = {};
          if (response.data.sections) {
            Object.keys(response.data.sections).forEach(sectionId => {
              initialSections[sectionId] = true; // Default to enabled
            });
          }
          setCustomizations(prev => ({
            ...prev,
            enabledSections: initialSections
          }));
        }
      } catch (error) {
        console.error('Error loading template config:', error);
        setError?.('Failed to load template configuration');
      } finally {
        setConfigLoading(false);
      }
    };

    if (templateId) {
      loadConfig();
    }
  }, [templateId, setError]);

  // Extract placeholders when config is loaded
  useEffect(() => {
    const extractPlaceholders = async () => {
      if (!templateId || !templateConfig) return;
      
      try {
        const response = await resumeAPI.extractPlaceholders(templateId);
        if (response.success) {
          setPlaceholders(response.data.placeholders || {});
          setSections(response.data.sections || []);
          
          // Initialize edited content from extracted placeholders
          const initialContent = {};
          Object.entries(response.data.placeholders || {}).forEach(([key, value]) => {
            if (value.currentValue) {
              initialContent[key] = value.currentValue;
            }
          });
          setCustomizations(prev => ({
            ...prev,
            editedContent: initialContent
          }));
        }
      } catch (error) {
        console.error('Error extracting placeholders:', error);
      }
    };

    extractPlaceholders();
  }, [templateId, templateConfig]);

  // Generate PDF preview
  const generatePreview = async () => {
    if (!templateId || !resumeData || !templateConfig) {
      console.warn('⚠️ Cannot generate preview - missing required data:', {
        hasTemplateId: !!templateId,
        hasResumeData: !!resumeData,
        hasTemplateConfig: !!templateConfig
      });
      return;
    }
    
    setGeneratingPreview(true);
    try {
      console.log('🔄 Generating preview...');
      const blob = await resumeAPI.getResumePreview(templateId, resumeData, customizations);
      
      if (!blob || blob.size === 0) {
        throw new Error('Received empty or invalid PDF blob');
      }
      
      const url = window.URL.createObjectURL(blob);
      
      // Clean up old URL
      if (pdfPreviewUrl) {
        window.URL.revokeObjectURL(pdfPreviewUrl);
      }
      
      setPdfPreviewUrl(url);
      console.log('✅ Preview generated successfully');
    } catch (error) {
      console.error('❌ Preview generation error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate preview';
      setError?.(`Failed to generate preview: ${errorMessage}`);
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Generate preview when customizations change (debounced)
  useEffect(() => {
    if (!templateConfig) return;
    
    const timeoutId = setTimeout(() => {
      generatePreview();
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [customizations, templateId, resumeData]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        window.URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const handleCustomizationChange = (updates) => {
    setCustomizations(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave({
        ...resumeData,
        customizations
      });
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      console.log('📥 Downloading PDF...', {
        templateId,
        hasResumeData: !!resumeData,
        resumeDataKeys: resumeData ? Object.keys(resumeData) : [],
        customizations
      });
      
      const blob = await resumeAPI.customizeResume(templateId, resumeData, customizations);
      
      if (!blob || blob.size === 0) {
        throw new Error('Received empty or invalid PDF blob');
      }
      
      console.log('✅ PDF blob received:', blob.size, 'bytes');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to download PDF';
      setError?.(`Failed to download PDF: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading template configuration...</span>
      </div>
    );
  }

  if (!templateConfig) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Template configuration not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">Review & Customize</h2>
          <p className="text-gray-600">Customize your resume template and preview changes in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generatePreview}
            disabled={generatingPreview}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generatingPreview ? 'animate-spin' : ''}`} />
            Refresh Preview
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Customization Controls */}
        <div className="space-y-6">
          {/* Customization Panel */}
          <CustomizationPanel
            templateConfig={templateConfig}
            currentCustomizations={customizations}
            onChange={handleCustomizationChange}
          />

          {/* Editable Content Form */}
          <EditableContentForm
            placeholders={placeholders}
            values={customizations.editedContent}
            onChange={(editedContent) => handleCustomizationChange({ editedContent })}
          />
        </div>

        {/* Right Panel: PDF Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <PDFPreview
            pdfUrl={pdfPreviewUrl}
            generating={generatingPreview}
            onRefresh={generatePreview}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 ml-auto"
          >
            Continue to Export
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ReviewPage;

