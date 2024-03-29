# 🚀 AI Assistant App for Rocket.Chat 🎨

## Description

This Rocket.Chat app provides an AI Assistant bot to help you understand the Rocket.Chat codebase. Built on top of Rocket.Chat's app framework, the bot leverages open-source LLMs (Large Language Models) from Hugging Face Inference APIs to answer your queries about the code's structure, logic, and workflows directly into the room

## How to Use the App

1. **Installation**:
   - Install the app on your Rocket.Chat server.
   
2. **Usage**:
   - Navigate to the dedicated AI Assistant room.
   - Ask any questions you have regarding the Rocket.Chat codebase.
   - The bot will promptly respond with relevant information.
   
3. **Customization**:
   - Modify app settings to change the language model (LLM) or view available LLMs.
   - Use commands provided within the app to customize settings.

## Local Setup Guide

To set up the AI Assistant bot locally, follow these steps:

1. **Prerequisites**:
   - Ensure you have a working Rocket.Chat server and Apps-Engine CLI installed on your machine. If not, set up the server [here](https://rocket.chat/docs/installation/docker-containers/) and CLI [here](https://github.com/RocketChat/Rocket.Chat.Apps-cli).

2. **Clone the Repository**:
   ```bash
   git clone https://github.com/<github_handle>/ai-assistant-bot.git
   ```
3. **Install Dependencies:**:
   ```bash
   npm install
   ```
4. **Deploy your app locally:**:
   ```bash
   rc-apps deploy --url http://localhost:3000 --username ${username} --password ${password}
   ```
   
   Your username and password are your local server's user credentials .Verify the successful build by accessing the /excalidraw endpoint in the Whiteboard app settings. You can access the React app through the provided URL.

