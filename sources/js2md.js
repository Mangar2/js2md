#!/usr/bin/env node

/**
 * @license
 * This software is licensed under the GNU LESSER GENERAL PUBLIC LICENSE Version 3. It is furnished
 * "as is", without any support, and with no warranty, express or implied, as to its usefulness for
 * any purpose.
 *
 * @author Volker Böhm
 * @copyright Copyright (c) 2020 Volker Böhm
 * @overview This module provides a parser and a generator to parse JSDOC tags in
 * JavaScript files and generates a markdown based on a user-defined template. It scans the
 * provided directory and generates one markdown file for all .js files in this directory
 * @example
 * ## jsmddoc directory outputfile --json jsonFile --template templateFile
 * jsmddoc . README.md --json writeJSONFormatHere --template useMyOwnTemplate
 */
'use strict'

const Tokenizer = require('./tokenizer')
const Parse = require('./parse')
const Generate = require('./generate')
const types = require('@mangar2/types')

const fs = require('fs')
const path = require('path')

/**
 * @private
 * @description
 * Gets the command line parameters as object (Key/value)
 * @param {Array} requiredArgs list of required arguments
 * @param {Array} whiteList list of supported additional arguments (--name value)
 * @returns {Object} object with key/value
 */
function getCommandLineParameters (requiredArgs = [], whiteList = []) {
    const result = {}
    const args = [...process.argv]
    // remove executable and file
    args.shift()
    args.shift()
    let argName
    for (argName of requiredArgs) {
        if (!types.isString(args[0]) || args[0].startsWith('--')) {
            break
        }
        result[argName] = args.shift()
    }
    for (const argument of args) {
        if (argument.startsWith('--')) {
            argName = argument.substring(2)
            result[argName] = ''
        } else if (types.isString(argName) && whiteList.includes(argName)) {
            result[argName] = argument
        }
    }
    return result
}

/**
 * @private
 * @description
 * Reads a directory and sorts it
 * @param {string} directory directory to read and sort files
 * @returns {promise} sorted list of files
 */
function readDir (directory) {
    const directoryContent = fs.readdirSync(directory)
    return directoryContent
}

/**
 * @private
 * @description
 * Parses the input files
 * @param {string} directory directory to search files
 * @returns {Object} documentation file content in JSON format
 */
function parseInput (directory) {
    const files = readDir(directory)
    let result = {}

    for (const file of files) {
        if (file.endsWith('.js')) {
            const pathAndName = path.join(directory, file)
            console.log('Parsing file %s', pathAndName)
            const content = fs.readFileSync(pathAndName, 'utf-8')
            const tokenizer = new Tokenizer(file, content)
            const parse = new Parse(tokenizer)
            result = parse.getJSON(result)
        }
    }
    return result
}

/**
 * Writes the JSON document output to a file
 * @param {Object} parameter command line parameter
 * @param {string} parameter.json filename to print the json output
 * @param {Object} documentationObject documentation data
 */
function writeJSON (parameters, documentationObject) {
    if (types.isString(parameters.json)) {
        fs.writeFileSync(parameters.json, JSON.stringify(documentationObject, null, 2))
    }
}

/**
 * Writes the JSON document output to a file
 * @param {Object} parameter command line parameter
 * @param {string} parameter.json filename to print the json output
 * @param {Object} documentationObject documentation data
 */
function writeMarkdown (parameters, documentationObject) {
    let template
    if (types.isString(documentationObject.template)) {
        template = fs.readFileSync(documentationObject.template)
    } else {
        template = require('./template.json')
    }

    const generate = new Generate(template)
    const documentationText = generate.generate(documentationObject)
    if (types.isString(parameters.json)) {
        fs.writeFileSync(parameters.json, JSON.stringify(documentationObject, null, 2), { flag: 'w' })
    }
    if (parameters.outputFile === undefined) {
        console.log(documentationText)
    } else {
        const outputFile = parameters.outputFile
        fs.writeFileSync(outputFile, documentationText, { flag: 'w' })
    }
}

/**
 * Main program, reads configuration, reads documentation from input files and generates
 * output files
 */
function main () {
    const parameters = getCommandLineParameters(['directory', 'outputFile'], ['json', 'template'])

    if (parameters.directory === undefined) {
        parameters.directory = __dirname
    }

    const documentationObject = parseInput(parameters.directory)

    writeJSON(parameters, documentationObject)
    writeMarkdown(parameters, documentationObject)
}

main()
