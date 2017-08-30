(function(){

angular.module('app', ['app.controllers', 'app.services', 'app.configs']);

angular.module('app.controllers', [
    'ui.bootstrap',
    'angular-loading-bar',
    'ngStorage',
    'ngToast',
    'restangular'
]);

angular.module('app.services', []);
angular.module('app.configs', []);


angular.module('app.configs').config(['ngToastProvider', function(ngToastProvider) {
    ngToastProvider.configure({
        animation: 'slide'
    });
}]);

angular.module('app.controllers').controller('MainController', [ 
    '$localStorage', 'Restangular', 'ngToast',
    function ($localStorage, Restangular, ngToast) {
        var vm = this;
        
        vm.addServer = function(value) {
            if (!value.name || !value.key) return;
            value.id = $localStorage.servers.length + 1;
            $localStorage.servers.push(angular.copy(value));
            vm.formServer = {};
            ngToast.info("Servidor adicionado!");
            bindValues();
        };

        vm.deleteServer = function(value) {
            if (confirm("Ao excluir o servidor, automaticamente excluirá todos os clientes vinculados a ele. Deseja continuar?")) {
                $localStorage.servers = $localStorage.servers.filter(function(v){ return v.id != value.id });
                $localStorage.clients = $localStorage.clients.filter(function(v){ return v.idServer != value.id });
                ngToast.info("Servidor e clientes deletados!");
                bindValues();
            }
        };

        vm.addClient = function(value) {
            if (!value.name || !value.token) return;
            value.id = $localStorage.clients.length + 1;
            $localStorage.clients.push(angular.copy(value));
            vm.formClient = {};
            ngToast.info("Cliente adicionado!");
            bindValues();
        };

        vm.deleteClient = function(value) {
            if (confirm("Realmente deseja continuar e excluir o cliente?")) {
                $localStorage.clients = $localStorage.clients.filter(function(v){ return v.id != value.id });
                ngToast.info("Cliente deletado!");
                bindValues();
            }
        };

        function bindValues() {
            vm.servers = angular.copy($localStorage.servers);
            vm.clients = angular.copy($localStorage.clients);
        }

        bindValues();

        function getTokenServer(idServer) {
            var key;
            angular.forEach(vm.servers, function(v){
                if (v.id == idServer) key = v.key;
            });
            return key;
        }

        vm.enviar = function (value) {
            if (!value || !value.clients || !value.title || !value.body || !value.server) return ngToast.warning("Preencha todos os campos!");

            var toPost = {
                'registration_ids': value.clients,
                'priority': 'high',
                'content_available': false,
                'notification': {
                    'title': value.title,
                    'body': value.body,
                    'icon': 'new',
                    'badge': '1'
                }
            };

            vm.hasErrorSend = false;
            vm.hasSuccessSend = false;

            var Req = Restangular.withConfig(function(RestConfig){
                RestConfig
                    .setBaseUrl('https://android.googleapis.com/')
                    .setDefaultHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': 'key='+getTokenServer(value.server)
                    });
            });

            Req.one('gcm').post('send', toPost).then(function(res){
                console.log(res);
                vm.responseSuccess = res;
                vm.hasSuccessSend = true;
            }, function(err) {
                console.error(err);
                document.getElementById('error').innerHTML = err.data;
                vm.hasErrorSend = true;
            });
        }
    }
]);


})();