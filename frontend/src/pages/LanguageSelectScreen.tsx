import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const LanguageSelectScreen: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const handleSelectLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    // Mark that the user has explicitly chosen a language
    localStorage.setItem('i18nextLng_set', 'true');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          Welcome to ELMA Core
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Please select your preferred language to continue.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => handleSelectLanguage('fr')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Français
          </button>
          
          <button
            onClick={() => handleSelectLanguage('ar')}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded hover:bg-emerald-700 transition-colors text-lg font-medium"
          >
            العربية
          </button>
          
          <button
            onClick={() => handleSelectLanguage('en')}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-700 transition-colors text-lg font-medium"
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectScreen;
