import { MiniDb } from './mini-db';
import { ObjectId } from './shims/mongodb';

/** Everyone in the demo uses this password. */
export const DEMO_PASSWORD = 'Demo1234';

export const DEMO_ACCOUNTS = [
  { username: 'sam', email: 'sam@demo.com', label: 'Super Admin', note: 'approves groups, sees audit log' },
  { username: 'alex', email: 'alex@demo.com', label: 'Group Admin', note: 'runs Book Club, has requests waiting' },
  { username: 'jordan', email: 'jordan@demo.com', label: 'Group Admin', note: 'runs Study Buddies' },
  { username: 'taylor', email: 'taylor@demo.com', label: 'Member', note: 'chats in Book Club' },
  { username: 'casey', email: 'casey@demo.com', label: 'Group Admin', note: 'runs Plant Parents, has pending requests' },
  { username: 'riley', email: 'riley@demo.com', label: 'Member, age 15', note: 'blocked from 18+ groups' },
];

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const dobForAge = (age: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age, d.getMonth(), Math.max(1, d.getDate() - 10));
  return d.toISOString().slice(0, 10);
};

/** Background members who fill out the groups (not shown on the start screen, but they can log in too). */
const EXTRA_USERS = ['morgan', 'jamie', 'avery', 'quinn', 'devon', 'skylar', 'noah', 'mia'];

