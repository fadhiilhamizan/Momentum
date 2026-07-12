/**
 * i18n/index.js — lightweight, dependency-free localization.
 *
 * `translate(lang, key)` looks up a key in the target language and falls back
 * to English per-key, so a partially translated language still renders cleanly.
 * The 10 most widely spoken languages are included, plus Indonesian. Arabic and
 * Urdu are right-to-left.
 */
import { useUserStore } from '../store/userStore';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', dir: 'ltr' },
  { code: 'zh', name: 'Chinese (Mandarin)', native: '中文', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português', dir: 'ltr' },
  { code: 'ru', name: 'Russian', native: 'Русский', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', native: 'اردو', dir: 'rtl' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', dir: 'ltr' },
];

// English is the complete base; every other language may translate a subset and
// falls back to English for any missing key.
const en = {
  'nav.today': 'Today',
  'nav.calendar': 'Calendar',
  'nav.tasks': 'All Tasks',
  'nav.starred': 'Starred',
  'nav.projects': 'Projects',
  'nav.analytics': 'Analytics',
  'nav.reflection': 'Reflection',
  'nav.settings': 'Settings',
  'nav.about': 'About',
  'sidebar.help': 'Help & shortcuts',
  'sidebar.dayStreak': 'day streak',
  'common.on': 'On',
  'common.off': 'Off',
  'common.import': 'Import',
  'common.export': 'Export',
  'settings.title': 'Settings',
  'settings.subtitle': 'Make Momentum yours',
  'settings.appearance': 'Appearance',
  'settings.dark': 'Dark',
  'settings.light': 'Light',
  'settings.language': 'Language',
  'settings.language.desc': 'Choose your preferred language.',
  'settings.sound': 'Sound',
  'settings.notifications': 'Notifications',
  'settings.data': 'Data',
  'settings.privacy': 'Privacy & Data',
  'settings.storage': 'Storage engine',
};

const zh = {
  'nav.today': '今天',
  'nav.calendar': '日历',
  'nav.tasks': '所有任务',
  'nav.starred': '已加星标',
  'nav.projects': '项目',
  'nav.analytics': '分析',
  'nav.reflection': '反思',
  'nav.settings': '设置',
  'nav.about': '关于',
  'sidebar.help': '帮助与快捷键',
  'sidebar.dayStreak': '天连续',
  'common.on': '开',
  'common.off': '关',
  'common.import': '导入',
  'common.export': '导出',
  'settings.title': '设置',
  'settings.subtitle': '让 Momentum 成为你的',
  'settings.appearance': '外观',
  'settings.dark': '深色',
  'settings.light': '浅色',
  'settings.language': '语言',
  'settings.language.desc': '选择你偏好的语言。',
  'settings.sound': '声音',
  'settings.notifications': '通知',
  'settings.data': '数据',
  'settings.privacy': '隐私与数据',
  'settings.storage': '存储引擎',
};

const hi = {
  'nav.today': 'आज',
  'nav.calendar': 'कैलेंडर',
  'nav.tasks': 'सभी कार्य',
  'nav.starred': 'तारांकित',
  'nav.projects': 'प्रोजेक्ट',
  'nav.analytics': 'विश्लेषण',
  'nav.reflection': 'चिंतन',
  'nav.settings': 'सेटिंग्स',
  'nav.about': 'परिचय',
  'sidebar.help': 'सहायता और शॉर्टकट',
  'sidebar.dayStreak': 'दिन की लय',
  'common.on': 'चालू',
  'common.off': 'बंद',
  'common.import': 'आयात',
  'common.export': 'निर्यात',
  'settings.title': 'सेटिंग्स',
  'settings.subtitle': 'Momentum को अपना बनाएं',
  'settings.appearance': 'दिखावट',
  'settings.dark': 'गहरा',
  'settings.light': 'हल्का',
  'settings.language': 'भाषा',
  'settings.language.desc': 'अपनी पसंदीदा भाषा चुनें।',
  'settings.sound': 'ध्वनि',
  'settings.notifications': 'सूचनाएं',
  'settings.data': 'डेटा',
  'settings.privacy': 'गोपनीयता और डेटा',
  'settings.storage': 'स्टोरेज इंजन',
};

const es = {
  'nav.today': 'Hoy',
  'nav.calendar': 'Calendario',
  'nav.tasks': 'Todas las tareas',
  'nav.starred': 'Destacados',
  'nav.projects': 'Proyectos',
  'nav.analytics': 'Analíticas',
  'nav.reflection': 'Reflexión',
  'nav.settings': 'Ajustes',
  'nav.about': 'Acerca de',
  'sidebar.help': 'Ayuda y atajos',
  'sidebar.dayStreak': 'días de racha',
  'common.on': 'Activado',
  'common.off': 'Desactivado',
  'common.import': 'Importar',
  'common.export': 'Exportar',
  'settings.title': 'Ajustes',
  'settings.subtitle': 'Haz de Momentum algo tuyo',
  'settings.appearance': 'Apariencia',
  'settings.dark': 'Oscuro',
  'settings.light': 'Claro',
  'settings.language': 'Idioma',
  'settings.language.desc': 'Elige tu idioma preferido.',
  'settings.sound': 'Sonido',
  'settings.notifications': 'Notificaciones',
  'settings.data': 'Datos',
  'settings.privacy': 'Privacidad y datos',
  'settings.storage': 'Motor de almacenamiento',
};

