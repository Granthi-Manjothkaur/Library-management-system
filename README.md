# Library Management System

A full-stack web application that helps a college librarian manage books, students, book issuing, returns, fines and reports. Students can log in to browse the catalogue and see their own borrowed books and fines.

**Stack:** React (Vite) · Bootstrap 5 · Lucide icons · Node.js · Express · MongoDB (Mongoose) · JWT · bcrypt (bcryptjs)

---

## 1. How it works (architecture)

```
Browser (React app, port 5173)
        │   HTTP requests to /api/...  (with a JWT token)
        ▼
Express server (port 5000)  ──►  MongoDB database (port 27017)
   routes → middleware → controllers → models
```

- **Frontend (React)** shows the pages and sends requests to the API.
- **Backend (Express)** checks the login token, validates the data, applies the library rules and talks to the database.
- **MongoDB** stores users, books and issue records permanently.
- In development, Vite forwards every `/api` request to the backend, so you do not need to worry about CORS.

### Database collections

| Collection | Purpose | Key fields |
|---|---|---|
| `users` | Admins **and** students (the `role` field decides) | name, email, password (hashed), role, studentId, phone, department, isActive |
| `books` | Library catalogue | title, author, isbn (unique), category, publisher, publicationYear, description, totalCopies, availableCopies, coverImage |
| `issues` | One record per borrowed book | student (ref), book (ref), issueDate, dueDate, returnDate, status, fine |

A separate students collection is not needed: students are users with `role: "student"`.

### How book availability stays correct

- **Issue:** the available count is decreased with one atomic MongoDB update that only succeeds if a copy is available. If saving the issue record then fails, the count is put back.
- **Return:** the record is switched from `issued` to `returned` with an atomic update that only matches records still `issued`, so the same book can never be returned twice. If increasing the count fails, the record is restored.
- A unique partial index stops a student from holding the same book twice at the same time.
- (MongoDB multi-document transactions need a replica set, which a normal local install does not have, so atomic updates plus rollback are used instead. This works on any MongoDB setup.)

---

## 2. Software you need (Windows)

1. **Node.js 18 or newer (LTS)** – https://nodejs.org (check with `node -v`)
2. **MongoDB Community Server** – https://www.mongodb.com/try/download/community  
   During install keep "Install MongoDB as a Service" ticked. It then runs automatically on `mongodb://127.0.0.1:27017`.  
   *Alternative:* a free MongoDB Atlas cloud database (copy its connection string into `MONGO_URI`).
3. **VS Code** – https://code.visualstudio.com
4. (Optional) **MongoDB Compass** to look at your data visually.

---

## 3. Folder structure

```
library-management-system/
├── README.md
├── backend/
│   ├── server.js                 # starts Express
│   ├── package.json
│   ├── .env.example              # copy to .env
│   ├── config/db.js              # MongoDB connection
│   ├── models/                   # User.js, Book.js, Issue.js
│   ├── middleware/               # auth.js (JWT + roles), validate.js, error.js
│   ├── controllers/              # auth, book, student, issue, dashboard, report
│   ├── routes/                   # one file per resource
│   ├── utils/                    # helpers.js (fine maths), asyncHandler.js
│   └── seed/seed.js              # demo data (separate from the app)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js            # dev server + /api proxy
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── services/api.js       # axios + token handling
        ├── context/              # AuthContext.jsx, ToastContext.jsx
        ├── utils/                # format.js, csv.js
        ├── components/           # Sidebar, Navbar, Layout, Modal, ConfirmDialog,
        │                         # DataTable, StatCard, SearchInput, Loader, EmptyState,
        │                         # BookForm, StudentForm, IssueTable, StatusBadge, ProtectedRoute
        └── pages/                # Login, Dashboard, Books, Students, IssueBook,
                                  # ReturnBook, Records, Reports,
                                  # StudentDashboard, BrowseBooks, MyBooks
```

---

## 4. Setup and run (VS Code + Windows)

Open the `library-management-system` folder in VS Code and use **Terminal → New Terminal**. You need **two terminals**: one for the backend, one for the frontend.

### Backend (terminal 1)

```bash
cd backend
npm install
copy .env.example .env
```

Open `backend/.env` and set:

- `JWT_SECRET` → a long random text. Generate one with:  
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `MONGO_URI` → leave as is for local MongoDB, or paste your Atlas string.
- The `SEED_*` values → the demo login passwords you want.

Load the demo data (this **erases** existing data, run it only once at the start):

```bash
npm run seed
```

Start the server:

```bash
npm run dev
```

You should see `MongoDB connected` and `Server running on http://localhost:5000`.  
Quick check: open http://localhost:5000/api/health in your browser.

### Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

### Demo accounts (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin (librarian) | value of `SEED_ADMIN_EMAIL` (default `admin@library.com`) | value of `SEED_ADMIN_PASSWORD` |
| Student | `aarav@student.edu` (also priya@, rohan@, sneha@, karthik@ `student.edu`) | value of `SEED_STUDENT_PASSWORD` |

