import './style.css';
import { lang, switchLang, t, type Lang } from './i18n';
import { closeSheet, esc, openSheet, registerPwa, showToast, uid } from './ui';

interface Ev {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  repeat: boolean;
  emoji: string;
  color: string;
  created: number;
}

type SortMode = 'near' | 'date' | 'added';

interface State {
  events: Ev[];
  sort: SortMode;
}

const STORE_KEY = 'ato-nannichi:v1';
const EMOJIS = ['✈️', '🎂', '💍', '🎉', '🏖️', '🗻', '🎄', '🎓', '💼', '❤️', '⭐', '🍣', '🏥', '👶', '🐶', '🎵'];
const COLORS = ['#F2643F', '#F5A524', '#2FB67C', '#1FA2D6', '#5B6CFF', '#A855F7', '#EC4899', '#64748B'];
const DAY = 86_400_000;

const app = document.querySelector<HTMLDivElement>('#app')!;

function load(): State {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<State>;
      return {
        events: Array.isArray(s.events) ? s.events.filter((e) => e && e.id && e.date) : [],
        sort: s.sort === 'added' || s.sort === 'date' ? s.sort : 'near',
      };
    }
  } catch {
    /* ignore corrupt data */
  }
  return { events: [], sort: 'near' };
}

const state: State = load();

function save(): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

// ---------- date helpers ----------
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY);
}

function sameMonthDay(year: number, base: Date): Date {
  const d = new Date(year, base.getMonth(), base.getDate());
  // Feb 29 in a non-leap year -> Feb 28
  if (d.getMonth() !== base.getMonth()) return new Date(year, base.getMonth() + 1, 0);
  return d;
}

interface Info {
  days: number; // >0 future, 0 today, <0 past
  target: Date;
  nth: number | null;
}

