
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const readline = require('readline');
const { readDB, writeDB } = require('./config/jsonDB');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  const name = (await ask('Admin name: ')).trim();
  const email = (await ask('Admin email: ')).trim().toLowerCase();
  const password = await ask('Choose admin password: ');

  if (!name || !email || password.length < 8) {
    throw new Error(
      'Name and email are required. Password must be at least 8 characters.'
    );
  }

  const db = await readDB();

  if (db.users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error('This email already exists in the database.');
  }

  const now = new Date().toISOString();

  const admin = {
    _id: randomUUID(),
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: 'admin',
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  db.users.push(admin);
  await writeDB(db);

  console.log('\nAdmin account created successfully!');
  console.log('Email:', email);
  console.log('Role: admin');
  console.log('Your password is not stored as plain text.');
}

main()
  .catch((error) => {
    console.error('\nCould not create admin:', error.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
