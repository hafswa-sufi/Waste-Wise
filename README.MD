# WasteWise 🥬

A web-based food waste tracking system built for Kenyan households.

## The Problem

Kenya wastes an estimated **5.2 million tonnes of food annually** at the household level — costing households roughly **KES 72 billion a year** — despite ranking 90th out of 125 countries on the Global Hunger Index. Much of this comes down to two things: households losing track of what's already in their pantry, and confusion around date labels like "best by" and "sell by" on packaged goods.

Existing solutions don't fill this gap well:
- **NoWaste** and **Kitche** rely on barcode scanning, which doesn't work for the unlabelled produce most Kenyan households buy at open markets.
- **Msossi**, a Kenyan solution, addresses food waste at the business-to-consumer level but doesn't offer household pantry management or expiry tracking.

WasteWise was built to address that gap directly.

## What It Does

- **Pantry tracking** — households log what they have and when they bought it.
- **Expiry alerts** — notifications before food goes to waste.
- **Freshness estimation** — a rule-based model estimates the shelf life of produce using details like type, storage method, and purchase date (built for produce without printed expiry dates, which is most open-market produce in Kenya).
- **Donation/disposal suggestions** — connecting surplus food to local NGOs and recycling partners.

## Tech Stack

- **Frontend:** React.js
- **Backend:** Firebase (authentication, database, storage)
- Built under the **Scrum framework**

## Impact

WasteWise aims to reduce preventable household food waste, create pathways for surplus food redistribution to food-insecure communities, and contribute to Kenya's progress toward **SDG 12.3** (halving food waste by 2030). The system was evaluated through functional and usability testing with representative users from Kenyan residential estates and apartment complexes.

## About This Project

WasteWise was built as a 3rd-year Informatics and Computer Science project at Strathmore University's School of Computing and Engineering Sciences (SCES), under the supervision of Mr. Emmanuel Olang'.

**Team:** Hafswa Sufi & Shifla Karani

## Future Enhancements

- **Mobile app** — extend the system into a mobile app for easier household use on smartphones.
- **Improved freshness estimation** — incorporate local food storage data or machine learning to improve accuracy beyond the current rule-based approach.
- **Route optimization** — optimize collection routes for NGO and recycling partners, enabling pickup from multiple households in a single trip, with map integration.
- **Impact reporting** — generate reports tracking how much food was consumed vs. collected/donated by each household.
- **End-to-end tracking** — allow households and partners to track food items from pantry to collection point.
- **NLP-based scanning** — explore natural language processing for scanning and identifying fresh food items.

## Getting Started

> Setup steps below are a standard Vite + React + Firebase starting point — update with your actual environment/config details.

```bash
# Clone the repo
git clone https://github.com/hafswa-sufi/Waste-Wise.git
cd Waste-Wise

# Install dependencies
npm install

# Add your Firebase config
# Create a .env file with your Firebase project credentials

# Run the dev server
npm run dev
```