function info(ev: Ev): Info {
  const base = parseYmd(ev.date);
  const now = today();
  if (ev.repeat) {
    let target = sameMonthDay(now.getFullYear(), base);
    if (target < now) target = sameMonthDay(now.getFullYear() + 1, base);
    if (target < base) target = base; // first occurrence still in the future
    const nth = target.getFullYear() - base.getFullYear();
    return { days: dayDiff(target, now), target, nth: nth > 0 ? nth : null };
  }
  return { days: dayDiff(base, now), target: base, nth: null };
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat(lang() === 'ja' ? 'ja-JP' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}

function approx(days: number): string {
  const a = Math.abs(days);
  if (a < 14) return '';
  if (a < 60) return t('weeks', { n: Math.round(a / 7) });
  const totalMonths = Math.round(a / 30.4375);
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return y > 0 ? t('yearsMonths', { y, m }) : t('months', { m });
}

function sorted(): { ev: Ev; inf: Info }[] {
  const list = state.events.map((ev) => ({ ev, inf: info(ev) }));
  if (state.sort === 'near') {
    list.sort((a, b) => {
      const fa = a.inf.days < 0 ? 1 : 0;
      const fb = b.inf.days < 0 ? 1 : 0;
      if (fa !== fb) return fa - fb;
      return Math.abs(a.inf.days) - Math.abs(b.inf.days);
    });
  } else if (state.sort === 'date') {
    list.sort((a, b) => a.inf.target.getTime() - b.inf.target.getTime());
  } else {
    list.sort((a, b) => b.ev.created - a.ev.created);
  }
  return list;
}

// ---------- render ----------
function countLabel(days: number): { num: string; pre: string; post: string } {
  if (days === 0) return { num: '', pre: '', post: t('today') };
  if (days > 0) return { num: String(days), pre: t('daysLeftPre'), post: t('daysLeftPost') };
  return { num: String(-days), pre: '', post: t('daysAgoPost') };
}

function headerHtml(): string {
  const l = lang();
  return `
  <header>
    <div class="header-row">
      <div class="titles">
        <img class="logo" src="./icons/icon-192.png" alt="" />
        <div>
          <h1>${t('appTitle')}</h1>
          <p class="sub">${t('appSub')}</p>
        </div>
      </div>
      <div class="lang-toggle" role="group" aria-label="Language">
        <button type="button" data-lang="ja" class="${l === 'ja' ? 'active' : ''}">日本語</button>
        <button type="button" data-lang="en" class="${l === 'en' ? 'active' : ''}">English</button>
      </div>
    </div>
  </header>`;
}

function subline(ev: Ev, inf: Info): string {
  const bits = [fmtDate(inf.target)];
  if (ev.repeat) bits.push(inf.nth ? `${t('yearly')} · ${t('nth', { n: inf.nth })}` : t('yearly'));
  return bits.map(esc).join(' · ');
}

function heroHtml(ev: Ev, inf: Info): string {
  const c = countLabel(inf.days);
  const near = inf.days === 1 ? t('tomorrow') : approx(inf.days);
  return `
  <button type="button" class="hero" data-edit="${ev.id}" style="--ev:${esc(ev.color)}">
    <div class="hero-top">
      <span class="hero-label">${t('nextUp')}</span>
      <span class="hero-emoji">${esc(ev.emoji)}</span>
    </div>
    <div class="hero-title">${esc(ev.title)}</div>
    <div class="hero-count">
      ${c.pre ? `<span class="pre">${c.pre}</span>` : ''}
      ${c.num ? `<span class="num">${c.num}</span>` : ''}
      <span class="post">${c.post}</span>
    </div>
    <div class="hero-date">${subline(ev, inf)}${near ? ` · ${esc(near)}` : ''}</div>
  </button>`;
}

function rowHtml(ev: Ev, inf: Info): string {
  const past = inf.days < 0;
  let num = '';
  let unit = '';
  if (inf.days === 0) {
    unit = t('today');
  } else {
    num = String(Math.abs(inf.days));
    unit = past ? t('daysAgoPost') : lang() === 'ja' ? `${t('daysLeftPost')}` : t('daysLeftPost');
  }
  const pre = !past && inf.days !== 0 && lang() === 'ja' ? `<span class="pre">${t('daysLeftPre')}</span>` : '';
  return `
  <li>
    <button type="button" class="ev card ${past ? 'past' : ''} ${inf.days === 0 ? 'is-today' : ''}" data-edit="${ev.id}" style="--ev:${esc(ev.color)}">
      <span class="ev-emoji">${esc(ev.emoji)}</span>
      <span class="ev-main">
        <span class="ev-title">${esc(ev.title)}</span>
        <span class="ev-sub">${subline(ev, inf)}</span>
      </span>
      <span class="ev-count">
        <span class="ev-num">${pre}${num}</span>
        <span class="ev-unit">${esc(unit)}</span>
      </span>
    </button>
  </li>`;
}

function render(): void {
  const list = sorted();
  let body = '';
  if (!list.length) {
    body = `
    <div class="empty">
      <div class="big">📅</div>
      <p><strong>${t('emptyTitle')}</strong></p>
      <p>${t('emptyBody')}</p>
      <div class="quick">
        <button type="button" class="chip" data-quick="trip">✈️ ${t('quickTrip')}</button>
        <button type="button" class="chip" data-quick="birthday">🎂 ${t('quickBirthday')}</button>
        <button type="button" class="chip" data-quick="anniv">💍 ${t('quickAnniv')}</button>
      </div>
    </div>`;
  } else {
    const heroItem = state.sort === 'near' ? list.find((x) => x.inf.days >= 0) : undefined;
    const rest = heroItem ? list.filter((x) => x !== heroItem) : list;
    body = `
      ${heroItem ? heroHtml(heroItem.ev, heroItem.inf) : ''}
      <div class="toolbar">
        <span class="muted count">${t('events', { n: list.length })}</span>
        <div class="seg-group" role="group">
          <button type="button" class="seg ${state.sort === 'near' ? 'active' : ''}" data-sort="near">${t('sortNear')}</button>
          <button type="button" class="seg ${state.sort === 'date' ? 'active' : ''}" data-sort="date">${t('sortDate')}</button>
          <button type="button" class="seg ${state.sort === 'added' ? 'active' : ''}" data-sort="added">${t('sortAdded')}</button>
        </div>
      </div>
      ${rest.length ? `<ul class="ev-list">${rest.map((x) => rowHtml(x.ev, x.inf)).join('')}</ul>` : ''}
    `;
  }
  app.innerHTML = `
    ${headerHtml()}
    <main class="main">${body}</main>
    <footer class="note">${t('footer')}</footer>
    <button type="button" class="fab" data-add><span aria-hidden="true">＋</span>${t('add')}</button>
  `;
}

// ---------- form ----------
function openForm(ev: Ev | null, preset?: Partial<Ev>): void {
  const draft: Ev = ev
    ? { ...ev }
    : {
        id: uid(),
        title: '',
        date: ymd(new Date(today().getTime() + 7 * DAY)),
        repeat: false,
        emoji: '✈️',
        color: COLORS[0]!,
        created: Date.now(),
        ...preset,
      };
  const emojiButtons = EMOJIS.map(
    (e) => `<button type="button" class="emo ${e === draft.emoji ? 'active' : ''}" data-emo="${e}">${e}</button>`,
  ).join('');
  const colorButtons = COLORS.map(
    (c) =>
      `<button type="button" class="swatch ${c === draft.color ? 'active' : ''}" data-color="${c}" style="--sw:${c}" aria-label="${c}"></button>`,
  ).join('');
  const sheet = openSheet(`
    <h2>${ev ? t('editEvent') : t('addEvent')}</h2>
    <label class="field">${t('title')}
      <input type="text" id="f-title" maxlength="60" placeholder="${esc(t('titlePh'))}" value="${esc(draft.title)}" enterkeyhint="done" />
    </label>
    <label class="field">${t('date')}
      <input type="date" id="f-date" value="${esc(draft.date)}" />
    </label>
    <label class="switch-row">
      <span><strong>${t('repeat')}</strong><small>${t('repeatHint')}</small></span>
      <input type="checkbox" id="f-repeat" class="switch" ${draft.repeat ? 'checked' : ''} />
    </label>
    <div class="field">${t('emoji')}
      <div class="emo-grid">${emojiButtons}</div>
      <input type="text" id="f-emoji" maxlength="8" placeholder="${esc(t('emojiCustom'))}" value="${EMOJIS.includes(draft.emoji) ? '' : esc(draft.emoji)}" />
    </div>
    <div class="field">${t('color')}
      <div class="swatches">${colorButtons}</div>
    </div>
    <div class="actions">
      ${ev ? `<button type="button" class="btn danger" data-f="delete">${t('delete')}</button>` : ''}
      <button type="button" class="btn" data-f="cancel">${t('cancel')}</button>
      <button type="button" class="btn primary" data-f="save">${t('save')}</button>
    </div>
  `);
  const titleIn = sheet.querySelector<HTMLInputElement>('#f-title')!;
  const emojiIn = sheet.querySelector<HTMLInputElement>('#f-emoji')!;
  if (!ev) window.setTimeout(() => titleIn.focus(), 60);

  sheet.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const emo = target.closest<HTMLElement>('[data-emo]');
    if (emo) {
      draft.emoji = emo.dataset.emo!;
      emojiIn.value = '';
      sheet.querySelectorAll('.emo').forEach((b) => b.classList.toggle('active', b === emo));
      return;
    }
    const sw = target.closest<HTMLElement>('[data-color]');
    if (sw) {
      draft.color = sw.dataset.color!;
      sheet.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('active', b === sw));
      return;
    }
    const act = target.closest<HTMLElement>('[data-f]')?.dataset.f;
    if (act === 'cancel') closeSheet();
    if (act === 'delete' && ev) {
      if (!confirm(t('confirmDelete', { t: ev.title }))) return;
      state.events = state.events.filter((x) => x.id !== ev.id);
      save();
      closeSheet();
      render();
      showToast(t('toastDeleted'));
    }
    if (act === 'save') {
      const title = titleIn.value.trim();
      const date = sheet.querySelector<HTMLInputElement>('#f-date')!.value;
      if (!title) {
        showToast(t('needTitle'));
        titleIn.focus();
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        showToast(t('needDate'));
        return;
      }
      const custom = emojiIn.value.trim();
      const next: Ev = {
        ...draft,
        title,
        date,
        repeat: sheet.querySelector<HTMLInputElement>('#f-repeat')!.checked,
        emoji: custom || draft.emoji,
      };
      const i = state.events.findIndex((x) => x.id === next.id);
      if (i >= 0) state.events[i] = next;
      else state.events.push(next);
      save();
      closeSheet();
      render();
      showToast(t('toastSaved'));
    }
  });
  emojiIn.addEventListener('input', () => {
    if (emojiIn.value.trim()) sheet.querySelectorAll('.emo').forEach((b) => b.classList.remove('active'));
  });
}

