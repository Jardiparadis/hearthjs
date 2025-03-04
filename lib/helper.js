const fs = require('fs')
const path = require('path')

const modeName = {
  dev: 'DEVELOPMENT',
  prod: 'PRODUCTION',
  test: 'TEST'
}

const helper = {
  /**
   * Ask a question to the user and return his response
   * @param {String} question Question to ask
   * @param {Regex} format The format expected for the answer
   * @param {Function} callback
   */
  ask: function (question, format, callback) {
    process.stdin.resume()
    process.stdout.write(question)
    process.stdin.once('data', (data) => {
      // Remove \n
      data = data.toString().slice(0, -1)

      if (format === null || format.test(data)) {
        return callback(data)
      }

      process.stdout.write('It should match ' + format + '\n')
      this.ask(question, format, callback)
    })
  },

  /**
   * Return an object to send to database
   * @param {String} mode Application mode (test, dev or prod)
   * @param {Function} callback
   */
  loadConfForDatabase: function (mode, callback) {
    const _confPath = path.join(process.env.HEARTH_SERVER_PATH, 'config', mode + '.json')

    // Read conf file
    fs.readFile(_confPath, 'utf8', (err, content) => {
      if (err) {
        return callback(err)
      }

      let _conf = {}

      // Parse conf file
      try {
        _conf = JSON.parse(content)
      } catch (e) {
        return callback(e)
      }

      // Transform conf file for database
      const _databaseConf = {
        user: _conf.APP_DATABASE_USERNAME,
        host: _conf.APP_DATABASE_HOST,
        database: _conf.APP_DATABASE_NAME,
        password: _conf.APP_DATABASE_PASSWORD,
        port: _conf.APP_DATABASE_PORT
      }

      return callback(null, _databaseConf)
    })
  },

  /**
   * Create all basic architecture
   * @param {Function} callback
   */
  createArchitecture: function (callback) {
    // Create all directory
    this._createDirectoryIfNotExists(path.join(process.env.HEARTH_SERVER_PATH))
    this._createDirectoryIfNotExists(path.join(process.env.HEARTH_SERVER_PATH, 'lang'))
    this._createDirectoryIfNotExists(path.join(process.env.HEARTH_SERVER_PATH, 'cron'))
    this._createDirectoryIfNotExists(path.join(process.env.HEARTH_SERVER_PATH, 'logs'))
    this._createDirectoryIfNotExists(path.join(process.env.HEARTH_SERVER_PATH, 'migration'))
    this._createDirectoryIfNotExists(path.join(process.env.HEARTH_SERVER_PATH, 'config'))
    this._createDirectoryIfNotExists(path.join(process.env.HEARTH_SERVER_PATH, 'api'))

    // Create base for config file
    this.createDefaultConfigFile('test', (err) => {
      if (err) {
        return callback(err)
      }

      this.createDefaultConfigFile('dev', (err) => {
        if (err) {
          return callback(err)
        }

        this.createDefaultConfigFile('prod', callback)
      })
    })
  },

  /**
   * Create a directory if it does not exist
   * @param {String} path Directory path
   */
  _createDirectoryIfNotExists: function (path) {
    if (fs.existsSync(path) === false) {
      fs.mkdirSync(path)
    }
  },

  /**
   * Write a basic config file
   * @param {String} env test, dev or prod
   * @param {Function} callback
   */
  createDefaultConfigFile: function (env, callback) {
    if (modeName[env] === undefined) {
      return callback(null)
    }

    fs.writeFile(path.join(process.env.HEARTH_SERVER_PATH, 'config', `${env}.json`), JSON.stringify({
      APP_DATABASE_USERNAME: 'postgres',
      APP_DATABASE_HOST: 'localhost',
      APP_DATABASE_NAME: 'db_name',
      APP_DATABASE_PASSWORD: 'password',
      APP_DATABASE_PORT: 5432,
      APP_SERVER_PORT: 8080,
      APP_SERVER_LANG: 'en'
    }, null, 2), callback)
  }
}

module.exports = helper
