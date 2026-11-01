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

export async function seedDemoData(db: MiniDb) {
  const ages: Record<string, number> = { sam: 31, alex: 24, jordan: 21, taylor: 27, casey: 19, riley: 15 };

  await db.collection('users').insertMany(
    DEMO_ACCOUNTS.map((a) => ({
      username: a.username,
      email: a.email,
      password: 'demo$' + DEMO_PASSWORD, // matches the demo bcrypt shim
      dob: dobForAge(ages[a.username]),
      age: ages[a.username],
      role: a.username === 'sam' ? 'super-admin' : 'user',
      valid: true,
      isDarkMode: a.username === 'jordan',
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
  ];
  await db.collection('groups').insertMany(groups.map((g) => ({ ...g, bannedMembers: [] })));

  // The approved requests that created those groups, so history pages have content.
  await db.collection('groupRequests').insertMany([
    ...groups.map((g, i) => ({
      groupName: g.groupName, groupDescription: g.groupDescription, minAge: g.minAge, themeColor: g.themeColor,
      creatorUserName: g.admins[0], creatorEmail: `${g.admins[0]}@demo.com`,
      status: 'approved', createdAt: ago(60 * 24 * (9 - i)), reviewedAt: ago(60 * 24 * (8 - i)),
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
  ]);

  await db.collection('joinRequests').insertMany([
    { groupName: 'Book Club', username: 'casey', status: 'pending', createdAt: ago(45) },
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
    ...groups.map((g, i) => ({ timeStamp: ago(60 * 24 * (8 - i)), actionPerformed: 'Accepted Group Creation', target: g.groupName, performedBy: 'sam' })),
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
