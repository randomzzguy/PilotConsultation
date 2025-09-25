// Vercel Serverless Function for Contact Form
// This file should be placed in /api/contact.js in your repository

// Import the server-side validator (we'll need to adapt it for Vercel)
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

        this.spamThreshold = 5;
    }

    validateSubmission(formData) {
        const { name, email, subject, message } = formData;

        // Basic field validation
        const basicValidation = this.validateBasicFields(name, email, subject, message);
        if (!basicValidation.valid) {
            return basicValidation;
        }

        // Content validation
        const contentValidation = this.validateContent(name, email, subject, message);
        if (!contentValidation.valid) {
            return contentValidation;
        }

        return { valid: true, reason: 'Valid submission' };
    }

    containsSpam(text) {
        if (!text) return false;

        // Check critical patterns
        for (const pattern of this.criticalSpamPatterns) {
            if (pattern.test(text)) {
                return true;
            }
        }

        // Check suspicious patterns with scoring
        let suspiciousScore = 0;
        for (const item of this.suspiciousPatterns) {
            const matches = text.match(item.pattern);
            if (matches) {
                suspiciousScore += matches.length * item.score;
            }
        }

        return suspiciousScore >= this.spamThreshold;
    }

    validateContent(name, email, subject, message) {
        const allText = `${name} ${email} ${subject} ${message}`;

        if (this.containsSpam(allText)) {
            return { valid: false, reason: 'Message contains prohibited content' };
        }

        return { valid: true };
    }

    validateBasicFields(name, email, subject, message) {
        if (!name || name.trim().length < 2) {
            return { valid: false, reason: 'Name must be at least 2 characters' };
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { valid: false, reason: 'Valid email address required' };
        }

        if (!message || message.trim().length < 10) {
            return { valid: false, reason: 'Message must be at least 10 characters' };
        }

        return { valid: true };
    }

    async verifyTurnstile(token, secretKey, ip) {
        if (!token || !secretKey) return false;

        try {
            const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${secretKey}&response=${token}&remoteip=${ip}`
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Turnstile verification error:', error);
            return false;
        }
    }
}

// Vercel serverless function handler
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Enable CORS for your domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        const validator = new ServerSideValidator();
        
        // Get client IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Validate the submission
        const validation = validator.validateSubmission(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({ 
                error: validation.reason,
                blocked: true 
            });
        }

        // Verify Turnstile CAPTCHA (optional - add your secret key)
        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
        if (turnstileSecret && req.body['cf-turnstile-response']) {
            const turnstileValid = await validator.verifyTurnstile(
                req.body['cf-turnstile-response'],
                turnstileSecret,
                ip
            );
            
            if (!turnstileValid) {
                return res.status(400).json({ 
                    error: 'CAPTCHA verification failed' 
                });
            }
        }

        // ✅ Valid submission - you can process it here
        // For example, send to an email service, save to database, etc.
        
        console.log('Valid submission received:', {
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            message: req.body.message?.substring(0, 100) + '...', // Log first 100 chars
            ip: ip,
            timestamp: new Date().toISOString()
        });

        // Return success response
        res.status(200).json({ 
            success: true, 
            message: 'Message sent successfully!' 
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
}