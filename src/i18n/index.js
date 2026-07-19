import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import ar from './ar.json'

const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('sentinel_lang')) || 'en'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export const RTL_LANGS = ['ar']
export const setAppLanguage = (lng) => {
  localStorage.setItem('sentinel_lang', lng)
  i18n.changeLanguage(lng)
  document.documentElement.dir = RTL_LANGS.includes(lng) ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
}

document.documentElement.dir = RTL_LANGS.includes(saved) ? 'rtl' : 'ltr'
document.documentElement.lang = saved

export default i18n
