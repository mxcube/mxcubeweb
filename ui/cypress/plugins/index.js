module.exports = (on, config) => {
  /** the rest of your plugins... **/
  require('cypress-log-to-output').install(on)
  // or, if there is already a before:browser:launch handler, use .browserLaunchHandler inside of it
  // @see https://github.com/flotwig/cypress-log-to-output/issues/5
}
