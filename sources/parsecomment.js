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

const { parseThrows, parseReturns, parseTypedef, parseParamLine } = require('./parseparam')
const { parseType } = require('./parsetype')
const { getTextWithNewline, getText, nextDocToken, isDocTag, isDocEndTag, isTextEndTag } = require('./tags')
const { reportError } = require('./reporterror')

/**
 * List of tags not supporint values
 * @private
 */
const _tagsWithoutValue = ['private', 'readonly', 'static']

/**
 * Map to support different writing of the same tag
 * @private
 */
const _tagMap = {
    fileoverview: 'overview',
    file: 'overview',
    return: 'returns',
    exception: 'throws',
    arg: 'param',
    argument: 'param'
}

/**
 * @private
 * @description
 * Parses an example section
 * @param {Tokenizer} tokenizer provides token
 * @returns {string} example section
 */
function _parseExample (tokenizer) {
    const example = getTextWithNewline(tokenizer)
    return example
}

/**
 * @private
 * @description
 * Parses the description part of a comment
 * @param {Tokenizer} tokenizer provides token
 * @param {string} [curDescription] current description entry
 */
function _parseDescription (tokenizer, curDescription) {
    if (curDescription !== undefined) {
        reportError(tokenizer, 'Duplicate description entry')
    }
    const description = getText(tokenizer)
    return description
}

/**
 * @private
 * @description
 * Parses a 'param' tag
 * @param {Tokenizer} tokenizer provides token
 * @param {Object[]} curParam parameters found so far
 * @returns {Object[]} curParam combined with current parameter
 */
function _parseParam (tokenizer, curParam) {
    if (curParam === undefined) {
        curParam = []
    }
    curParam = parseParamLine(tokenizer, curParam)
    return curParam
}

/**
 * @private
 * @description
 * Parses a 'throws' tag
 * @param {Tokenizer} tokenizer provides token
 * @param {Object[]} cur throw commands found so far
 * @returns {Object[]} combined list of throw commands
 */
function _parseThrows (tokenizer, cur) {
    if (cur === undefined) {
        cur = []
    }
    const newThrows = parseThrows(tokenizer)
    cur.push(newThrows)
    return cur
}

/**
 * @private
 * @description
 * Parses all "simple" tags
 * @param {Tokenizer} tokenizer provides token
 * @param {string} tag current tag
 * @returns {string} tag content
 */
function _parseTag (tokenizer, tag) {
    let text = getText(tokenizer)
    if (text !== '' && _tagsWithoutValue.includes(tag)) {
        reportError(tokenizer, 'The @' + tag + ' tag does not permit a value; the value will be ignored')
        text = ''
    }
    if (text === '') {
        text = true
    }
    return text
}

/**
 * @private
 * @description
 * Gets/maps the tag
 * @param {string} token current tag token
 */
function _getTag (token) {
    let tag = token.substr(1)
    const mapped = _tagMap[tag]
    if (mapped !== undefined) {
        tag = mapped
    }
    return tag
}

/**
 * @private
 * @description
 * Extracts the type from a parameter description
 * @param {Tokenizer} tokenizer provides token
 * @param {Object} [curInfo={}] attributes found so far
 * @returns {Object} with property types
 */
function _parseTypeTag (tokenizer, curInfo = {}) {
    const result = parseType(tokenizer, curInfo)
    if (!isTextEndTag(tokenizer.token)) {
        reportError(tokenizer, 'The @type tag does not permit a description; the description will be ignored.')
    }
    return result
}

/**
 * @private
 * @description
 * Parses a typedef entry
 * @param {Tokenizer} tokenizer provides token
 * @param {Object} [curInfo={}] attributes found so far
 * @returns {Object} with property types
 */
function _parseTypedef (tokenizer, curInfo = {}) {
    const typedef = parseTypedef(tokenizer)
    const result = { ...curInfo, ...typedef }
    if (!isTextEndTag(tokenizer.token)) {
        reportError(tokenizer, 'The @typedef tag does not permit a description; the description will be ignored.')
    }
    return result
}

/**
 * @private
 * @description
 * Parses the comment section
 * @param {Tokenizer} tokenizer provides token
 * @returns {Object} object with properties of each comment section
 */
function parseComment (tokenizer) {
    let result = {}
    const description = _parseDescription(tokenizer)
    if (description !== '') {
        result.description = description
    }
    while (!isDocEndTag(tokenizer.token)) {
        const tk = tokenizer.token
        if (isDocTag(tk)) {
            nextDocToken(tokenizer)
            const tag = _getTag(tk)
            switch (tag) {
            case 'param': result.param = _parseParam(tokenizer, result.param); break
            case 'property': result.property = _parseParam(tokenizer, result.property); break
            case 'returns': result.returns = [parseReturns(tokenizer)]; break
            case 'throws': result.throws = _parseThrows(tokenizer, result.throws); break
            case 'descripton': result.description = _parseDescription(tokenizer, result.description); break
            case 'type': result = _parseTypeTag(tokenizer, result); break
            case 'typedef': result = _parseTypedef(tokenizer, result); break
            case 'example': result.example = _parseExample(tokenizer); break
            case 'readonly': result.readonly = true; break
            default: result[tag] = _parseTag(tokenizer, tag); break
            }
        } else {
            nextDocToken(tokenizer)
        }
    }
    nextDocToken(tokenizer)
    return result
}

module.exports = { parseComment }
