require('dotenv').config();
const request = require('request-promise-native');
const AmiClient = require('asterisk-ami-client');
const winston = require('winston');

// Constants
const TEXT_MESSAGE = "Thank you for calling with us. We appreciate your interest and will get back to you as soon as possible.";

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

class AsteriskSMSHandler {
    constructor() {
        this.configuration = this.validateConfig({
            smsUsername: process.env.SMS_USERNAME,
            smsPassword: process.env.SMS_PASSWORD,
            asteriskIP: process.env.ASTERISK_IP,
            asteriskUser: process.env.ASTERISK_USER,
            asteriskPass: process.env.ASTERISK_PASS,
            smsApiUrl: process.env.SMS_API_URL || 'https://sms.ariaservice.net/api/select',
            fromNumber: process.env.FROM_NUMBER || '3000505'
        });
        
        this.sentNumbers = new Set();
        this.client = new AmiClient({
            reconnect: true,
            keepAlive: true,
            emitEventsByTypes: true,
            emitResponsesById: true,
            maxRetries: 5,
            retryInterval: 5000
        });
    }

    validateConfig(config) {
        const requiredFields = ['smsUsername', 'smsPassword', 'asteriskIP', 'asteriskUser', 'asteriskPass'];
        requiredFields.forEach(field => {
            if (!config[field]) throw new Error(`Missing required configuration: ${field}`);
        });
        return config;
    }

    async sendMessage(toNumber) {
        if (!this.isValidPhoneNumber(toNumber)) {
            throw new Error('Invalid phone number format');
        }

        try {
            const response = await request.post({
                url: this.configuration.smsApiUrl,
                body: {
                    op: "send",  // Changed from "pattern" to "send" for direct message
                    user: this.configuration.smsUsername,
                    pass: this.configuration.smsPassword,
                    fromNum: this.configuration.fromNumber,
                    toNum: toNumber,
                    message: TEXT_MESSAGE
                },
                json: true,
                timeout: 10000
            });

            logger.info(`SMS sent successfully to ${toNumber}`);
            return response;
        } catch (error) {
            logger.error('SMS sending failed:', { 
                number: toNumber, 
                error: error.message 
            });
            throw error;
        }
    }

    isValidPhoneNumber(number) {
        return /^\d{10,12}$/.test(number.toString());
    }

    async connect() {
        try {
            await this.client.connect(
                this.configuration.asteriskUser,
                this.configuration.asteriskPass,
                {
                    host: this.configuration.asteriskIP,
                    port: 5038,
                    timeout: 5000
                }
            );

            this.setupEventHandlers();
            logger.info('Connected to Asterisk AMI successfully');
        } catch (error) {
            logger.error('AMI connection failed:', error);
            throw error;
        }
    }

    setupEventHandlers() {
        this.client.on('Hangup', this.handleHangup.bind(this));
        this.client.on('error', (error) => {
            logger.error('AMI client error:', error);
        });
    }

    async handleHangup(event) {
        try {
            if (event.ChannelState === '4' && event.Cause === '16' && 
                !this.sentNumbers.has(event.CallerIDNum)) {
                
                await this.sendMessage(event.CallerIDNum);
                this.sentNumbers.add(event.CallerIDNum);
                
                setTimeout(() => {
                    this.sentNumbers.delete(event.CallerIDNum);
                }, 24 * 60 * 60 * 1000);
            }
        } catch (error) {
            logger.error('Hangup handler error:', error);
        }
    }
}

const handler = new AsteriskSMSHandler();
handler.connect().catch(error => {
    logger.error('Failed to start service:', error);
    process.exit(1);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    await handler.client.disconnect();
    process.exit(0);
});
