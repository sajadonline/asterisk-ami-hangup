/**
 * Developer: Alex Voronyansky <belirafon@gmail.com>
 * Date: 14.11.2014
 * Time: 12:28
 */

"use strict";

const Transform = require('stream').Transform;
const eventUtils = require('asterisk-ami-event-utils');
const COMMAND_END = '--END COMMAND--';

/**
 * Ami Event Emitter
 */
class AmiEventsStream extends Transform{

    constructor(){
        super();
        Object.assign(this, {
            _parser: eventUtils.toObject,
            _rawData: [],
            _sawFirstCrLf: false,
            _buffer: null,
            _lastAmiEvent: null,
            _lastAmiResponse: null,
            _lastAmiAction: null,
            _isEmitted: true
        });
    }

    /**
     *
     * @returns {*}
     */
    getLastEvent(){
        return this._lastAmiEvent;
    }

    /**
     *
     * @returns {*}
     */
    get lastEvent(){
        return this.getLastEvent();
    }

    /**
     *
     * @returns {null}
     */
    getLastResponse(){
        return this._lastAmiResponse;
    }

    /**
     *
     * @returns {null}
     */
    get lastResponse(){
        return this.getLastResponse();
    }

    /**
     *
     * @returns {*}
     */
    getLastAction(){
        return this._lastAmiAction;
    }

    /**
     *
     * @returns {null}
     */
    get lastAction(){
        return this.getLastAction();
    }

    /**
     *
     * @param chunk
     * @param encoding
     * @param done
     * @private
     */
    _transform(chunk, encoding, done){
        let chunkSlice = chunk;

        if(this._rawData.length){
            chunkSlice = Buffer.concat(this._rawData.concat([chunkSlice]));
            this._rawData = [];
        }

        let parseGen = this._parse(chunkSlice);

        while(chunkSlice){
            chunkSlice = parseGen.next(chunkSlice).value;
        }
        done();
    }

    /**
     *
     * @param chunk
     * @private
     */
    _analyzeSimple(chunk){
        let chunkLength = chunk.length;

        for (let i = 0; i < chunkLength; i++) {
            if (chunk[i] === 13 && i + 1 < chunkLength && chunk[i + 1] === 10){
                i++;

                if (this._sawFirstCrLf){
                    this._buffer = chunk.slice(0, i);
                    this._emission(this._buffer);
                    this._sawFirstCrLf = false;
                    return chunk.slice(i);

                }else{
                    this._sawFirstCrLf = true;
                }

            }else{
                this._sawFirstCrLf = false;
            }
        }
        this._rawData.push(chunk.slice(0));
        return null;
    }

    /**
     *
     * @param chunk
     * @private
     */
    _analyzeExtend(chunk){
        let chunkStr = eventUtils.toString(chunk),
            indexOfEnd = chunkStr.indexOf(COMMAND_END);

        if(chunkStr === ''){ return null; }
        
        if(~indexOfEnd){
            this._emission(chunk.slice(0, indexOfEnd + COMMAND_END.length + 1));
            return chunk.slice(indexOfEnd + COMMAND_END.length + 1);
        }
        this._rawData.push(chunk);
        return null;
    }

    /**
     *
     * @returns {null}
     * @private
     */
    * _parse(chunk){
        let chunkSlice = chunk;
        while(chunkSlice){
            chunkSlice = this._isEmitted && !/^Response:\sFollows/i.test(eventUtils.toString(chunkSlice)) ?
                yield this._analyzeSimple(chunkSlice) : yield this._analyzeExtend(chunkSlice);
        }
        return null;
    }

    /**
     *
     * @param eventBuffer
     * @private
     */
    _emission(eventBuffer){
        let eventStr = eventUtils.toString(eventBuffer);

        if(eventStr.length){
            if(/^Event/i.test(eventStr)){
                this._lastAmiEvent = this._parser(eventBuffer);
                this.emit('amiEvent', this._lastAmiEvent);

            }else if(/^Action/i.test(eventStr)){
                this._lastAmiAction = this._parser(eventBuffer);
                this.emit('amiAction', this._lastAmiAction);

            }else{
                this._lastAmiResponse = this._parser(eventBuffer);
                this.emit('amiResponse', this._lastAmiResponse);
            }
            this.push(eventUtils.fromString(eventStr));
        }

        this._isEmitted = true;
        return this;
    }
}

module.exports = AmiEventsStream;