Passwords live only in your own `.env` file, never in the source code.

---

## 5. Features

**Authentication:** JWT login, hashed passwords, admin/student roles, protected routes, logout, form validation.  
**Dashboard:** total books, available copies, issued, students, overdue, recent books, recent activity (all from the database).  
**Books:** add, edit, delete, search (title/author/ISBN/category), filter by category and availability, duplicate-ISBN protection, cover image or placeholder.  
**Students:** add, edit, deactivate/activate, delete (only without history), search by name/ID/email.  
**Issue:** pick student and book, due date set automatically (14 days), unavailable/duplicate issues blocked, max 5 active books per student.  
**Return:** one click return, availability restored, overdue flag, fine = days late × ₹5, double return blocked.  
**Records:** full history with search, status filter, date range, CSV export.  
**Reports:** inventory, overdue books, most borrowed, student history, date filters, CSV export.  
**Student portal:** dashboard, browse and search books, book details, current loans with due dates and fines, full history.

Library rules are set in `backend/.env`: `BORROW_DAYS=14`, `FINE_PER_DAY=5`, `MAX_ACTIVE_ISSUES=5`.

---

## 6. API summary

| Method & path | Who | What |
|---|---|---|
| POST `/api/auth/login` | public | Log in, returns token |
| GET `/api/auth/me` | any user | Current user |
| GET `/api/books`, `/api/books/categories`, `/api/books/:id` | any user | Browse |
| POST/PUT/DELETE `/api/books` | admin | Manage books |
| GET/POST/PUT/PATCH/DELETE `/api/students` | admin | Manage students |
| POST `/api/issues` | admin | Issue a book |
| PUT `/api/issues/:id/return` | admin | Return a book |
| GET `/api/issues` | admin | All records (filters: status, q, from, to) |
| GET `/api/issues/mine` | student | Own records |
| GET `/api/dashboard/admin`, `/api/dashboard/student` | admin / student | Statistics |
| GET `/api/reports/books`, `overdue`, `most-borrowed`, `activity`, `student-history/:id` | admin | Reports |

---

## 7. How to test every feature

1. **Login:** wrong password shows an error; admin lands on Dashboard, student lands on My Dashboard.
2. **Role protection:** log in as a student and open `/students` in the address bar → you are redirected away.
3. **Books:** add a book; try the same ISBN again (error); edit it; search; filter; delete it.
4. **Students:** add a student; edit; deactivate (they can no longer log in); activate again.
5. **Issue:** issue a book to a student. Dashboard "Issued" goes up and the book's available copies go down. Try issuing the same book to the same student again (blocked). Issue all copies of a book, then try once more (blocked).
6. **Return:** return a book from *Return Book*. Available copies go up. The seed data already contains overdue books so you can see the fine (₹5 per day late).
7. **Records:** filter by Overdue/Returned, pick dates, export CSV.
8. **Reports:** open each tab, use date filters, export CSV.
9. **Student portal:** log in as a student, browse and search books, open book details, check My Books (due dates, fines, history).
10. **Persistence:** stop both servers, start them again; all data is still there.

---

## 8. Troubleshooting

- **`MongoDB connection failed`** – MongoDB is not running. On Windows press `Win+R`, type `services.msc`, start "MongoDB Server". Or fix `MONGO_URI`.
- **`JWT_SECRET is missing`** – you did not create `backend/.env` from `.env.example`.
- **Frontend shows "Cannot reach the server"** – start the backend first (`npm run dev` in `backend`).
- **Port already in use** – change `PORT` in `.env` and the proxy target in `frontend/vite.config.js`.
- **`npm install` errors on Windows** – this project uses `bcryptjs` (pure JavaScript), so no C++ build tools are needed.
- **Book cover images do not show** – the seed data uses Open Library cover links and needs internet; a placeholder is shown otherwise.

---

## 9. Screenshots to add

Add your screenshots to a `screenshots/` folder and link them here before submitting:

- Login page
- Admin dashboard
- Books page (and Add Book form)
- Students page
- Issue Book page
- Return Book / Records page (showing a fine)
- Reports page
- Student dashboard and Browse Books

---

## 10. Viva cheat-sheet

- **Why JWT?** The server stays stateless: each request carries a signed token that proves who the user is and their role.
- **Why hash passwords?** If the database leaks, real passwords stay hidden. bcrypt is slow on purpose and adds a random salt.
- **How are roles enforced?** `protect` middleware verifies the token; `authorize('admin')` rejects other roles on the server. Hiding menu items in React is only for convenience.
- **How do you prevent wrong stock counts?** Atomic `$inc` updates with conditions, plus rollback if saving fails.
- **How is the fine calculated?** `ceil(days past due date) × FINE_PER_DAY`; stored permanently when the book is returned.
- **Why one `users` collection?** Admins and students share login fields; extra student fields are optional.

---

*Project description for your report:* The Library Management System digitises everyday library work. It replaces paper registers with a secure web application where the librarian manages the catalogue and members, issues and receives books with automatic due dates and fines, and views reports, while students can check availability and their own loans online.
