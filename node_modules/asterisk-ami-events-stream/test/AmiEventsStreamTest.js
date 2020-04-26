/**
 * Developer: BelirafoN
 * Date: 15.04.2016
 * Time: 15:39
 */

"use strict";

const assert = require('assert');
const fs = require('fs');
const FixtureTransformer = require('./fixtures/FixtureTransformer');
const AmiEventEmitter = require('../lib/AmiEventsStream');

describe('AmiEventsStream internal functionality', function() {
    this.timeout(process.env.MOCHA_TIMEOUT || 2000);

    let eventEmitter = null,
        readStream = null,
        fixtureTransformer = null;

    beforeEach(() => {
        eventEmitter = new AmiEventEmitter();
        fixtureTransformer = new FixtureTransformer();
        readStream = fs.createReadStream('./test/fixtures/ami.dump').pipe(fixtureTransformer);
        readStream.on('error', error => console.log(error));
    });

    it('Push data to "data" handler', done => {
        let eventsCount = 0;
        eventEmitter.on('data', event => eventsCount++);
        readStream.on('end', () => {
            assert.equal(eventsCount, 10);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Push data to "amiEvent" handler', done => {
        let eventsCount = 0;
        eventEmitter.on('amiEvent', event => eventsCount++);
        readStream.on('end', () => {
            assert.equal(eventsCount, 4);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Push data to "amiResponse" handler', done => {
        let eventsCount = 0;
        eventEmitter.on('amiResponse', event => eventsCount++);
        readStream.on('end', () => {
            assert.equal(eventsCount, 5);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Push data to "amiAction" handler', done => {
        let actionsCount = 0;
        eventEmitter.on('amiAction', action => actionsCount++);
        readStream.on('end', () => {
            assert.equal(actionsCount, 1);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Emit events & apply parse-function', done => {
        let events = {};
        eventEmitter.on('amiEvent', event => {
            if(!events[event['Event']]){
                events[event['Event']] = [event];
            }else{
                events[event['Event']].push(event);
            }
        });
        readStream.on('end', () => {
            assert.equal(events['Hangup'].length, 1);
            assert.equal(events['HangupRequest'].length, 3);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Get last amiEvent with events', done => {
        let eventsCount = 0,
            expectedEvent = {
                Event: 'HangupRequest',
                Privilege: 'call,all',
                Channel: 'Local/160@from-queue-002e58e7;2',
                Uniqueid: '1418896538.6181899'
            };

        eventEmitter.on('amiEvent', event => eventsCount++);
        readStream.on('end', () => {
            assert.deepEqual(eventEmitter.getLastEvent(), expectedEvent);
            assert.deepEqual(eventEmitter.lastEvent, expectedEvent);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Get last amiEvent without events', () => {
        assert.equal(eventEmitter.getLastEvent(), null);
        assert.equal(eventEmitter.lastEvent, null);
    });

    it('Get last amiResponse with responses', done => {
        let eventsCount = 0,
            expectedResponse = {
                Response: 'Pong'
            };

        eventEmitter.on('amiEvent', event => eventsCount++);
        readStream.on('end', () => {
            assert.deepEqual(eventEmitter.getLastResponse(), expectedResponse);
            assert.deepEqual(eventEmitter.lastResponse, expectedResponse);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Get last amiResponse without responses', () => {
        assert.equal(eventEmitter.getLastResponse(), null);
        assert.equal(eventEmitter.lastResponse, null);
    });

    it('Get last amiAction with action\'s data', done => {
        let actionsCount = 0,
            expected = {
                Action: 'Ping'
            };

        eventEmitter.on('amiAction', event => actionsCount++);
        readStream.on('end', () => {
            assert.deepEqual(eventEmitter.getLastAction(), expected);
            assert.deepEqual(eventEmitter.lastAction, expected);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Get last amiAction without action\'s data', () => {
        assert.equal(eventEmitter.getLastAction(), null);
        assert.equal(eventEmitter.lastAction, null);
    });

});