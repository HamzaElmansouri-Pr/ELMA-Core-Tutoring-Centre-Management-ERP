import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select
      className="p-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 outline-none cursor-pointer"
      onChange={handleLanguageChange}
      value={i18n.language}
    >
      <option value="fr">🇫🇷 Français</option>
      <option value="en">🇬🇧 English</option>
      <option value="ar">🇸🇦 العربية</option>
    </select>
  );
};

export default LanguageSwitcher;
