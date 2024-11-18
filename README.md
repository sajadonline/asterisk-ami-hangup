# Asterisk SMS Notification Service

Automatically sends SMS notifications to missed calls using Asterisk AMI.

## Features
- Auto SMS for missed calls
- Environment-based configuration
- Docker support
- Error logging
- Rate limiting
- Phone number validation

## Setup

### Environment Variables
Create `.env`:
```
SMS_USERNAME=your_username
SMS_PASSWORD=your_password
ASTERISK_IP=your_ip
ASTERISK_USER=your_user
ASTERISK_PASS=your_pass
FROM_NUMBER=3000505
```

### Local Installation
```bash
npm install
npm start
```

### Docker
```bash
docker build -t asterisk-sms .
docker run --env-file .env asterisk-sms
```

## Logs
- `error.log`: Error messages
- `combined.log`: All logs

## License
MIT
