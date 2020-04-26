/**
 * Created by Alex Voronyansky <belirafon@gmail.com>
 * Date: 26.04.2016
 * Time: 13:47
 */

"use strict";

const co  = require('co');
const net = require('net');
const AmiConnection = require('./AmiConnection');
const AmiAuthError = require('./errors/AmiAuthError');
const AmiEventsStream = require('asterisk-ami-events-stream');
const amiUtils = require('asterisk-ami-event-utils');
const debugLog = require('debug')('amiConnector');
const errorLog = require('debug')('amiConnector:error');

/**
 *
 * @param login
 * @param secret
 * @param connectionOptions
 * @returns {Promise}
 */
function createAmiConnection(login, secret, connectionOptions){
    return new Promise((resolve, reject) => {

        let amiDataStream = new AmiEventsStream(),
            authCommand = {
                Action: 'login',
                Username: login,
                Secret: secret,
                ActionID: `__auth_${Date.now()}__`
            },
            amiSocket = null;

        debugLog('connecting to asterisk ami...');

        amiSocket = net.connect(connectionOptions, () => {
            debugLog('connection established');

                amiSocket.pipe(amiDataStream)
                .once('error', reject)
                .once('close', () => reject(new AmiAuthError('ami auth error')))
                .on('amiResponse', response => {
                    if(response.ActionID !== authCommand.ActionID){ return; }
                    if(response.Response !== 'Success'){
                        reject(new AmiAuthError(`AMI message: ${response.Message}`));
                        return;
                    }

                    debugLog('authontificated successfull');
                    amiSocket
                        .removeAllListeners('error')
                        .removeAllListeners('close')
                        .unpipe(amiDataStream);

                    amiDataStream
                        .removeAllListeners('error')
                        .removeAllListeners('close')
                        .removeAllListeners('amiResponse');

                    resolve(new AmiConnection(amiSocket));
                    debugLog('asterisk\'s ami connection ready to work');
                });
            debugLog(`authontification [username:${authCommand.Username}]...`);
            amiSocket.write(amiUtils.fromObject(authCommand));
        })
            .once('error', reject)
            .once('close', reject);
    });
}

/**
 *
 * @param maxAttemptsCount
 * @param attemptsDelay
 * @returns {Function}
 */
function wrapper(maxAttemptsCount, attemptsDelay){
    return function(login, password, options){
        return co(function* (){
            let currAttemptIndex = 0;

            while(maxAttemptsCount === null || ++currAttemptIndex <= maxAttemptsCount){
                try{
                    return yield createAmiConnection(login, password, options);

                }catch (error){
                    if(error instanceof AmiAuthError) throw error;

                    errorLog(error.message);
                    yield sleep(attemptsDelay);
                }

                if(maxAttemptsCount === null){
                    debugLog(`attempt of reconnecting...`);
                }else{
                    debugLog(`attempt [${currAttemptIndex} of ${maxAttemptsCount}] of reconnecting...`);
                }
            }
            throw new Error('Reconnection error after max count attempts.');
        });
    }
}

/**
 *
 * @param delay
 * @returns {Promise}
 */
function sleep(delay){
    return new Promise(resolve => setTimeout(resolve, delay));
}

module.exports = function(options){
    options = Object.assign({
        reconnect: false,
        maxAttemptsCount: null,
        attemptsDelay: 1000
    }, options || {});

    return {
        connect: !options.reconnect ? createAmiConnection : wrapper(options.maxAttemptsCount, options.attemptsDelay)
    };
};
