/**
 * Developer: BelirafoN
 * Date: 05.05.2016
 * Time: 11:26
 */

"use strict";

const AmiTestServer = require('asterisk-ami-test-server');
const connectorFactory = require('../lib/index');
const AmiConnection = require('../lib/AmiConnection');
const assert = require('assert');
const CRLF = '\r\n';

let serverOptions = {
        credentials: {
            username: 'test',
            secret: 'test'
        }
    },
    socketOptions = {
        host: '127.0.0.1',
        port: 5038
    };

describe('Ami connector Internal functioanlity', function(){
    this.timeout(3000);

    let server = null,
        connector = null,
        connectorOptions = {
            reconnect: false,
            maxAttemptsCount: null,
            attemptsDelay: 1000
        };

    afterEach(done => {
        if(server instanceof AmiTestServer){
            server.close();
            server.removeAllListeners();
            server = null;
        }
        connector = null;
        done();
    });

    describe('Regular connection functionality', function(){

        beforeEach(done => {
            connector = connectorFactory(connectorOptions);
            server = new AmiTestServer(serverOptions);
            server.listen({port: socketOptions.port}).then(done);
        });

        it('Connect without reconnection & correct credentials', done => {
            connector.connect('test', 'test', socketOptions).then(() => done());
        });

        it('Connector returns instance of AmiConnection', done => {
            connector.connect('test', 'test', socketOptions).then(amiConnection => {
                assert.ok(amiConnection instanceof AmiConnection);
                done();
            });
        });

        it('Connect without reconnection & invalid credentials', done => {
            connector.connect('username', 'secret', socketOptions)
                .catch(error => {
                    assert.ok(error instanceof Error);
                    assert.equal('ami message: authentication failed', error.message.toLowerCase());
                    done();
                });
        });
    });

    describe('Reconnection functioanlity', function(){

        beforeEach(() => {
            server = new AmiTestServer(serverOptions);
        });

        it('Reconnection with correct credentials', done => {
            connector = connectorFactory({
                reconnect: true
            });
            connector.connect('test', 'test', socketOptions).then(() => done());
            setTimeout(() => {
                server.listen({port: socketOptions.port});
            }, 1500);
        });

        it('Reconnection with invalid credentials', done => {
            connector = connectorFactory({
                reconnect: true
            });
            connector.connect('username', 'secret', socketOptions).catch(error => {
                assert.ok(error instanceof Error);
                assert.equal('ami message: authentication failed', error.message.toLowerCase());
                done();
            });
            setTimeout(() => {
                server.listen({port: socketOptions.port});
            }, 1500);
        });

        it('Limit of attempts of reconnection', done => {
            connector = connectorFactory({
                reconnect: true,
                maxAttemptsCount: 1
            });
            connector.connect('test', 'test', socketOptions).catch(error => {
                assert.ok(error instanceof Error);
                assert.equal('reconnection error after max count attempts.', error.message.toLowerCase());
                done();
            });
            setTimeout(() => {
                server.listen({port: socketOptions.port});
            }, 1500);
        });

        it('Ban for reconnection', done => {
            connector = connectorFactory({
                reconnect: false
            });
            connector.connect('test', 'test', socketOptions).catch(error => {
                assert.ok(error instanceof Error);
                assert.equal('connect ECONNREFUSED 127.0.0.1:5038', error.message);
                done();
            });
            setTimeout(() => {
                server.listen({port: socketOptions.port});
            }, 1500);
        });
    });

    describe('AmiConnection internal functionality', function(){
        let connection = null;

        beforeEach(done => {
            connector = connectorFactory(connectorOptions);
            server = new AmiTestServer(serverOptions);
            server.listen({port: socketOptions.port}).then(() => {
                connector.connect('test', 'test', socketOptions)
                    .then(amiConnection => {
                    connection = amiConnection;
                    done();
                });
            });
        });

        afterEach(() => {
            if(connection instanceof AmiConnection){
                connection.close();
                connection.removeAllListeners();
                connection = null;
            }
        });

        it('Last response', done => {
            connection
                .once('response', response => {
                    assert.deepEqual(connection.lastResponse, response);
                    done();
                })
                .write({Action: 'Ping'});
        });

        it('Last event', done => {
            server.broadcast([
                    'Event: Test',
                    'Value: AmiConnectionTest'
                ].join(CRLF) + CRLF.repeat(2));

            connection.once('event', event => {
                assert.deepEqual(connection.lastEvent, event);
                done();
            });
        });

        it('Last wrote data', () => {
            let dataPackage = {Action: 'Ping'};
            connection.write(dataPackage);
            assert.deepEqual(connection.lastWroteData, dataPackage);
        });

        it('Connection state is "connected"', () => {
            assert.ok(connection.isConnected);
        });

        it('Close connection', () => {
            connection.close();
            assert.ok(!connection.isConnected);
        })

    });

});