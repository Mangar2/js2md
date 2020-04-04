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

/**
 * Creates a generator to generate descriptions from a parsed file content in json format
 * @param {Object} template generator template
 */
class Generate {
    constructor (template) {
        this._content = undefined
        this._template = template
    }

    /**
     * @private
     * @description
     * Replaces all occurences of search by replacement in str
     * @param {string} str string to replace substrings
     * @param {string} search string to replace
     * @param {string} replacement replacement
     */
    _replaceAll (str, search, replacement) {
        str = str.replace(new RegExp(search + '\\b', 'g'), replacement)
        return str
    }

    /**
     * @private
     * @description
     * Escapes a string for md
     * @param {string} str string to escape
     * @returns {string}
     */
    _escapeString (str) {
        const result = str.split('*').join('\\*')
        return result
    }

    /**
     * @private
     * @description
     * Replaces tags beginning with @ in text by info-values
     * @param {string} text text with elements to replace
     * @param {Object} info replacement infos (key, value)
     */
    _replaceTags (text, info) {
        let result = ''
        if (text !== undefined) {
            result = String(text)
            for (const property in info) {
                const replacement = info[property]
                if (types.isString(replacement)) {
                    const search = '@' + property
                    result = this._replaceAll(result, search, this._escapeString(replacement))
                }
            }
        }
        return result
    }

    /**
     * @private
     * @description
     * Generates base on a template reference
     * @param {Object[]} jsonData content extracted from a file
     * @param {Object} line single line of a generator template
     * @param {boolean} includePrivate true, if private elements shall be generated
     */
    _generateRef (jsonData, line, includePrivate) {
        let result = ''
        const definitions = this._template.$def
        if (definitions !== undefined && line.$ref !== undefined && definitions[line.$ref] !== undefined) {
            result = this._generateByTemplate(jsonData, definitions[line.$ref], true, includePrivate)
        }
        return result
    }

    /**
     * @private
     * @description
     * Generates a text from a template line having a single data element
     * @param {Object} jsonData content extracted from a file formatted in JSON
     * @param {Object} line single line of a generator template
     */
    _generateText (jsonData, line) {
        let result = ''
        if (line.text !== undefined) {
            result = this._replaceTags(line.text, jsonData)
        }
        return result
    }

    /**
     * @private
     * @description
     * Generates a text from a template line having a single data element
     * @param {Object} jsonData content extracted from a file formatted in JSON
     * @param {Object} line single line of a generator template
     * @param {boolean} includePrivate true, if private elements shall be generated
     */
    _generateDetail (jsonData, line, includePrivate) {
        let result = ''
        if (line['for each'] !== undefined && line['iterate on'] !== undefined) {
            let detailData = jsonData[line['iterate on']]
            if (detailData === undefined) {
                detailData = []
            } else if (!types.isArray(detailData)) {
                detailData = [detailData]
            }
            let isFirst = true
            for (const jsonDataElement of detailData) {
                if (jsonDataElement.private === undefined || includePrivate) {
                    result += this._generateByTemplate(jsonDataElement, line['for each'], isFirst, includePrivate)
                    isFirst = false
                }
            }
        }
        return result
    }

    /**
     * @private
     * @description
     * Checks, if data is not undefined and if it is an array, if it is not empty (private elements are not counted)
     * @param {string|array} data data to check for existance
     * @returns {boolean} true, if data "exists"
     */
    _exists (data, includePrivate) {
        let result = data !== undefined
        if (types.isArray(data)) {
            result = false
            for (const element of data) {
                if (element.private === undefined || includePrivate) {
                    result = true
                    break
                }
            }
        }
        return result
    }

    /**
     * @private
     * @description
     * Generates output by appliying content to a template
     * @param {Object} jsonData content extracted from a file formatted in JSON
     * @param {Object[]} template generator template
     * @param {boolean} [isFirst=true] true, if it is the first element and shall not add a separator
     * @param {boolean} [includePrivate=false] true, if private elements shall be included
     */
    _generateByTemplate (jsonData, template, isFirst = true, includePrivate = false) {
        let result = ''
        if (!types.isArray(template)) {
            template = [template]
        }
        if (jsonData !== undefined && (jsonData.private === undefined || includePrivate)) {
            for (const line of template) {
                if (line['if exists'] && !this._exists(jsonData[line['if exists']], includePrivate)) {
                    continue
                }
                if (line['if isfirst'] === true && !isFirst) {
                    continue
                }
                if (line['if isfirst'] === false && isFirst) {
                    continue
                }
                if (!isFirst && line.separator !== undefined) {
                    result += line.separator
                }
                result += this._generateText(jsonData, line)
                result += this._generateDetail(jsonData, line)
                result += this._generateRef(jsonData, line)
            }
        }
        return result
    }

    /**
     * @description
     * Generates output by appliying json formatted file description to a list of templates
     * @param {Object} jsonData content of the file as JSON
     * @param {Object} options generation options
     * @param {boolean} [options.includePrivate=false] set to true to generate private elements
     */
    generate (jsonData, options = { }) {
        let result = ''
        for (const subTemplate of this._template.templates) {
            result += this._generateByTemplate(jsonData, subTemplate, options.includePrivate)
        }
        return result
    }
}

module.exports = Generate
