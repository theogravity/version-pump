import { parseSemVer } from 'semver-parser'

export default class BaseVersionStrategy {
  /**
   * The strategy name used for calling the strategy in the cli and configuration file.
   * @type {string}
   */
  static strategyShortName = 'base'

  /**
   * @param {object} options Options generated by ConfigParser
   * @param {object} logger Custom logging object
   */
  constructor (options = {}, { logger } = { logger: console }) {
    this.currentVersion = null
    this.options = options
    this.logger = logger
  }

  /**
   * Returns an object used for logging
   * @return {Object}
   */
  getLogger () {
    return this.logger
  }

  /**
   * This is called before getNextVersion() in `VersionBump.js`.
   *
   * - Parses string version data into an object
   * - Parses options specific to the strategy
   * @param {string} currentVersion Version number eg '1.2.3'
   */
  async init ({ currentVersion }) {
    if (!currentVersion) {
      throw new Error('Strategy init is missing currentVersion')
    }

    this.currentVersion = parseSemVer(currentVersion)
  }

  /**
   * Describes the options specific to the strategy in the CLI.
   * It is called as part of the CLI / plugin tooling.
   *
   * See https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
   *
   * Note: handler is not available, and will be overwritten if defined.
   *
   * @return {{command: string, describe: string, builder: object}}
   */
  static getCommandConfig () {
    return {
      command: '',
      describe: '',
      builder: (yargs) => {}
    }
  }

  /**
   * Get the high-level options like fileVersion, etc.
   * @return {object}
   */
  getOptions () {
    return this.options || {}
  }

  /**
   * Returns a structure that contains metadata about the parsed version.
   * @returns {Object} Result of semver-parser#parseSemVer
   */
  getCurrentVersion () {
    return this.currentVersion
  }

  /**
   * Returns the next release version to update the versionFile with.
   * Use getCurrentVersion() to get an object to work with.
   * @returns {Promise<object>} An updated object that was originally defined by getCurrentVersion()
   */
  async getNextVersion () {
    throw new Error('getNextVersion() is not implemented')
  }
}
