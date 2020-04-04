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

const { getText, nextDocToken, isDocEndTag } = require('./tags')
const { parseType } = require('./parsetype')
const { reportError } = require('./reporterror')
const types = require('@mangar2/types')

/**
 * @private
 * @description
 * Searches a parameter with a dedicated name from a list of parameters
 * @param {string} name name of the parameter we are looking for
 * @param {Object[]} parameterList list of parameter definitions
 * @returns {Object} parameter having the searched name
 */
function _getParameter (name, parameterList) {
    let result
    for (const param of parameterList) {
        if (param.name === name) {
            result = param
            break
        }
    }
    return result
}

/**
 * @private
 * @description
 * Copies all non empty properties form source to target
 * @param {Object} target target object
 * @param {Object} source source object
 * @returns {Object} target object with additional copied properties
 */
function _copyNonEmptyProperties (target, source) {
    for (const property in source) {
        if (source[property] !== undefined && source[property] !== '') {
            target[property] = source[property]
        }
    }
    return target
}

/**
 * @private
 * @description
 * Unifies the properties of all parameter descriptions by adding empty properties
 * if any other parameter has this property
 * @param {Object[]} parameterList list of parameter descriptions
 */
function _unifyParameterProperties (parameterList) {
    const existingProperties = {}
    for (const parameter of parameterList) {
        for (const property in parameter) {
            if (types.isString(parameter[property])) {
                existingProperties[property] = true
            }
        }
    }
    for (const parameter of parameterList) {
        for (const property in existingProperties) {
            if (parameter[property] === undefined) {
                parameter[property] = ''
            }
        }
    }
}

/**
 * @private
 * @description
 * Adds a parameter recursively in the parameter tree
 * @param {string[]} nameList list of name components
 * @param {Object} paramProperties parameter attributes like type and attributes
 * @param {Object[]} parameterList current list of parameters
 */
function _addParameterRec (nameList, paramProperties, parameterList) {
    const name = nameList.shift()
    let parameter = _getParameter(name, parameterList)
    if (parameter === undefined) {
        parameter = { name }
        parameterList.push(parameter)
    }
    if (nameList.length > 0) {
        if (parameter.param === undefined) {
            parameter.param = []
        }
        parameter.param = _addParameterRec(nameList, paramProperties, parameter.param)
    } else {
        _copyNonEmptyProperties(parameter, paramProperties)
        _unifyParameterProperties(parameterList)
    }
    return parameterList
}

/**
 * @private
 * @description
 * parses a default value
 * @param {Tokenizer} tokenizer provides token
 * @returns {string}
 */
function _parseDefault (tokenizer) {
    let defaultValue = ''
    let spacer = ''
    if (tokenizer.token === '=') {
        nextDocToken(tokenizer)
        while (tokenizer.token !== ']' && tokenizer.token !== '' && !isDocEndTag(tokenizer.token)) {
            defaultValue += spacer + tokenizer.token
            spacer = ' '
            nextDocToken(tokenizer)
        }
    }
    return defaultValue
}

/**
 * @private
 * @description
 * Parses the attributes of a parameter
 * @param {Tokenizer} tokenizer provides tokens
 * @param {string} [curAttributes] attributes found so far
 * @returns {string}
 */
function _parseAttribute (tokenizer, curAttributes) {
    if (curAttributes === undefined) {
        curAttributes = ''
    }
    if (tokenizer.token === '[') {
        if (curAttributes !== '') {
            curAttributes += ', '
        }
        curAttributes += 'optional'
        nextDocToken(tokenizer)
    }
    return curAttributes
}

/**
 * @private
 * @description
 * Extracts the name from the parameter line
 * @param {Tokenizer} tokenizer provides token
 * @returns {string[]} array of name chunks
 */
function _parseName (tokenizer, curInfo) {
    const result = []
    const breakToken = ['=', ']', '']
    while (!breakToken.includes(tokenizer.token) && !isDocEndTag(tokenizer.token)) {
        result.push(tokenizer.token)
        nextDocToken(tokenizer)
        if (tokenizer.token !== '.') {
            break
        }
        nextDocToken(tokenizer)
    }
    return result
}

/**
 * @private
 * @description
 * Parses the documentation
 * @param {Tokenizer} tokenizer provides token
 * @retunrs {string}
 */
function _parseDescription (tokenizer) {
    const documentation = getText(tokenizer)
    return documentation
}

/**
 * @private
 * @description
 * Parses a 'param' tag
 * @param {Tokenizer} tokenizer provides token
 * @param {Object[]} paramList current List of parameter
 * @returns {Object[]} list of parameter including new parameter
 */
function parseParamLine (tokenizer, paramList) {
    const paramProperties = parseType(tokenizer, {})
    paramProperties.attributes = _parseAttribute(tokenizer, paramProperties.attributes)
    const nameList = _parseName(tokenizer)
    paramProperties.default = _parseDefault(tokenizer)
    if (tokenizer.token === ']') {
        nextDocToken(tokenizer)
    } else if (paramProperties.attributes === '<optional>') {
        reportError(tokenizer, '] expected')
    }
    paramProperties.description = _parseDescription(tokenizer)
    paramList = _addParameterRec(nameList, paramProperties, paramList)
    return paramList
}

/**
 * @private
 * @description
 * Parses a 'return' tag
 * @param {Tokenizer} tokenizer provides token
 * @returns {Object[]} type and documentation
 */
function parseReturns (tokenizer) {
    const returns = parseType(tokenizer)
    returns.description = _parseDescription(tokenizer)
    return returns
}

/**
 * @private
 * @description
 * Parses a 'throw' tag
 * @param {Tokenizer} tokenizer provides token
 * @returns {Object[]} type and documentation
 */
function parseThrows (tokenizer) {
    const throws = parseType(tokenizer)
    throws.description = _parseDescription(tokenizer)
    return throws
}

/**
 * @private
 * @description
 * Parses a 'throw' tag
 * @param {Tokenizer} tokenizer provides token
 * @returns {Object[]} type and documentation
 */
function parseTypedef (tokenizer) {
    const typedef = parseType(tokenizer)
    typedef.typedef = _parseName(tokenizer)
    if (types.isArray(typedef.typedef)) {
        // names separated by '.' are not allowed
        typedef.typedef = typedef.typedef[0]
    } else {
        reportError(tokenizer, 'typedef without name')
    }
    return typedef
}

module.exports = { parseThrows, parseReturns, parseTypedef, parseParamLine }
