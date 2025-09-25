/**
 * Server-Side Validation Module
 * This module provides backup validation for form submissions
 * Can be integrated with Node.js, PHP, Python, or any backend
 */

class ServerSideValidator {
    constructor() {
        // Critical spam patterns for immediate blocking
        this.criticalSpamPatterns = [
            /\b(viagra|cialis|levitra)\b/i,
            /\b(casino|gambling|poker|lottery)\b/i,
            /\bmake.*\$\d+.*day\b/i,
            /\bguaranteed.*income\b/i,
            /\bno.*risk.*money\b/i,
            /\bclick.*here.*now\b/i,
            /\bact.*now.*limited\b/i,
            /\bfree.*trial.*offer\b/i,
            /\bweight.*loss.*pills\b/i,
            /\breplica.*watches\b/i,
            /\bmlm|multi.*level.*marketing\b/i,
            /\bseo.*services.*cheap\b/i
        ];

        // Suspicious patterns with scoring
        this.suspiciousPatterns = [
            { pattern: /[A-Z]{5,}/g, score: 2, name: 'excessive_caps' },
            { pattern: /[!]{3,}/g, score: 3, name: 'excessive_exclamation' },
            { pattern: /\$\d+/g, score: 1, name: 'money_mention' },
            { pattern: /https?:\/\/[^\s]+/g, score: 2, name: 'url_links' },
            { pattern: /\b\d{10,}\b/g, score: 2, name: 'long_numbers' },
            { pattern: /(.)\1{4,}/g, score: 3, name: 'repeated_chars' },
            { pattern: /\b(free|cheap|discount|sale|offer)\b/gi, score: 1, name: 'promotional_words' }
        ];

        // Non-English character patterns
        this.nonEnglishPatterns = [
            /[\u4e00-\u9fff]/g, // Chinese
            /[\u0400-\u04ff]/g, // Cyrillic
            /[\u0590-\u05ff]/g, // Hebrew
            /[\u0600-\u06ff]/g  // Arabic
        ];

        this.spamThreshold = 5;
    }

    /**
     * Main validation function
     * @param {Object} formData - Form submission data
     * @returns {Object} Validation result
     */
    validateSubmission(formData) {
        const { name, email, subject, message } = formData;
        
        // Basic field validation
        if (!this.validateBasicFields(name, email, subject, message)) {
            return { valid: false, reason: 'Missing required fields' };
        }

        // Spam content check
        if (this.containsSpam(message) || this.containsSpam(subject) || this.containsSpam(name)) {
            return { valid: false, reason: 'Content contains prohibited material' };
        }

        // Advanced content validation
        const contentValidation = this.validateContent(name, email, subject, message);
        if (contentValidation !== true) {
            return { valid: false, reason: contentValidation };
        }

        // Rate limiting check (implement based on your backend)
        if (!this.checkRateLimit(formData.ip || 'unknown')) {
            return { valid: false, reason: 'Rate limit exceeded' };
        }

        return { valid: true, reason: 'Validation passed' };
    }

    /**
     * Check for spam content using patterns and scoring
     */
    containsSpam(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        
        // Check critical patterns first
        for (const pattern of this.criticalSpamPatterns) {
            if (pattern.test(lowerText)) {
                return true;
            }
        }

        // Calculate spam score
        let spamScore = 0;
        
        for (const { pattern, score } of this.suspiciousPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                spamScore += matches.length * score;
            }
        }

        // Check for non-English content (higher score if excessive)
        let nonEnglishCount = 0;
        for (const pattern of this.nonEnglishPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                nonEnglishCount += matches.length;
            }
        }
        
        if (nonEnglishCount > text.length * 0.3) {
            spamScore += 4;
        }

        return spamScore >= this.spamThreshold;
    }

    /**
     * Advanced content validation
     */
    validateContent(name, email, subject, message) {
        // Individual field spam checks
        if (this.containsSpam(name)) return 'Name contains prohibited content';
        if (this.containsSpam(email)) return 'Email contains prohibited content';
        if (this.containsSpam(subject)) return 'Subject contains prohibited content';
        if (this.containsSpam(message)) return 'Message contains prohibited content';

        // Message length validation
        if (message.length < 10) return 'Message too short';
        if (message.length > 5000) return 'Message too long';

        // Enhanced name validation
        if (!/^[a-zA-Z\s\-'\.]{2,50}$/.test(name)) {
            return 'Invalid name format';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Invalid email format';
        }

        // Check for suspicious email patterns
        const suspiciousEmailPatterns = [
            /\d{5,}@/,  // Many numbers before @
            /@(temp|fake|spam|test)\./i,
            /\+.*\+.*@/  // Multiple + signs
        ];
        
        for (const pattern of suspiciousEmailPatterns) {
            if (pattern.test(email)) {
                return 'Suspicious email pattern detected';
            }
        }

        // Subject validation
        if (subject.length < 3) return 'Subject too short';
        if (subject.length > 200) return 'Subject too long';

        // Check for excessive capitalization
        const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
        if (capsRatio > 0.5 && message.length > 20) {
            return 'Excessive capitalization detected';
        }

        return true;
    }

    /**
     * Basic field validation
     */
    validateBasicFields(name, email, subject, message) {
        return name && email && subject && message &&
               name.trim().length > 0 &&
               email.trim().length > 0 &&
               subject.trim().length > 0 &&
               message.trim().length > 0;
    }

    /**
     * Rate limiting check (implement based on your backend)
     */
    checkRateLimit(ip) {
        // This should be implemented with your backend's rate limiting logic
        // For example, using Redis, database, or in-memory storage
        // Return false if rate limit exceeded
        return true; // Placeholder
    }

    /**
     * Verify Turnstile token (for Cloudflare integration)
     */
    async verifyTurnstile(token, secretKey, ip) {
        try {
            const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    secret: secretKey,
                    response: token,
                    remoteip: ip
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Turnstile verification failed:', error);
            return false;
        }
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = ServerSideValidator;
} else if (typeof window !== 'undefined') {
    // Browser environment
    window.ServerSideValidator = ServerSideValidator;
}

// Example usage for different backends:

/*
// Node.js/Express example:
const ServerSideValidator = require('./server-validation');
const validator = new ServerSideValidator();

app.post('/contact', async (req, res) => {
    const validation = validator.validateSubmission({
        name: req.body.name,
        email: req.body.email,
        subject: req.body.subject,
        message: req.body.message,
        ip: req.ip
    });
    
    if (!validation.valid) {
        return res.status(400).json({ error: validation.reason });
    }
    
    // Verify Turnstile
    const turnstileValid = await validator.verifyTurnstile(
        req.body['cf-turnstile-response'],
        process.env.TURNSTILE_SECRET_KEY,
        req.ip
    );
    
    if (!turnstileValid) {
        return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
    
    // Process valid submission
    // ... your form processing logic
});

// PHP example:
// $validator = new ServerSideValidator();
// $validation = $validator->validateSubmission($_POST);
// if (!$validation['valid']) {
//     http_response_code(400);
//     echo json_encode(['error' => $validation['reason']]);
//     exit;
// }

// Python/Flask example:
// from server_validation import ServerSideValidator
// validator = ServerSideValidator()
// validation = validator.validate_submission(request.form)
// if not validation['valid']:
//     return jsonify({'error': validation['reason']}), 400
*/