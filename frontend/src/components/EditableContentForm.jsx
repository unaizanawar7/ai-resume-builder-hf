/**
 * EditableContentForm Component
 * Dynamically generates form fields from extracted placeholders
 */

import React from 'react';
import { Edit3 } from 'lucide-react';

function EditableContentForm({ placeholders, values, onChange }) {
  const handleFieldChange = (placeholderName, value) => {
    onChange({
      ...values,
      [placeholderName]: value
    });
  };

  // Group placeholders by type for better organization
  const groupedPlaceholders = {
    personal: [],
    contact: [],
    content: [],
    other: []
  };

  Object.entries(placeholders).forEach(([key, config]) => {
    const label = config.label || key;
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('name') || lowerKey.includes('first') || lowerKey.includes('last')) {
      groupedPlaceholders.personal.push({ key, config, label });
    } else if (lowerKey.includes('email') || lowerKey.includes('phone') || lowerKey.includes('address') || 
               lowerKey.includes('linkedin') || lowerKey.includes('github') || lowerKey.includes('url')) {
      groupedPlaceholders.contact.push({ key, config, label });
    } else if (lowerKey.includes('summary') || lowerKey.includes('bio') || lowerKey.includes('tagline') ||
               lowerKey.includes('experience') || lowerKey.includes('education') || lowerKey.includes('skills')) {
      groupedPlaceholders.content.push({ key, config, label });
    } else {
      groupedPlaceholders.other.push({ key, config, label });
    }
  });

  const renderField = (placeholderKey, config, label) => {
    const value = values[placeholderKey] || config.currentValue || config.default || '';
    const type = config.type || 'text';

    if (type === 'textarea') {
      return (
        <div key={placeholderKey} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(placeholderKey, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      );
    }

    const inputType = type === 'email' ? 'email' : 
                     type === 'phone' ? 'tel' : 
                     type === 'url' ? 'url' : 
                     type === 'date' ? 'date' : 'text';

    return (
      <div key={placeholderKey} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
          type={inputType}
          value={value}
          onChange={(e) => handleFieldChange(placeholderKey, e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Edit3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-xl font-bold">Edit Content</h3>
      </div>

      {Object.keys(placeholders).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No placeholders found in this template.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Personal Information */}
          {groupedPlaceholders.personal.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Personal Information</h4>
              {groupedPlaceholders.personal.map(({ key, config, label }) => 
                renderField(key, config, label)
              )}
            </div>
          )}

          {/* Contact Information */}
          {groupedPlaceholders.contact.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Contact Information</h4>
              {groupedPlaceholders.contact.map(({ key, config, label }) => 
                renderField(key, config, label)
              )}
            </div>
          )}

          {/* Content Sections */}
          {groupedPlaceholders.content.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Content</h4>
              {groupedPlaceholders.content.map(({ key, config, label }) => 
                renderField(key, config, label)
              )}
            </div>
          )}

          {/* Other Fields */}
          {groupedPlaceholders.other.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Other</h4>
              {groupedPlaceholders.other.map(({ key, config, label }) => 
                renderField(key, config, label)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EditableContentForm;



