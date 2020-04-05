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
const { requireToken, reportError } = require('./reporterror')

/**
 * @private
 * @description
 * Checks for attributes and adds them to the type description
 * @param {Tokenizer} tokenizer provides token
 * @param {Object} currentType current type description
 */
function _parseAttribute (tokenizer, currentType) {
    const attributeToken = ['?', '!', '.']
    while (attributeToken.includes(tokenizer.token)) {
        if (tokenizer.token === '?') {
            currentType.attributes = 'nullable'
            nextDocToken(tokenizer)
        } else if (tokenizer.token === '!') {
            currentType.attributes = 'non-null'
            nextDocToken(tokenizer)
        }
        let dots = 0
        while (tokenizer.token === '.') {
            dots++
            nextDocToken(tokenizer)
        }
        if (dots === 3) {
            currentType.attributes = 'repeatable'
        }
    }
    return currentType
}

/**
 * @private
 * @description
 * Parses a primitive type definition
 * @param {Tokenizer} tokenizer provides token
 * @returns {string} string representation of the type
 */
function _parsePrimitiveType (tokenizer) {
    const terminatingToken = ['|', ')', '}', '[', ']', '', '*/']
    let result = ''
    while (!terminatingToken.includes(tokenizer.token)) {
        result += tokenizer.token
        if (tokenizer.token === ',') {
            result += ' '
        }
        nextDocToken(tokenizer)
    }
    return result
}

/**
 * @private
 * @description
 * Parses an object in type declaration
 * @param {Tokenizer} tokenizer provides token
 * @returns {string} string representation of the object
 */
function _parseObject (tokenizer) {
    const terminatingToken = ['}', '', '*/']
    let result = ''
    tokenizer.nextToken()
    while (!terminatingToken.includes(tokenizer.token)) {
        result += tokenizer.token
        if (tokenizer.token === ',') {
            result += ' '
        }
        nextDocToken(tokenizer)
    }
    if (requireToken(tokenizer, 'missing } in type object definition', '}')) {
        result = 'Object.\\<' + result + '\\>'
    }
    return result
}

/**
 * @private
 * @description
 * Parses an object in type declaration
 * @param {Tokenizer} tokenizer provides token
 * @param {string} type inner type of array
 * @returns {string} string representation of the object
 */
function _parseArray (tokenizer, type) {
    let result = ''
    tokenizer.nextToken()
    if (requireToken(tokenizer, 'missing ] in type array definition', ']')) {
        result = 'Array.\\<' + type + '\\>'
    }
    return result
}

/**
 * @private
 * @description
 * Parses a single type
 * @param {Tokenizer} tokenizer provides token
 * @returns {string} type description
 */
function _parseSingleType (tokenizer) {
    let result = ''
    if (tokenizer.token === '{') {
        result = _parseObject(tokenizer)
    } else {
        result = _parsePrimitiveType(tokenizer)
    }
    if (tokenizer.token === '[') {
        result = _parseArray(tokenizer, result)
    }
    return result
}

/**
 * @private
 * @description
 * Extracts the type from a parameter description
 * @param {Tokenizer} tokenizer provides token
 * @param {Object} [curInfo={}] attributes found so far
 * @returns {Object} with property types
 */
function parseType (tokenizer, curInfo = {}) {
    const terminatingToken = ['}', '', '*/']
    const illegalToken = [']']
    curInfo.type = ''
    if (tokenizer.token === '{') {
        nextDocToken(tokenizer)
        curInfo = _parseAttribute(tokenizer, curInfo)
        while (!terminatingToken.includes(tokenizer.token)) {
            if (tokenizer.token === '(' || tokenizer.token === ')') {
                nextDocToken(tokenizer)
            } else if (tokenizer.token === '|') {
                curInfo.type += ', '
                nextDocToken(tokenizer)
            } else {
                curInfo.type += _parseSingleType(tokenizer)
            }
            if (illegalToken.includes(tokenizer.token)) {
                reportError(tokenizer, 'unexpected token ' + tokenizer.token)
                nextDocToken(tokenizer)
            }
        }
        requireToken(tokenizer, 'missing } in type definition', '}')
    }
    return curInfo
}

module.exports = { parseType }