const fr = {
  'nav.today': "Aujourd'hui",
  'nav.calendar': 'Calendrier',
  'nav.tasks': 'Toutes les tâches',
  'nav.starred': 'Favoris',
  'nav.projects': 'Projets',
  'nav.analytics': 'Analytique',
  'nav.reflection': 'Réflexion',
  'nav.settings': 'Paramètres',
  'nav.about': 'À propos',
  'sidebar.help': 'Aide et raccourcis',
  'sidebar.dayStreak': 'jours de série',
  'common.on': 'Activé',
  'common.off': 'Désactivé',
  'common.import': 'Importer',
  'common.export': 'Exporter',
  'settings.title': 'Paramètres',
  'settings.subtitle': 'Faites de Momentum le vôtre',
  'settings.appearance': 'Apparence',
  'settings.dark': 'Sombre',
  'settings.light': 'Clair',
  'settings.language': 'Langue',
  'settings.language.desc': 'Choisissez votre langue préférée.',
  'settings.sound': 'Son',
  'settings.notifications': 'Notifications',
  'settings.data': 'Données',
  'settings.privacy': 'Confidentialité et données',
  'settings.storage': 'Moteur de stockage',
};

const ar = {
  'nav.today': 'اليوم',
  'nav.calendar': 'التقويم',
  'nav.tasks': 'كل المهام',
  'nav.starred': 'المميّزة',
  'nav.projects': 'المشاريع',
  'nav.analytics': 'التحليلات',
  'nav.reflection': 'تأمل',
  'nav.settings': 'الإعدادات',
  'nav.about': 'حول',
  'sidebar.help': 'المساعدة والاختصارات',
  'sidebar.dayStreak': 'يوم متتالٍ',
  'common.on': 'تشغيل',
  'common.off': 'إيقاف',
  'common.import': 'استيراد',
  'common.export': 'تصدير',
  'settings.title': 'الإعدادات',
  'settings.subtitle': 'اجعل Momentum خاصًا بك',
  'settings.appearance': 'المظهر',
  'settings.dark': 'داكن',
  'settings.light': 'فاتح',
  'settings.language': 'اللغة',
  'settings.language.desc': 'اختر لغتك المفضلة.',
  'settings.sound': 'الصوت',
  'settings.notifications': 'الإشعارات',
  'settings.data': 'البيانات',
  'settings.privacy': 'الخصوصية والبيانات',
  'settings.storage': 'محرّك التخزين',
};

const bn = {
  'nav.today': 'আজ',
  'nav.calendar': 'ক্যালেন্ডার',
  'nav.tasks': 'সব কাজ',
  'nav.starred': 'তারকাচিহ্নিত',
  'nav.projects': 'প্রকল্প',
  'nav.analytics': 'বিশ্লেষণ',
  'nav.reflection': 'প্রতিফলন',
  'nav.settings': 'সেটিংস',
  'nav.about': 'সম্পর্কে',
  'sidebar.help': 'সাহায্য ও শর্টকাট',
  'sidebar.dayStreak': 'দিনের ধারা',
  'common.on': 'চালু',
  'common.off': 'বন্ধ',
  'common.import': 'ইম্পোর্ট',
  'common.export': 'এক্সপোর্ট',
  'settings.title': 'সেটিংস',
  'settings.subtitle': 'Momentum-কে নিজের করে নিন',
  'settings.appearance': 'চেহারা',
  'settings.dark': 'গাঢ়',
  'settings.light': 'হালকা',
  'settings.language': 'ভাষা',
  'settings.language.desc': 'আপনার পছন্দের ভাষা নির্বাচন করুন।',
  'settings.sound': 'শব্দ',
  'settings.notifications': 'বিজ্ঞপ্তি',
  'settings.data': 'ডেটা',
  'settings.privacy': 'গোপনীয়তা ও ডেটা',
  'settings.storage': 'স্টোরেজ ইঞ্জিন',
};

const pt = {
  'nav.today': 'Hoje',
  'nav.calendar': 'Calendário',
  'nav.tasks': 'Todas as tarefas',
  'nav.starred': 'Favoritos',
  'nav.projects': 'Projetos',
  'nav.analytics': 'Análises',
  'nav.reflection': 'Reflexão',
  'nav.settings': 'Configurações',
  'nav.about': 'Sobre',
  'sidebar.help': 'Ajuda e atalhos',
  'sidebar.dayStreak': 'dias de sequência',
  'common.on': 'Ativado',
  'common.off': 'Desativado',
  'common.import': 'Importar',
  'common.export': 'Exportar',
  'settings.title': 'Configurações',
  'settings.subtitle': 'Torne o Momentum seu',
  'settings.appearance': 'Aparência',
  'settings.dark': 'Escuro',
  'settings.light': 'Claro',
  'settings.language': 'Idioma',
  'settings.language.desc': 'Escolha o seu idioma preferido.',
  'settings.sound': 'Som',
  'settings.notifications': 'Notificações',
  'settings.data': 'Dados',
  'settings.privacy': 'Privacidade e dados',
  'settings.storage': 'Mecanismo de armazenamento',
};

