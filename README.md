# Welcome to Dinder!
👥 Team: Sagar Sahu, Paul Kratsios, Brendan Capuzzo, Ryan Hong, Russell Chao

This documentation is meant to guide first-time and returning users set up the Dinder application on their local machine, run the app on localhost through their web browser, navigate through the interface, interact with its features, and troubleshoot any potential issues. Whether you're new to this or just need a quick refresher, this guide covers all aspects of the product.

# Swipe. Match. Eat. It's that simple.

Dinder is a web app solution that offers an interactive interface to help friend groups discover dining and restauraunt matchmaking selection. This application takes inspiration from Tinder, a popular dating and matchmaking platform. The app integrates several APIs such as Google and Yelp in order to web-scrape and fetch data from nearby restaurants. Group members can join a session that will help them mutually decide on a place to eat. Each group member will have the opportunity to select preferences, including cuisine, price range, and distance. The app provides a fun experience by allowing each user to swipe left or right based on their liking to a restaurant choice. Ultimately, no one should be stuck with the question, "Where do you want to eat?".

# System Requirements

🛠️ To run this application, the following operating systems are required: Windows 11 (for Windows users), or the latest version of MacOS (Sequoia 15.1.1 for Apple users), which supports both Intel and Apple Silicon processors. Additionally, this app works best on the latest web browser version of Google Chrome.

Note: It is recommended to try the application out on a Windows desktop, as we are looking into issues for MacOS users (both Intel and M1+ Silicon) involving dependency and middleware errors with CORS. In the meantime, we've concluded, as a workaround, to follow the below steps for Mac and Windows devices.

# Installation Steps

In this repository, you will find the entire codebase for Dinder. Our application is divided into a backend and frontend folder, which each operate asynchronously for various functions. You may choose to install the app with a variety of options, highlighted below. On Windows:

## To fork and clone this repository onto your local machine,

1. On the GitHub website, navigate to the main menu of the repo and locate the green `<> Code` button in the top right. Clicking this will allow you to clone the repo using the web URL or the GitHub CLI.

2. In the command-line terminal, enter `git clone`, followed by the path to the repository, or the designated CLI command.

3. Open the folder of the repository in your preferred IDE (such as Visual Studio Code, Sublime, XCode). Navigate to the root directory using the `cd _` command.

## To download a ZIP file to your device,

1. On the GitHub website, navigate to the main menu of the repo and locate the green `<> Code` button in the top right. Clicking this will present the option to download a .zip file of the repository, which can be downloaded into your specified directory.

2. Alternatively, you can access the Releases menu by navigating to the `Releases` tab on the sidebar and selecting the version you would like to see (v1.0.0-final for the Final Release executable).

### For MacOS users, you will need a Windows emulator (Parallels or UTM Virtual) for Silicon Macs, or the native Boot Camp assistant feature for Intel Macs which can extend desktops to include a Windows virtual machine.

Once you navigate to the repsository link in a Windows environment, follow the above steps for installation and continue to see how to set up the interface.

# Setting up the Application

There are 2 main components in this repository, a backend handling server-side functions and API routing, and a frontend handling the web client and UI application. For more specific details regarding each, navigate to the `frontend` or `backend` folders and examine the corresponding README files for information regarding dependencies, structure, and environment setup.

Once you have opened the repository in your IDE, follow these steps:

1. Open a brand new terminal, navigate to the backend using `cd backend`, name the terminal 'backend', and install the latest versions of the backend dependencies:

   a. For Node.js, run `npm install node` and `npm install nodemon`.

   b. For Express.js, create an Express app by running `npm install express`.

   c. For Socket.io, run `npm install socket`.

   d. For MongoDB, run `npm install mongoose`.
   
2. In the `backend` terminal, run `node server.js` and `npm start` to launch the backend and connect to the database.

3. Open another new terminal, navigate to the frontend by running `cd frontend`, name the terminal 'frontend', and install the latest version of the frontend dependencies:

   a. For React.js, run `npm install -g create-react-app` and then create a React app with `npx create-react-app`.

4. In the `frontend` terminal, run `npm start` to view the web app on your localhost. The application should now be running on your browser.

Note: Each directory, 'backend' and 'frontend', should contain a `.env` file. The backend .env should have a Google Places API key, a MongoDB URI, and a port designation. The frontend .env should have a URL to the localhost and a port number designation. More on this can be found in the backend and frontend README files.

# Quick Start Guide

⌛️ When first running the application, you will be presented with a homepage containing sections to get started, learn more about the team, contact us by filling out a message ticket, and explore the core features of Dinder. These can be easily navigated with the toolbar at the bottom of the window, with buttons to direct you to each section. There is also a button to return to the top of the page, and clicking the Dinder logo button in the top left of any webpage will redirect you back to the homepage.

## Creating a Session as a Host

Click `Get Started`. For a host who wants to create a brand new session, click `Start a Group Session`. A unique 4-digit code will be generated, with the option to copy and send a URL link as well as the code itself to other users. The host can input their preferences by clicking `Select Preferences` and entering constraints for Cuisine, Price, Rating, and Distance/Location in the popup menu.

Note that a session will have 0 participants by default, and as a host, you must enter/save your preferences before starting a session. All fields must be entered before clicking `Save Preferences`, otherwise a warning will show up. On the startup menu, a queue of current participants in the session can be viewed. Click `Start Session` to begin!

## Joining a Session as a Guest

For a guest who wants to join a created session, click `Join a Group Session`. Similarly, enter your preferences for Cuisine, Price, Rating, and Distance/Location. Input your name and the 4-digit invite code provided by the host and click `Save Preferences`. You will be redirected to the startup menu, and your name should appear in the queue of participants.

Note: Since we are basing this application on localhost rather than a global domain URL, you will need to open a new window in the browser as a unique user and navigate to the Dinder web app with the invite link URL, e.g. `http://localhost:3001/preferences-join?code=XXXX`.

## Happy Swiping!

Every user in the session will receive 20 of the top dining choices, determined by our intelligent ranking algorithm, which factors each individual's unique preferences and gauges the match similarity based on these inputs. A restaurant card presented contains detailed information, such as:

- Restaurant name
- Rating
- Price
- Cuisine
- Distance from current location
- Building hours

If you agree with a choice presented, use the mouse cursor to drag the card right, or press the green 'check' icon at the bottom. If you do not agree with a choice presented, use the mouse cursor to drag the card left, or press the red 'X' icon at the bottom. Continue with this process until you have seen all 20 presented cards.

## Results

If a unanimous vote is reached and, for all users, a single restaurant is chosen, a results screen will indicate that a perfect match has been found. Congratulations!

If a perfect match is not found, the topmost results, generated by the ranking algorithm, will be presented.

If no match is found at all, you will recieve a message indicating that no restaurant option received more than 50% of the group's votes.

# Links

GitHub- https://github.com/sagars2004/Dinder

Jira- https://dinder.atlassian.net/jira/software/projects/SCRUM/list

MongoDB- https://cloud.mongodb.com/v2/6707194df3931c7b952c5be3#/clusters

Google Places API- https://developers.google.com/maps/documentation/places/web-service/overview

Yelp API- https://docs.developer.yelp.com/docs/fusion-intro

# Troubleshooting

‼️ If you encounter any bugs or issues in your experience, double check the spelling of your commands and consider force-quitting the application by entering `^C` in both the backend and frontend terminals. Then restart the application, and ensure that all connections and dependencies are installed and working, as decribed above.

Please don't hesitate to reach out with additional concerns or comments. We value your feedback in making Dinder the best product for group dining indecision as possible.

### Thank you so much for choosing Dinder!


