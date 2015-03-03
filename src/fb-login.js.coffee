FBLogin =
  version: "0.1.0"

  # Method to generate promises. Change it if you want.
  _Promise: -> $.Deferred()

  # Check if user is logged in.
  # Will return a promise to resolve if user is logged in,
  # reject if they're not.
  #
  # @param [Promise] Promise to be passed, optional.
  # @return [Promise] Promise to settle.
  ensureLogin: (promise) ->
    promise ||= @_Promise()

    FB.getLoginStatus (response) ->
      if response.status == "connected"
        promise.resolve()
      else
        promise.reject()

    promise.promise()

  getPermission: (permission, promise, opts) ->
    promise ||= @_Promise()
    params = {return_scopes: true, scope: permission}

    if opts && opts.rerequest
      params.auth_type = "rerequest"

    FB.login (response) ->
      unless response.authResponse
        promise.reject()
        return

      if permission in response.authResponse.grantedScopes.split(',')
        promise.resolve()
      else
        promise.reject()
    , params

    promise

  # Ensure user has permission. If they don't, go get it.
  #
  # @param [String] permission to ensure
  # @return [Promise] to be resolved if permission is granted
  ensurePermission: (permission) ->
    promise = @_Promise()

    login = @ensureLogin()

    login.done ->
      FB.api '/me/permissions', (response) ->
        if response.data
          if result = _.where(response.data, {permission: permission})[0]
            if result.status == "granted"
              return promise.resolve()
            else
              return FBLogin.getPermission(permission, promise, rerequest: true)

        FBLogin.getPermission(permission, promise)

    login.fail ->
      FBLogin.getPermission(permission, promise)

    promise.promise()

  # Log user out of app. Useful for debugging.
  # Will print result on the console.
  logout: ->
    FB.api '/me/permissions', 'delete', {}, (success) ->
      if success
        console.info "FBLogin: Logged out of app"
      else
        console.info "FBLogin: Logout failed"

    return

window.FBLogin = FBLogin
