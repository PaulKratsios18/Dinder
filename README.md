# Welcome to Dinder!
👥 Team: Sagar Sahu, Paul Kratsios, Brendan Capuzzo, Russell Chao, Ryan Hong

Dinder is a web app solution that offers an interactive interface to help friend groups discover dining and restauraunt matchmaking selection. This application takes inspiration from Tinder, a popular dating and matchmaking platform. The app integrates several APIs such as Google and Yelp in order to web-scrape and fetch data from nearby restaurants. Group members can join a session that will help them mutually decide on a place to eat. Each group member will have the opportunity to select preferences, including cuisine, price range, and distance. The app provides a fun experience by allowing each user to swipe left or right based on their liking to a restaurant choice. Ultimately, no one should be stuck with the question, “Where do you want to eat?”.

# Swipe. Match. Eat. It's that simple.

🛠️ To run this application, the following operating systems are required: Windows 11 (for Windows users), or the latest version of MacOS (Sequoia 15.1.1 for Apple users), which supports both Intel and Apple Silicon processors. Additionally, this app works best on the latest web browser version of Google Chrome.

# Installation & Setup

1. Clone this repository into your GitHub desktop application, or use the command terminal to clone using `git clone`.
2. Open the folder of the repository in your preferred IDE (e.g. Visual Studio Code). In the root directory, ensure all dependencies are installed.
3. Open a new terminal, run `cd backend`, name the terminal 'backend', and install the latest versions of Node, Express, and Socket for the backend components:

   a. For Node.js, run `npm install node` and `npm install nodemon`.

   b. For Express.js, create an Express app by running `npm install express`.

   c. For Socket.io, run `npm install socket`.
4. Open another new terminal, run `cd frontend`, name the terminal 'frontend', and install the latest version of React for the frontend components:

   a. For React.js, run `npm install -g create-react-app` and then create a React app with `npx create-react-app`.
5. In the `frontend` terminal, run `npm start` to view the web app on your localhost.

Note: Each directory, 'backend' and 'frontend', should contain a `.env` file. The backend .env should have a Google Places API key, a MongoDB URI, and a port designation. The frontend .env should have a URL to the localhost and a port number designation.

# Quick Start Guide

⌛️ When first running the application, you will be presented with a homepage containing prompts to get started, learn about the team, contact us, and explore the core features of Dinder.

Click `Get Started`. For a host who wants to create a brand new session, click `Start a Group Session`. A unique 4-digit code will be generated, with the option to copy and invite URL link as well as the code itself. The host can input their preferences by clicking `Select Preferences` and entering constraints for Cuisine, Price, Rating, and Distance/Location. All fields must be entered before clicking `Save Preferences`. On the startup menu, a queue of current participants in the session are shown. Click `Start Session` to begin!

For a guest who wants to join a created session, click `Join a Group Session`. Similarly, enter your preferences for Cuisine, Price, Rating, and Distance/Location. Input your name and the 4-digit invite code provided by the host and click `Save Preferences`. You will be redirected to the startup menu, and your name should appear in the queue of participants.

Happy swiping!

# Links

Google Places API- https://developers.google.com/maps/documentation/places/web-service/overview

Yelp API- https://docs.developer.yelp.com/docs/fusion-intro

# Troubleshooting

‼️ For some MacOS users, you may encounter an issue regarding 'CORS' when starting up the application, which is a dependency for Cross-Origin Resource Sharing middleware. To address this, try installing CORS by running `npm install cors`. 
