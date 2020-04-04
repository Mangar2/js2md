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
 * List of supported element types
 * @private
 */
const elementTypes = ['class', 'function', 'typedef', 'callback', 'method', 'member']

/**
 * @private
 * @description
 * Result tree containing the results of JS file parsing parsing
 */
class ParseResult {
    constructor () {
        this.file = []
    }

    /**
     * @private
     * @description
     * The type of an element is derived by its properties. It is - for example - a class
     * if it has a property "class" with value true
     * @param {Object} element object to evaluate
     * @returns {string} element type
     */
    _getType (element) {
        let result
        for (const property of elementTypes) {
            if (element[property] !== undefined) {
                result = property
                break
            }
        }
        return result
    }

    /**
     * @private
     * @description
     * Adds an element to the parent object and returns the new parent
     * @param {Object} element object to add
     * @param {Object} parent parent object
     * @param {string} property property of the parent to add the element to
     * @returns {Object} modified parent
     */
    _addToParent (element, parent, property) {
        if (parent[property] === undefined) {
            parent[property] = []
        }
        parent[property].push(element)
        parent[property].sort((child1, child2) => {
            if (child1.name < child2.name) return -1
            if (child1.name > child2.name) return 1
            return 0
        })
    }

    /**
     * @private
     * @description
     * Adds an element to a class
     * @param {Object} element element to add
     */
    _addToClass (element) {
        const type = this._getType(element)
        if (type === undefined) {
            return
        }
        if (this.class === undefined) {
            this.class = []
        }
        let parentClass
        for (const classDoc of this.class) {
            if (element.memberOf === classDoc.name) {
                parentClass = classDoc
                break
            }
        }
        if (parentClass !== undefined) {
            this._addToParent(element, parentClass, type)
        }
    }

    /**
     * Adds a new element to the parse result tree
     * @param {Object} element element to add
     * @param {string} filename name of the current file
     */
    add (element, filename) {
        if (element.memberOf !== undefined) {
            this._addToClass(element)
        } else {
            const type = this._getType(element)
            if (type !== undefined) {
                this._addToParent(element, this, type)
            } else {
                element.filename = filename
                this._addToParent(element, this, 'file')
            }
        }
    }
}

module.exports = ParseResult
