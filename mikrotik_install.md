# Installing Node.js Container on MikroTik RouterOS 7

## Prerequisites
- MikroTik device running RouterOS v7
- At least 128MB free storage
- Internet connection
- SSH access to MikroTik

## Installation Steps

1. Enable container feature:
```
/system/container
add remote-image=node:16-alpine interface=bridge pull=yes
```

2. Create container configuration:
```
/system/container/envs
add name=sms-env key=SMS_USERNAME value="your_username"
add name=sms-env key=SMS_PASSWORD value="your_password"
add name=sms-env key=ASTERISK_IP value="your_ip"
add name=sms-env key=ASTERISK_USER value="your_user"
add name=sms-env key=ASTERISK_PASS value="your_pass"
add name=sms-env key=FROM_NUMBER value="3000505"
```

3. Create container mount:
```
/system/container/mounts
add name=app-mount dst=/app src=/asterisk-sms
```

4. Copy application files:
```
/file/print file=asterisk-sms/
put [your files content] dst=/asterisk-sms/index.js
put [your package.json content] dst=/asterisk-sms/package.json
```

5. Start container:
```
/system/container
add remote-image=node:16-alpine interface=bridge envlist=sms-env mounts=app-mount cmd="npm install && node index.js"
```

6. Monitor logs:
```
/system/container/logs
print where container="container1"
```

## Troubleshooting
- Check container status: `/system/container/print`
- View logs: `/system/container/logs/print`
- Restart container: `/system/container/restart numbers=[container-number]`
