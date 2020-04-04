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
 * @description
 * Creates a tokenizer class providing the content of a file token by token
 * @param {string} fileName name of the file
 * @param {string} content file content as string
 */
class Tokenizer {
    constructor (fileName, content) {
        this._filename = fileName
        this._content = content
        this.pos = 0
        this._token = ''
        this._spaces = [' ', '\r']
        this._specialChars = ['\n', '{', '}', '[', ']', '(', ')', '=', '.', ',', '|', '?', '!', ':']
        this._lineNo = 1
        this._lineBegin = 0
    }

    /**
     * Current token
     * @type {string}
     */
    get token () { return this._token }

    /**
     * Name of the file currently processed
     * @type {string}
     */
    get filename () { return this._filename }
    set filename (filename) { this._filename = filename }

    /**
     * Current line number of the input file
     * @type {integer}
     */
    get lineNo () { return this._lineNo }

    /**
     * Current postion in the input text
     * @type {integer}
     */
    get pos () { return this._pos }
    set pos (pos) { this._pos = pos }

    /**
     * @private
     * @description
     * Scipts characters of the input file
     * @param {char[]} scipList scipts chars contained in the char array
     */
    _scip (scipList) {
        for (; this.pos < this._content.length; this.pos++) {
            const curCh = this._content[this.pos]
            if (!scipList.includes(curCh)) {
                break
            }
            this._line += curCh
        }
    }

    /**
     * @private
     * @description
     * Scipts spaces
     */
    _scipSpaces () { this._scip(this._spaces) }

    /**
     * Gets the next token
     * @returns {string} token
     */
    nextToken () {
        this._token = ''
        this._scipSpaces()
        for (; this.pos < this._content.length; this.pos++) {
            const curCh = this._content.charAt(this.pos)
            if (this._specialChars.includes(curCh)) {
                if (this._token === '') {
                    this._token = curCh
                    this.pos++
                }
                break
            }
            if (this._spaces.includes(curCh)) {
                break
            }
            this._token += curCh
        }
        if (this._token === '\n') {
            this._lineNo++
            this._lineBegin = this.pos + 1
        }
        return this._token
    }

    /**
     * @private
     * @description
     * Gets the next char without moving the current-char-pointer
     */
    _peekCh () {
        const ch = this.pos >= this._content.length - 1 ? '' : this._content.charAt(this.pos + 1)
        return ch
    }

    /**
     * Gets the full line without changes
     * @returns {string} line
     */
    scipToEndOfLine () {
        let result = this.token
        let curCh = ''
        while (this.pos < this._content.length) {
            curCh = this._content.charAt(this.pos)
            if (curCh + this._peekCh() === '*/') {
                break
            }
            this.pos++
            result += curCh
            if (curCh === '\n') {
                this._lineNo++
                this._lineBegin = this.pos
                break
            }
        }
        return result
    }

    /**
     * Prints a note, warning or error message
     * @param {string} type type of the message (note, warning, error)
     * @param {string} text text of the message
     */
    printMessage (type, text) {
        console.log('% line: %s, %s', type, this._lineNo, text)
    }
}

module.exports = Tokenizer
