/**
 * Developer: Alex Voronyansky <belirafon@gmail.com>
 * Date: 16.03.2015
 * Time: 18:33
 */

'use strict';

/**
 *  Asterisk authorization errorLog
 */
class AmiAuthError extends Error{

    constructor(message){
        super(message);
        this.message = message;
        this.name = AmiAuthError;
    }
}

module.exports = AmiAuthError;