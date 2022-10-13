const chalk = require('chalk')
const stripAnsi = require('strip-ansi')
const table = require('text-table')

function pluralize(word, count) {
  return (count === 1 ? word : `${word}s`)
}

function linkifyPath(path) {
  return (
    '\033]8;;'
    + `file://${path}`
    + '\033\\'
    + `${chalk.underline(path)}`
    + '\033]8;;\033\\'
  )
}

module.exports = function(results) {
  let output = ['\n'],
    errorCount = 0,
    warningCount = 0,
    fixableErrorCount = 0,
    fixableWarningCount = 0,
    summaryColor = 'yellow'

  results.forEach(result => {
    const messages = result.messages

    if (messages.length === 0) {
      return
    }

    errorCount += result.errorCount
    warningCount += result.warningCount
    fixableErrorCount += result.fixableErrorCount
    fixableWarningCount += result.fixableWarningCount

    output.push(linkifyPath(result.filePath), '\n')


    output.push(`${table(
      messages.map(message => {
        let messageType
        if (message.fatal || message.severity === 2) {
          messageType = chalk.red('error')
          summaryColor = 'red'
        } else {
          messageType = chalk.yellow('warning')
        }
        return [
          '',
          message.line || 0,
          message.column || 0,
          messageType,
          message.message.replace(/([^ ])\.$/u, '$1'),
          chalk.dim(message.ruleId || '')
        ]
      }),
      {
        align: ['', 'r', 'l'],
        stringLength(str) {
          return stripAnsi(str).length
        }
      }
    ).split('\n').map(el => el.replace(/(\d+)\s+(\d+)/u, (m, p1, p2) => chalk.dim(`${p1}:${p2}`))).join('\n')}\n\n`)
  })

  const total = errorCount + warningCount

  if (total > 0) {
    output.push(chalk[summaryColor].bold([
      '\u2716 ', total, pluralize(' problem', total),
      ' (', errorCount, pluralize(' error', errorCount), ', ',
      warningCount, pluralize(' warning', warningCount), ')\n'
    ].join('')))

    if (fixableErrorCount > 0 || fixableWarningCount > 0) {
      output.push(chalk[summaryColor].bold([
        '  ', fixableErrorCount, pluralize(' error', fixableErrorCount), ' and ',
        fixableWarningCount, pluralize(' warning', fixableWarningCount),
        ' potentially fixable with the `--fix` option.\n'
      ].join('')))
    }
  }

  // Resets output color, for prevent change on top level
  return total > 0 ? chalk.reset(output.join('')) : ''
}
