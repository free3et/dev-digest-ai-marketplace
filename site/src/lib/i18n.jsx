import en from '../locales/en.js';

// The active language. To add one, import its file here and select it (for example from a stored preference).
const messages = en;

const lookup = (key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), messages);
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (whole, name) => (name in vars ? String(vars[name]) : whole));

/** Translated string for `key` ("section.name"), with `{name}` placeholders filled from `vars`. */
export function t(key, vars = {}) {
  const value = lookup(key);
  if (typeof value !== 'string') {
    console.warn(`i18n: missing string "${key}"`);
    return key;
  }
  return fill(value, vars);
}

/** Like `t`, but returns `fallback` instead of the key when the string does not exist (data-driven keys). */
export function tOr(key, fallback) {
  const value = lookup(key);
  return typeof value === 'string' ? value : fallback;
}

/** Array of strings stored under `key`. */
export function list(key) {
  const value = lookup(key);
  return Array.isArray(value) ? value : [];
}

/** Like `t`, but turns `<c>text</c>` into inline code. Returns React nodes. */
export function rich(key, vars = {}) {
  return t(key, vars)
    .split(/<c>(.*?)<\/c>/)
    .map((part, i) => (i % 2 ? <span className="mono" key={i}>{part}</span> : part));
}

export const dateLocale = () => lookup('meta.dateLocale') || 'en';
export const typeLabel = (type) => tOr(`type.one.${type}`, type);
export const typeLabelPlural = (type) => tOr(`type.many.${type}`, type);
export const healthLabel = (health) => tOr(`health.label.${health}`, health);
export const healthCode = (code) => tOr(`health.code.${code}`, code);
