# asterisk-ami-hangup
detect hangup and send sms for id caller

# install
``` bash
git clone git@github.com:sajadonline/asterisk-ami-hangup.git
cd asterisk-ami-hangup
npm install
```
# sms configuration
visit https://sms.ariaservice.net and register
modify configuration sms access variable in index.js

# ami config and access
modify /etc/asterisk/manager.conf and add ami user

# run
``` bash
node index.js
```