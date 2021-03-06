import { readVersionFile, writeVersionFile } from './utils'
import { join } from 'path'
import { versionObjToString } from './version-utils'
import BaseVersionStrategy from './BaseVersionStrategy'
import { IVersionBump } from './interfaces'
import VersionFile = IVersionBump.VersionFile
import BaseVersionStrategyOptions = IVersionBump.BaseVersionStrategyOptions
import ILogger = IVersionBump.ILogger
import VersionStrategyInternalOptions = IVersionBump.VersionStrategyInternalOptions

/**
 * Facade that interfaces to the changelog classes. Main entry point for the command line.
 * See the respective classes for parameter info.
 **/
export default class VersionBumper {
  packageData: VersionFile
  options: BaseVersionStrategyOptions
  strategyInstance: BaseVersionStrategy<BaseVersionStrategyOptions>
  logger: ILogger

  constructor (
    options: BaseVersionStrategyOptions,
    internalOpts?: VersionStrategyInternalOptions
  ) {
    this.options = options
    this.strategyInstance = null
    this.packageData = null
    this.logger = internalOpts?.logger ?? console
  }

  /**
   * Call this first before calling one of the public facing methods.
   * @returns {Promise<void>}
   */
  async initStrategy (Strategy) {
    if (!Strategy) {
      throw new Error(
        'VersionBumper#initStrategy() requires the Strategy parameter'
      )
    }

    this.strategyInstance = new Strategy(this.options, {
      logger: this.logger
    })

    const { projectRoot, versionFile } = this.options

    if (!versionFile) {
      throw new Error('Required option not defined: versionFile')
    }

    if (!projectRoot) {
      throw new Error('Required option not defined: projectRoot')
    }

    this.packageData = await readVersionFile(projectRoot, versionFile, {
      logger: this.logger
    })

    await this.strategyInstance.init({
      currentVersion: this.packageData.version
    })
  }

  /**
   * Runs the procedures to update the version number
   * @returns {Promise<void>}
   */
  async bumpVersion () {
    const { projectRoot, versionFile, onBeforeRelease } = this.options

    if (!this.strategyInstance) {
      throw new Error(
        'VersionBumper#init() was not called before bumpVersion()'
      )
    }

    this.logger.info('Executing strategy...')

    const packageData = this.packageData

    // execute the strategy
    let newVersion = await this.strategyInstance.getNextVersion()

    if (onBeforeRelease) {
      newVersion = await onBeforeRelease(newVersion)
    }

    this.logger.info('Old version:', packageData.version)

    packageData.version = versionObjToString(newVersion)

    this.logger.info('New version:', packageData.version)

    if (this.options.simulate) {
      this.logger.info('Simulate option used. Version file not updated.')
      return
    }

    this.logger.info('Version updated in:', join(projectRoot, versionFile))

    await writeVersionFile(
      projectRoot,
      versionFile,
      // @ts-ignore
      JSON.stringify(packageData, 0, 2) + '\n'
    )
  }
}
