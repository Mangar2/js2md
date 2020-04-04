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

const VERBOSE = true
const TestRun = require('@mangar2/testrun')
const Parse = require('../parse.js')
const Tokenizer = require('../tokenizer')

const testRun = new TestRun(VERBOSE)

testRun.on('prepare', (testCase) => {
})

testRun.on('break', (test, prepared) => {
    const tokenizer = new Tokenizer('test', test.input)
    const parse = new Parse(tokenizer)
    const result = parse.getJSON()
    testRun.unitTest.assertDeepEqual(result.class, result.class)
    console.log(JSON.stringify(result, null, 2))
})

testRun.on('run', (test, prepared) => {
    const tokenizer = new Tokenizer('test', test.input)
    const parse = new Parse(tokenizer)
    const result = parse.getJSON()
    return result
})

testRun.on('validate', (test, result, path) => {
    for (const property in test.expected) {
        const expected = test.expected[property]
        const testResult = testRun.unitTest.assertDeepEqual(expected, result[property], '[' + property + '] ' + path)
        if (!testResult) {
            testRun.runAgain()
        }
    }
})

function testParse () {
    testRun.run([
        'basics',
        'meta',
        'parameter',
        'class',
        'type',
        'function',
        'member',
        'typedef',
        'example',
        'callback'
    ], __dirname)
}

testParse()

testRun.unitTest.showResult(63)
