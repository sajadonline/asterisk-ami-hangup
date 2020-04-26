/**
 * Developer: BelirafoN
 * Date: 22.04.2016
 * Time: 16:37
 */

"use strict";

const Transform = require('stream').Transform;

class FixtureTransformer extends Transform{
    constructor(){
        super();
    }
    _transform(chunk, encoding, done){
        this.push(chunk.toString('utf-8').replace(/\n/g, '\r\n'));
        done();
    }
}

module.exports = FixtureTransformer;