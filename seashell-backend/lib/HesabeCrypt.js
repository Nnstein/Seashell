/**
 * HesabeCrypt - AES-256-CBC Encryption/Decryption Library for Hesabe Payment Gateway
 * Based on the official Hesabe documentation
 */

"use strict";

const aesjs = require("aes-js");

class HesabeCrypt {
    /**
     * Create a new HesabeCrypt instance
     * @param {Uint8Array} secret - The secret key as bytes
     * @param {Uint8Array} iv - The IV key as bytes
     */
    constructor(secret, iv) {
        this.key = secret;
        this.iv = iv;
    }

    /**
     * Encrypt text using AES-256-CBC
     * @param {string} txt - The plaintext to encrypt
     * @returns {string} - The encrypted hex string
     */
    encryptAes(txt) {
        // Convert text to bytes and apply PKCS7 padding
        const txtBytes = aesjs.padding.pkcs7.pad(aesjs.utils.utf8.toBytes(txt));
        
        // Create AES-CBC cipher
        const aesCbc = new aesjs.ModeOfOperation.cbc(this.key, this.iv);
        
        // Encrypt the bytes
        const encBytes = aesCbc.encrypt(txtBytes);
        
        // Convert to hex string
        const encHex = aesjs.utils.hex.fromBytes(encBytes);
        
        return encHex;
    }

    /**
     * Decrypt hex string using AES-256-CBC
     * @param {string} encHex - The encrypted hex string
     * @returns {string} - The decrypted plaintext
     */
    decryptAes(encHex) {
        // Convert hex to bytes
        const encBytes = aesjs.utils.hex.toBytes(encHex);
        
        // Create AES-CBC cipher
        const aesCbc = new aesjs.ModeOfOperation.cbc(this.key, this.iv);
        
        // Decrypt the bytes
        const decBytes = aesCbc.decrypt(encBytes);
        
        // Convert to string
        const decTxt = aesjs.utils.utf8.fromBytes(decBytes);
        
        // Strip PKCS5 padding
        const strippedTxt = this.pkcs5Strip(decTxt);
        
        return strippedTxt;
    }

    /**
     * Apply PKCS5 padding to data
     * @param {string} data - The data to pad
     * @returns {string} - The padded data
     */
    pkcs5Pad(data) {
        const blockSize = 32;
        const padLen = blockSize - (data.length % blockSize);
        const paddedTxt = data + this.strRepeat(String.fromCharCode(padLen), padLen);
        return paddedTxt;
    }

    /**
     * Strip PKCS5 padding from data
     * @param {string} data - The padded data
     * @returns {string} - The unpadded data
     */
    pkcs5Strip(data) {
        const dataLen = data.length;
        
        if (dataLen < 32) {
            throw new Error('Invalid data length. Block size must be 32 bytes');
        }
        
        const padderCodeInt = data.charCodeAt(dataLen - 1);
        
        if (padderCodeInt > 32) {
            throw new Error('PKCS#5 padding byte out of range');
        }
        
        const len = dataLen - padderCodeInt;
        const strippedTxt = data.substr(0, len);
        
        return strippedTxt;
    }

    /**
     * Repeat a string multiple times
     * @param {string} input - The string to repeat
     * @param {number} multiplier - Number of times to repeat
     * @returns {string} - The repeated string
     */
    strRepeat(input, multiplier) {
        let y = '';
        while (true) {
            if (multiplier & 1) {
                y += input;
            }
            multiplier >>= 1;
            if (multiplier) {
                input += input;
            } else {
                break;
            }
        }
        return y;
    }
}

module.exports = HesabeCrypt;