const ru = {
  'nav.today': 'Сегодня',
  'nav.calendar': 'Календарь',
  'nav.tasks': 'Все задачи',
  'nav.starred': 'Избранное',
  'nav.projects': 'Проекты',
  'nav.analytics': 'Аналитика',
  'nav.reflection': 'Рефлексия',
  'nav.settings': 'Настройки',
  'nav.about': 'О программе',
  'sidebar.help': 'Помощь и горячие клавиши',
  'sidebar.dayStreak': 'дней подряд',
  'common.on': 'Вкл',
  'common.off': 'Выкл',
  'common.import': 'Импорт',
  'common.export': 'Экспорт',
  'settings.title': 'Настройки',
  'settings.subtitle': 'Сделайте Momentum своим',
  'settings.appearance': 'Оформление',
  'settings.dark': 'Тёмная',
  'settings.light': 'Светлая',
  'settings.language': 'Язык',
  'settings.language.desc': 'Выберите предпочитаемый язык.',
  'settings.sound': 'Звук',
  'settings.notifications': 'Уведомления',
  'settings.data': 'Данные',
  'settings.privacy': 'Конфиденциальность и данные',
  'settings.storage': 'Движок хранилища',
};

const ur = {
  'nav.today': 'آج',
  'nav.calendar': 'کیلنڈر',
  'nav.tasks': 'تمام کام',
  'nav.starred': 'نمایاں شدہ',
  'nav.projects': 'پروجیکٹس',
  'nav.analytics': 'تجزیات',
  'nav.reflection': 'غور و فکر',
  'nav.settings': 'ترتیبات',
  'nav.about': 'بارے میں',
  'sidebar.help': 'مدد اور شارٹ کٹس',
  'sidebar.dayStreak': 'دن مسلسل',
  'common.on': 'آن',
  'common.off': 'آف',
  'common.import': 'درآمد',
  'common.export': 'برآمد',
  'settings.title': 'ترتیبات',
  'settings.subtitle': 'Momentum کو اپنا بنائیں',
  'settings.appearance': 'ظاہری شکل',
  'settings.dark': 'گہرا',
  'settings.light': 'ہلکا',
  'settings.language': 'زبان',
  'settings.language.desc': 'اپنی پسندیدہ زبان منتخب کریں۔',
  'settings.sound': 'آواز',
  'settings.notifications': 'اطلاعات',
  'settings.data': 'ڈیٹا',
  'settings.privacy': 'رازداری اور ڈیٹا',
  'settings.storage': 'اسٹوریج انجن',
};

const id = {
  'nav.today': 'Hari Ini',
  'nav.calendar': 'Kalender',
  'nav.tasks': 'Semua Tugas',
  'nav.starred': 'Berbintang',
  'nav.projects': 'Proyek',
  'nav.analytics': 'Analitik',
  'nav.reflection': 'Refleksi',
  'nav.settings': 'Pengaturan',
  'nav.about': 'Tentang',
  'sidebar.help': 'Bantuan & pintasan',
  'sidebar.dayStreak': 'hari beruntun',
  'common.on': 'Aktif',
  'common.off': 'Nonaktif',
  'common.import': 'Impor',
  'common.export': 'Ekspor',
  'settings.title': 'Pengaturan',
  'settings.subtitle': 'Jadikan Momentum milikmu',
  'settings.appearance': 'Tampilan',
  'settings.dark': 'Gelap',
  'settings.light': 'Terang',
  'settings.language': 'Bahasa',
  'settings.language.desc': 'Pilih bahasa yang kamu inginkan.',
  'settings.sound': 'Suara',
  'settings.notifications': 'Notifikasi',
  'settings.data': 'Data',
  'settings.privacy': 'Privasi & Data',
  'settings.storage': 'Mesin penyimpanan',
};

const TRANSLATIONS = { en, zh, hi, es, fr, ar, bn, pt, ru, ur, id };

export function translate(lang, key, vars) {
  const base = TRANSLATIONS.en;
  const dict = TRANSLATIONS[lang] || base;
  let str = dict[key] != null ? dict[key] : base[key];
  if (str == null) str = key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.split(`{${k}}`).join(vars[k]);
    });
  }
  return str;
}

export function dirFor(lang) {
  const l = LANGUAGES.find((x) => x.code === lang);
  return l ? l.dir : 'ltr';
}

/** Apply the language + text direction to the document root. */
export function applyLanguage(lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', lang || 'en');
  document.documentElement.setAttribute('dir', dirFor(lang));
}

/** Hook returning a `t(key, vars)` bound to the current language (reactive). */
export function useT() {
  const lang = useUserStore((s) => s.settings.language || 'en');
  return (key, vars) => translate(lang, key, vars);
}
