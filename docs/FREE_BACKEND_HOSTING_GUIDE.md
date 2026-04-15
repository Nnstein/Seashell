# 💸 Free Backend Hosting Guide (No Credit Card)

Since Firebase Functions requires a billing account, here are the two best **completely free** methods to host your `seashell-backend` and get a secure `https://` link.

---

## Option 1: Render.com (Easiest for Express) 🏆

Render is a cloud platform that lets you run Node.js web services for free.

**Pros**: Runs your `server.js` exactly as it is.
**Cons**: Server "sleeps" after 15 minutes of inactivity (taking ~30s to wake up on the next request).

### Steps:

1.  **Push your code to GitHub**:
    Make sure your `seashell` project is pushed to GitHub.

2.  **Sign up for Render**:
    Go to [dashboard.render.com](https://dashboard.render.com/) and log in with GitHub.

3.  **Create a Web Service**:
    - Click **New +** -> **Web Service**.
    - Connect your GitHub repository.
    - Select the `seashell` repo.

4.  **Configure the Service**:
    - **Name**: `seashell-backend`
    - **Root Directory**: `seashell-backend` (Important! This tells Render where your server files are).
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js`
    - **Instance Type**: Free

5.  **Environment Variables**:
    - Scroll down to "Environment Variables".
    - Add `AES_SECRET_KEY`: (Copy from your `.env.local`)
    - Add `IV_KEY`: (Copy from your `.env.local`)
    - Add `ACCESS_CODE`: (Copy from your `.env.local`)
    - Add `HESABE_MERCHANT_CODE`: (Copy from your `.env.local`)

6.  **Deploy**:
    Click **Create Web Service**.

Render will give you a URL like `https://seashell-backend.onrender.com`. Use this URL in your frontend `.env` file!

---

## Option 2: Vercel (Best for Performance) ⚡

Vercel can host Express apps as "Serverless Functions". This is fast and never "sleeps".

**Pros**: Fast, no cold starts, easy integration.
**Cons**: Requires adding a `vercel.json` file.

### Steps:

1.  **Add Configuration File**:
    Create a file named `vercel.json` inside your `seashell-backend` folder with this content:

    ```json
    {
      "version": 2,
      "builds": [
        {
          "src": "server.js",
          "use": "@vercel/node"
        }
      ],
      "routes": [
        {
          "src": "/(.*)",
          "dest": "server.js"
        }
      ]
    }
    ```

2.  **Install Vercel CLI (Optional but easy)**:
    Open your terminal in `seashell-backend`:

    ```bash
    npm install -g vercel
    ```

3.  **Deploy**:
    Run this command in `seashell-backend`:

    ```bash
    vercel
    ```

    - It will ask to log in (use GitHub).
    - Accept default settings.
    - It will give you a generic URL.

4.  **Environment Variables**:
    - Go to the Vercel Dashboard -> Project Settings -> Environment Variables.
    - Add your secrets (AES, IV, HESABE codes) there.
    - Redeploy using `vercel --prod`.

You will get a URL like `https://seashell-backend.vercel.app`.

---

## 🚀 Final Step: Connect Frontend

Once you have your new HTTPS Backend URL:

1.  Open `apps/menu-app/.env`.
2.  Update the backend URL:
    ```env
    VITE_BACKEND_URL=https://your-new-backend-url.onrender.com
    ```
3.  Redeploy your **Frontend** (Menu App) to Firebase Hosting.

Now both your Frontend and Backend are on HTTPS, and everything will work!
