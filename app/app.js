// Leonida Trophy Guide — tracker logic. Loads data/trophies.json (a file of this
// app, fetched relative to the page), renders the checklist, the roadmap and
// the filters, and keeps progress in localStorage. No network use at all.

const EARNED_KEY = 'leonida-trophy-guide-earned-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoiler-v1';

const ROADMAP = [
  { stage: 1, title: 'Play the story, chapters 1–5', note: 'Twelve story trophies pop as you finish chapters and named missions. Enjoy the campaign first — most of the list opens up from it. Do the Chapter 1 balcony meditation for Positive Mental Attitude before you leave Chapter 1.' },
  { stage: 2, title: 'Strangers across Leonida', note: 'Eight stranger strands for the silver, plus a finale trophy for each of Andy, Kenton, Billy, Randy and Tyrone, and Bret’s unique-animal hunt. Start each strand when its marker appears.' },
  { stage: 3, title: 'Activities and challenges', note: 'Nine activity types to sample, 20 races to win, drone races at every Top Fun location, gold at all 42 Shooting Range challenges, 250 stunts and 50 challenges. Check Progress (Touch Pad) to see what is close.' },
  { stage: 4, title: 'Collectibles and exploration', note: 'Meditate at all 18 spots, finish 3 card sets, WAiNK It at 100 locations, discover 100 vehicles and explore every corner of Leonida. Fold these into your travel instead of sweeping them at the end.' },
  { stage: 5, title: 'Robbery and money', note: 'Five bank vaults, an armored truck, a quiet jewelry store, one illegal operation per gang, and the money goals: $250,000 laundered, $100,000 spent, every garage bought, 10 vehicles registered.' },
  { stage: 6, title: 'Odd ones, 100%, platinum', note: 'The hidden one-offs and the two big ones: A Long Road (100% completion, from the checklist that unlocks after the story) and then Vice Got a Price!, the platinum, which pops when everything else is done.' },
];

const KIND_LABELS = {
  all: 'All kinds', story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', robbery: 'Robbery', exploration: 'Exploration', money: 'Money',
  strangers: 'Strangers', combat: 'Combat', completion: 'Completion', misc: 'Odd ones',
};

const state = {
  trophies: [],
  sources: {},
  earned: new Set(),
  kind: 'all',
  grade: 'all',
  shown: 'all',
  spoiler: false,
  query: '',
  expanded: null,
};

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const roadmapEl = $('roadmapStages');

function loadStored() {
  try { state.earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]')); }
  catch { state.earned = new Set(); }
  state.spoiler = localStorage.getItem(SPOILER_KEY) === '1';
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...state.earned]));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, state.spoiler ? '1' : '0');
}

function isMasked(trophy) {
  return state.spoiler && trophy.hidden && !state.earned.has(trophy.name);
}

function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function sourceLinks(keys) {
  return (keys ?? []).map((key) => {
    const source = state.sources[key];
    if (!source) return key;
    if (!source.url) return source.name;
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.name;
    link.rel = 'noopener';
    return link;
  });
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('progressText').textContent = `${done} of ${total} earned`;
  $('progressPct').textContent = `${pct}%`;
  $('progressFill').style.width = `${pct}%`;
  $('stickyProgress').textContent = `${done} of ${total} earned · ${pct}% to the platinum`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const ofGrade = state.trophies.filter((t) => t.grade === grade);
    const got = ofGrade.filter((t) => state.earned.has(t.name)).length;
    return `${gradeWord(grade)} ${got}/${ofGrade.length}`;
  });
  $('gradeBreakdown').textContent = parts.join(' · ');
}

