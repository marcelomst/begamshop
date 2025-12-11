# Firebase Emulators portable container
# Base Node aligned with Functions engine
FROM node:20-bullseye

# Install Java runtime needed by Firestore emulator
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-17-jre-headless && rm -rf /var/lib/apt/lists/*# Install Firebase CLI
RUN npm i -g firebase-tools

# Work in mounted workspace
WORKDIR /workspace

# Default command starts all emulators using firebase.json config
CMD ["firebase", "emulators:start", "--import", "/workspace/emulator-data", "--export-on-exit", "/workspace/emulator-data"]
