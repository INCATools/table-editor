export default app => {
  window.INCAFormVersion = '0.0.10';

  app.config(['$httpProvider', function config($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.defaults.useXDomain = true;
  }]);

  // app.config( ['$provide', function ($provide) {
  //     $provide.decorator('$browser', ['$delegate', function ($delegate) {
  //         $delegate.onUrlChange = function(newUrl, newState) {
  //         };
  //         $delegate.url = function (url) {
  //                                       return '';
  //                                     };
  //         return $delegate;
  //     }]);
  // }]);

  //
  // For some reason, $location isn't working properly in changing the URL bar, so
  // I disabled it. I think that $location must be used in conjunction with the
  // angular router, which I am not currently using.
  // $location works, but when it rewrites the URL it unnecessarily URIencodes it, which is undesirable.
  //
  app.config(['$locationProvider', function config($locationProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: true
    }).hashPrefix('!');
  }]);

  app.config(['JSONFormatterConfigProvider', function (JSONFormatterConfigProvider) {
      JSONFormatterConfigProvider.hoverPreviewEnabled = true;
    }]);

  app.config([ '$provide', function($provide) {
    $provide.decorator('uiGridEditService', [
      '$delegate',
      function myServiceDecorator($delegate) {
        var isStartEditKey = $delegate.isStartEditKey;

        function isStartEditKeyOverride(event) {
          // console.log('isStartEditKeyOverride', event);
          return (event.keyCode === 13) || isStartEditKey.apply($delegate, [event]);
        }

        $delegate.isStartEditKey = isStartEditKeyOverride;
        return $delegate;
      }
    ]);
  }]);

};