function renderRoadmap() {
  roadmapEl.replaceChildren();
  for (const step of ROADMAP) {
    const members = state.trophies.filter((t) => t.stage === step.stage);
    const done = members.filter((t) => state.earned.has(t.name)).length;
    const item = document.createElement('li');
    const heading = document.createElement('h3');
    heading.textContent = `Stage ${step.stage}: ${step.title} `;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${done}/${members.length} earned`;
    heading.append(count);
    const note = document.createElement('p');
    note.textContent = step.note;
    const chips = document.createElement('ul');
    chips.className = 'stage-trophies';
    for (const trophy of members) {
      const chipItem = document.createElement('li');
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = isMasked(trophy) ? 'Hidden trophy' : trophy.name;
      if (state.earned.has(trophy.name)) chip.classList.add('done');
      chip.addEventListener('click', () => jumpToTrophy(trophy));
      chipItem.append(chip);
      chips.append(chipItem);
    }
    item.append(heading, note, chips);
    roadmapEl.append(item);
  }
}

function matchesFilters(trophy) {
  if (state.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (state.kind !== 'all' && trophy.kind !== state.kind) {
    return false;
  }
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.shown === 'earned' && !state.earned.has(trophy.name)) return false;
  if (state.shown === 'remaining' && state.earned.has(trophy.name)) return false;
  if (state.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!haystack.includes(state.query)) return false;
  }
  return true;
}

function trophyCard(trophy) {
  const masked = isMasked(trophy);
  const earned = state.earned.has(trophy.name);
  const card = document.createElement('li');
  card.className = 'trophy-card';
  card.id = `trophy-${trophy.id}`;
  if (earned) card.classList.add('earned');
  if (trophy.hidden) card.classList.add('hidden-trophy');

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.setAttribute('aria-label', `Mark ${masked ? 'hidden trophy' : trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(trophy.name);
    else state.earned.delete(trophy.name);
    saveEarned();
    renderAll();
  });
  const titleBox = document.createElement('div');
  titleBox.className = 'trophy-title';
  const title = document.createElement('h3');
  if (masked) {
    const mask = document.createElement('span');
    mask.className = 'spoiler-mask';
    mask.textContent = 'Hidden trophy — earn it to reveal';
    title.append(mask);
  } else {
    title.textContent = trophy.name;
  }
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = masked ? 'Its name and description stay hidden until you earn it.' : trophy.description;
  titleBox.append(title, desc);
  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = gradeWord(trophy.grade);
  head.append(box, titleBox, badge);

  const tags = document.createElement('div');
  tags.className = 'trophy-tags';
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  tags.append(kindTag);
  if (trophy.hidden) {
    const hiddenTag = document.createElement('span');
    hiddenTag.className = 'tag tag-hidden';
    hiddenTag.textContent = 'Hidden on PS5';
    tags.append(hiddenTag);
  }
  if (trophy.missable) {
    const missTag = document.createElement('span');
    missTag.className = 'tag tag-missable';
    missTag.textContent = 'Possibly missable';
    tags.append(missTag);
  }
  if (trophy.caution) {
    const cautionTag = document.createElement('span');
    cautionTag.className = 'tag tag-caution';
    cautionTag.textContent = 'Time-sensitive — see guide';
    tags.append(cautionTag);
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  const open = state.expanded === trophy.id;
  toggle.textContent = open ? 'Hide guide ▲' : 'Read the guide ▼';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.addEventListener('click', () => {
    state.expanded = open ? null : trophy.id;
    renderList();
  });

  card.append(head, tags, toggle);
  if (open) {
    const guideBox = document.createElement('div');
    guideBox.className = 'trophy-guide';
    if (masked) {
      const hiddenNote = document.createElement('p');
      hiddenNote.textContent = 'This trophy is hidden on PlayStation until you earn it. Tick it off above once it pops to reveal its guide.';
      guideBox.append(hiddenNote);
    } else {
      const guideText = document.createElement('p');
      guideText.textContent = trophy.guide;
      guideBox.append(guideText);
      if (trophy.missable && trophy.missableNote) {
        const note = document.createElement('p');
        note.className = 'missable-note';
        note.textContent = `Missable warning: ${trophy.missableNote}`;
        guideBox.append(note);
      }
      if (trophy.caution) {
        const caution = document.createElement('p');
        caution.className = 'missable-note';
        caution.textContent = `Watch out: ${trophy.caution}`;
        guideBox.append(caution);
      }
      const sources = document.createElement('p');
      sources.className = 'guide-sources';
      sources.textContent = 'Sources: ';
      const links = sourceLinks(trophy.sources);
      links.forEach((link, index) => {
        if (index > 0) sources.append(document.createTextNode(' · '));
        sources.append(link);
      });
      guideBox.append(sources);
    }
    card.append(guideBox);
  }
  return card;
}

function renderList() {
  const visible = state.trophies.filter(matchesFilters);
  listEl.replaceChildren(...visible.map(trophyCard));
  $('emptyNote').hidden = visible.length > 0;
  $('shownCount').textContent = `Showing ${visible.length} of ${state.trophies.length} trophies`;
}

function renderKindFilters() {
  const wrap = $('kindFilters');
  wrap.replaceChildren();
  for (const [key, label] of Object.entries(KIND_LABELS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(state.kind === key));
    button.addEventListener('click', () => {
      state.kind = key;
      renderKindFilters();
      renderList();
    });
    wrap.append(button);
  }
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderKindFilters();
  renderList();
}

function jumpToTrophy(trophy) {
  state.kind = 'all';
  state.grade = 'all';
  state.shown = 'all';
  state.query = '';
  $('search').value = '';
  $('gradeFilter').value = 'all';
  $('earnedFilter').value = 'all';
  state.expanded = trophy.id;
  renderAll();
  document.getElementById(`trophy-${trophy.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function download(filename, text) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function wireControls() {
  $('search').addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderList();
  });
  $('gradeFilter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderList();
  });
  $('earnedFilter').addEventListener('change', (event) => {
    state.shown = event.target.value;
    renderList();
  });
  const spoilerToggle = $('spoilerToggle');
  spoilerToggle.checked = state.spoiler;
  spoilerToggle.addEventListener('change', () => {
    state.spoiler = spoilerToggle.checked;
    saveSpoiler();
    renderAll();
  });
  $('exportBtn').addEventListener('click', () => {
    download('gta6-trophy-progress.json', JSON.stringify({
      game: 'Grand Theft Auto VI',
      exportedAt: new Date().toISOString(),
      earned: [...state.earned],
    }, null, 2));
    $('importNote').textContent = `Exported ${state.earned.size} earned trophies.`;
  });
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    const note = $('importNote');
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const names = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(names)) throw new Error('no earned list');
      const known = new Set(state.trophies.map((t) => t.name));
      const kept = names.filter((name) => typeof name === 'string' && known.has(name));
      state.earned = new Set(kept);
      saveEarned();
      renderAll();
      note.textContent = `Imported ${kept.length} earned trophies${names.length - kept.length ? ` (${names.length - kept.length} unknown names skipped)` : ''}.`;
    } catch {
      note.textContent = 'That file could not be read as trophy progress — nothing was changed.';
    }
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Clear all earned trophies? This cannot be undone.')) return;
    state.earned = new Set();
    saveEarned();
    renderAll();
    $('importNote').textContent = 'Progress cleared.';
  });
}

async function init() {
  loadStored();
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  state.trophies = data.trophies;
  state.sources = data.sources ?? {};
  // Guard: drop any stored name that is not a trophy of this list (a stale
  // entry from an older list, or a hand-edited localStorage value), so a
  // corrupt save can never inflate the progress count.
  const knownNames = new Set(state.trophies.map((t) => t.name));
  const pruned = [...state.earned].filter((name) => knownNames.has(name));
  if (pruned.length !== state.earned.size) {
    state.earned = new Set(pruned);
    saveEarned();
  }
  wireControls();
  renderAll();
  const hash = window.location.hash;
  if (hash === '#roadmap') {
    $('roadmap').scrollIntoView();
  } else if (hash.startsWith('#trophy-')) {
    const id = Number(hash.slice('#trophy-'.length));
    const trophy = state.trophies.find((t) => t.id === id);
    if (trophy) jumpToTrophy(trophy);
  }
}

init();