export async function seedDemoData(db: MiniDb) {
  const ages: Record<string, number> = {
    sam: 31, alex: 24, jordan: 21, taylor: 27, casey: 19, riley: 15,
    morgan: 22, jamie: 17, avery: 29, quinn: 20, devon: 35, skylar: 18, noah: 26, mia: 16,
  };

  await db.collection('users').insertMany(
    [...DEMO_ACCOUNTS.map((a) => a.username), ...EXTRA_USERS].map((username) => ({
      username,
      email: `${username}@demo.com`,
      password: 'demo$' + DEMO_PASSWORD, // matches the demo bcrypt shim
      dob: dobForAge(ages[username]),
      age: ages[username],
      role: username === 'sam' ? 'super-admin' : 'user',
      valid: true,
      isDarkMode: username === 'jordan',
      profilePictureUrl: '/pfp.png',
    })),
  );

  const groups = [
    {
      groupName: 'Book Club',
      groupDescription: 'One book a month, spoilers only in the right room.',
      minAge: 13, themeColor: 'light',
      admins: ['alex'], members: ['alex', 'jordan', 'taylor', 'riley'],
      rooms: ['Main Room', 'Fantasy', 'Sci-Fi'],
    },
    {
      groupName: 'Study Buddies',
      groupDescription: 'Accountability, flashcards and exam-week panic.',
      minAge: 16, themeColor: 'dark',
      admins: ['jordan'], members: ['jordan', 'casey', 'alex'],
      rooms: ['Main Room', 'Exam Prep'],
    },
    {
      groupName: 'Night Owls',
      groupDescription: 'For people who do their best thinking after midnight. 18+.',
      minAge: 18, themeColor: 'dark',
      admins: ['taylor'], members: ['taylor', 'alex'],
      rooms: ['Main Room'],
    },
    {
      groupName: 'Plant Parents',
      groupDescription: 'Repotting help, cuttings swaps and photos of new leaves.',
      minAge: 13, themeColor: 'light',
      admins: ['casey'], members: ['casey', 'riley'],
      rooms: ['Main Room'],
    },
    {
      groupName: 'Gamers Guild',
      groupDescription: 'Co-op nights, speedrun attempts and the eternal console vs PC debate.',
      minAge: 13, themeColor: 'dark',
      admins: ['devon'], members: ['devon', 'quinn', 'jamie', 'noah'],
      rooms: ['Main Room', 'LFG', 'Speedruns'],
    },
    {
      groupName: 'Coding Corner',
      groupDescription: 'Ask questions, share side projects, review each other\'s code.',
      minAge: 16, themeColor: 'dark',
      admins: ['avery'], members: ['avery', 'morgan', 'quinn', 'jordan'],
      rooms: ['Main Room', 'Help Desk', 'Show & Tell'],
    },
    {
      groupName: 'Movie Nights',
      groupDescription: 'Weekly watch parties and very strong opinions about endings.',
      minAge: 13, themeColor: 'light',
      admins: ['mia'], members: ['mia', 'skylar', 'jamie', 'taylor'],
      rooms: ['Main Room', 'Reviews'],
    },
    {
      groupName: 'Fitness Crew',
      groupDescription: 'Keeping each other honest about leg day.',
      minAge: 16, themeColor: 'light',
      admins: ['noah'], members: ['noah', 'morgan', 'devon'],
      rooms: ['Main Room', 'Running', 'Lifting'],
    },
    {
      groupName: 'Foodies',
      groupDescription: 'Recipes, restaurant finds and kitchen disasters.',
      minAge: 13, themeColor: 'light',
      admins: ['skylar'], members: ['skylar', 'avery', 'casey', 'mia'],
      rooms: ['Main Room', 'Recipes'],
    },
    {
      groupName: 'Music Makers',
      groupDescription: 'Share tracks, get feedback, find people to jam with.',
      minAge: 13, themeColor: 'dark',
      admins: ['quinn'], members: ['quinn', 'jamie', 'devon'],
      rooms: ['Main Room', 'Feedback'],
    },
    {
      groupName: 'Travel Talk',
      groupDescription: 'Trip planning, packing lists and photos from the road. 18+.',
      minAge: 18, themeColor: 'light',
      admins: ['morgan'], members: ['morgan', 'avery', 'noah'],
      rooms: ['Main Room', 'Trip Planning'],
    },
    {
      groupName: 'Language Exchange',
      groupDescription: 'Practise a new language with native speakers. All levels welcome.',
      minAge: 13, themeColor: 'light',
      admins: ['jamie'], members: ['jamie', 'mia', 'skylar'],
      rooms: ['Main Room', 'Español', 'Français'],
    },
    {
      groupName: 'Art Studio',
      groupDescription: 'Sketches, paintings, digital art, and kind critique.',
      minAge: 13, themeColor: 'light',
      admins: ['avery'], members: ['avery', 'riley', 'mia'],
      rooms: ['Main Room', 'Critique'],
    },
  ];
  await db.collection('groups').insertMany(groups.map((g) => ({ ...g, bannedMembers: [] })));

  // The approved requests that created those groups, so history pages have content.
  await db.collection('groupRequests').insertMany([
    ...groups.map((g, i) => ({
      groupName: g.groupName, groupDescription: g.groupDescription, minAge: g.minAge, themeColor: g.themeColor,
      creatorUserName: g.admins[0], creatorEmail: `${g.admins[0]}@demo.com`,
      status: 'approved', createdAt: ago(60 * 24 * (30 - 2 * i) + 60), reviewedAt: ago(60 * 24 * (30 - 2 * i)),
    })),
    {
      groupName: 'Crypto Signals', groupDescription: 'Guaranteed 10x picks every day!!', minAge: 18, themeColor: 'dark',
      creatorUserName: 'casey', creatorEmail: 'casey@demo.com',
      status: 'rejected', reason: 'Financial promotion is not allowed on Fabulari.',
      createdAt: ago(60 * 24 * 3), reviewedAt: ago(60 * 24 * 2),
    },
    {
      groupName: 'Photography', groupDescription: 'Share shots, swap tips, weekly photo prompts.', minAge: 13, themeColor: 'light',
      creatorUserName: 'casey', creatorEmail: 'casey@demo.com',
      status: 'pending', createdAt: ago(90),
    },
    {
      groupName: 'Chess Club', groupDescription: 'Daily puzzles, friendly blitz games and opening prep.', minAge: 13, themeColor: 'light',
      creatorUserName: 'noah', creatorEmail: 'noah@demo.com',
      status: 'pending', createdAt: ago(40),
    },
  ]);

  await db.collection('joinRequests').insertMany([
    { groupName: 'Book Club', username: 'casey', status: 'pending', createdAt: ago(45) },
    { groupName: 'Book Club', username: 'morgan', status: 'pending', createdAt: ago(25) },
    { groupName: 'Study Buddies', username: 'taylor', status: 'pending', createdAt: ago(30) },
    { groupName: 'Night Owls', username: 'jordan', status: 'approved', createdAt: ago(60 * 24 * 4), reviewedAt: ago(60 * 24 * 4 - 30) },
  ]);
  // jordan's approved join above: keep membership consistent with it
  await db.collection('groups').updateOne({ groupName: 'Night Owls' }, { $addToSet: { members: 'jordan' } });

  await db.collection('roomRequests').insertMany([
    { groupName: 'Book Club', roomName: 'Mystery', username: 'taylor', status: 'pending', createdAt: ago(20) },
  ]);

  await db.collection('groupDeletionRequests').insertMany([
    {
      groupName: 'Night Owls', requestedBy: 'taylor', requestedByRole: 'user',
      reason: 'Most of us moved to Study Buddies, this group is quiet now.',
      status: 'pending', createdAt: ago(15),
    },
  ]);

  await db.collection('auditLogs').insertMany([
    ...groups.map((g, i) => ({ timeStamp: ago(60 * 24 * (30 - 2 * i)), actionPerformed: 'Accepted Group Creation', target: g.groupName, performedBy: 'sam' })),
    { timeStamp: ago(60 * 24 * 2), actionPerformed: 'Rejected Group Creation', target: 'Crypto Signals', performedBy: 'sam' },
  ]);

  const conversations: [string, string, [string, string][]][] = [
    ['Book Club', 'Main Room', [
      ['alex', 'Welcome to Book Club! This month we are reading "Piranesi".'],
      ['taylor', 'Just got my copy, the first chapter is so strange (in a good way)'],
      ['jordan', 'I am 80 pages in. No spoilers please 🙏'],
      ['riley', 'Can we do a fantasy pick next month?'],
      ['alex', 'Yes! Drop suggestions in the Fantasy room and we will vote on Friday.'],
      ['taylor', 'Meeting is Sunday 7pm as usual?'],
    ]],
    ['Book Club', 'Fantasy', [
      ['riley', 'My vote: "The Name of the Wind"'],
      ['jordan', 'Seconding that, or "Mistborn"'],
      ['taylor', 'Mistborn has the best magic system, fight me'],
    ]],
    ['Study Buddies', 'Main Room', [
      ['jordan', 'Pomodoro session at 8? 25 min on, 5 off.'],
      ['casey', 'In. Bringing my stats homework'],
      ['alex', 'Count me in for the second half'],
    ]],
    ['Study Buddies', 'Exam Prep', [
      ['casey', 'Does anyone have notes for week 6?'],
      ['jordan', 'Uploading them tonight!'],
    ]],
    ['Plant Parents', 'Main Room', [
      ['casey', 'My monstera finally grew a split leaf!!'],
      ['riley', 'Photo or it did not happen 🌿'],
    ]],
    ['Gamers Guild', 'Main Room', [
      ['devon', 'Raid tonight at 9, who is in?'],
      ['quinn', 'Me! Bringing snacks (virtually)'],
      ['jamie', 'I will be 10 min late, start without me'],
    ]],
    ['Coding Corner', 'Help Desk', [
      ['morgan', 'Why does my Angular signal not update the view? 😭'],
      ['avery', 'Are you mutating the array instead of calling set() with a new one?'],
      ['morgan', '...yes. Thank you!!'],
    ]],
    ['Movie Nights', 'Main Room', [
      ['mia', 'This Friday: Spirited Away. Vote for next week in Reviews!'],
      ['skylar', 'Bringing popcorn 🍿'],
    ]],
    ['Fitness Crew', 'Running', [
      ['noah', 'New 5k PB this morning: 23:41'],
      ['morgan', 'Huge! I am still stuck at 27 min'],
    ]],
    ['Foodies', 'Recipes', [
      ['skylar', 'Tried the one-pan lemon pasta, 10/10 would recommend'],
      ['casey', 'Recipe please!'],
    ]],
    ['Music Makers', 'Feedback', [
      ['quinn', 'Uploaded a new lo-fi beat, honest feedback welcome'],
      ['devon', 'The bass line is really nice. Maybe lower the hi-hats a bit?'],
    ]],
    ['Language Exchange', 'Español', [
      ['jamie', '¡Hola a todos! ¿Qué tal vuestro fin de semana?'],
      ['mia', 'Muy bien, gracias. Fui a la playa 🏖️'],
    ]],
    ['Night Owls', 'Main Room', [
      ['taylor', 'Anyone else up? Coffee number three...'],
      ['alex', 'Always. Working on my side project.'],
    ]],
  ];
  const messages = conversations.flatMap(([groupName, roomName, lines]) =>
    lines.map(([senderUserName, content], i) => ({
      _id: new ObjectId(),
      groupName, roomName, senderUserName, content, imageUrl: null,
      timestamp: ago((lines.length - i) * 7 + 3),
    })),
  );
  await db.collection('messages').insertMany(messages);
}
