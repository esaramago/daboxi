# Daboxi
A personal finance app


# Setup
## Dependencies
- [Node.js](https://nodejs.org/en/download/)
- NPM (Comes with Node.js)
- [Appwrite CLI](https://appwrite.io/docs/tooling/command-line/installation#getting-started) (optional)

## Installation
1. Install dependencies
2. Copy .env.example to .env and fill in the values
3. Run `npm install`

# Appwrite (optional)
## Setup
See [Appwrite CLI Installation](https://appwrite.io/docs/tooling/command-line/installation#getting-started) for more information.
1. Install Appwrite CLI by running `npm install -g appwrite-cli`
2. Login to Appwrite by running `appwrite login --endpoint "YOUR_APPWRITE_ENDPOINT"`

## Push tables to Appwrite
1. Run `appwrite push tables` to push the tables to the project

## Bring tables from Appwrite to local (if you don't have appwrite.config.json already)
1. Run `appwrite init` to create a file `appwrite.config.json` with the project ID and endpoint
2. Run `appwrite pull tables` to pull the tables from the project
3. Run `appwrite types --language ts ./` to generate the types for the project