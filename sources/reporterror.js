/**
 * @license
 * This software is licensed under the GNU LESSER GENERAL PUBLIC LICENSE Version 3. It is furnished
 * "as is", without any support, and with no warranty, express or implied, as to its usefulness for
 * any purpose.
 *
 * @author Volker Böhm
 * @copyright Copyright (c) 2020 Volker Böhm
 */
'use strict'

const { nextDocToken } = require('./tags')

/**
 * @private
 * @description
 * Reports an error to console
 * @param {Tokenizer} tokenizer provides token
 * @param {string} errorMessage error message
 * @param {string} [type='Warning'] error type
 */
const reportError = (tokenizer, errorMessage, type = 'Warning') => {
    console.log('%s, file: %s, line: %s, %s', type, tokenizer.filename, tokenizer.lineNo, errorMessage)
}

/**
 * @private
 * @description
 * Checks, if a token is the expected token and skips it. Reports an error message if not
 * @param {Tokenizer} tokenizer provides token
 * @param {string} errorMessage error message
 * @param {string} expected expected token
 * @param {string} [type='Warning'] error type
 * @returns {boolean} true, if the required token is present
 */
const requireToken = (tokenizer, errorMessage, expected, type = 'Warning') => {
    const requiredTokenPresend = tokenizer.token === expected
    if (requiredTokenPresend) {
        nextDocToken(tokenizer)
    } else {
        reportError(tokenizer, errorMessage, type)
    }
    return requiredTokenPresend
}

module.exports = { reportError, requireToken }
