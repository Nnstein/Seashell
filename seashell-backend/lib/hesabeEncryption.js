/**
 * Hesabe Encryption/Decryption Helper Functions
 * Based on official Hesabe documentation
 * 
 * These functions provide a simple interface for encrypting and decrypting
 * data for the Hesabe payment gateway API.
 */

const aesjs = require("aes-js");
const HesabeCrypt = require("./HesabeCrypt.js");

// Load keys from environment variables
const getKeys = () => {
    const secret_key = process.env.HESABE_SECRET_KEY; // Secret key provided by Hesabe
    const iv_key = process.env.HESABE_IV_KEY;         // IV key provided by Hesabe
    
    if (!secret_key || !iv_key) {
        throw new Error('HESABE_SECRET_KEY and HESABE_IV_KEY must be set in environment variables');
    }
    
    return { secret_key, iv_key };
};

/**
 * Encrypt data for Hesabe API
 * @param {any} value - The value to encrypt (will be JSON stringified)
 * @returns {string} - The encrypted hex string
 */
const getEncryptedData = (value) => {
    const { secret_key, iv_key } = getKeys();
    
    if (value) {
        const secret = secret_key;  // merchant secret key
        const ivCode = iv_key;      // merchant iv code
        
        const key = aesjs.utils.utf8.toBytes(secret);
        const iv = aesjs.utils.utf8.toBytes(ivCode);
        
        const instance = new HesabeCrypt(key, iv);
        
        const text = value;
        const encrypted = instance.encryptAes(JSON.stringify(text));
        const encrypted_data = encrypted;
        
        return encrypted_data;
    }
    
    return null;
};

/**
 * Decrypt data from Hesabe API
 * @param {string} value - The encrypted hex string to decrypt
 * @returns {object} - The decrypted and parsed JSON data
 */
const getDecryptedData = (value) => {
    const { secret_key, iv_key } = getKeys();
    
    if (value) {
        const secret = secret_key;  // merchant secret key
        const ivCode = iv_key;      // merchant iv code
        
        const key = aesjs.utils.utf8.toBytes(secret);
        const iv = aesjs.utils.utf8.toBytes(ivCode);
        
        const instance = new HesabeCrypt(key, iv);
        
        const text = value;
        const decrypted = instance.decryptAes(text);
        const decrypted_data = JSON.parse(decrypted);
        
        return decrypted_data;
    }
    
    return null;
};

/**
 * Utility to mask PII (Personally Identifiable Information) in logs
 * @param {object} data - The data object to mask
 * @returns {object} - A copy of the data with sensitive fields masked
 */
const maskPII = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    // Deep copy to avoid modifying the original data
    let maskedData;
    try {
        maskedData = JSON.parse(JSON.stringify(data));
    } catch (e) {
        return '[Unserializable Data]';
    }
    
    const maskValue = (val) => {
        if (!val) return val;
        const str = String(val);
        if (str.length <= 4) return '****';
        return str.substring(0, 4) + '****';
    };

    const processObject = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        // Mask variable2 (Phone number)
        if (obj.variable2) {
            obj.variable2 = maskValue(obj.variable2);
        }

        // Mask customer details
        if (obj.customer && typeof obj.customer === 'object') {
            const sensitiveFields = ['Mobile', 'Email', 'Name', 'NameOnCard', 'CardNumber'];
            sensitiveFields.forEach(field => {
                if (obj.customer[field]) {
                    obj.customer[field] = '****';
                }
            });
        }

        // Recurse through properties
        Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object') {
                processObject(obj[key]);
            }
        });
    };

    processObject(maskedData);
    return maskedData;
};

module.exports = {
    getEncryptedData,
    getDecryptedData,
    maskPII
};
