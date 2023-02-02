class HttpError extends Error {
  constructor (message, httpCode) {
    super(message)
    this.httpCode = httpCode
  }
}

module.exports = {
  HttpError,
}
