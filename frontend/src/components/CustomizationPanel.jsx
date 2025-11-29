/**
 * CustomizationPanel Component
 * Dynamically generates customization controls based on template config
 */

import React from 'react';
import { Palette, Type, Eye, EyeOff } from 'lucide-react';

function CustomizationPanel({ templateConfig, currentCustomizations, onChange }) {
  const features = templateConfig?.features || {};

  const handleColorSchemeChange = (schemeName) => {
    onChange({ colorScheme: schemeName });
  };

  const handleFontChange = (fontName) => {
    onChange({ font: fontName });
  };

  const handleSectionToggle = (sectionId, enabled) => {
    onChange({
      enabledSections: {
        ...currentCustomizations.enabledSections,
        [sectionId]: enabled
      }
    });
  };

  const handleCustomColorChange = (colorName, hexValue) => {
    onChange({
      customColors: {
        ...currentCustomizations.customColors,
        [colorName]: hexValue
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 space-y-6">
      <h3 className="text-xl font-bold mb-4">Customize Template</h3>

      {/* Color Schemes */}
      {features.supportsColorSchemes && templateConfig.colorSchemes && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-lg">Color Scheme</h4>
          </div>
          <select
            value={currentCustomizations.colorScheme || ''}
            onChange={(e) => handleColorSchemeChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Default</option>
            {Object.entries(templateConfig.colorSchemes).map(([schemeName, scheme]) => (
              <option key={schemeName} value={schemeName}>
                {scheme.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Fonts */}
      {features.supportsFonts && templateConfig.fonts && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-lg">Font</h4>
          </div>
          <select
            value={currentCustomizations.font || ''}
            onChange={(e) => handleFontChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Default</option>
            {Object.entries(templateConfig.fonts).map(([fontName, font]) => (
              <option key={fontName} value={fontName}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Section Toggles */}
      {features.supportsSectionToggle && templateConfig.sections && (
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Sections</h4>
          <div className="space-y-2">
            {Object.entries(templateConfig.sections).map(([sectionId, section]) => {
              const isEnabled = currentCustomizations.enabledSections?.[sectionId] !== false;
              return (
                <label
                  key={sectionId}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleSectionToggle(sectionId, e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {isEnabled ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={isEnabled ? 'text-gray-900' : 'text-gray-500'}>
                      {section.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Colors */}
      {features.supportsCustomColors && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-600" />
            <h4 className="font-semibold text-lg">Custom Colors</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['primary', 'secondary', 'accent'].map((colorName) => (
              <div key={colorName}>
                <label className="block text-sm font-medium mb-1 capitalize">{colorName}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentCustomizations.customColors?.[colorName] || '#3b82f6'}
                    onChange={(e) => handleCustomColorChange(colorName, e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentCustomizations.customColors?.[colorName] || '#3b82f6'}
                    onChange={(e) => handleCustomColorChange(colorName, e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info message if no customizations available */}
      {!features.supportsColorSchemes && 
       !features.supportsFonts && 
       !features.supportsSectionToggle && 
       !features.supportsCustomColors && (
        <div className="text-center py-4 text-gray-500">
          <p>This template does not support customizations.</p>
        </div>
      )}
    </div>
  );
}

export default CustomizationPanel;



