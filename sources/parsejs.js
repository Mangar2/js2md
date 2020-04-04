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

/**
 * List of reserved word in JavaScript, they are not concidered as names
 * @private
 */
const reservedWords = [
    'abstract', 'arguments', 'await', 'boolean', 'break', 'byte',
    'case', 'catch', 'char', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends',
    'false', 'final', 'finally', 'float', 'for', 'function', 'goto',
    'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface',
    'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public',
    'return', 'short', 'static', 'super', 'switch', 'synchronized',
    'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof',
    'var', 'void', 'volatile', 'while', 'with', 'yield']

/**
 * @private
 * @description
 * Parses a class tag
 * @param {Tokenizer} tokenizier class providing tokens
 */
function _parseClass (tokenizer) {
    const className = tokenizer.nextToken()
    return { class: true, name: className }
}

/**
 * @private
 * @description Adds one string to another
 * @param {string|undefined} curText current string
 * @param {string} addText string to add
 */
function addString (curText, addText) {
    let result = curText
    if (curText === undefined) {
        result = addText
    } else if (!curText.includes(addText)) {
        result = curText + ' ' + addText
    }
    return result
}

/**
 * @private
 * @description
 * Parses and skips all kind of prefixes
 * @param {Tokenizer} tokenizier class providing tokens
 */
function _parsePrefixes (tokenizer) {
    const result = {}
    const prefixes = ['static', 'async', 'const', 'var', 'let', '=', 'module', 'exports', '.', '\n']
    while (prefixes.includes(tokenizer.token)) {
        switch (tokenizer.token) {
        case 'async': result.async = true; break
        case 'static': result.static = true; break
        case 'const': result.readonly = true; break
        }
        tokenizer.nextToken()
    }
    return result
}

/**
 * @private
 * @description
 * Parses a method tag
 * @param {Tokenizer} tokenizier class providing tokens
 * @returns {object} information about the function/method
 */
function _parseMember (tokenizer) {
    const result = { }
    const prefixes = ['get', 'set']
    while (prefixes.includes(tokenizer.token)) {
        tokenizer.nextToken()
    }
    const name = tokenizer.token
    tokenizer.nextToken()
    if (tokenizer.token === '(' && name !== '') {
        result.member = true
        result.name = name
    }
    return result
}

/**
 * @private
 * @description
 * Parses a method tag
 * @param {Tokenizer} tokenizier class providing tokens
 * @returns {object} information about the method
 */
function _parseMethod (tokenizer) {
    const result = { }
    const name = tokenizer.token
    tokenizer.nextToken()
    if (tokenizer.token === '(' && name !== '') {
        result.method = true
        result.name = name
        tokenizer.nextToken()
    }
    return result
}

/**
 * @private
 * @description
 * Parse a namepath (like Class.prototype.myname)
 * @param {Tokenizer} tokenizier class providing tokens
 * @returns {{memberOf: string, name: string}} name including memberOf information, if present
 */
function _parseNamePath (tokenizer) {
    let result
    if (!reservedWords.includes(tokenizer.token)) {
        result = { name: tokenizer.token }
        tokenizer.nextToken()
    }
    while (tokenizer.token === '.') {
        tokenizer.nextToken()
        if (tokenizer.token !== 'prototype') {
            if (result.memberOf === undefined) {
                result.memberOf = result.name
            }
            result.name = tokenizer.token
        }
        tokenizer.nextToken()
    }
    return result
}

/**
 * @private
 * @description
 * Parses a method tag
 * @param {Tokenizer} tokenizier class providing tokens
 * @returns {object} information about the function/method
 */
function _parseFunction (tokenizer) {
    let result = { }
    let namePath = _parseNamePath(tokenizer)
    while (['=', ':'].includes(tokenizer.token)) {
        tokenizer.nextToken()
    }
    if (tokenizer.token === 'function') {
        tokenizer.nextToken()
    }
    if (namePath === undefined) {
        namePath = _parseNamePath(tokenizer)
    }
    if (tokenizer.token === '(' && namePath !== undefined) {
        result = namePath
        if (result.memberOf !== undefined) {
            result.method = true
        } else {
            result.function = true
        }
    }
    return result
}

/**
 * @private
 * @description
 * Parses the JavaScript elements of a file to document
 * @param {Tokenizer} tokenizier class providing tokens
 * @param {boolean} inClass true, if we are inside a class definition
 */
function parseJS (tokenizer, inClass) {
    let result = _parsePrefixes(tokenizer)
    let nameAndType = {}

    switch (tokenizer.token) {
    case 'class': nameAndType = _parseClass(tokenizer); break
    case 'function': nameAndType = _parseFunction(tokenizer, 'function'); break
    case 'set':
    case 'get': nameAndType = _parseMember(tokenizer); break
    case '/**': break
    default:
        if (inClass) {
            nameAndType = _parseMethod(tokenizer); break
        } else {
            nameAndType = _parseFunction(tokenizer, 'function'); break
        }
    }
    result = { ...result, ...nameAndType }
    return result
}

module.exports = { parseJS, addString }