app.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const l = target.closest<HTMLElement>('[data-lang]')?.dataset.lang as Lang | undefined;
  if (l) {
    switchLang(l);
    render();
    return;
  }
  const sort = target.closest<HTMLElement>('[data-sort]')?.dataset.sort as SortMode | undefined;
  if (sort) {
    state.sort = sort;
    save();
    render();
    return;
  }
  if (target.closest('[data-add]')) {
    openForm(null);
    return;
  }
  const q = target.closest<HTMLElement>('[data-quick]')?.dataset.quick;
  if (q) {
    const presets: Record<string, Partial<Ev>> = {
      trip: { emoji: '✈️', color: COLORS[3]!, title: '' },
      birthday: { emoji: '🎂', color: COLORS[6]!, repeat: true },
      anniv: { emoji: '💍', color: COLORS[5]!, repeat: true },
    };
    openForm(null, presets[q]);
    return;
  }
  const id = target.closest<HTMLElement>('[data-edit]')?.dataset.edit;
  if (id) {
    const ev = state.events.find((x) => x.id === id);
    if (ev) openForm(ev);
  }
});

// Refresh counts when the day changes or the app comes back to the foreground.
let lastDay = ymd(today());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ymd(today()) !== lastDay) {
    lastDay = ymd(today());
    render();
  }
});

document.documentElement.lang = lang();
render();
registerPwa();
