(function() {
  var FBLogin,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  FBLogin = {
    version: "0.1.0",
    _Promise: function() {
      return $.Deferred();
    },
    ensureLogin: function(promise) {
      promise || (promise = this._Promise());
      FB.getLoginStatus(function(response) {
        if (response.status === "connected") {
          return promise.resolve();
        } else {
          return promise.reject();
        }
      });
      return promise.promise();
    },
    getPermission: function(permission, promise, opts) {
      var params;
      promise || (promise = this._Promise());
      params = {
        return_scopes: true,
        scope: permission
      };
      if (opts && opts.rerequest) {
        params.auth_type = "rerequest";
      }
      FB.login(function(response) {
        if (!response.authResponse) {
          promise.reject();
          return;
        }
        if (indexOf.call(response.authResponse.grantedScopes.split(','), permission) >= 0) {
          return promise.resolve();
        } else {
          return promise.reject();
        }
      }, params);
      return promise;
    },
    ensurePermission: function(permission) {
      var login, promise;
      promise = this._Promise();
      login = this.ensureLogin();
      login.done(function() {
        return FB.api('/me/permissions', function(response) {
          var result;
          if (response.data) {
            if (result = _.where(response.data, {
              permission: permission
            })[0]) {
              if (result.status === "granted") {
                return promise.resolve();
              } else {
                return FBLogin.getPermission(permission, promise, {
                  rerequest: true
                });
              }
            }
          }
          return FBLogin.getPermission(permission, promise);
        });
      });
      login.fail(function() {
        return FBLogin.getPermission(permission, promise);
      });
      return promise.promise();
    },
    logout: function() {
      FB.api('/me/permissions', 'delete', {}, function(success) {
        if (success) {
          return console.info("FBLogin: Logged out of app");
        } else {
          return console.info("FBLogin: Logout failed");
        }
      });
    }
  };

  window.FBLogin = FBLogin;

}).call(this);
