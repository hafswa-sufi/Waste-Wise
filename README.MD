# 🌿 WasteWise — Food Waste Tracking System for Kenyan Households

WasteWise is a web-based food waste tracking system built specifically for Kenyan households. It helps users monitor their pantry, receive expiry alerts, estimate the freshness of farm produce, and connect surplus food to local NGOs and recycling companies.

---

## 🇰🇪 Why WasteWise?

Kenya wastes approximately 5.2 million tonnes of food annually at the household level, costing households an estimated KES 128 billion each year — while 1 in 4 Kenyans face food insecurity. Existing food waste apps like CozZo, Kitche, and NoWaste were built for Western markets and rely on barcode scanning, which doesn't work for the unlabelled fresh produce most Kenyan households buy from open-air markets.

WasteWise is designed from the ground up for the Kenyan context.

---

## ✨ Features

### 🏠 Household Users
- **Pantry Management** — Add, edit, delete and track food items with full CRUD functionality
- **Expiry Alerts** — In-app and email notifications when items are approaching their expiry date
- **Freshness Estimation** — Rule-based shelf life classification (Fresh / Mid-Fresh / Spoiled) for farm produce like sukuma wiki and tomatoes that carry no printed expiry dates
- **Donate & Dispose** — Flag surplus food for donation to NGOs or disposal via recycling companies

### 🤝 NGO & Recycling Company Partners
- Map dashboard showing households with flagged surplus food or disposal requests
- Uber-style pickup request cards with accept/decline functionality
- Coordinated pickup scheduling across households in the same estate or apartment complex

### 🔐 Admin
- Review and approve/reject NGO and recycling company registrations
- Cross-reference submitted registration certificates against Kenyan government registries

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + TypeScript (TSX) |
| Routing | React Router DOM |
| Styling | Tailwind CSS |
| Backend | Node.js + Express.js |
| Database & Auth | Firebase (Firestore + Firebase Auth) |
| API Testing | Postman |
| IDE | Visual Studio Code |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or above)
- npm or yarn
- A Firebase project with Firestore and Authentication enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/wastewise.git

# Navigate into the project
cd wastewise

# Install dependencies
npm install
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Firestore Database** and **Authentication** (Email/Password)
3. Copy your Firebase config and create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Running the App

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔧 Backend Setup

The backend is built with Node.js and Express.js and runs as a separate server.

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start the backend server
npm start
```

The backend runs on `http://localhost:5000` by default.

---

## 🥬 Freshness Estimation Logic

For fresh produce without printed expiry dates (e.g. sukuma wiki, tomatoes, onions), WasteWise uses a rule-based estimation model. The system classifies produce as **Fresh**, **Mid-Fresh**, or **Spoiled** based on:

- **Item type** — different produce has different natural shelf lives
- **Storage method** — fridge, counter, or basket
- **Purchase date** — days elapsed since purchase

Example rule:
```
IF item = "tomatoes" AND storage = "counter" AND days_since_purchase > 3
THEN classification = "Mid-Fresh"
```

No machine learning or image scanning is required.

---

## 👥 User Roles

| Role | Access |
|---|---|
| Household User | Pantry management, expiry alerts, freshness estimation, donate/dispose |
| NGO Representative | Map dashboard, pickup requests, confirmed pickups |
| Recycling Company | Map dashboard, disposal requests, confirmed disposals |
| Admin | Partner registration approvals, document review |

---

## 🧪 Testing

API endpoints are tested using Postman. Functional and usability testing is carried out against defined requirements with representative users from Kenyan residential estates.

---

## 🎯 SDG Alignment

WasteWise directly contributes to **UN SDG 12.3**, which calls for halving per capita food waste at the retail and consumer level by 2030.

---

## 👩‍💻 Authors

- **Hafsa** — Strathmore University, ICS Year 3
- **Shifla** — Strathmore University, ICS Year 3

Supervised by **Mr. Emmanuel Olang'**, Strathmore University

---

## 📄 License

This project was developed as an academic project at Strathmore University. All rights reserved.