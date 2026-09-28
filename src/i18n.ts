export type Lang = 'ja' | 'en';

const LANG_KEY = 'ato-nannichi-lang';

export function getLang(): Lang {
  const v = localStorage.getItem(LANG_KEY);
  if (v === 'en' || v === 'ja') return v;
  return 'ja';
}

export function setLang(lang: Lang): void {
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
}

type Dict = Record<string, string>;

let current: Lang = getLang();

export function lang(): Lang {
  return current;
}

export function switchLang(l: Lang): void {
  current = l;
  setLang(l);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const raw = dictionaries[current][key] ?? dictionaries.ja[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.split(`{${k}}`).join(String(v)),
    raw,
  );
}

const ja: Dict = {
  appTitle: 'あと何日',
  appSub: '大切な日までのカウントダウン',
  add: '追加',
  addEvent: '予定を追加',
  editEvent: '予定を編集',
  title: 'タイトル',
  titlePh: '例：沖縄旅行',
  date: '日付',
  repeat: '毎年くり返す',
  repeatHint: '誕生日・記念日などに',
  emoji: '絵文字',
  emojiCustom: '他の絵文字',
  color: 'カラー',
  save: '保存',
  cancel: 'キャンセル',
  delete: '削除',
  confirmDelete: '「{t}」を削除しますか？',
  sortNear: '近い順',
  sortAdded: '追加順',
  sortDate: '日付順',
  today: '今日！',
  tomorrow: '明日',
  yesterday: '昨日',
  daysLeftPre: 'あと',
  daysLeftPost: '日',
  daysAgoPost: '日経過',
  daysUnit: '日',
  nextUp: 'つぎの予定',
  yearly: '毎年',
  nth: '{n}回目',
  emptyTitle: 'まだ予定がありません',
  emptyBody: '旅行・誕生日・記念日などを追加すると、あと何日かを表示します。',
  quickTrip: '旅行',
  quickBirthday: '誕生日',
  quickAnniv: '記念日',
  toastSaved: '保存しました',
  toastDeleted: '削除しました',
  needTitle: 'タイトルを入力してください',
  needDate: '日付を選んでください',
  weeks: '約{n}週間',
  yearsMonths: '約{y}年{m}ヶ月',
  months: '約{m}ヶ月',
  footer: 'データはこの端末だけに保存 · 無料 · 広告なし · ログイン不要',
  events: '{n}件',
};

const en: Dict = {
  appTitle: 'Days Until',
  appSub: 'Count down to the days that matter',
  add: 'Add',
  addEvent: 'New event',
  editEvent: 'Edit event',
  title: 'Title',
  titlePh: 'e.g. Okinawa trip',
  date: 'Date',
  repeat: 'Repeat every year',
  repeatHint: 'For birthdays and anniversaries',
  emoji: 'Emoji',
  emojiCustom: 'Other emoji',
  color: 'Colour',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  confirmDelete: 'Delete “{t}”?',
  sortNear: 'Nearest',
  sortAdded: 'Added',
  sortDate: 'By date',
  today: 'Today!',
  tomorrow: 'Tomorrow',
  yesterday: 'Yesterday',
  daysLeftPre: '',
  daysLeftPost: 'days to go',
  daysAgoPost: 'days ago',
  daysUnit: 'days',
  nextUp: 'Next up',
  yearly: 'Yearly',
  nth: '#{n}',
  emptyTitle: 'No events yet',
  emptyBody: 'Add a trip, birthday or anniversary to see how many days are left.',
  quickTrip: 'Trip',
  quickBirthday: 'Birthday',
  quickAnniv: 'Anniversary',
  toastSaved: 'Saved',
  toastDeleted: 'Deleted',
  needTitle: 'Please enter a title',
  needDate: 'Please pick a date',
  weeks: '≈ {n} weeks',
  yearsMonths: '≈ {y} yr {m} mo',
  months: '≈ {m} months',
  footer: 'Data stays on this device · free · no ads · no login',
  events: '{n} events',
};

const dictionaries: Record<Lang, Dict> = { ja, en };
