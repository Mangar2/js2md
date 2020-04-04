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

const types = require('@mangar2/types')
const { parseJS, addString } = require('./parsejs')
const { nextDocToken, isDocBeginTag } = require('./tags')
const { parseComment } = require('./parsecomment')
const ParseResult = require('./parseresult.js')

/**
 * @description
 * Creates a java script document parser extracting documentation from a JavaScript file
 * @param {Tokenizer} tokenizer tokenizer class to read file and provide its content in tokens
 */
class Parse {
    constructor (tokenizer) {
        this._tokenizer = tokenizer
        this._indent = 0
    }

    /**
     * @private
     * @description
     * Unifies the string properties of a list of objects by adding
     * empty string properties to any object missing any property that any other
     * object has
     * @param {Object[]} objectList list of objects
     */
    _unifyProperties (objectList) {
        const existingProperties = {}
        if (objectList !== undefined) {
            for (const parameter of objectList) {
                for (const property in parameter) {
                    if (types.isString(parameter[property])) {
                        existingProperties[property] = true
                    }
                }
            }
            for (const parameter of objectList) {
                for (const property in existingProperties) {
                    if (parameter[property] === undefined) {
                        parameter[property] = ''
                    }
                }
            }
        }
    }

    /**
     * @private
     * @description
     * Unifies the string properties of a list of objects by adding
     * empty string properties to any object missing any property that any other
     * object has
     * @param {Object[]} classList list of class definitions
     */
    _unifyClassProperties (classList) {
        if (classList !== undefined) {
            for (const classDef of classList) {
                this._unifyProperties(classDef.member)
            }
        }
    }

    /**
     * @private
     * @description
     * Calculate the attributes and join them in one tag
     * @param {Object} comment all comment tags identified.
     * @returns {Object} comment object with new "attributes" tag containing all the attributes
     */
    _createAttributesTag (comment) {
        const attributeTags = ['static', 'readonly', 'async']
        for (const property in comment) {
            if (attributeTags.includes(property) && comment[property] === true) {
                comment.attributes = addString(comment.attributes, property)
            }
        }
        return comment
    }

    /**
     * @private
     * @description
     * Joins the properties of object2 to object1, if both have a string property
     * with the same name, the strings are concatenated
     * Corrects also funtions having a class tag in the documentation above to be classes
     * @param {Object} comment first object to join, got from "comment" section
     * @param {Object} jsInfo second object to join, parsed from javascript code
     * @returns {Object} object1 with added properties
     */
    _joinObjects (comment, jsInfo) {
        const typeTags = ['function', 'class', 'member', 'method']
        let hasType = false
        for (const type of typeTags) {
            if (comment[type] !== undefined) {
                hasType = true
            }
        }
        for (const property in jsInfo) {
            const value = jsInfo[property]
            if (typeTags.includes(property) && hasType) {
                // type tags overwrite detected types
                continue
            }
            if (comment[property] === undefined && value !== undefined) {
                comment[property] = value
            }
        }
        comment = this._createAttributesTag(comment)
        return comment
    }

    /**
     * @description
     * Creates a JSON structure of the file comments
     * @param {Object} parseResult result of the former files
     * @returns {Object} file comments
     */
    getJSON (parseResult) {
        if (parseResult === undefined) {
            parseResult = new ParseResult()
        }

        let parent = null
        this._tokenizer.nextToken()
        while (this._tokenizer.token !== '') {
            if (isDocBeginTag(this._tokenizer.token)) {
                nextDocToken(this._tokenizer)
                const comment = parseComment(this._tokenizer)
                const jsInfo = parseJS(this._tokenizer, parent !== null)
                const fullInfo = this._joinObjects(comment, jsInfo)
                if (jsInfo.class) {
                    parent = fullInfo.name
                } else if (parent !== null && fullInfo.memberOf === undefined) {
                    fullInfo.memberOf = parent
                }
                parseResult.add(fullInfo, this._tokenizer.filename)
            } else {
                nextDocToken(this._tokenizer)
            }
        }
        this._unifyClassProperties(parseResult.class)
        return parseResult
    }
}

module.exports = Parse
