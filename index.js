
const request = require('request');
const AmiClient = require('asterisk-ami-client');
let client = new AmiClient({
    reconnect: true,
    keepAlive: true,
    emitEventsByTypes: true,
    emitResponsesById: true
});

var configuration = [
    {
        smsUsername : 'username',
        smsPassword : 'password',
        AsteriskIP  : 'callCenterIp',
        AsteriskUser : 'asteriskAMIUser',
        AsteriskPass : 'asteriskAMIpass'

}
]


function sendMessage(toNumber,pattern){
    request.post({
        url: 'https://sms.ariaservice.net/api/select',
        body: {
                "op":"pattern",
                "user":configuration[smsUsername],
                "pass":configuration[smsPassword],
                "fromNum":"3000505",
                "toNum": toNumber,
                "patternCode":pattern,
                "inputData":[{"name":""}]
            },
        json: true,
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
         //YOU‌ CAN‌ CHECK‌ THE‌ RESPONSE‌ AND SEE‌ ERROR‌ OR‌ SUCCESS‌ MESSAGE
            console.log(response.body);
        } else {
           console.log(error);
        
        }
    });

}



var sent = []   

client.connect(configuration[AsteriskUser], configuration[AsteriskPass], {host: configuration[AsteriskIP],
     port: 5038})
.then(() => {
    client
       
        .on('Hangup', event => {
           
           if(event.ChannelState == '4' && event.Cause == '16'){
           
           // first check number , if is mobile send message
           
            
                if(sent.indexOf(event.CallerIDNum) == -1){
                    sendMessage(event.CallerIDNum,'yloxqv1p3r')
                    sent.push(event.CallerIDNum)
                }
           
            
           }
           
        })
     

    
})
.catch(error => console.log(error));
