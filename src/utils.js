const debug = require('debug')
const requestify = require('requestify')

const debugBase = debug('email-verifier:base')

const debugRequest = (debugInstance, req) => {
  debugInstance(`
    Receiving ${req.path} request from ${req.headers.origin}
    body: ${JSON.stringify(req.body || {})}
    queryParams: ${JSON.stringify(req.query)}
    `)
}

const sendRequest = async (
  { url, method, form, body, params },
  errorMessage,
) => {
  debugBase(`
    Sending request to
    url: ${url}
    method: ${method}
    body: ${JSON.stringify(body)}
    params: ${JSON.stringify(params)}
    `)

  try {
    const response = await requestify.request(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      form,
      body,
      params,
    })

    const responseBody = response.getBody()

    debugBase(`
      Success from : ${url}
      responseBody: ${JSON.stringify(responseBody)}
    `)

    return responseBody
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      throw new Error(errorMessage)
    } else {
      const message = e.body || e.message
      throw new Error(message)
    }
  }
}

module.exports = {
  debugBase,
  debugRequest,
  sendRequest,
}
