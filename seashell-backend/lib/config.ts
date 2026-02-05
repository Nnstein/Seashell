const config = {
        // env: {
        //     production: process.env.NODE_ENV === 'production',
        //     development: process.env.NODE_ENV === 'development',
        //     test: process.env.NODE_ENV === 'test',
        // },
        // firebase: {
        //     apiKey: process.env.FIREBASE_API_KEY,
        //     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        //     projectId: process.env.FIREBASE_PROJECT_ID,
        //     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        //     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        //     appId: process.env.FIREBASE_APP_ID,
        // },
        hesabe: {
            merchantId: process.env.HESABE_MERCHANT_ID!,
            accessCode: process.env.HESABE_ACCESS_CODE!,
            secretKey: process.env.HESABE_SECRET_KEY!,
            ivKey: process.env.HESABE_IV_KEY!,
            baseUrl: process.env.HESABE_BASE_URL!,
            paymentInitiatedCheckoutUrl: process.env.HESABE_PAYMENT_INITIATED_CHECKOUT_URL!,
            paymentPageRedirectionUrl: process.env.HESABE_PAYMENT_PAGE_REDIRECTION_URL!,
        },
    } 

export default config