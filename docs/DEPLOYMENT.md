# Deployment Guide

This guide details the steps required to build and deploy the Seashell applications (Menu App and Management App).

## Prerequisites

- Node.js and npm installed
- Firebase CLI installed and logged in (`firebase login`)
- PowerShell (for the preparation script)

## 1. Build the Applications

You need to build both applications before deploying.

### Menu App
Navigate to the Menu App directory and run the build command:

```powershell
cd Seashell-Menu-App
npm run build
```

### Management App
Navigate to the Management App directory and run the build command:

```powershell
cd Seashell-Management-App
npm run build
```

## 2. Prepare for Deployment

Run the preparation script from the **root directory** (`Seashell`). This script copies the built assets from both applications into the `public` directory that Firebase uses for hosting.

```powershell
powershell -ExecutionPolicy Bypass -File prepare_deploy.ps1
```

## 3. Deploy to Firebase

Finally, deploy the hosted files to Firebase from the **root directory**:

```powershell
firebase deploy
```

## Summary of Commands

For convenience, here is the full sequence of commands to run from the project root:

```powershell
# 1. Build Menu App
cd Seashell-Menu-App
npm run build
cd ..

# 2. Build Management App
cd Seashell-Management-App
npm run build
cd ..

# 3. Prepare Assets
powershell -ExecutionPolicy Bypass -File prepare_deploy.ps1

# 4. Deploy
firebase deploy
```
