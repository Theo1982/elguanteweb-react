import { useTranslation } from '../hooks/useI18n';

export default function SocialLinks({ className = '', showLabels = false }) {
  const { t } = useTranslation();

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/elguanteweb', // Replace with actual URL
      icon: '📘',
      color: '#1877f2'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/elguanteweb', // Replace with actual URL
      icon: '📷',
      color: '#e4405f'
    },
    {
      name: 'WhatsApp',
      url: 'https://wa.me/549XXXXXXXXXX', // Replace with actual WhatsApp Business number
      icon: '💬',
      color: '#25d366'
    }
  ];

  return (
    <div className={`social-links ${className}`}>
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          style={{ '--hover-color': social.color }}
          aria-label={`${t('followUs', 'Follow us')} en ${social.name}`}
        >
          <span className="social-icon">{social.icon}</span>
          {showLabels && <span className="social-label">{social.name}</span>}
        </a>
      ))}
    </div>
  );
}
