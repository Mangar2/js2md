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
 * @private
 * @description
 * Checks, if a token is a documentation begin tag
 * @param {string} tk token to check
 * @returns {boolean}
 */
function isDocBeginTag (tk) {
    return tk === '/**'
}

/**
 * @private
 * @description
 * Checks, if a token is a tag beginning with @
 * @param {string} tk token to check
 * @returns {boolean} true, if the token is a "doc-tag"
 */
function isDocTag (tk) {
    return tk.charAt(0) === '@' && tk.length > 1
}

/**
 * @private
 * @description
 * Checks, if a token is a documentation end tag
 * @param {string} tk token to check
 * @returns {boolean}
 */
function isDocEndTag (tk) {
    return tk === '*/' || tk === ''
}

/**
 * @private
 * @description
 * Checks, it the tag is a text end tag
 * @param {string} tk current token
 * @returns {boolean} true, if the current token ends the text part of a description component
 */
function isTextEndTag (tk) {
    return isDocTag(tk) || isDocEndTag(tk)
}

/**
 * @private
 * @description
 * Skips the line break of a documentation line block including the \n and the starting '*'
 * @param {Tokenizer} tokenizer provides the token
 * @returns {string} next Token
 */
function nextDocToken (tokenizer) {
    let tk = tokenizer.nextToken()
    while (tk === '\n') {
        tk = tokenizer.nextToken()
        if (tk === '*') {
            tk = tokenizer.nextToken()
        }
    }
    return tk
}

/**
 * @private
 * @description
 * Gets the text of a jsdoc comment
 * @param {Tokenizer} tokenizer provides the token
 * @returns {string} the documentation text
 */
function getText (tokenizer) {
    let result = ''
    let firstEnumeration = true
    let skipSpace = false
    while (!isTextEndTag(tokenizer.token)) {
        if (result !== '' && !skipSpace) {
            result += ' '
        }
        skipSpace = false
        result += tokenizer.token
        tokenizer.nextToken()
        while (tokenizer.token === '\n') {
            if (tokenizer.nextToken() === '*') {
                if (tokenizer.nextToken() === '-') {
                    result += firstEnumeration ? '\n\n' : '\n'
                    firstEnumeration = false
                    skipSpace = true
                }
            }
        }
    }
    return result
}

/**
 * @private
 * @description
 * Removes documentation chars ('*' and ' ') from the beginning of the line
 * @param {string} line
 * @returns {string} line, without '*'
 */
function _removeDocLineStart (line) {
    const test = String(line).trimLeft()
    if (test.startsWith('* ')) {
        line = test.slice(2)
    } else if (test.startsWith('*')) {
        line = test.slice(1)
    }
    return line
}

/**
 * @private
 * @description
 * Gets the text of a jsdoc comment keeping newline
 * @param {Tokenizer} tokenizer provides the token
 * @returns {string} the documentation text
 */
function getTextWithNewline (tokenizer) {
    let result = ''
    while (!isTextEndTag(tokenizer.token)) {
        const curPos = tokenizer.pos
        const line = _removeDocLineStart(tokenizer.scipToEndOfLine())
        const isNewDocCommand = line.startsWith('@')
        if (isNewDocCommand) {
            tokenizer.pos = curPos
            nextDocToken(tokenizer)
            break
        }
        result += line
        nextDocToken(tokenizer)
    }
    result = result.trimRight()
    return result
}

module.exports = { getText, getTextWithNewline, nextDocToken, isDocBeginTag, isDocTag, isDocEndTag, isTextEndTag }
