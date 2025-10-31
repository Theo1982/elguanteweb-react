import { useTranslation } from '../hooks/useI18n';

export default function LanguageSelector() {
  const { language, languages, changeLanguage } = useTranslation();

  return (
    <div className="language-selector">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
        aria-label="Seleccionar idioma"
      >
        {Object.values(languages).map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
