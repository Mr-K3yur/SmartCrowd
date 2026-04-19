# SmartCrowd: Next-Generation Queue and Density Management

SmartCrowd is a real-time queue and density management system designed to optimize guest flow and safety in massive scale venues. 

## Chosen Vertical
**Large Scale Venues & Stadiums** (Sports arenas, Concert halls, Festivals, Conventions)
Managing large crowds efficiently is critical for both the guest experience and venue safety. SmartCrowd solves the problem of overcrowding, long wait times, and unsafe congestion by providing real-time telemetry and dynamic wayfinding for visitors, while giving administrators powerful tools to manage the flow of the crowd.

## Approach and Logic
Our approach focuses on real-time data synchronization and intelligent routing:
- **Real-Time Data:** Leveraging **Firebase Firestore**, SmartCrowd maintains live, sub-second updates of crowd densities across different venue zones and wait times at various queues (like concessions or restrooms).
- **Dynamic Wayfinding Engine:** The app uses a custom routing algorithm to calculate the best path between two points in the venue. It factorizes the real-time crowd density of the zones along the path to offer alternative routes if the primary route is heavily congested.
- **AI-Powered Emergency Broadcasting:** Integrating with the **Google Gemini API**, administrators can generate rapid, accurate, and context-aware emergency broadcast alerts based on brief incident descriptions. 
- **Role-Based Access Control:** The platform is separated into a "Guest View" for visitors to navigate the venue and an "Admin Dashboard" for venue operators to manage the data and alerts.

## How the Solution Works
### For Guests (Visitors)
1. **Live Venue Overview:** Guests can view the current density of different zones (Low, Medium, High, Critical) and the estimated wait times at various queues.
2. **Dynamic Wayfinding:** Guests input their current location and destination. The system provides a primary route and an estimated time of arrival. If a route goes through a "Critical" density zone, it automatically flags the delay and suggests an alternative, less congested path.
3. **Real-time Alerts:** Guests receive push-like venue announcements and emergency alerts directly on their dashboard.

### For Administrators
1. **Density & Queue Management:** Admins can manually update crowd percentages and queue lengths (simulating data that would normally come from physical IoT sensors or turnstiles).
2. **AI Emergency Alerts:** In the event of an incident, an admin can type a brief scenario (e.g., "Fire near Gate A"). The Gemini API instantly generates a formal, standardized emergency broadcast message which can then be pushed to all active users.
3. **Venue Control:** Admins can send standard venue announcements (info, warning) to direct crowds.

## Assumptions Made
- **IoT/Sensor Integration in Production:** Currently, the crowd density and queue lengths are simulated/updated manually by an administrator. In a real-world deployment, this data would be fed continuously via APIs from physical turnstiles, cameras, or WiFi/Bluetooth triangulation sensors.
- **Firebase Setup:** It is assumed that the Firebase project is correctly configured with Authentication (Email/Password enabled) and Firestore Database, and the client credentials are provided in the environment.
- **Gemini API:** The AI generation features assume a valid Google Gemini API key (`VITE_GEMINI_API_KEY`) is present in the `.env.local` file.
- **Venue Topography:** The routing engine uses a predefined node graph of the venue (Gates and Sectors). For different venues, this node map needs to be mathematically mapped out in the codebase.

## Run Locally
**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `VITE_GEMINI_API_KEY` in `.env.local` to your Google Gemini API key.
3. Run the application:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:3000`. You can use the built-in demo credentials for both Guest and Admin roles.
